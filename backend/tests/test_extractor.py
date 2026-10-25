import io
import pytest
from fastapi import HTTPException
from fastapi.datastructures import UploadFile
from app.services.extractor import extract_and_validate_pdf


@pytest.mark.asyncio
async def test_extractor_rejects_empty_file():
    empty_stream = io.BytesIO(b"")
    upload_file = UploadFile(filename="resume.pdf", file=empty_stream)
    
    with pytest.raises(HTTPException) as exc_info:
        await extract_and_validate_pdf(upload_file)
    assert exc_info.value.status_code == 400
    assert "empty" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_extractor_rejects_non_pdf():
    text_stream = io.BytesIO(b"This is just plain text, not a real PDF document.")
    upload_file = UploadFile(filename="fake.pdf", file=text_stream)

    with pytest.raises(HTTPException) as exc_info:
        await extract_and_validate_pdf(upload_file)
    assert exc_info.value.status_code == 400
    assert "not a valid pdf" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_extractor_rejects_oversized_file():
    # 6 MB of data
    large_bytes = b"%PDF-" + (b"0" * (6 * 1024 * 1024))
    large_stream = io.BytesIO(large_bytes)
    upload_file = UploadFile(filename="huge.pdf", file=large_stream)

    with pytest.raises(HTTPException) as exc_info:
        await extract_and_validate_pdf(upload_file)
    assert exc_info.value.status_code == 413
    assert "5 mb limit" in exc_info.value.detail.lower()
