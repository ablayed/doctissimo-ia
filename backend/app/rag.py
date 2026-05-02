import os

from FlagEmbedding import BGEM3FlagModel
from upstash_vector import Index


_model: BGEM3FlagModel | None = None


def _embedding_model() -> BGEM3FlagModel:
    global _model
    if _model is None:
        _model = BGEM3FlagModel("BAAI/bge-m3", use_fp16=True, normalize_embeddings=True)
    return _model


async def query(text: str, k: int = 5) -> str:
    model = _embedding_model()
    dense = model.encode([text], return_dense=True)["dense_vecs"][0]
    index = Index(
        url=os.environ["UPSTASH_VECTOR_REST_URL"],
        token=os.environ["UPSTASH_VECTOR_REST_TOKEN"],
    )
    results = index.query(
        vector=dense.tolist(),
        top_k=k,
        include_metadata=True,
        include_vectors=False,
    )
    if not results:
        return ""

    chunks: list[str] = []
    for result in results:
        metadata = result.metadata or {}
        chunk = metadata.get("text")
        url = metadata.get("url")
        if chunk and url:
            chunks.append(f"[Source: {url}]\n{chunk}")
    return "\n\n---\n\n".join(chunks)
