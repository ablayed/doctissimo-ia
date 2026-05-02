import pytest

from app import state_store
from app.main import app
from fastapi.testclient import TestClient


@pytest.mark.anyio
async def test_thread_persistence_memory(monkeypatch) -> None:
    monkeypatch.setattr(state_store, "_has_redis_env", lambda: False)
    await state_store.save_thread(
        "persist-test",
        {
            "thread_id": "persist-test",
            "topic": "test",
            "seed_post": "seed",
            "posts": [{"id": "1", "persona_id": "p", "pseudo": "P", "parent_id": None, "text": "ok", "arrived_at": 1.0}],
            "n_personas": 1,
            "completed_at": 12345.0,
        },
    )

    loaded = await state_store.load_thread("persist-test")
    assert loaded is not None
    assert loaded["topic"] == "test"
    assert loaded["posts"][0]["id"] == "1"


def test_recent_endpoint_returns_items(monkeypatch) -> None:
    monkeypatch.setattr(state_store, "_has_redis_env", lambda: False)
    client = TestClient(app)

    # seed a stored thread in the memory backend
    import asyncio

    asyncio.run(
        state_store.save_thread(
            "recent-test",
            {
                "thread_id": "recent-test",
                "topic": "recent topic",
                "seed_post": "seed",
                "posts": [{"id": "1", "persona_id": "p", "pseudo": "P", "parent_id": None, "text": "ok", "arrived_at": 1.0}],
                "n_personas": 1,
                "completed_at": 12345.0,
            },
        )
    )
    asyncio.run(state_store.zadd("recent_threads", {"recent-test": 12345.0}))

    response = client.get("/api/forum/recent")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert any(item["thread_id"] == "recent-test" for item in data["items"])
