import pytest

from app import graph as graph_module
from app.graph import graph
from app.personas import load_all


def _personas(ids: list[str]) -> list[dict]:
    all_personas = load_all()
    return [persona.model_dump() for persona in all_personas if persona.id in ids]


@pytest.mark.anyio
async def test_graph_fanout_three_personas(monkeypatch) -> None:
    async def fake_rag(seed_post: str, k: int = 5) -> str:
        return "RAG context fixture"

    async def fake_llm(model, messages, max_tokens, temperature=0.7) -> str:
        return f"réponse {model}"

    monkeypatch.setattr(graph_module, "_query_rag", fake_rag)
    monkeypatch.setattr(graph_module, "_call_llm", fake_llm)
    monkeypatch.setattr(graph_module.random, "uniform", lambda a, b: 0.0)

    result = await graph.ainvoke(
        {
            "thread_id": "test",
            "topic": "Mal au ventre",
            "seed_post": "jé mal au ventre",
            "personas": _personas(
                ["sandra67", "maman_de3_loulous", "true_researcher88"]
            ),
            "posts": [],
            "rag_context": "",
        },
        config={"recursion_limit": 100, "max_concurrency": 12},
    )

    assert len(result["posts"]) == 3
    assert {post["pseudo"] for post in result["posts"]} == {
        "Sandra67",
        "MamanDe3Loulous",
        "TrueResearcher88",
    }
