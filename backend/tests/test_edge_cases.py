import httpx
import pytest
from fastapi.testclient import TestClient
from openai import RateLimitError

from app import azure, state_store
from app.main import app


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


@pytest.mark.anyio
async def test_call_llm_returns_modem_fallback(monkeypatch) -> None:
    request = httpx.Request("POST", "https://example.test")
    response = httpx.Response(429, request=request)
    rate_limit = RateLimitError("rate limited", response=response, body=None)

    async def boom(*args, **kwargs):
        raise rate_limit

    monkeypatch.setattr(azure, "_call_with_backoff", boom)
    text = await azure.call_llm(
        "mini",
        [{"role": "user", "content": "hello"}],
        max_tokens=10,
        persona_pseudo="Sandra67",
    )
    assert "Sandra67" in text
    assert "modem 56k" in text


@pytest.mark.anyio
async def test_save_thread_swallow_redis_disconnect(monkeypatch) -> None:
    monkeypatch.setattr(state_store, "_has_redis_env", lambda: True)

    class BrokenRedis:
        def set(self, *args, **kwargs):
            raise RuntimeError("redis down")

    monkeypatch.setattr(state_store, "_redis", lambda: BrokenRedis())
    result = await state_store.save_thread("broken", {"ok": True})
    assert result is None


def test_start_rejects_seed_post_too_long() -> None:
    client = TestClient(app)
    response = client.post("/api/forum/start", json={"topic": "x", "seed_post": "a" * 1001})
    assert response.status_code == 400
    assert "1000" in response.json()["detail"]


def test_start_rejects_empty_seed_post() -> None:
    client = TestClient(app)
    response = client.post("/api/forum/start", json={"topic": "x", "seed_post": ""})
    assert response.status_code == 422
