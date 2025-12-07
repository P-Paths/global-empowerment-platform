"""
Shared pricing rules and helper utilities for trim tiers, mileage curves,
feature weighting, and normalization logic used by both backend agents and
API layers.
"""

from __future__ import annotations

from typing import Dict, List, Optional, Tuple

# Trim tier keyword heuristics
TRIM_TIER_KEYWORDS: Dict[str, List[str]] = {
    "base": [
        "lx",
        "l",
        "le",
        "ls",
        "se",
        "s",
        "standard",
        "base",
        "value",
        "dx",
        "fe",
    ],
    "mid": [
        "sport",
        "sr",
        "ex",
        "ex-l",
        "xle",
        "xlt",
        "trail",
        "latitude",
        "premium",
        "plus",
        "preferred",
        "select",
        "limited x",  # Jeep specific
    ],
    "high": [
        "limited",
        "touring",
        "platinum",
        "signature",
        "black label",
        "elite",
        "premier",
        "denali",
        "high country",
        "platinum plus",
        "first edition",
    ],
}

TRIM_TIER_PERCENT_RANGE: Dict[str, Tuple[float, float]] = {
    "base": (0.0, 0.0),
    "mid": (0.05, 0.08),   # +5% to +8%
    "high": (0.10, 0.15),  # +10% to +15%
}

# Reliability tiers
RELIABILITY_TIER_BRANDS: Dict[str, str] = {
    "toyota": "tier_a",
    "honda": "tier_a",
    "lexus": "tier_a",
    "acura": "tier_a",
    "subaru": "tier_a",
    "ford": "tier_b",
    "chevrolet": "tier_b",
    "chevy": "tier_b",
    "nissan": "tier_b",
    "hyundai": "tier_b",
    "kia": "tier_b",
    "jeep": "tier_b",
    "gmc": "tier_b",
    "dodge": "tier_b",
    "ram": "tier_b",
    "volkswagen": "tier_b",
    "mazda": "tier_b",
    "bmw": "tier_c",
    "mercedes-benz": "tier_c",
    "mercedes": "tier_c",
    "audi": "tier_c",
    "volvo": "tier_c",
    "porsche": "tier_c",
    "jaguar": "tier_c",
    "land rover": "tier_c",
    "infiniti": "tier_c",
    "cadillac": "tier_c",
    "lincoln": "tier_c",
}

MILEAGE_THRESHOLDS: Dict[str, List[int]] = {
    # Each list represents the mileage at which the next penalty step begins.
    # Penalty steps correspond to 0%, -2%, -5%, -10%, -15%.
    "tier_a": [150_000, 170_000, 190_000, 210_000],
    "tier_b": [100_000, 120_000, 140_000, 165_000],
    "tier_c": [70_000, 90_000, 110_000, 130_000],
}

# Detroit-specific mileage penalties (Tier_B 150k-170k: -10% to -13%, using -11.5% average)
# Chevy sedans drop faster after 150k
MILEAGE_PENALTIES = [0.0, -0.115, -0.05, -0.10, -0.15]  # 150k-170k: -10% to -13% (avg -11.5%)

# Feature weighting
FEATURE_CATEGORY_MAP: Dict[str, Dict[str, object]] = {
    "driver_assist": {
        "keywords": ["backup camera", "360 camera", "parking sensors"],
        "percent": 0.02,
        "label": "Driver Assistance",
    },
    "luxury_interior": {
        "keywords": ["leather", "heated seat", "ventilated seat", "massage seat"],
        "percent": 0.03,
        "label": "Luxury Interior",
    },
    "roof": {
        "keywords": ["sunroof", "moonroof", "panoramic"],
        "percent": 0.03,
        "label": "Premium Roof",
    },
    "infotainment": {
        "keywords": ["navigation", "carplay", "android auto", "touchscreen", "premium audio"],
        "percent": 0.02,
        "label": "Infotainment",
    },
    "performance": {
        "keywords": ["sport wheel", "black rim", "alloy wheel", "sport suspension"],
        "percent": 0.02,
        "label": "Performance Appearance",
    },
    "utility": {
        "keywords": ["third-row", "third row", "tow package", "roof rack"],
        "percent": 0.02,
        "label": "Utility",
    },
}

MAX_FEATURE_BONUS_PERCENT = 0.12  # Hard cap of +12% uplift from features


def normalize_title_status(value: Optional[str]) -> str:
    """Normalize a title status string to a canonical lowercase form."""
    if not value or not isinstance(value, str):
        return "clean"
    cleaned = value.strip().lower()
    if cleaned in {"rebuilt", "salvage"}:
        return cleaned
    if cleaned in {"branded", "flood", "lemon"}:
        return cleaned
    if cleaned == "clean":
        return "clean"
    # Default to the provided value but ensure it is at least descriptive
    return cleaned or "clean"


def detect_trim_tier(trim: Optional[str]) -> Tuple[str, List[str]]:
    """
    Determine trim tier (base/mid/high) based on trim keywords.

    Returns:
        tier: str
        matched_keywords: list of keyword hits (for transparency)
    """
    if not trim or not isinstance(trim, str):
        return "base", []
    trim_lower = trim.lower()
    matches: List[str] = []
    chosen_tier = "base"
    for tier, keywords in TRIM_TIER_KEYWORDS.items():
        for keyword in keywords:
            if keyword and keyword in trim_lower:
                matches.append(keyword)
                # Prefer the highest tier encountered (base < mid < high)
                if tier == "high":
                    return "high", matches
                if tier == "mid":
                    chosen_tier = "mid"
    return chosen_tier, matches


def get_trim_adjustment_percent(tier: str, match_count: int = 1, trim: Optional[str] = None, model: Optional[str] = None) -> float:
    """
    Translate trim tier into a percentage uplift.
    Uses midpoint values within the allowed range, weighted by keyword hits.
    
    Detroit-specific trim adjustments for Malibu:
    - LS: baseline (0%)
    - LT: +4% to +7% (average 5.5%)
    - LTZ: +10% to +15% (average 12.5%)
    """
    if trim and isinstance(trim, str) and model and isinstance(model, str):
        trim_lower = trim.lower()
        model_lower = model.lower()
        
        # Malibu-specific trim adjustments
        if "malibu" in model_lower:
            if "ltz" in trim_lower or "premier" in trim_lower:
                return 0.125  # LTZ: +10% to +15% (average 12.5%)
            elif "lt" in trim_lower and "ltz" not in trim_lower:
                return 0.055  # LT: +4% to +7% (average 5.5%)
            elif "ls" in trim_lower:
                return 0.0  # LS: baseline (0%)
    
    # Detroit-specific: Sport trim gets +3%
    if trim and isinstance(trim, str) and "sport" in trim.lower():
        return 0.03
    
    range_low, range_high = TRIM_TIER_PERCENT_RANGE.get(tier, (0.0, 0.0))
    if range_high == range_low:
        return range_low
    # Weight toward the high end if multiple keywords matched
    steps = max(match_count, 1)
    # Clamp steps to 3 to avoid exceeding the max range
    steps = min(steps, 3)
    if steps == 1:
        return range_low
    if steps == 2:
        return round(range_low + (range_high - range_low) * 0.5, 4)
    return range_high


def format_trim_tier_label(tier: str, trim_value: Optional[str], matches: List[str]) -> str:
    if tier == "base":
        return "Base Trim (no premium keywords detected)"
    if tier == "mid":
        return f"Mid Trim ({', '.join(matches) if matches else trim_value})"
    if tier == "high":
        return f"High Trim ({', '.join(matches) if matches else trim_value})"
    return "Unknown Trim Tier"


def get_reliability_tier(make: Optional[str]) -> str:
    """
    Map make to reliability tier (A/B/C). Defaults to Tier B when unknown.
    """
    if not make or not isinstance(make, str):
        return "tier_b"
    return RELIABILITY_TIER_BRANDS.get(make.strip().lower(), "tier_b")


def calculate_mileage_penalty_percent(
    mileage: Optional[int],
    reliability_tier: str,
) -> Tuple[float, str]:
    """
    Calculate mileage penalty percent (negative) and descriptive label
    based on reliability tier tables.
    """
    if not mileage or mileage <= 0:
        return 0.0, "Mileage within base range"
    thresholds = MILEAGE_THRESHOLDS.get(reliability_tier, MILEAGE_THRESHOLDS["tier_b"])
    penalty_index = 0
    for idx, threshold in enumerate(thresholds, start=1):
        if mileage < threshold:
            penalty_index = idx - 1
            break
    else:
        penalty_index = len(MILEAGE_PENALTIES) - 1

    penalty_percent = MILEAGE_PENALTIES[penalty_index]

    if penalty_index == 0:
        label = f"{reliability_tier.title()} · Up to {thresholds[0]:,} mi (0%)"
    elif penalty_index >= len(thresholds):
        label = f"{reliability_tier.title()} · {thresholds[-1]:,}+ mi (-15%)"
    else:
        lower = thresholds[penalty_index - 1]
        upper = thresholds[penalty_index]
        label = f"{reliability_tier.title()} · {lower:,}-{upper:,} mi ({penalty_percent*100:.0f}%)"
    return penalty_percent, label


def calculate_feature_bonus(features: List[str]) -> Tuple[float, List[Dict[str, object]], bool]:
    """
    Calculate total feature bonus percent (capped) and a breakdown of
    contributing categories.
    """
    if not features:
        return 0.0, [], False
    normalized_features = [f.lower() for f in features if isinstance(f, str)]
    total_percent = 0.0
    breakdown: List[Dict[str, object]] = []

    for category, data in FEATURE_CATEGORY_MAP.items():
        keywords: List[str] = data.get("keywords", [])  # type: ignore
        percent: float = data.get("percent", 0.0)  # type: ignore
        label: str = data.get("label", category.title())  # type: ignore
        matched_keyword = None
        for keyword in keywords:
            keyword_lower = keyword.lower()
            for feature in normalized_features:
                if keyword_lower in feature:
                    matched_keyword = keyword
                    break
            if matched_keyword:
                break
        if matched_keyword:
            total_percent += percent
            breakdown.append(
                {
                    "category": category,
                    "label": label,
                    "keyword": matched_keyword,
                    "percent": percent,
                }
            )

    cap_applied = total_percent > MAX_FEATURE_BONUS_PERCENT
    if cap_applied:
        total_percent = MAX_FEATURE_BONUS_PERCENT

    return round(total_percent, 4), breakdown, cap_applied

