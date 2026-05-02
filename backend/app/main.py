import os
import json
import uuid
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from app.graph import graph
from app.personas import load_all
from app.state_store import load_thread, save_thread


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting Doctissimo.IA backend...")
    yield


VERSION = "0.2.0"


class StartReq(BaseModel):
    topic: str
    seed_post: str
    persona_ids: list[str] | None = None


app = FastAPI(title="Doctissimo.IA API", version=VERSION, lifespan=lifespan)

allowed_origin = os.environ.get("ALLOWED_ORIGIN", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[allowed_origin] if allowed_origin != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "version": VERSION}


@app.get("/api/warm")
async def warm() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/smoke")
async def smoke() -> dict[str, str]:
    """E2E ping: confirms Azure works. Returns one short LLM completion."""
    from app.azure import call_llm

    try:
        text = await call_llm(
            "mini",
            [
                {
                    "role": "user",
                    "content": "Réponds UNIQUEMENT par 'OK Doctissimo' en français.",
                }
            ],
            max_tokens=20,
            temperature=0.0,
        )
        return {"status": "ok", "azure_says": text.strip()}
    except Exception as e:
        return {"status": "error", "detail": str(e)}


async def _azure_ok() -> bool:
    if not (
        os.environ.get("AZURE_OPENAI_ENDPOINT")
        and os.environ.get("AZURE_OPENAI_API_KEY")
    ):
        return False
    try:
        from app.azure import call_llm

        text = await call_llm(
            "mini",
            [{"role": "user", "content": "Réponds uniquement OK."}],
            max_tokens=5,
            temperature=0.0,
        )
        return bool(text.strip())
    except Exception:
        return False


async def _redis_ok() -> bool:
    if not (
        os.environ.get("UPSTASH_REDIS_REST_URL")
        and os.environ.get("UPSTASH_REDIS_REST_TOKEN")
    ):
        return False
    try:
        key = f"info-{uuid.uuid4()}"
        await save_thread(key, {"ok": True}, ttl=60)
        data = await load_thread(key)
        return data == {"ok": True}
    except Exception:
        return False


def _extract_vector_count(info: Any) -> int:
    if isinstance(info, dict):
        for key in ("vector_count", "vectorCount", "total_vectors", "totalVectors"):
            if key in info:
                return int(info[key])
    for key in ("vector_count", "vectorCount", "total_vectors", "totalVectors"):
        value = getattr(info, key, None)
        if value is not None:
            return int(value)
    return 0


async def _rag_indexed() -> bool:
    if not (
        os.environ.get("UPSTASH_VECTOR_REST_URL")
        and os.environ.get("UPSTASH_VECTOR_REST_TOKEN")
    ):
        return False
    try:
        from upstash_vector import Index

        index = Index(
            url=os.environ["UPSTASH_VECTOR_REST_URL"],
            token=os.environ["UPSTASH_VECTOR_REST_TOKEN"],
        )
        return _extract_vector_count(index.info()) > 0
    except Exception:
        return False


@app.get("/api/info")
async def info() -> dict[str, bool | int | str]:
    return {
        "version": VERSION,
        "personas_loaded": len(load_all()),
        "rag_indexed": await _rag_indexed(),
        "azure_ok": await _azure_ok(),
        "redis_ok": await _redis_ok(),
    }


@app.post("/api/forum/start")
async def start(req: StartReq) -> dict[str, str | int]:
    thread_id = str(uuid.uuid4())[:8]
    all_personas = load_all()
    if req.persona_ids:
        wanted = set(req.persona_ids)
        personas = [persona.model_dump() for persona in all_personas if persona.id in wanted]
    else:
        personas = [persona.model_dump() for persona in all_personas]
    personas = personas[:30]
    data = {
        "thread_id": thread_id,
        "topic": req.topic,
        "seed_post": req.seed_post,
        "persona_ids": [persona["id"] for persona in personas],
    }
    await save_thread(thread_id, data)
    return {"thread_id": thread_id, "n_personas": len(personas)}


@app.get("/api/forum/{thread_id}/stream")
async def stream(thread_id: str) -> EventSourceResponse:
    data = await load_thread(thread_id)
    if not data:
        raise HTTPException(404, "thread not found")

    all_personas = load_all()
    wanted = set(data["persona_ids"])
    personas = [persona.model_dump() for persona in all_personas if persona.id in wanted]

    async def event_gen():
        initial_state = {
            "thread_id": thread_id,
            "topic": data["topic"],
            "seed_post": data["seed_post"],
            "personas": personas,
            "posts": [],
            "rag_context": "",
        }
        seen_post_ids: set[str] = set()
        yield {"event": "start", "data": json.dumps({"thread_id": thread_id})}
        async for chunk in graph.astream(
            initial_state,
            stream_mode="updates",
            config={"recursion_limit": 100, "max_concurrency": 12},
        ):
            for delta in chunk.values():
                if not delta:
                    continue
                for post in delta.get("posts", []):
                    if post["id"] in seen_post_ids:
                        continue
                    seen_post_ids.add(post["id"])
                    yield {"event": "post", "data": json.dumps(post)}
        yield {"event": "done", "data": "{}"}

    return EventSourceResponse(
        event_gen(),
        headers={"X-Accel-Buffering": "no", "Cache-Control": "no-cache"},
    )
