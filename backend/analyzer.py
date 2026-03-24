import re
from typing import List, Tuple

OWNERSHIP_KEYWORDS = [
    "km",
    "ridden",
    "odometer",
    "my ather",
    "owned",
    "bought",
    "using for",
    "been riding",
    "daily commute",
    "service history",
    "months of",
    "year of ownership",
    "after using",
    "while using",
    "my scooter",
    "my rizta",
    "my 450x",
    "almost",
    "over",
]

NON_OWNER_KEYWORDS = [
    "looking to buy",
    "planning to",
    "considering",
    "thinking about",
    "should i buy",
    "is it worth",
    "review",
    "first ride",
    "test ride",
    "which one",
    "vs ",
    "vs.",
    "compare",
    "anybody who",
    "people who",
    "owners please",
    "suggest",
]

DISTANCE_PATTERNS = [
    r"\d+\s*km",
    r"\d+k\s*km",
    r"\d+\.\d+\s*km",
    r"\d+\s*kms",
    r"\d+\s*k\s*km",
]


def is_owner_post(title: str, body: str) -> bool:
    if not body:
        body = ""

    text = f"{title} {body}".lower()

    non_owner_count = sum(1 for kw in NON_OWNER_KEYWORDS if kw in text)
    if non_owner_count > 0:
        return False

    owner_count = sum(1 for kw in OWNERSHIP_KEYWORDS if kw in text)

    for pattern in DISTANCE_PATTERNS:
        if re.search(pattern, text):
            owner_count += 1

    return owner_count >= 2


CLUSTER_KEYWORDS = {
    "Battery & Range": [
        "battery",
        "range",
        "charging",
        "charge",
        "drain",
        "mileage",
        "km",
        "kms",
        "kmpl",
        "full charge",
        "low battery",
        "battery health",
        "charging time",
        "fast charger",
        "home charging",
        "grid",
    ],
    "Service & Support": [
        "service",
        "repair",
        "warranty",
        "support",
        "maintenance",
        "issue",
        "problem",
        "broken",
        "not working",
        "defective",
        "replacement",
        "spare",
        "parts",
        "service center",
        "authorized",
        "free service",
    ],
    "Performance": [
        "speed",
        "acceleration",
        "warp",
        "power",
        "torque",
        "fast",
        "performance",
        "top speed",
        "pickup",
        "throttle",
        "boost",
    ],
    "Build Quality": [
        "quality",
        "rattle",
        "noise",
        "vibration",
        "plastic",
        "build",
        "durability",
        "robust",
        "sturdy",
        "cheap",
        "premium",
        "material",
        "finish",
        "panel",
        "loose",
        "tight",
    ],
    "App & Tech": [
        "app",
        "software",
        "update",
        "bluetooth",
        "display",
        "connected",
        "connectivity",
        "ota",
        "map",
        "gps",
        "navigation",
        "screen",
    ],
    "Buying Experience": [
        "buying",
        "purchase",
        "price",
        "delivery",
        "showroom",
        "deal",
        "ex-showroom",
        "on-road",
        "discount",
        "exchange",
        "booking",
        "wait time",
        "delivery date",
        "received",
        "bought",
    ],
    "Comfort": [
        "seat",
        "suspension",
        "ride",
        "comfortable",
        "bumpy",
        "pillion",
        "cushion",
        "backrest",
        "leg space",
        "ergonomics",
        "riding position",
    ],
    "Positive Experience": [
        "love",
        "amazing",
        "best",
        "great",
        "excellent",
        "happy",
        "fantastic",
        "perfect",
        "awesome",
        "wonderful",
        "recommend",
        "satisfied",
        "delighted",
        "worth it",
        "value for money",
    ],
}


def get_tags(title: str, body: str) -> List[Tuple[str, int]]:
    if not body:
        body = ""

    text = f"{title} {body}".lower()

    matches = []
    for cluster, keywords in CLUSTER_KEYWORDS.items():
        score = 0
        for keyword in keywords:
            if keyword in text:
                score += 1
        if score > 0:
            matches.append((cluster, score))

    matches.sort(key=lambda x: x[1], reverse=True)
    return matches


def extract_key_metrics(title: str, body: str) -> dict:
    metrics = {}

    if not body:
        body = ""

    text = f"{title} {body}"

    km_match = re.search(r"(\d+)\s*(?:km|k\s*km|kms)", text.lower())
    if km_match:
        metrics["km_mentioned"] = int(km_match.group(1))

    model_match = re.search(r"(450x|450s|450|rizta|ather)", text.lower())
    if model_match:
        metrics["model"] = model_match.group(1).upper()

    return metrics
