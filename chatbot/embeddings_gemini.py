import os
os.environ["TRANSFORMERS_NO_TF"] = "1"
os.environ["TRANSFORMERS_NO_FLAX"] = "1"
from typing import List
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
load_dotenv()
import google.generativeai as genai

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


class GeminiClient:
    def __init__(self):
        
        # Load BGE-M3 model
        try:
    
            self.model = SentenceTransformer("BAAI/bge-m3")
        except Exception as e:
            print(f"❌ Error loading BGE-M3: {e}")
            raise

        # Setup Gemini for generation
        if not GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not set in environment")

        genai.configure(api_key=GEMINI_API_KEY)
        self.genai = genai

    def get_embedding(self, text: str) -> List[float]:
        """
        Return embedding vector for `text` using BGE-M3 (1024 dims).
        """
        embeddings = self.model.encode([text], convert_to_tensor=False)
        return embeddings[0].tolist()

    def generate(self, prompt: str, context: str = "") -> str:
        full_prompt = f"{prompt}\n\nContext:\n{context}" if context else prompt

        model = self.genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(full_prompt)
        return response.text


__all__ = ["GeminiClient"]
