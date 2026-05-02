import asyncio
import time

from app.graph import graph
from app.personas import load_all


async def main() -> None:
    personas = [persona.model_dump() for persona in load_all()]
    state = {
        "thread_id": "local-test",
        "topic": "J'ai mal au ventre depuis 2 jours",
        "seed_post": "jé mal o ventre depui 2j c grav ???",
        "personas": personas,
        "posts": [],
        "rag_context": "",
        "reply_targets": [],
    }
    t0 = time.time()
    result = await graph.ainvoke(
        state,
        config={"recursion_limit": 100, "max_concurrency": 12},
    )
    for post in sorted(result["posts"], key=lambda item: item["arrived_at"]):
        print(f"[+{post['arrived_at']:.1f}s] {post['pseudo']}: {post['text']}\n")
    print(f"{len(result['posts'])} posts in {time.time() - t0:.1f}s")


if __name__ == "__main__":
    asyncio.run(main())
