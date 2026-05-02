import os
from pathlib import Path

import tiktoken
import yaml
from FlagEmbedding import BGEM3FlagModel
from upstash_vector import Index


ROOT = Path(__file__).parent
CORPUS_DIR = ROOT / "corpus"
WINDOW_TOKENS = 800
OVERLAP_TOKENS = 120


def _chunks(text: str) -> list[str]:
    encoding = tiktoken.get_encoding("cl100k_base")
    tokens = encoding.encode(text)
    chunks: list[str] = []
    step = WINDOW_TOKENS - OVERLAP_TOKENS
    for start in range(0, len(tokens), step):
        window = tokens[start : start + WINDOW_TOKENS]
        if not window:
            continue
        chunks.append(encoding.decode(window))
    return chunks


def _read_doc(path: Path) -> tuple[dict, str]:
    raw = path.read_text(encoding="utf-8")
    if raw.startswith("---"):
        _, metadata_raw, body = raw.split("---", 2)
        return yaml.safe_load(metadata_raw), body.strip()
    return {"source": path.stem, "topic": path.stem, "url": ""}, raw


def main() -> None:
    model = BGEM3FlagModel("BAAI/bge-m3", use_fp16=True, normalize_embeddings=True)
    index = Index(
        url=os.environ["UPSTASH_VECTOR_REST_URL"],
        token=os.environ["UPSTASH_VECTOR_REST_TOKEN"],
    )
    docs = sorted(CORPUS_DIR.glob("*.md"))
    vectors = []
    total = 0
    for path in docs:
        metadata, text = _read_doc(path)
        for chunk_idx, chunk in enumerate(_chunks(text)):
            vector_id = f"{metadata['source']}_{metadata['topic']}_{chunk_idx}"
            embedding = model.encode([chunk], return_dense=True)["dense_vecs"][0]
            vectors.append(
                {
                    "id": vector_id,
                    "vector": embedding.tolist(),
                    "metadata": {
                        **metadata,
                        "chunk_idx": chunk_idx,
                        "text": chunk,
                    },
                }
            )
            total += 1
            print(f"[{total}] queued chunk {metadata['topic']}_{chunk_idx}")
            if len(vectors) >= 16:
                index.upsert(vectors=vectors)
                print(f"[{total}] upserted batch")
                vectors.clear()
    if vectors:
        index.upsert(vectors=vectors)
        print(f"[{total}] upserted final batch")


if __name__ == "__main__":
    main()
