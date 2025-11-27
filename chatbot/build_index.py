"""In case you need to rebuild the FAISS index from the MongoDB data, run this script."""
import os
import pickle
from dotenv import load_dotenv
from typing import List

import numpy as np
import faiss

from load_from_mongo import get_client, load_collections
from prepare_documents import prepare_documents
from embeddings_gemini import GeminiClient

load_dotenv()

INDEX_PATH = os.path.join(os.path.dirname(__file__), "..", "faiss_index.pkl")
DOCS_PATH = os.path.join(os.path.dirname(__file__), "..", "documents.pkl")

def build_index(db_name: str, client=None, embed_client: GeminiClient = None):
    if client is None:
        client = get_client()
    items = load_collections(client=client, db_name=db_name)
    docs = prepare_documents(items)

    if embed_client is None:
        embed_client = GeminiClient()

    embeddings = []
    ids = []
    for i, d in enumerate(docs):
        text = d.get("text") or ""
        emb = embed_client.get_embedding(text)
        embeddings.append(np.array(emb, dtype=np.float32))
        ids.append(i)

    if not embeddings:
        raise RuntimeError("No embeddings computed — check your data and embedding client")

    matrix = np.vstack(embeddings)
    dim = matrix.shape[1]

    index = faiss.IndexFlatL2(dim)
    index.add(matrix)

    # Save index and docs map
    with open(INDEX_PATH, "wb") as f:
        pickle.dump(index, f)
    with open(DOCS_PATH, "wb") as f:
        pickle.dump(docs, f)

    print(f"Saved FAISS index to {INDEX_PATH} and documents to {DOCS_PATH}")


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python build_index.py <db_name>")
        raise SystemExit(1)
    build_index(sys.argv[1])
