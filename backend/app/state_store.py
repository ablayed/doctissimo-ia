import json
import os
import time
from typing import Any


_MEMORY: dict[str, tuple[float, str]] = {}


def _redis():
    from upstash_redis import Redis

    return Redis(
        url=os.environ["UPSTASH_REDIS_REST_URL"],
        token=os.environ["UPSTASH_REDIS_REST_TOKEN"],
    )


def _has_redis_env() -> bool:
    return bool(
        os.environ.get("UPSTASH_REDIS_REST_URL")
        and os.environ.get("UPSTASH_REDIS_REST_TOKEN")
    )


async def save_thread(thread_id: str, data: dict[str, Any], ttl: int = 3600) -> None:
    raw = json.dumps(data)
    if _has_redis_env():
        _redis().set(f"thread:{thread_id}", raw, ex=ttl)
        return
    _MEMORY[f"thread:{thread_id}"] = (time.time() + ttl, raw)


async def load_thread(thread_id: str) -> dict[str, Any] | None:
    key = f"thread:{thread_id}"
    if _has_redis_env():
        raw = _redis().get(key)
        return json.loads(raw) if raw else None

    item = _MEMORY.get(key)
    if not item:
        return None
    expires_at, raw = item
    if expires_at < time.time():
        _MEMORY.pop(key, None)
        return None
    return json.loads(raw)
