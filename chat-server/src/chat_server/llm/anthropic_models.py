from collections.abc import AsyncGenerator
from typing import Literal

from anthropic import AsyncAnthropic
from anthropic.types.message_param import MessageParam

from chat_server.generated.models import ChatMessage, Model, Role
from chat_server.llm.llm import LLM, InvalidMessageRoleError
from chat_server.utils.logging import logger


class AnthropicModels(LLM):
    def __init__(self, model_name: Model) -> None:
        self.model_name = model_name.value

    def convert_messages(self, messages: list[ChatMessage]) -> list[MessageParam]:
        formatted_messages = []
        for m in messages:
            if m.role == Role.user:
                formatted_messages.append(
                    MessageParam(
                        content=m.content,
                        role="user",
                    )
                )
            elif m.role == Role.ai:
                formatted_messages.append(
                    MessageParam(
                        content=m.content,
                        role="assistant",
                    )
                )
            else:
                invalid_message_role_error = f"Invalid message role: {m.role}"
                raise InvalidMessageRoleError(invalid_message_role_error)
        return formatted_messages

    async def response_generator(self, messages: list[MessageParam]) -> AsyncGenerator[str, None]:
        client = AsyncAnthropic()
        async with client.messages.stream(
            max_tokens=1024,
            model=self.model_name,
            messages=messages,
        ) as stream:
            async for text in stream.text_stream:
                logger.info(f"ANTHROPIC: Received text: {text}")
                yield text
