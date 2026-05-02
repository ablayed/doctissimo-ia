import inspect
import json
import logging
import os
import time
from typing import Any


logger = logging.getLogger(__name__)
_MEMORY: dict[str, tuple[float, str]] = {}
_MEMORY_ZSETS: dict[str, dict[str, float]] = {}


class _MemoryRedis:
    async def set(self, key: str, value: str, ex: int | None = None) -> None:
        expires_at = time.time() + ex if ex else float("inf")
        _MEMORY[key] = (expires_at, value)

    async def get(self, key: str):
        item = _MEMORY.get(key)
        if not item:
            return None
        expires_at, value = item
        if expires_at < time.time():
            _MEMORY.pop(key, None)
            return None
        return value

    async def incr(self, key: str) -> int:
        return await self.incrby(key, 1)

    async def incrby(self, key: str, amount: int) -> int:
        current = int((await self.get(key)) or 0)
        current += amount
        await self.set(key, str(current))
        return current

    async def expire(self, key: str, ttl: int) -> None:
        item = _MEMORY.get(key)
        if not item:
            return
        _MEMORY[key] = (time.time() + ttl, item[1])

    async def zadd(self, name: str, mapping: dict[str, float]) -> None:
        bucket = _MEMORY_ZSETS.setdefault(name, {})
        for member, score in mapping.items():
            bucket[member] = score

    async def zrevrange(self, name: str, start: int, stop: int) -> list[str]:
        bucket = _MEMORY_ZSETS.get(name, {})
        sorted_members = sorted(bucket.items(), key=lambda item: (-item[1], item[0]))
        return [member for member, _ in sorted_members][start : stop + 1]

    async def zremrangebyrank(self, name: str, start: int, stop: int) -> None:
        bucket = _MEMORY_ZSETS.get(name, {})
        if not bucket:
            return
        sorted_members = sorted(bucket.items(), key=lambda item: (item[1], item[0]))
        members = [member for member, _ in sorted_members]
        count = len(members)
        if count == 0:
            return
        actual_start = start if start >= 0 else count + start
        actual_stop = stop if stop >= 0 else count + stop
        actual_start = max(0, actual_start)
        actual_stop = min(count - 1, actual_stop)
        if actual_start > actual_stop:
            return
        for member in members[actual_start : actual_stop + 1]:
            bucket.pop(member, None)

    async def zcard(self, name: str) -> int:
        return len(_MEMORY_ZSETS.get(name, {}))

    async def zscore(self, name: str, member: str) -> float | None:
        return _MEMORY_ZSETS.get(name, {}).get(member)


async def _maybe_await(result):
    if inspect.isawaitable(result):
        return await result
    return result


def _redis():
    try:
        from upstash_redis import Redis

        if _has_redis_env():
            return Redis(
                url=os.environ["UPSTASH_REDIS_REST_URL"],
                token=os.environ["UPSTASH_REDIS_REST_TOKEN"],
            )
    except Exception:
        pass
    return _MemoryRedis()


def _has_redis_env() -> bool:
    return bool(os.environ.get("UPSTASH_REDIS_REST_URL") and os.environ.get("UPSTASH_REDIS_REST_TOKEN"))


async def save_thread(thread_id: str, data: dict[str, Any], ttl: int = 3600) -> None:
    raw = json.dumps(data)
    try:
        if _has_redis_env():
            redis = _redis()
            await _maybe_await(redis.set(f"thread:{thread_id}", raw, ex=ttl))
            return
        _MEMORY[f"thread:{thread_id}"] = (time.time() + ttl, raw)
    except Exception as exc:
        logger.warning("save_thread failed for %s: %s", thread_id, exc)
        return None


async def load_thread(thread_id: str) -> dict[str, Any] | None:
    key = f"thread:{thread_id}"
    try:
        if _has_redis_env():
            raw = await _maybe_await(_redis().get(key))
            return json.loads(raw) if raw else None
        item = _MEMORY.get(key)
        if not item:
            return None
        expires_at, raw = item
        if expires_at < time.time():
            _MEMORY.pop(key, None)
            return None
        return json.loads(raw)
    except Exception as exc:
        logger.warning("load_thread failed for %s: %s", thread_id, exc)
        return None


async def zadd(name: str, mapping: dict[str, float]) -> None:
    try:
        if _has_redis_env():
            await _maybe_await(_redis().zadd(name, mapping))
            return
        bucket = _MEMORY_ZSETS.setdefault(name, {})
        for member, score in mapping.items():
            bucket[member] = score
    except Exception as exc:
        logger.warning("zadd failed for %s: %s", name, exc)


async def zrevrange(name: str, start: int, stop: int) -> list[str]:
    try:
        if _has_redis_env():
            return list(await _maybe_await(_redis().zrevrange(name, start, stop)))
        bucket = _MEMORY_ZSETS.get(name, {})
        sorted_members = sorted(bucket.items(), key=lambda item: (-item[1], item[0]))
        return [member for member, _score in sorted_members][start : stop + 1]
    except Exception as exc:
        logger.warning("zrevrange failed for %s: %s", name, exc)
        return []


async def zremrangebyrank(name: str, start: int, stop: int) -> None:
    try:
        if _has_redis_env():
            await _maybe_await(_redis().zremrangebyrank(name, start, stop))
            return
        bucket = _MEMORY_ZSETS.get(name, {})
        if not bucket:
            return
        sorted_members = sorted(bucket.items(), key=lambda item: (item[1], item[0]))
        members = [member for member, _score in sorted_members]
        count = len(members)
        if count == 0:
            return
        actual_start = start if start >= 0 else count + start
        actual_stop = stop if stop >= 0 else count + stop
        actual_start = max(0, actual_start)
        actual_stop = min(count - 1, actual_stop)
        if actual_start > actual_stop:
            return
        for member in members[actual_start : actual_stop + 1]:
            bucket.pop(member, None)
    except Exception as exc:
        logger.warning("zremrangebyrank failed for %s: %s", name, exc)


async def zcard(name: str) -> int:
    try:
        if _has_redis_env():
            return int(await _maybe_await(_redis().zcard(name)))
        return len(_MEMORY_ZSETS.get(name, {}))
    except Exception as exc:
        logger.warning("zcard failed for %s: %s", name, exc)
        return 0


async def zscore(name: str, member: str) -> float | None:
    try:
        if _has_redis_env():
            result = await _maybe_await(_redis().zscore(name, member))
            return float(result) if result is not None else None
        return _MEMORY_ZSETS.get(name, {}).get(member)
    except Exception as exc:
        logger.warning("zscore failed for %s/%s: %s", name, member, exc)
        return None
