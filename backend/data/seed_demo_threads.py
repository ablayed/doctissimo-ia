import asyncio
import json
import time
import uuid
from pathlib import Path

from app.personas import load_all


QUESTIONS = [
    "j'ai mal au ventre depuis 2 jours c'est grave ???",
    "ya quelqu'un qui a essaye l'arnica pour la migraine ?",
    "je suis fatiguee tout le temps c'est le stress ?",
    "comment tomber enceinte plus vite j'ai 2 kids",
    "ya une vraie diff entre paracetamol et ibuprofene ?",
]


def _seed_path(index: int) -> Path:
    return Path(__file__).resolve().parents[2] / "data" / "seed_threads" / f"{index}.json"


def _build_synthetic_thread(index: int, question: str) -> dict:
    personas = [persona.model_dump() for persona in load_all()[:30]]
    posts: list[dict] = []
    for i, persona in enumerate(personas):
        posts.append(
            {
                "id": str(uuid.uuid4()),
                "persona_id": persona["id"],
                "pseudo": persona["pseudo"],
                "parent_id": None,
                "text": f"{persona['pseudo']} repond sur '{question}' avec son style Doctissimo :bounce:",
                "arrived_at": float(i + 1),
            }
        )
    for i in range(10):
        parent = posts[i]
        persona = personas[(i + 5) % len(personas)]
        posts.append(
            {
                "id": str(uuid.uuid4()),
                "persona_id": persona["id"],
                "pseudo": persona["pseudo"],
                "parent_id": parent["id"],
                "text": f"[quote={parent['pseudo']}] {parent['text']} [/quote] Je suis pas d'accord du tout :love:",
                "arrived_at": 30.0 + i,
            }
        )
    return {
        "thread_id": f"demo-{index}",
        "topic": question,
        "seed_post": question,
        "posts": posts,
        "n_personas": 30,
        "completed_at": time.time(),
    }


async def main():
    output_dir = Path(__file__).resolve().parents[2] / "data" / "seed_threads"
    output_dir.mkdir(parents=True, exist_ok=True)
    for index, question in enumerate(QUESTIONS, start=1):
        payload = _build_synthetic_thread(index, question)
        _seed_path(index).write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"seeded demo {index}: {_seed_path(index)}")


if __name__ == "__main__":
    asyncio.run(main())
