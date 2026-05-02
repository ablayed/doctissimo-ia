import pytest

from app import graph as graph_module
from app.graph import graph
from app.personas import load_all


@pytest.mark.anyio
async def test_reply_chain_creates_parented_posts(monkeypatch) -> None:
    async def fake_rag(seed_post: str, k: int = 5) -> str:
        return "RAG context fixture"

    async def fake_llm(model, messages, max_tokens, temperature=0.7) -> str:
        return "[quote=supracomment]test[/quote] réponse de test :love:"

    monkeypatch.setattr(graph_module, "_query_rag", fake_rag)
    monkeypatch.setattr(graph_module, "_call_llm", fake_llm)
    monkeypatch.setattr(graph_module.random, "uniform", lambda a, b: 0.0)
    monkeypatch.setattr(graph_module.random, "randint", lambda a, b: 8)
    monkeypatch.setattr(graph_module.random, "shuffle", lambda x: x)

    personas = [persona.model_dump() for persona in load_all()[:4]]
    result = await graph.ainvoke(
        {
            "thread_id": "test-replies",
            "topic": "Mal au ventre",
            "seed_post": "jé mal au ventre",
            "personas": personas,
            "posts": [],
            "rag_context": "",
            "reply_targets": [],
        },
        config={"recursion_limit": 100, "max_concurrency": 12},
    )

    assert len(result["posts"]) == 12
    assert sum(1 for post in result["posts"] if post["parent_id"]) >= 8
    assert any(post["parent_id"] for post in result["posts"])
