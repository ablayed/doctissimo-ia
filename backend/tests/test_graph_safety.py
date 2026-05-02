import pytest

from app import graph as graph_module
from app.graph import graph
from app.personas import load_all


@pytest.fixture
def all_personas() -> list[dict]:
    return [persona.model_dump() for persona in load_all()]


@pytest.mark.anyio
async def test_emergency_routes_to_single_refusal(monkeypatch, all_personas) -> None:
    async def fail_rag(seed_post: str, k: int = 5) -> str:
        raise AssertionError("RAG must not be called for emergencies")

    async def fail_llm(*args, **kwargs) -> str:
        raise AssertionError("LLM must not be called for emergencies")

    monkeypatch.setattr(graph_module, "_query_rag", fail_rag)
    monkeypatch.setattr(graph_module, "_call_llm", fail_llm)

    result = await graph.ainvoke(
        {
            "thread_id": "test",
            "topic": "Je vais mal",
            "seed_post": "j'ai envie de mourir personne ne comprend",
            "personas": all_personas,
            "posts": [],
            "rag_context": "",
        },
        config={"recursion_limit": 100, "max_concurrency": 12},
    )

    assert len(result["posts"]) == 1
    assert result["posts"][0]["pseudo"] == " Modération Doctissimo.IA"
    assert "3114" in result["posts"][0]["text"]


@pytest.mark.anyio
async def test_normal_flow_uses_all_personas(monkeypatch, all_personas) -> None:
    async def fake_rag(seed_post: str, k: int = 5) -> str:
        return "[Source: https://www.ameli.fr/test] contexte"

    async def fake_llm(model, messages, max_tokens, temperature=0.7) -> str:
        return "réponse"

    monkeypatch.setattr(graph_module, "_query_rag", fake_rag)
    monkeypatch.setattr(graph_module, "_call_llm", fake_llm)
    monkeypatch.setattr(graph_module.random, "uniform", lambda a, b: 0.0)

    result = await graph.ainvoke(
        {
            "thread_id": "test",
            "topic": "Mal au ventre",
            "seed_post": "jé mal au ventre depuis 2j",
            "personas": all_personas,
            "posts": [],
            "rag_context": "",
        },
        config={"recursion_limit": 100, "max_concurrency": 12},
    )

    assert len(result["posts"]) == 30
    assert "InfirmièreUrgences42" in {post["pseudo"] for post in result["posts"]}
