import os
import logging
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.schemas import LiteratureSourceCitation

logger = logging.getLogger(__name__)

class LLMProviderService:
    """Configurable AI provider abstraction for literature synthesis and evidence retrieval.
    
    Adheres strictly to scientific integrity rules:
    - Never fabricates citations or experimental values.
    - If no generative provider (OpenAI, Anthropic, or local LLM) is configured,
      returns a clear AI_PROVIDER_UNCONFIGURED status and labels the output as
      deterministic passage ranking without masquerading as generative AI.
    - Grounded exclusively in verified database chunk excerpts."""

    def __init__(self):
        self.provider = os.getenv("LLM_PROVIDER", getattr(settings, "LLM_PROVIDER", "none")).lower()
        self.api_key = os.getenv("LLM_API_KEY", getattr(settings, "LLM_API_KEY", None))

    def generate_grounded_answer(
        self,
        query: str,
        citations: List[LiteratureSourceCitation],
        target_pfas: Optional[str] = None
    ) -> Dict[str, Any]:
        """Synthesizes a response grounded in retrieved citations."""
        if not citations:
            return {
                "answer": (
                    f"No empirical literature records in the local Q-FLUX database currently match the query: '{query}'. "
                    "All Q-FLUX responses are strictly evidence-grounded and do not fabricate literature sources or experimental values."
                ),
                "provider_status": "NO_EVIDENCE_FOUND",
                "is_generative": False,
                "model_name": None,
                "confidence_level": "Zero Evidence Found",
                "missing_evidence_statement": "No indexed documents or studies address this exact question with verified data."
            }

        # If an external provider is configured and an API key is present
        if self.provider in ["openai", "anthropic", "local"] and self.api_key:
            try:
                if self.provider == "openai":
                    return self._call_openai(query, citations, target_pfas)
                elif self.provider == "anthropic":
                    return self._call_anthropic(query, citations, target_pfas)
            except Exception as e:
                logger.warning(f"External LLM call failed: {e}. Falling back to deterministic synthesis.")

        # Default fallback: deterministic evidence synthesis with explicit labeling
        top_cit = citations[0]
        grounded_passages = " ".join([f"[{i+1}] {c.passage_excerpt}" for i, c in enumerate(citations[:3])])
        
        answer_text = (
            f"[Deterministic Synthesis — Generative LLM Provider Unconfigured]\n"
            f"Based on the stored research literature records in Q-FLUX for query '{query}':\n"
            f"Key reported details from primary study '{top_cit.document_title}' indicate: {top_cit.passage_excerpt}\n\n"
            f"Retrieved Evidence Excerpts:\n{grounded_passages}\n\n"
            f"Governance note: Experimental conditions, defluorination stoichiometric ratios, and matrix interferences "
            f"must be independently verified prior to drawing broad catalytic conclusions."
        )

        return {
            "answer": answer_text,
            "provider_status": "AI_PROVIDER_UNCONFIGURED",
            "is_generative": False,
            "model_name": "Deterministic Semantic Evidence Retrieval (SentenceTransformers/Local Projection)",
            "confidence_level": "Evidence Grounded (High)" if len(citations) >= 3 else "Preliminary Grounded (Moderate)",
            "missing_evidence_statement": None if len(citations) >= 2 else "Limited comparative evidence available in repository; additional peer-reviewed datasets recommended."
        }

    def _call_openai(self, query: str, citations: List[LiteratureSourceCitation], target_pfas: Optional[str]) -> Dict[str, Any]:
        """Invokes OpenAI API with strict citation grounding."""
        import requests
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        context = "\n".join([f"Citation [{i+1}] Title: {c.document_title}\nExcerpt: {c.passage_excerpt}" for i, c in enumerate(citations)])
        prompt = (
            f"You are a scientific research assistant for PFAS catalyst discovery. "
            f"Answer the user query based ONLY on the provided citations. If the evidence is insufficient, "
            f"state clearly what is missing. Never fabricate citations or numbers.\n\n"
            f"Context:\n{context}\n\nQuery: {query}"
        )
        res = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json={
                "model": "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.0
            },
            timeout=10
        )
        if res.status_code == 200:
            data = res.json()
            ans = data["choices"][0]["message"]["content"]
            return {
                "answer": ans,
                "provider_status": "GENERATIVE_LLM_ACTIVE",
                "is_generative": True,
                "model_name": "OpenAI gpt-4o-mini",
                "confidence_level": "High (AI-Assisted Grounded)",
                "missing_evidence_statement": None
            }
        raise RuntimeError(f"OpenAI error: {res.text}")

    def _call_anthropic(self, query: str, citations: List[LiteratureSourceCitation], target_pfas: Optional[str]) -> Dict[str, Any]:
        """Invokes Anthropic Claude API with strict citation grounding."""
        import requests
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        context = "\n".join([f"Citation [{i+1}] Title: {c.document_title}\nExcerpt: {c.passage_excerpt}" for i, c in enumerate(citations)])
        prompt = (
            f"Answer the query based ONLY on the provided citations. If evidence is insufficient, say so.\n\n"
            f"Context:\n{context}\n\nQuery: {query}"
        )
        res = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers=headers,
            json={
                "model": "claude-3-haiku-20240307",
                "max_tokens": 1000,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.0
            },
            timeout=10
        )
        if res.status_code == 200:
            data = res.json()
            ans = data["content"][0]["text"]
            return {
                "answer": ans,
                "provider_status": "GENERATIVE_LLM_ACTIVE",
                "is_generative": True,
                "model_name": "Anthropic Claude 3 Haiku",
                "confidence_level": "High (AI-Assisted Grounded)",
                "missing_evidence_statement": None
            }
        raise RuntimeError(f"Anthropic error: {res.text}")

llm_service = LLMProviderService()
