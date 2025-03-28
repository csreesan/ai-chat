# generated by fastapi-codegen:
#   filename:  /Users/chrissreesangkom/ai-chat/api-spec/openapi.yaml
#   timestamp: 2025-03-24T14:05:31+00:00

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class Thread(BaseModel):
    id: str
    name: str
    created_at: datetime


class Model(Enum):
    gpt_3_5_turbo = 'gpt-3.5-turbo'
    gpt_4_turbo = 'gpt-4-turbo'
    gpt_4o = 'gpt-4o'
    gpt_4o_mini = 'gpt-4o-mini'
    gpt_4_5_preview = 'gpt-4.5-preview'
    o1 = 'o1'
    o1_mini = 'o1-mini'
    o3_mini = 'o3-mini'
    claude_2_1 = 'claude-2.1'
    claude_3_opus_20240229 = 'claude-3-opus-20240229'
    claude_3_5_haiku_20241022 = 'claude-3-5-haiku-20241022'
    claude_3_5_sonnet_20241022 = 'claude-3-5-sonnet-20241022'
    claude_3_7_sonnet_20250219 = 'claude-3-7-sonnet-20250219'


class Role(Enum):
    user = 'user'
    ai = 'ai'


class ChatMessage(BaseModel):
    content: str = Field(..., description='The text content of the message')
    role: Role
    model: Optional[Model] = Field(
        None, description='The model used to generate the message'
    )


class SubmitChatMessageRequest(BaseModel):
    content: str
    model: Model = Field(..., description='The model to use for the chat message')


class Error(BaseModel):
    code: str
    message: str


class SubmitChatMessageCompareRequest(BaseModel):
    content: str = Field(..., description='The text content of the message')
    models: List[Model] = Field(
        ..., description='The models to use for comparison', min_items=1
    )


class SubmitChatMessageSelectRequest(BaseModel):
    comparison_message_id: str
    selected_model: Model
