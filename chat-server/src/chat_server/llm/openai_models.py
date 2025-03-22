from collections.abc import Generator
from typing import Literal

from openai import OpenAI
from openai.types.chat import (
    ChatCompletionAssistantMessageParam,
    ChatCompletionMessageParam,
    ChatCompletionUserMessageParam,
)

from chat_server.generated.models import ChatMessage, Model, Role
from chat_server.llm.llm import LLM, InvalidMessageRoleError


class OpenAIModels(LLM):
    def __init__(self, model_name: Literal[Model.gpt_4o_mini, Model.gpt_4o]) -> None:
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

    def response_generator(self, messages: list[ChatCompletionMessageParam]) -> Generator[str, None, None]:
        client = OpenAI()
        response = client.chat.completions.create(
            model=self.model_name,
            messages=messages,
            stream=True,
        )
        for chunk in response:
            if chunk.choices[0].finish_reason == "stop":
                break
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
