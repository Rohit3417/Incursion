import time
import  pymupdf
import requests
from integrations.cache import read_from_cache, write_to_cache
from backend.app.ingest.flags import StatusFlag

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def extract_text_from_pdf(url_or_path: str) -> str:
    """
    Fail-safe PDF text extractor with retries, private Drive detection, and non-PDF guards.
    Never raises an unhandled exception; returns a StatusFlag string on failure.
    """
    if not url_or_path or url_or_path in [StatusFlag.MISSING, StatusFlag.INVALID]:
        return StatusFlag.MISSING

    cached_text = read_from_cache(url_or_path)
    if cached_text:
        return cached_text

    try:
        if url_or_path.startswith(("http://", "https://")):
            response = None
            for attempt in range(3):
                try:
                    response = requests.get(url_or_path, timeout=8, stream=True, allow_redirects=True)
                    if response.status_code < 500:
                        break
                except requests.exceptions.RequestException:
                    time.sleep(0.5 * (2 ** attempt))

            if response is None:
                return StatusFlag.API_FAILED
            if response.status_code == 404:
                return StatusFlag.INVALID
            if response.status_code in (401, 403):
                return StatusFlag.UNAVAILABLE
            if response.status_code >= 400:
                return StatusFlag.API_FAILED

            # Detect private Google Drive sign-in pages or HTML responses instead of PDF binary
            content_type = response.headers.get("Content-Type", "").lower()
            if "text/html" in content_type or "accounts.google.com" in response.url:
                return StatusFlag.UNAVAILABLE

            if int(response.headers.get("Content-Length", 0)) > MAX_FILE_SIZE:
                return StatusFlag.UNAVAILABLE

            pdf_bytes = response.content
            # Verify PDF magic header (%PDF)
            if not pdf_bytes.startswith(b"%PDF"):
                return StatusFlag.INVALID

            doc = pymupdf.open("pdf", pdf_bytes)
        else:
            if not str(url_or_path).lower().endswith(".pdf"):
                return StatusFlag.INVALID
            doc = pymupdf.open(url_or_path)

        text = "".join(page.get_text() for page in doc)
        doc.close()

        if not text.strip():
            return "NO TEXT"

        write_to_cache(url_or_path, text)
        return text

    except Exception:
        return StatusFlag.INVALID