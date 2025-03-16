import os
import random
from typing import Generator, List, Union

from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from openai import OpenAI

from sqlmodel import Session, create_engine, select, SQLModel

from .generated.models import ChatMessage, Error, Role, Thread
from .models.chat import ChatMessage as ChatMessageModel
from .models.thread import Thread as ThreadModel

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
    print("Getting threads")
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
def submit_chat_message(thread_id: str, body: ChatMessage) -> Union[StreamingResponse, Error]:
    """
    Submit a chat message and get a streaming response
    """
    # Create the user message but don't commit it yet
    user_message = ChatMessageModel(content=body.content, thread_id=thread_id, role=body.role)

    # Get existing messages for context
    with Session(engine) as session:
        existing_messages = _get_entire_chat_history(session, thread_id)

    # Add the new user message to the context for the AI
    messages = existing_messages + [ChatMessage(content=body.content, role=body.role)]

    # Create a generator function for the streaming response
    def response_generator():
        entire_response = ""
        try:
            response = generate_response(messages)
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


def generate_response(messages: List[ChatMessage]) -> Generator[str, None, None]:
    """
    Generate a response to the chat messages
    """
    client = OpenAI()
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=_convert_messages_to_openai_format(messages),
        stream=True,
    )
    for chunk in response:
        if chunk.choices[0].finish_reason == "stop":
            break
        if chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content

def _convert_messages_to_openai_format(messages: List[ChatMessage]) -> List[dict]:
    resp = []
    for m in messages:
        if m.role == Role.user:
            resp.append({"role": "user", "content": m.content})
        elif m.role == Role.ai:
            resp.append({"role": "assistant", "content": m.content})
        else:
            raise ValueError(f"Invalid message role: {m.role}")
    return resp
