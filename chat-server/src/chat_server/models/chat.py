import uuid
from datetime import datetime

from sqlmodel import Field, Index, SQLModel


class ChatMessage(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    thread_id: str = Field(foreign_key="thread.id", index=True)
    role: str
    model: str | None = Field(default=None)

    __table_args__ = Index("thread_id_created_at_index", "thread_id", "created_at")
