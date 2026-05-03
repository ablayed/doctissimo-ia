import hashlib
import os
import time

from fastapi import HTTPException, Request

from app.state_store import _maybe_await, _redis

MAX_TOKENS_PER_IP_PER_DAY = int(os.environ.get("MAX_TOK_IP_DAY", 100_000))
MAX_TOKENS_PER_THREAD = int(os.environ.get("MAX_TOK_THREAD", 30_000))
MAX_THREADS_PER_IP_PER_HOUR = int(os.environ.get("MAX_THREADS_IP_HOUR", 20))


def hashed_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for") or ""
    ip = (forwarded.split(",")[0].strip() or getattr(request.client, "host", None) or "unknown")
    return hashlib.sha256(ip.encode("utf-8")).hexdigest()[:16]


async def check_thread_quota(request: Request) -> str:
    redis = _redis()
    ip_h = hashed_ip(request)
    hour_key = f"q:threads:{ip_h}:{int(time.time() // 3600)}"
    count = int(await _maybe_await(redis.incr(hour_key)))
    if count == 1:
        await _maybe_await(redis.expire(hour_key, 3600))
    if count > MAX_THREADS_PER_IP_PER_HOUR:
        raise HTTPException(429, "Too many threads. Slow down kikoo.")

    day_key = f"q:tok:{ip_h}:{time.strftime('%Y-%m-%d')}"
    used = int(await _maybe_await(redis.get(day_key)) or 0)
    if used >= MAX_TOKENS_PER_IP_PER_DAY:
        raise HTTPException(429, "Daily token quota exceeded.")
    return ip_h


def _token_estimate(messages_text: str, response_text: str) -> int:
    return max(1, (len(messages_text) + len(response_text)) // 4)


async def record_tokens(ip_h: str, n_tokens: int, thread_id: str | None = None) -> None:
    redis = _redis()
    today = time.strftime("%Y-%m-%d")
    day_key = f"q:tok:{ip_h}:{today}"
    thread_key = f"q:thread_tok:{thread_id}" if thread_id else None
    if thread_key:
        await _maybe_await(redis.incrby(thread_key, n_tokens))
        await _maybe_await(redis.expire(thread_key, 86400 * 7))
    await _maybe_await(redis.incrby(day_key, n_tokens))
    await _maybe_await(redis.expire(day_key, 86400 * 2))
    await _maybe_await(redis.incrby(f"q:tok:GLOBAL:{today}", n_tokens))
    await _maybe_await(redis.incr(f"q:llm_calls:GLOBAL:{today}"))


async def thread_quota_exceeded(thread_id: str) -> bool:
    redis = _redis()
    used = int(await _maybe_await(redis.get(f"q:thread_tok:{thread_id}")) or 0)
    return used > MAX_TOKENS_PER_THREAD
