import asyncio
import json
import os
import random
import uuid
from collections.abc import AsyncGenerator

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from redis import Redis
from sqlmodel import Session, SQLModel, create_engine, select

from chat_server.generated.models import (
    ChatMessage,
    Error,
    Model,
    Role,
    SubmitChatMessageCompareRequest,
    SubmitChatMessageRequest,
    SubmitChatMessageSelectRequest,
    Thread,
)
from chat_server.llm.factory import llm_factory
from chat_server.models.chat import ChatMessage as ChatMessageModel
from chat_server.models.thread import Thread as ThreadModel
from chat_server.utils.logging import logger

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]
engine = create_engine(DATABASE_URL)
SQLModel.metadata.create_all(engine)
redis_url = os.environ["REDIS_URL"]
redis_port = os.environ["REDIS_PORT"]
redis_db = os.environ["REDIS_DB"]
redis_client = Redis(host=redis_url, port=redis_port, db=redis_db)


app = FastAPI(
    title="Simple Chat API",
    description="API for a chat application with a single endpoint",
    version="1.0.0",
    servers=[
        {
            "url": "https://chat.chrissreesangkom.com/api",
            "description": "Production server",
        },
        {"url": "http://localhost:8000", "description": "Development server"},
    ],
)

# Add CORS middleware to the application
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


@app.post("/thread", tags=["Chat"])
def create_thread() -> Thread:
    thread_name = f"New Thread Name {random.randint(0, 100)}"  # noqa: S311
    thread = ThreadModel(name=thread_name)
    with Session(engine) as session:
        session.add(thread)
        session.commit()
        session.refresh(thread)
    return Thread(id=thread.id, name=thread.name, created_at=thread.created_at)


@app.get("/thread", tags=["Chat"])
def get_threads() -> list[Thread]:
    with Session(engine) as session:
        threads = session.exec(select(ThreadModel)).all()
        return [Thread(id=thread.id, name=thread.name, created_at=thread.created_at) for thread in threads]


@app.get("/thread/{thread_id}/chat", tags=["Chat"])
def get_chat_messages(thread_id: str) -> list[ChatMessage]:
    with Session(engine) as session:
        if not _check_thread_exists(session, thread_id):
            raise HTTPException(status_code=404, detail="Thread not found")
        messages = _get_entire_chat_history(session, thread_id)
        return [ChatMessage(content=message.content, role=message.role, model=message.model) for message in messages]


def _check_thread_exists(session: Session, thread_id: str) -> bool:
    return session.exec(select(ThreadModel).where(ThreadModel.id == thread_id)).first() is not None


@app.post(
    "/thread/{thread_id}/chat",
    responses={"400": {"model": Error}},
    response_model=None,
    tags=["Chat"],
)
async def submit_chat_message(thread_id: str, body: SubmitChatMessageRequest) -> StreamingResponse | Error:
    # Create the user message but don't commit it yet
    llm = llm_factory(body.model)
    user_message = ChatMessageModel(content=body.content, thread_id=thread_id, role=Role.user)

    # Get existing messages for context
    with Session(engine) as session:
        messages = _get_entire_chat_history(session, thread_id)

    # Add the new user message to the context for the AI
    messages.append(ChatMessage(content=body.content, role=Role.user))

    # Create a generator function for the streaming response
    async def response_generator() -> AsyncGenerator[str, None]:
        entire_response = ""
        try:
            stream = llm.get_stream_generator(messages)
            async for chunk in stream:
                entire_response += chunk
                yield chunk

            # After streaming is complete, save both messages in a new transaction
            with Session(engine) as session:
                session.connection(execution_options={"isolation_level": "SERIALIZABLE"})
                # Add the user message
                session.add(user_message)
                # Add the AI response
                ai_message = ChatMessageModel(
                    content=entire_response,
                    thread_id=thread_id,
                    role=Role.ai,
                    model=body.model.value,
                )
                session.add(ai_message)
                session.commit()
        except Exception as e:
            logger.error(f"Error during streaming: {e}")
            raise

    return StreamingResponse(
        response_generator(),
        media_type="text/plain",
    )


def _get_entire_chat_history(session: Session, thread_id: str) -> list[ChatMessage]:
    messages = session.exec(
        select(ChatMessageModel)
        .where(
            ChatMessageModel.thread_id == thread_id,
        )
        .order_by(ChatMessageModel.created_at),
    ).all()
    return [
        ChatMessage(
            content=message.content,
            role=message.role,
            model=message.model,
        )
        for message in messages
    ]


@app.post(
    "/thread/{thread_id}/chat/compare",
    response_model=None,
    responses={"400": {"model": Error}},
    tags=["Chat"],
)
async def submit_chat_message_compare(
    thread_id: str, body: SubmitChatMessageCompareRequest
) -> StreamingResponse | Error:
    comparison_message_id = str(uuid.uuid4())
    user_message_key = f"{comparison_message_id}:user_message"
    redis_client.set(user_message_key, body.content, ex=60*60)
    with Session(engine) as session:
        messages = _get_entire_chat_history(session, thread_id)
    messages.append(ChatMessage(content=body.content, role=Role.user))
    return StreamingResponse(
        _merge_streams(body.models, messages, comparison_message_id),
        media_type="text/event-stream"
    )

async def _merge_streams(
    models: list[Model],
    messages: list[ChatMessage],
    comparison_message_id: str,
) -> AsyncGenerator[str, None]:
    try:
        tasks = []
        queue = asyncio.Queue()
        final_messages = {}
        for model in models:
            final_messages[model.value] = ""

        # Send initial comparison_message_id
        yield f"data: {json.dumps({'comparison_message_id': comparison_message_id})}\n\n"

        async def run(model: str) -> None:
            try:
                stream = llm_factory(model).get_stream_generator(messages)
                async for item in stream:
                    final_messages[model.value] += item
                    message = json.dumps({"model": model.value, "content": item})
                    try:
                        # Add timeout for queue put operations
                        await queue.put(message)
                    except Exception as e:
                        logger.error(f"Error queuing message for {model}: {e}")
                        raise
            except Exception as e:
                logger.error(f"Error in run task for {model}: {e}")
                raise
            finally:
                # Signal this task is done
                await queue.put(f"DONE_{model.value}")

        # Start all model tasks
        tasks = [asyncio.create_task(run(model)) for model in models]
        active_models = {model.value for model in models}

        # Stream results as they come in
        while active_models:
            try:
                # Add timeout for queue get operations
                message = await asyncio.wait_for(queue.get(), timeout=5)
                if isinstance(message, str) and message.startswith("DONE_"):
                    done_model = message.strip("DONE_")
                    active_models.remove(done_model)
                    continue
                yield f"data: {message}\n\n"
            except asyncio.TimeoutError:
                logger.error("Timeout while waiting for model responses")
                break
            except Exception as e:
                logger.error(f"Error processing queue item: {e}")
                break

        # Wait for all tasks to complete with timeout
        try:
            await asyncio.wait_for(asyncio.gather(*tasks, return_exceptions=True), timeout=60.0)
        except asyncio.TimeoutError:
            logger.error("Timeout while waiting for tasks to complete")

        # Store final messages in Redis
        for model in models:
            redis_client.set(f"{comparison_message_id}:{model}", final_messages[model.value])

    except Exception as e:
        logger.error(f"Error during streaming: {e}")
        if tasks:
            for task in tasks:
                if not task.done():
                    task.cancel()
        raise



@app.post(
    "/thread/{thread_id}/chat/compare/select",
    response_model=None,
    responses={"400": {"model": Error}},
    tags=["Chat"],
)
def submit_chat_message_select(
    thread_id: str, body: SubmitChatMessageSelectRequest,
) -> JSONResponse | Error:
    user_message_key = f"{body.comparison_message_id}:user_message"
    ai_message_key = f"{body.comparison_message_id}:{body.selected_model}"
    user_message = redis_client.get(user_message_key).decode("utf-8")
    ai_message = redis_client.get(ai_message_key).decode("utf-8")
    with Session(engine) as session:
        session.add(ChatMessageModel(content=user_message, role=Role.user, thread_id=thread_id))
        session.add(ChatMessageModel(
            content=ai_message,
            role=Role.ai,
            thread_id=thread_id,
            model=body.selected_model.value,
        ))
        session.commit()



@app.exception_handler(Exception)
def global_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    logger.error(f"Error: {exc}")
    return JSONResponse(status_code=500, content={"error": str(exc)})
