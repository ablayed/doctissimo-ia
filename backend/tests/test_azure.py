from types import SimpleNamespace

import httpx
import pytest
from openai import RateLimitError

from app import azure


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


def _response(text: str):
    return SimpleNamespace(
        choices=[SimpleNamespace(message=SimpleNamespace(content=text))]
    )


class _Completions:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = 0

    async def create(self, **kwargs):
        self.calls += 1
        response = self.responses.pop(0)
        if isinstance(response, Exception):
            raise response
        return response


class _Client:
    def __init__(self, completions):
        self.chat = SimpleNamespace(completions=completions)


@pytest.mark.anyio
async def test_call_llm_returns_string(monkeypatch) -> None:
    completions = _Completions([_response("OK mini")])
    monkeypatch.setattr(azure, "_client", lambda: _Client(completions))

    text = await azure.call_llm(
        "mini",
        [{"role": "user", "content": "Réponds OK"}],
        max_tokens=10,
        temperature=0.0,
    )

    assert text == "OK mini"
    assert completions.calls == 1


@pytest.mark.anyio
async def test_backoff_retries_on_rate_limit(monkeypatch) -> None:
    request = httpx.Request("POST", "https://example.test")
    response = httpx.Response(429, request=request)
    rate_limit = RateLimitError("rate limited", response=response, body=None)
    completions = _Completions([rate_limit, _response("OK after retry")])
    monkeypatch.setattr(azure, "_client", lambda: _Client(completions))

    text = await azure.call_llm(
        "mini",
        [{"role": "user", "content": "Réponds OK"}],
        max_tokens=10,
        temperature=0.0,
    )

    assert text == "OK after retry"
    assert completions.calls == 2
