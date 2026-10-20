# Q&A: Data Integrity & AI Safeguards

## Q: What stops the AI (Gemini) from fabricating skills, projects, or achievements?
A: Three strict architectural safeguards prevent AI hallucination:
1. **Strict Zero Temperature:** Gemini is invoked at `temperature: 0.0` with response mime type restricted strictly to JSON.
2. **Mandatory Verbatim Quotes:** Gemini must return an exact verbatim substring (`quote`) directly from the resume text alongside every extracted item.
3. **Post-Extraction Code Verification:** Deterministic Python code checks whether the normalized quote exists in the raw resume text. If the quote is missing or modified, the item's status is automatically downgraded to `UNCERTAIN` and confidence drops to `0.3`.

## Q: Does the LLM ever decide the shortlist?
A: **Never.** The LLM's sole responsibility is text extraction and signal parsing. All scoring, weight application, missing-data redistribution, hard eligibility rule checks, and ranking are performed entirely by deterministic Python code.

## Q: How are third-party API failures (GitHub rate limits or private links) handled?
A: Integrations never throw unhandled exceptions. Failures are caught gracefully and converted into structured status flags (`API_FAILED`, `UNAVAILABLE`, `INVALID`, `MISSING`), which trigger warning badges in the frontend or fall back to local disk cache (`cache/`).