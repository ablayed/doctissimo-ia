from fastapi.testclient import TestClient

from app import graph as graph_module
from app.main import app


def test_start_returns_thread_id() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/forum/start",
        json={"topic": "mal au ventre", "seed_post": "jé mal au ventre"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["thread_id"]
    assert body["n_personas"] == 30


def test_stream_emits_post_events(monkeypatch) -> None:
    async def fake_rag(seed_post: str, k: int = 5) -> str:
        return "RAG context fixture"

    calls = 0

    async def fake_llm(model, messages, max_tokens, temperature=0.7) -> str:
        nonlocal calls
        calls += 1
        return f"post fake {calls}"

    monkeypatch.setattr(graph_module, "_query_rag", fake_rag)
    monkeypatch.setattr(graph_module, "_call_llm", fake_llm)
    monkeypatch.setattr(graph_module.random, "uniform", lambda a, b: 0.0)

    client = TestClient(app)
    start = client.post(
        "/api/forum/start",
        json={
            "topic": "mal au ventre",
            "seed_post": "jé mal au ventre",
            "persona_ids": ["sandra67", "maman_de3_loulous"],
        },
    )
    thread_id = start.json()["thread_id"]

    response = client.get(f"/api/forum/{thread_id}/stream")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/event-stream")
    body = response.text
    assert "event: start" in body
    assert body.count("event: post") == 2
    assert "event: done" in body
    assert '"pseudo": "Sandra67"' in body
