from abc import ABC, abstractmethod
from collections.abc import Generator
from typing import Generic, TypeVar

from chat_server.generated.models import ChatMessage

T = TypeVar("T")


class InvalidMessageRoleError(Exception):
    pass


class LLM(ABC, Generic[T]):
    @abstractmethod
    def convert_messages(self, messages: list[ChatMessage]) -> T:
        pass

    @abstractmethod
    def response_generator(self, messages: T) -> Generator[str, None, None]:
        pass

    def get_stream_generator(self, messages: list[ChatMessage]) -> Generator[str, None, None]:
        formatted_messages = self.convert_messages(messages)
        return self.response_generator(formatted_messages)
