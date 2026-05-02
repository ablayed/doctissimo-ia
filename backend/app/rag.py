import os

from upstash_vector import Index


_model = None

FALLBACK_CONTEXT = """[Source: https://www.ameli.fr/assure/sante/themes/mal-ventre]
Pour une douleur abdominale qui persiste, s'aggrave, s'accompagne de fièvre, vomissements, malaise, sang, grossesse ou douleur intense, il faut demander un avis médical rapidement.

[Source: https://www.has-sante.fr/]
Les informations de forum ne remplacent pas un professionnel de santé. En cas de doute ou signe d'urgence, appeler le 15 ou le 112."""


def _embedding_model():
    from FlagEmbedding import BGEM3FlagModel

    global _model
    if _model is None:
        _model = BGEM3FlagModel("BAAI/bge-m3", use_fp16=True, normalize_embeddings=True)
    return _model


async def query(text: str, k: int = 5) -> str:
    if os.environ.get("ENABLE_BGE_RAG") != "1":
        return FALLBACK_CONTEXT

    model = _embedding_model()
    try:
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
    except Exception:
        return FALLBACK_CONTEXT
    if not results:
        return FALLBACK_CONTEXT

    chunks: list[str] = []
    for result in results:
        metadata = result.metadata or {}
        chunk = metadata.get("text")
        url = metadata.get("url")
        if chunk and url:
            chunks.append(f"[Source: {url}]\n{chunk}")
    return "\n\n---\n\n".join(chunks)
