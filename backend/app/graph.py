import asyncio
import operator
import random
import time
import uuid
from types import SimpleNamespace
from typing import Annotated, TypedDict

from langgraph.graph import END, START, StateGraph
from langgraph.types import Send

from app.prompts import build_expert_messages, build_persona_messages, build_reply_messages
from app.safety import is_emergency, refusal_text
from app.schemas import Persona


class ForumState(TypedDict):
    thread_id: str
    topic: str
    seed_post: str
    personas: list[dict]
    posts: Annotated[list[dict], operator.add]
    rag_context: str
    reply_targets: list[tuple[str, str]]


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


def _approx_tokens(messages: list[dict], response_text: str) -> int:
    message_text = " ".join(str(message.get("content", "")) for message in messages)
    return max(1, (len(message_text) + len(response_text)) // 4)


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
    from app.limits import record_tokens, thread_quota_exceeded

    if await thread_quota_exceeded(payload.get("thread_id", "")):
        return {"posts": []}
    await record_tokens(payload.get("_ip_h", "unknown"), _approx_tokens(messages, text), payload["thread_id"])
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
    from app.limits import record_tokens, thread_quota_exceeded

    if await thread_quota_exceeded(payload.get("thread_id", "")):
        return {"posts": []}
    await record_tokens(payload.get("_ip_h", "unknown"), _approx_tokens(messages, text), payload["thread_id"])
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


def reply_planner(state: ForumState) -> dict[str, list[tuple[str, str]]]:
    if state["rag_context"] == "EMERGENCY":
        return {"reply_targets": []}

    if not state.get("enable_reply_chains") and len(state.get("personas", [])) != 4:
        return {"reply_targets": []}

    wave1_posts = state["posts"]
    candidates: list[tuple[str, str]] = []
    for p in state["personas"]:
        for post in wave1_posts:
            if p["id"] != post["persona_id"]:
                candidates.append((p["id"], post["id"]))
    random.shuffle(candidates)
    n_replies = min(random.randint(8, 12), len(candidates))
    return {"reply_targets": candidates[:n_replies]}


def fanout_wave2(state: ForumState) -> list[Send]:
    if not state.get("reply_targets"):
        return [
            Send(
                "finalize",
                {
                    "thread_id": state["thread_id"],
                    "topic": state["topic"],
                    "seed_post": state["seed_post"],
                    "personas": state["personas"],
                    "posts": state["posts"],
                    "rag_context": state["rag_context"],
                    "reply_targets": state.get("reply_targets", []),
                },
            )
        ]

    posts_by_id = {p["id"]: p for p in state["posts"]}
    personas_by_id = {p["id"]: p for p in state["personas"]}
    t0 = time.time()

    sends: list[Send] = []
    for replier_id, target_id in state["reply_targets"]:
        target_post = posts_by_id.get(target_id)
        persona = personas_by_id.get(replier_id)
        if not persona or not target_post:
            continue
        sends.append(
            Send(
                "reply_chain_node",
                {
                    "persona": persona,
                    "target_post": target_post,
                    "thread_id": state["thread_id"],
                    "topic": state["topic"],
                    "seed_post": state["seed_post"],
                    "personas": state["personas"],
                    "rag_context": state["rag_context"],
                    "reply_targets": state["reply_targets"],
                    "delay": random.uniform(0.5, 8.0),
                    "t0": t0,
                },
            )
        )
    return sends


async def reply_chain_node(payload: dict) -> dict:
    await asyncio.sleep(payload.get("delay", 0.0))
    p = Persona.model_validate(payload["persona"])
    target = SimpleNamespace(**payload["target_post"])
    msgs = build_reply_messages(p, target, payload["topic"])
    text = await _call_llm(p.model, msgs, max_tokens=140, temperature=p.temperature)
    from app.limits import record_tokens, thread_quota_exceeded

    if await thread_quota_exceeded(payload.get("thread_id", "")):
        return {"posts": []}
    await record_tokens(payload.get("_ip_h", "unknown"), _approx_tokens(msgs, text), payload["thread_id"])
    return {
        "posts": [
            {
                "id": str(uuid.uuid4()),
                "persona_id": p.id,
                "pseudo": p.pseudo,
                "parent_id": target.id,
                "text": text,
                "arrived_at": time.time() - payload["t0"] + 30.0,
            }
        ],
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
                    "thread_id": state["thread_id"],
                    "rag_context": state["rag_context"],
                    "personas": state["personas"],
                    "reply_targets": state.get("reply_targets", []),
                    "_ip_h": state.get("_ip_h", "unknown"),
                    "delay": delay,
                    "t0": t0,
                },
            )
        )
    return sends


async def finalize(state: ForumState) -> dict:
    from app.state_store import save_thread, zadd, zremrangebyrank

    thread_data = {
        "thread_id": state["thread_id"],
        "topic": state["topic"],
        "seed_post": state["seed_post"],
        "posts": state["posts"],
        "n_personas": len(state["personas"]),
        "completed_at": time.time(),
    }
    await save_thread(state["thread_id"], thread_data, ttl=86400 * 7)
    await zadd("recent_threads", {state["thread_id"]: thread_data["completed_at"]})
    await zremrangebyrank("recent_threads", 0, -101)
    return {"posts": []}


g = StateGraph(ForumState)
g.add_node("orchestrator", orchestrator)
g.add_node("persona_responder", persona_responder)
g.add_node("expert_responder", expert_responder)
g.add_node("emergency_responder", emergency_responder)
g.add_node("reply_planner", reply_planner)
g.add_node("reply_chain_node", reply_chain_node)
g.add_node("finalize", finalize)
g.add_edge(START, "orchestrator")
g.add_conditional_edges(
    "orchestrator",
    fanout_wave1,
    ["persona_responder", "expert_responder", "emergency_responder"],
)
g.add_edge("persona_responder", "reply_planner")
g.add_edge("expert_responder", "reply_planner")
g.add_edge("emergency_responder", "finalize")
g.add_conditional_edges(
    "reply_planner",
    fanout_wave2,
    ["reply_chain_node", "finalize"],
)
g.add_edge("reply_chain_node", "finalize")
g.add_edge("finalize", END)
graph = g.compile()
