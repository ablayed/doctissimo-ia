import json
import os
import time
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

from app.graph import graph
from app.limits import check_thread_quota
from app.personas import load_all
from app.state_store import load_thread, save_thread, zcard, zrevrange, zscore


VERSION = "0.6.0"
APP_START_TIME = time.time()
_warmed = False


async def _run_warmup() -> dict[str, str]:
    global _warmed
    if _warmed:
        return {"status": "already_warm"}
    try:
        from app.rag import _embedding_model

        model = _embedding_model()
        model.encode(["warmup ping"], return_dense=True)
        from app.azure import call_llm

        await call_llm(
            "mini",
            [{"role": "user", "content": "hi"}],
            max_tokens=5,
            temperature=0.0,
        )
        _warmed = True
        return {"status": "warmed"}
    except Exception as exc:
        print(f"Warmup failed (non-fatal): {exc}")
        return {"status": "warm_failed", "detail": str(exc)}


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting Doctissimo.IA backend...")
    await _run_warmup()
    yield


class StartReq(BaseModel):
    topic: str = Field(min_length=1)
    seed_post: str = Field(min_length=1)
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
    return await _run_warmup()


@app.get("/api/smoke")
async def smoke() -> dict[str, str]:
    from app.azure import call_llm

    try:
        text = await call_llm(
            "mini",
            [{"role": "user", "content": "Reponds UNIQUEMENT par 'OK Doctissimo'."}],
            max_tokens=20,
            temperature=0.0,
        )
        return {"status": "ok", "azure_says": text.strip()}
    except Exception as exc:
        return {"status": "error", "detail": str(exc)}


async def _azure_ok() -> bool:
    if not (os.environ.get("AZURE_OPENAI_ENDPOINT") and os.environ.get("AZURE_OPENAI_API_KEY")):
        return False
    try:
        from app.azure import call_llm

        text = await call_llm(
            "mini",
            [{"role": "user", "content": "Reponds uniquement OK."}],
            max_tokens=5,
            temperature=0.0,
        )
        return bool(text.strip())
    except Exception:
        return False


async def _redis_ok() -> bool:
    if not (os.environ.get("UPSTASH_REDIS_REST_URL") and os.environ.get("UPSTASH_REDIS_REST_TOKEN")):
        return False
    try:
        key = f"info-{uuid.uuid4()}"
        await save_thread(key, {"ok": True}, ttl=60)
        data = await load_thread(key)
        return data == {"ok": True}
    except Exception:
        return False


def _extract_vector_count(info):
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
    if not (os.environ.get("UPSTASH_VECTOR_REST_URL") and os.environ.get("UPSTASH_VECTOR_REST_TOKEN")):
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
async def info():
    latest_thread_id = None
    last_thread_at = None
    recent = await zrevrange("recent_threads", 0, 0)
    if recent:
        latest_thread_id = recent[0]
        last_thread_at = await zscore("recent_threads", latest_thread_id)
    return {
        "version": VERSION,
        "personas_loaded": len(load_all()),
        "rag_indexed": await _rag_indexed(),
        "azure_ok": await _azure_ok(),
        "redis_ok": await _redis_ok(),
        "uptime_seconds": int(time.time() - APP_START_TIME),
        "last_thread_at": last_thread_at,
        "warmup_status": _warmed,
        "latest_thread_id": latest_thread_id,
    }


@app.get("/api/forum/{thread_id}/replay")
async def replay(thread_id: str):
    data = await load_thread(thread_id)
    if not data or not data.get("posts"):
        raise HTTPException(404, "thread not found or expired")
    sorted_posts = sorted(data["posts"], key=lambda post: post["arrived_at"])
    return {**data, "posts": sorted_posts}


@app.get("/api/forum/recent")
async def recent(limit: int = 10):
    raw = await zrevrange("recent_threads", 0, limit - 1)
    items = []
    for tid in raw:
        thread = await load_thread(tid)
        if thread:
            items.append(
                {
                    "thread_id": tid,
                    "topic": thread["topic"],
                    "n_replies": len(thread.get("posts", [])),
                    "completed_at": thread.get("completed_at"),
                }
            )
    return {"items": items}


@app.get("/api/forum/demo/{n}")
async def demo_thread(n: int):
    if n not in range(1, 6):
        raise HTTPException(404, "demo not found")
    path = Path(__file__).parent.parent.parent / "data" / "seed_threads" / f"{n}.json"
    if not path.exists():
        raise HTTPException(404, "demo not seeded")
    return json.loads(path.read_text(encoding="utf-8"))


@app.post("/api/forum/start")
async def start(req: StartReq, request: Request):
    if len(req.seed_post) > 1000:
        raise HTTPException(400, "Message trop long. 1000 caracteres max.")
    if len(req.topic) > 200:
        raise HTTPException(400, "Sujet trop long. 200 caracteres max.")
    thread_id = str(uuid.uuid4())[:8]
    ip_h = await check_thread_quota(request)
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
        "_ip_h": ip_h,
    }
    await save_thread(thread_id, data)
    return {"thread_id": thread_id, "n_personas": len(personas)}


@app.get("/api/forum/{thread_id}/stream")
async def stream(thread_id: str):
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
            "reply_targets": [],
            "enable_reply_chains": True,
            "_ip_h": data.get("_ip_h", "unknown"),
        }
        seen_post_ids: set[str] = set()
        yield {"event": "start", "data": json.dumps({"thread_id": thread_id})}
        async for chunk in graph.astream(initial_state, stream_mode="updates", config={"recursion_limit": 100, "max_concurrency": 12}):
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


@app.get("/admin/stats")
async def admin_stats(key: str = ""):
    admin_key = os.environ.get("ADMIN_KEY", "")
    if not admin_key or key != admin_key:
        raise HTTPException(403, "Forbidden")
    from app.state_store import _redis

    redis = _redis()
    today = time.strftime("%Y-%m-%d")
    tokens_today = int(await redis.get(f"q:tok:GLOBAL:{today}") or 0)
    llm_calls_today = int(await redis.get(f"q:llm_calls:GLOBAL:{today}") or 0)
    return {
        "tokens_today": tokens_today,
        "llm_calls_today": llm_calls_today,
        "threads_total": await zcard("recent_threads"),
        "estimated_cost_eur": round(tokens_today * 0.00015 / 1000 * 0.93, 2),
    }


@app.get("/api/forum/easter-egg")
async def easter_egg():
    return {"hint": "Try the Konami code on the homepage. ↑↑↓↓←→←→BA"}
