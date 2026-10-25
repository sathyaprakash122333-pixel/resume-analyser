import pytest
from app.services.gemini_service import compute_weighted_overall_score, get_status_label


def test_score_weighting_formula():
    # Perfect score test: all 100 -> 100
    assert compute_weighted_overall_score(100, 100, 100, 100, 100) == 100

    # Zero score test: all 0 -> 0
    assert compute_weighted_overall_score(0, 0, 0, 0, 0) == 0

    # Specific weight test:
    # skills: 80 * 0.30 = 24
    # experience: 70 * 0.25 = 17.5
    # content: 60 * 0.20 = 12
    # structure: 90 * 0.15 = 13.5
    # completeness: 50 * 0.10 = 5
    # sum = 24 + 17.5 + 12 + 13.5 + 5 = 72
    result = compute_weighted_overall_score(80, 70, 60, 90, 50)
    assert result == 72


def test_score_bounds_enforcement():
    # Scores > 100 should clamp to 100
    assert compute_weighted_overall_score(120, 150, 200, 105, 110) == 100

    # Negative scores should clamp to 0
    assert compute_weighted_overall_score(-10, -50, -5, -2, 0) == 0


def test_status_label():
    assert get_status_label(90) == "Excellent"
    assert get_status_label(85) == "Excellent"
    assert get_status_label(80) == "Good"
    assert get_status_label(75) == "Good"
    assert get_status_label(65) == "Average"
    assert get_status_label(60) == "Average"
    assert get_status_label(59) == "Needs Improvement"
    assert get_status_label(40) == "Needs Improvement"
