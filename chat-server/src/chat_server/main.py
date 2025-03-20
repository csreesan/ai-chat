import os
import random
from typing import List, Union

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse

from chat_server.llm.factory import llm_factory

from sqlmodel import Session, create_engine, select, SQLModel

from chat_server.generated.models import ChatMessage, Error, Role, Thread, SubmitChatMessageRequest
from chat_server.models.chat import ChatMessage as ChatMessageModel
from chat_server.models.thread import Thread as ThreadModel
from chat_server.utils.logging import logger

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]
engine = create_engine(DATABASE_URL)
SQLModel.metadata.create_all(engine)


app = FastAPI(
    title='Simple Chat API',
    description='API for a chat application with a single endpoint',
    version='1.0.0',
    servers=[
        {
            'url': 'https://chat.chrissreesangkom.com/api',
            'description': 'Production server',
        },
        {'url': 'http://localhost:8000', 'description': 'Development server'},
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


@app.post('/thread', response_model=Thread, tags=['Chat'])
def create_thread() -> Thread:
    """
    Create a new thread
    """
    thread_name = "New Thread Name " + str(random.randint(0, 100))
    thread = ThreadModel(name=thread_name)
    with Session(engine) as session:
        session.add(thread)
        session.commit()
        session.refresh(thread)
    return Thread(id=thread.id, name=thread.name, created_at=thread.created_at)

@app.get('/thread', response_model=List[Thread], tags=['Chat'])
def get_threads() -> List[Thread]:
    """
    Get all threads
    """
    with Session(engine) as session:
        threads = session.exec(select(ThreadModel)).all()
        return [Thread(id=thread.id, name=thread.name, created_at=thread.created_at) for thread in threads]


@app.get('/thread/{thread_id}/chat', response_model=List[ChatMessage], tags=['Chat'])
def get_chat_messages(thread_id: str) -> List[ChatMessage]:
    """
    Get all chat messages
    """
    with Session(engine) as session:
        messages = _get_entire_chat_history(session, thread_id)
        return [ChatMessage(content=message.content, role=message.role) for message in messages]

@app.post(
    '/thread/{thread_id}/chat',
    responses={'400': {'model': Error}},
    response_model=None,
    tags=['Chat'],
)
def submit_chat_message(thread_id: str, body: SubmitChatMessageRequest) -> Union[StreamingResponse, Error]:
    """
    Submit a chat message and get a streaming response
    """
    # Create the user message but don't commit it yet
    llm = llm_factory(body.model)
    user_message = ChatMessageModel(content=body.content, thread_id=thread_id, role=Role.user)

    # Get existing messages for context
    with Session(engine) as session:
        existing_messages = _get_entire_chat_history(session, thread_id)

    # Add the new user message to the context for the AI
    messages = existing_messages + [ChatMessage(content=body.content, role=Role.user)]

    # Create a generator function for the streaming response
    def response_generator():
        entire_response = ""
        try:
            response = llm.get_stream_generator(messages)
            for chunk in response:
                entire_response += chunk
                yield chunk

            # After streaming is complete, save both messages in a new transaction
            with Session(engine) as session:
                session.connection(execution_options={"isolation_level": "SERIALIZABLE"})
                # Add the user message
                session.add(user_message)
                # Add the AI response
                ai_message = ChatMessageModel(content=entire_response, thread_id=thread_id, role=Role.ai)
                session.add(ai_message)
                session.commit()
        except Exception as e:
            # If something goes wrong, nothing gets committed
            # Re-raise the exception to be handled by FastAPI
            raise e

    return StreamingResponse(
        response_generator(),
        media_type="text/plain",
    )

def _get_entire_chat_history(session: Session, thread_id: str) -> List[ChatMessage]:
    """
    Get the entire chat history
    """
    messages = session.exec(
        select(ChatMessageModel).where(
            ChatMessageModel.thread_id == thread_id,
        ).order_by(ChatMessageModel.created_at),
    ).all()
    return [ChatMessage(content=message.content, role=message.role) for message in messages]

@app.exception_handler(Exception)
def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Global exception handler
    """
    logger.error(f"Error: {exc}")
    return JSONResponse(status_code=500, content={"error": str(exc)})
