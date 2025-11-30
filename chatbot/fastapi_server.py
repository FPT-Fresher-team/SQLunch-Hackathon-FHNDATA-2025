
import os
import pickle
from typing import List, Optional
from contextlib import asynccontextmanager
import logging

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import faiss
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from embeddings_gemini import GeminiClient
from load_from_mongo import get_client, load_collections
from prepare_documents import prepare_documents

load_dotenv()

# Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") 
MONGO_URI = os.getenv("MONGO_DB")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "bunnyStore_database")
PRODUCT_DOMAIN = os.getenv("PRODUCT_DOMAIN", "http://localhost:3000")

BASE_DIR = os.path.dirname(__file__)
INDEX_PATH = os.path.join(BASE_DIR, "..", "faiss_index.pkl")
DOCS_PATH = os.path.join(BASE_DIR, "..", "documents.pkl")

# Logger
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


# ============================================================================
# Global State
# ============================================================================
class IndexState:
    index: Optional[faiss.Index] = None
    docs: Optional[List[dict]] = None
    client: Optional[GeminiClient] = None
    
    @classmethod
    def load(cls):
        """Load FAISS index and documents from disk."""
        if not os.path.exists(INDEX_PATH) or not os.path.exists(DOCS_PATH):
            raise FileNotFoundError(f"Index or documents not found at {INDEX_PATH}")
        
        with open(INDEX_PATH, "rb") as f:
            cls.index = pickle.load(f)
        with open(DOCS_PATH, "rb") as f:
            cls.docs = pickle.load(f)
    
    @classmethod
    def init_client(cls):
        """Initialize Gemini client."""
        if not cls.client:
            cls.client = GeminiClient()


# ============================================================================
# Background Job Functions
# ============================================================================
def rebuild_index_job():
    """Background job to rebuild FAISS index from MongoDB."""
    logger.info("[SCHEDULER] Starting scheduled index rebuild...")
    try:
        # Load data from MongoDB
        mongo_client = get_client(uri=MONGO_URI)
        items = load_collections(
            client=mongo_client,
            db_name=MONGO_DB_NAME,
            collection_names=["products", "vouchers"]
        )
        logger.info(f"[SCHEDULER] Loaded {len(items)} items from MongoDB")
        
        # Prepare documents
        docs = prepare_documents(items)
        logger.info(f"[SCHEDULER] Prepared {len(docs)} documents")
        
        # Initialize Gemini client
        embed_client = GeminiClient()
        
        # Compute embeddings
        embeddings = []
        for i, d in enumerate(docs):
            text = d.get("text") or ""
            emb = embed_client.get_embedding(text)
            embeddings.append(np.array(emb, dtype=np.float32))
            if (i + 1) % 100 == 0:
                logger.info(f"[SCHEDULER] Computed {i + 1}/{len(docs)} embeddings")
        
        if not embeddings:
            raise RuntimeError("No embeddings computed")
        
        # Build FAISS index
        matrix = np.vstack(embeddings)
        dim = matrix.shape[1]
        index = faiss.IndexFlatL2(dim)
        index.add(matrix)
        logger.info(f"[SCHEDULER] Built FAISS index with {len(docs)} documents")
        
        # Save to disk
        with open(INDEX_PATH, "wb") as f:
            pickle.dump(index, f)
        with open(DOCS_PATH, "wb") as f:
            pickle.dump(docs, f)
        logger.info(f"[SCHEDULER] Saved index to {INDEX_PATH}")
        
        # Update global state
        IndexState.index = index
        IndexState.docs = docs
        logger.info("[SCHEDULER] ✅ Index rebuild completed successfully")
        
    except Exception as e:
        logger.error(f"[SCHEDULER] ❌ Index rebuild failed: {str(e)}")


# ============================================================================
# Startup/Shutdown
# ============================================================================
scheduler = BackgroundScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    # Startup
    try:
        IndexState.load()
        IndexState.init_client()
        logger.info("✅ FAISS index and Gemini client loaded successfully")
    except FileNotFoundError:
        # Index doesn't exist, build it automatically
        logger.warning("⚠️  Index not found. Building automatically on startup...")
        try:
            rebuild_index_job()
            IndexState.load()
            IndexState.init_client()
            logger.info("✅ Index built and loaded successfully on startup")
        except Exception as build_error:
            logger.error(f"❌ Failed to build index on startup: {str(build_error)}")
            logger.warning("⚠️  Server started but index is not available. Chat will not work.")
    except Exception as e:
        logger.warning(f"⚠️  Warning during startup: {e}")
    
    # Start scheduler
    try:
        # Schedule index rebuild at 3:00 AM daily
        scheduler.add_job(
            rebuild_index_job,
            CronTrigger(hour=3, minute=0),
            id="rebuild_index_job",
            name="Daily FAISS Index Rebuild",
            replace_existing=True
        )
        scheduler.start()
        logger.info("✅ Scheduler started - daily rebuild at 3:00 AM")
    except Exception as e:
        logger.warning(f"⚠️  Warning starting scheduler: {e}")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down FastAPI server")
    scheduler.shutdown(wait=True)
    logger.info("🛑 Scheduler stopped")


app = FastAPI(
    title="SQLunch RAG Chatbot",
    description="RAG-based chatbot for product, voucher, and comment queries",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration for JavaScript frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Pydantic Models
# ============================================================================
class ChatRequest(BaseModel):
    query: str
    top_k: int = 5
    user_id: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str  # Can be plain text or Markdown
    sources: List[dict]
    query: str
    format: str = "markdown"  # Indicates answer is in Markdown format



# ============================================================================
# Helper Functions
# ============================================================================
def retrieve(
    query: str,
    embed_client: GeminiClient,
    index: faiss.Index,
    docs: List[dict],
    top_k: int = 5
) -> List[dict]:
    """Retrieve top-k documents similar to query."""
    q_emb = np.array(embed_client.get_embedding(query), dtype=np.float32).reshape(1, -1)
    D, I = index.search(q_emb, top_k)
    
    results = []
    for idx in I[0]:
        if idx < 0 or idx >= len(docs):
            continue
        results.append(docs[idx])
    
    return results


def build_context(retrieved: List[dict]) -> tuple[str, List[dict]]:
    """Build context string and extract sources from retrieved documents."""
    parts = []
    sources = []
    
    for r in retrieved:
        meta = r.get("metadata", {})
        collection = meta.get("collection")
        text = r.get("text")
        doc_id = r.get("id")
        
        # Build source info
        source_info = {
            "id": doc_id,
            "collection": collection,
            "metadata": meta
        }
        
        # Add product link if available
        if collection == "products":
            product_id = meta.get("id")
            if product_id:
                product_link = f"{PRODUCT_DOMAIN}/all-products/product/{product_id}"
                source_info["url"] = product_link
                parts.append(f"Sản phẩm:\n{text}\n[Xem chi tiết]({product_link})")
            else:
                parts.append(f"Sản phẩm:\n{text}")
        elif collection == "vouchers":
            parts.append(f"Khuyến mãi:\n{text}")
        else:
            parts.append(f"Nguồn ({collection}):\n{text}")
        
        sources.append(source_info)
    
    return "\n\n".join(parts), sources


def build_prompt(query: str, context: str) -> str:
    """Build system prompt for Gemini - asks for Markdown formatted answer."""
    return f"""Bạn là trợ lý thân thiện cho website bán mỹ phẩm BEAUTÉ. 
Trả lời câu hỏi của khách hàng dựa trên thông tin được cung cấp dưới đây. 
Lưu ý câu hỏi khách hàng sẽ thường là tiếng việt.
Hãy trả lời ngắn gọn, hữu ích và bằng tiếng Việt. 
Nếu có thông tin về sản phẩm, hãy bao gồm link sản phẩm. 

**IMPORTANT: Format your answer in Markdown with:**
- **Bold text** for important product names/features using **text**
- Line breaks for better readability
- Bullet points using - for lists
- Markdown links using [product name](link) for product links
Nếu không có thông tin liên quan, hãy nói rằng bạn không có thông tin để trả lời.

Thông tin liên quan:
{context}

Câu hỏi: {query}

Trả lời (dùng Markdown format):"""


# ============================================================================
# Endpoints
# ============================================================================

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """RAG-based chat endpoint."""
    if IndexState.index is None or IndexState.docs is None:
        raise HTTPException(status_code=503, detail="Index not loaded. Please build index first.")
    
    if IndexState.client is None:
        raise HTTPException(status_code=503, detail="Gemini client not initialized.")
    
    query = request.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    
    try:
        # Retrieve relevant documents
        retrieved = retrieve(
            query,
            IndexState.client,
            IndexState.index,
            IndexState.docs,
            top_k=request.top_k
        )
        
        # Build context and extract sources
        context, sources = build_context(retrieved)
        
        # Generate answer
        prompt = build_prompt(query, context)
        answer = IndexState.client.generate(prompt=prompt, context="")
        
        return ChatResponse(
            answer=answer,
            sources=sources,
            query=query
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing chat: {str(e)}"
        )


\

# ============================================================================
# Root endpoint
# ============================================================================
@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": "SQLunch RAG Chatbot API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("FASTAPI_PORT", 8000))
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info"
    )
