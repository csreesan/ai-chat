import uuid
from datetime import datetime
from sqlmodel import Field, SQLModel


class Thread(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
