import os

import backoff
from openai import APIError, AsyncAzureOpenAI, RateLimitError


def _client() -> AsyncAzureOpenAI:
    return AsyncAzureOpenAI(
        api_key=os.environ["AZURE_OPENAI_API_KEY"],
        api_version="2024-10-21",
        azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
    )


DEPLOYMENTS = {
    "mini": os.environ.get("AZURE_DEPLOYMENT_MINI", "gpt-4o-mini"),
    "4o": os.environ.get("AZURE_DEPLOYMENT_4O", "gpt-4o"),
}


@backoff.on_exception(
    backoff.expo,
    (RateLimitError, APIError),
    max_time=25,
    jitter=backoff.full_jitter,
)
async def _call_with_backoff(
    model: str,
    messages: list[dict],
    max_tokens: int,
    temperature: float = 0.7,
) -> str:
    client = _client()
    deployment = DEPLOYMENTS[model]
    resp = await client.chat.completions.create(
        model=deployment,
        messages=messages,
        max_tokens=max_tokens,
        temperature=temperature,
    )
    return resp.choices[0].message.content or ""


async def call_llm(
    model: str,
    messages: list[dict],
    max_tokens: int,
    temperature: float = 0.7,
    persona_pseudo: str | None = None,
) -> str:
    try:
        return await _call_with_backoff(
            model,
            messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )
    except (RateLimitError, APIError, TimeoutError, OSError):
        if persona_pseudo:
            return f"*** {persona_pseudo} a quitte la conversation (probleme de modem 56k) ***"
        return "*** Erreur de connexion ***"
