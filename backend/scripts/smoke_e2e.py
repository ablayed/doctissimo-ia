"""Production smoke check for the live forum stream."""

import asyncio
import json
import os
import time
from pathlib import Path

import httpx


PROD_URL = os.environ.get("SMOKE_E2E_URL", "https://doctissimo-ia.vercel.app")


async def main():
    started_at = time.time()
    summary: list[str] = []
    async with httpx.AsyncClient() as client:
        start = await client.post(
            f"{PROD_URL}/api/forum/start",
            json={"topic": "smoke", "seed_post": "j'ai mal au ventre depuis 2 jours c'est grave ???"},
            timeout=30.0,
        )
        start.raise_for_status()
        thread_id = start.json()["thread_id"]
        wave1 = 0
        wave2 = 0
        truth_post = None
        async with client.stream("GET", f"{PROD_URL}/api/forum/{thread_id}/stream", timeout=95.0) as stream:
            async for line in stream.aiter_lines():
                if not line.startswith("data:"):
                    continue
                raw = line[5:].strip()
                if not raw or raw == "{}":
                    continue
                post = json.loads(raw)
                if post.get("parent_id"):
                    wave2 += 1
                else:
                    wave1 += 1
                if post.get("persona_id") == "infirmiere_urgences42" or post.get("persona_id") == "infirmiereurgences42":
                    truth_post = post
                if wave1 >= 25 and wave2 >= 8 and truth_post:
                    break
        elapsed = round(time.time() - started_at, 1)
        assert wave1 >= 25, f"wave1 too low: {wave1}"
        assert wave2 >= 8, f"wave2 too low: {wave2}"
        assert truth_post, "truth teller missing"
        assert "ameli.fr" in truth_post.get("text", "") or "has-sante.fr" in truth_post.get("text", ""), "expert post missing source URL"
        summary.extend(
            [
                "Stream connection: OK",
                f"Wave 1: {wave1} posts",
                f"Wave 2: {wave2} reply posts",
                "InfirmiereUrgences42 present",
                "Expert post contains medical URL",
                f"Total time: {elapsed}s",
            ]
        )
    output_path = Path(__file__).resolve().parents[2] / "data" / "smoke_final.txt"
    output_path.write_text("\n".join(summary), encoding="utf-8")
    print("\n".join(f"OK {line}" for line in summary))


if __name__ == "__main__":
    asyncio.run(main())
