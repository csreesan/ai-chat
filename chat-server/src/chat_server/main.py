import os
import random
from typing import List, Union

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
    response_model=ChatMessage,
    responses={'400': {'model': Error}},
    tags=['Chat'],
)
def submit_chat_message(thread_id: str, body: ChatMessage) -> Union[ChatMessage, Error]:
    """
    Submit a chat message and get a response
    """
    with Session(engine) as session:
        session.connection(execution_options={"isolation_level": "SERIALIZABLE"})
        message = ChatMessageModel(content=body.content, thread_id=thread_id, role=body.role)
        session.add(message)
        messages = _get_entire_chat_history(session, thread_id)
        response = generate_response(messages)
        message = ChatMessageModel(content=response.content, thread_id=thread_id, role=response.role)
        session.add(message)
        session.commit()
        return response

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


def generate_response(messages: List[ChatMessage]) -> ChatMessage:
    """
    Generate a response to the chat messages
    """
    client = OpenAI()
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=_convert_messages_to_openai_format(messages),
    )
    response_msg = response.choices[0].message.content
    return ChatMessage(content=response_msg, role=Role.ai)

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
