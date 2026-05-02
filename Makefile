ingest:
	cd data && python ingest.py

index:
	cd data && python index_rag.py

rag-all: ingest index
