import asyncio
import operator
import random
import time
import uuid
from typing import Annotated, TypedDict

from langgraph.graph import END, START, StateGraph
from langgraph.types import Send

from app.prompts import build_expert_messages, build_persona_messages
from app.safety import is_emergency, refusal_text
from app.schemas import Persona


class ForumState(TypedDict):
    thread_id: str
    topic: str
    seed_post: str
    personas: list[dict]
    posts: Annotated[list[dict], operator.add]
    rag_context: str


async def _query_rag(seed_post: str, k: int = 5) -> str:
    from app.rag import query

    return await query(seed_post, k=k)


async def _call_llm(
    model: str,
    messages: list[dict],
    max_tokens: int,
    temperature: float = 0.7,
) -> str:
    from app.azure import call_llm

    return await call_llm(model, messages, max_tokens=max_tokens, temperature=temperature)


async def orchestrator(state: ForumState) -> dict:
    if is_emergency(state["seed_post"]):
        return {"rag_context": "EMERGENCY"}
    return {"rag_context": await _query_rag(state["seed_post"], k=5)}


async def persona_responder(payload: dict) -> dict:
    await asyncio.sleep(payload.get("delay", 0.0))
    p = Persona.model_validate(payload["persona"])
    messages = build_persona_messages(p, payload["topic"], payload["seed_post"])
    text = await _call_llm(
        p.model,
        messages,
        max_tokens=180,
        temperature=p.temperature,
    )
    return {
        "posts": [
            {
                "id": str(uuid.uuid4()),
                "persona_id": p.id,
                "pseudo": p.pseudo,
                "parent_id": None,
                "text": text,
                "arrived_at": time.time() - payload["t0"],
            }
        ]
    }


async def expert_responder(payload: dict) -> dict:
    await asyncio.sleep(payload.get("delay", 0.0))
    p = Persona.model_validate(payload["persona"])
    messages = build_expert_messages(
        p,
        payload["topic"],
        payload["seed_post"],
        payload["rag_context"],
    )
    text = await _call_llm("4o", messages, max_tokens=400, temperature=0.3)
    return {
        "posts": [
            {
                "id": str(uuid.uuid4()),
                "persona_id": p.id,
                "pseudo": p.pseudo,
                "parent_id": None,
                "text": text,
                "arrived_at": time.time() - payload["t0"],
            }
        ]
    }


async def emergency_responder(state: ForumState) -> dict:
    return {
        "posts": [
            {
                "id": str(uuid.uuid4()),
                "persona_id": "system",
                "pseudo": " Modération Doctissimo.IA",
                "parent_id": None,
                "text": refusal_text(),
                "arrived_at": 0.1,
            }
        ]
    }


def fanout_wave1(state: ForumState) -> list[Send]:
    if state["rag_context"] == "EMERGENCY":
        return [Send("emergency_responder", state)]

    t0 = time.time()
    sends: list[Send] = []
    for i, persona in enumerate(state["personas"]):
        delay = 0.0 if i < 7 else random.uniform(2.0, 28.0)
        target = "expert_responder" if persona.get("truth_teller") else "persona_responder"
        if target == "expert_responder":
            delay = random.uniform(4.0, 12.0)
        sends.append(
            Send(
                target,
                {
                    "persona": persona,
                    "topic": state["topic"],
                    "seed_post": state["seed_post"],
                    "rag_context": state["rag_context"],
                    "delay": delay,
                    "t0": t0,
                },
            )
        )
    return sends


async def finalize(state: ForumState) -> dict:
    return {"posts": []}


g = StateGraph(ForumState)
g.add_node("orchestrator", orchestrator)
g.add_node("persona_responder", persona_responder)
g.add_node("expert_responder", expert_responder)
g.add_node("emergency_responder", emergency_responder)
g.add_node("finalize", finalize)
g.add_edge(START, "orchestrator")
g.add_conditional_edges(
    "orchestrator",
    fanout_wave1,
    ["persona_responder", "expert_responder", "emergency_responder"],
)
g.add_edge("persona_responder", "finalize")
g.add_edge("expert_responder", "finalize")
g.add_edge("emergency_responder", "finalize")
g.add_edge("finalize", END)
graph = g.compile()
