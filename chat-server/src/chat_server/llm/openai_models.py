from collections.abc import AsyncGenerator

from openai import AsyncOpenAI
from openai.types.chat import (
    ChatCompletionAssistantMessageParam,
    ChatCompletionMessageParam,
    ChatCompletionUserMessageParam,
)

from chat_server.generated.models import ChatMessage, Model, Role
from chat_server.llm.llm import LLM, InvalidMessageRoleError
from chat_server.utils.logging import logger

class OpenAIModels(LLM):
    def __init__(self, model_name: Model) -> None:
        self.model_name = model_name.value

    def convert_messages(self, messages: list[ChatMessage]) -> list[ChatCompletionMessageParam]:
        formatted_messages = []
        for m in messages:
            if m.role == Role.user:
                formatted_messages.append(
                    ChatCompletionUserMessageParam(
                        content=m.content,
                        role="user",
                    )
                )
            elif m.role == Role.ai:
                formatted_messages.append(
                    ChatCompletionAssistantMessageParam(
                        content=m.content,
                        role="assistant",
                    )
                )
            else:
                invalid_message_role_error = f"Invalid message role: {m.role}"
                raise InvalidMessageRoleError(invalid_message_role_error)
        return formatted_messages

    async def response_generator(self, messages: list[ChatCompletionMessageParam]) -> AsyncGenerator[str, None]:
        client = AsyncOpenAI()
        stream = await client.chat.completions.create(
            model=self.model_name,
            messages=messages,
            stream=True,
        )
        async for chunk in stream:
            if chunk.choices[0].finish_reason == "stop":
                break
            if chunk.choices[0].delta.content:
                logger.info(f"OPENAI: Received text: {chunk.choices[0].delta.content}")
                yield chunk.choices[0].delta.content
