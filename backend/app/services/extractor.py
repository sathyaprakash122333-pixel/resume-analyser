import logging
from typing import Tuple
from fastapi import HTTPException, status, UploadFile
import fitz  # PyMuPDF
from app.core.config import settings

import re

logger = logging.getLogger("extractor")

PDF_MAGIC_BYTES = b"%PDF-"
MAX_CHARS = 16000
MIN_EXTRACTED_CHARS = 50


async def extract_and_validate_pdf(file: UploadFile) -> Tuple[str, str]:
    """
    Validates PDF format, checks magic bytes, enforces 5 MB limit,
    and extracts readable text using PyMuPDF.
    Returns (extracted_text, filename).
    """
    filename = file.filename or "resume.pdf"

    # Read binary content into memory
    content = await file.read()
    file_size = len(content)

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty."
        )

    if file_size > settings.max_upload_size_bytes:
        size_mb = round(file_size / (1024 * 1024), 2)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Uploaded file exceeds the 5 MB limit (size: {size_mb} MB)."
        )

    # Magic byte verification for true PDF structure
    if not content.startswith(PDF_MAGIC_BYTES) and PDF_MAGIC_BYTES not in content[:1024]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid document structure. The uploaded file is not a valid PDF document."
        )

    try:
        doc = fitz.open(stream=content, filetype="pdf")
    except Exception as e:
        logger.error("Failed to parse PDF structure: %s", e)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The uploaded PDF is malformed or corrupted."
        )

    try:
        if doc.is_encrypted:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded PDF is password-protected or encrypted. Please upload an unprotected document."
            )

        extracted_text_parts = []
        total_chars = 0

        for page_idx in range(len(doc)):
            page = doc.load_page(page_idx)
            page_text = page.get_text("text")
            extracted_text_parts.append(page_text)
            total_chars += len(page_text)

            # Prevent decompression bombs
            if total_chars > MAX_CHARS:
                break

        full_text = "\n".join(extracted_text_parts).strip()
        # Normalize redundant blank lines
        full_text = re.sub(r"\n{3,}", "\n\n", full_text)

        if len(full_text) < MIN_EXTRACTED_CHARS:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    "The uploaded document contains no extractable text. Scanned image PDFs and "
                    "optical character recognition (OCR) are not supported yet; please upload a text-based PDF."
                )
            )

        return full_text[:MAX_CHARS], filename

    finally:
        doc.close()
