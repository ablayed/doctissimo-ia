import pytest

from app import graph as graph_module
from app.graph import graph
from app.personas import load_all


def _persona(persona_id: str) -> dict:
    return next(persona for persona in load_all() if persona.id == persona_id).model_dump()


@pytest.mark.anyio
async def test_graph_single_persona(monkeypatch) -> None:
    async def fake_rag(seed_post: str, k: int = 5) -> str:
        return "RAG context fixture"

    async def fake_llm(*args, **kwargs) -> str:
        return "réponse de test :love:"

    monkeypatch.setattr(graph_module, "_query_rag", fake_rag)
    monkeypatch.setattr(graph_module, "_call_llm", fake_llm)
    monkeypatch.setattr(graph_module.random, "uniform", lambda a, b: 0.0)

    result = await graph.ainvoke(
        {
            "thread_id": "test",
            "topic": "Mal au ventre",
            "seed_post": "jé mal au ventre",
            "personas": [_persona("sandra67")],
            "posts": [],
            "rag_context": "",
        },
        config={"recursion_limit": 100, "max_concurrency": 12},
    )

    assert len(result["posts"]) == 1
    assert result["posts"][0]["pseudo"] == "Sandra67"
    assert result["posts"][0]["text"] == "réponse de test :love:"
