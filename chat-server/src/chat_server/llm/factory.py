from chat_server.generated.models import Model
from chat_server.llm.anthropic_models import AnthropicModels
from chat_server.llm.llm import LLM
from chat_server.llm.openai_models import OpenAIModels

OPENAI_MODELS = [Model.gpt_4o_mini, Model.gpt_4o]
ANTHROPIC_MODELS = [Model.claude_3_7_sonnet_20250219, Model.claude_3_5_sonnet_20241022]


class InvalidModelError(Exception):
    pass


def llm_factory(model_name: Model) -> LLM:
    if model_name in OPENAI_MODELS:
        return OpenAIModels(model_name)
    if model_name in ANTHROPIC_MODELS:
        return AnthropicModels(model_name)
    invalid_model_error = f"Invalid model name: {model_name}"
    raise InvalidModelError(invalid_model_error)
