# generated by fastapi-codegen:
#   filename:  /Users/chrissreesangkom/ai-chat/api-spec/openapi.yaml
#   timestamp: 2025-03-20T13:26:02+00:00

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class Thread(BaseModel):
    id: str
    name: str
    created_at: datetime


class Role(Enum):
    user = 'user'
    ai = 'ai'


class ChatMessage(BaseModel):
    content: str = Field(..., description='The text content of the message')
    role: Optional[Role] = Field(None, description='The role of the message sender')


class Model(Enum):
    gpt_4o_mini = 'gpt-4o-mini'
    gpt_4o = 'gpt-4o'
    claude_3_7_sonnet_20250219 = 'claude-3-7-sonnet-20250219'
    claude_3_5_sonnet_20241022 = 'claude-3-5-sonnet-20241022'


class SubmitChatMessageRequest(BaseModel):
    content: str
    model: Model = Field(..., description='The model to use for the chat message')


class Error(BaseModel):
    code: str
    message: str
