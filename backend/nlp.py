import os
import json
from google import genai
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

RISK_KEYS = [
    "sleep_hours",
    "deadlines_next_7_days",
    "work_hours",
    "stress_self_report",
    "sentiment_score",
]


def extract_burnout_inputs(json_data: dict) -> dict:
    journal_text = json_data.get("journal_text", "")

    prompt = f"""
Return ONLY valid JSON (no markdown, no extra text).
Keys must be a subset of: {RISK_KEYS}

Rules:
- sleep_hours (number), deadlines_next_7_days (int), work_hours (number), stress_self_report (int 1-10):
  Include ONLY if the journal explicitly states a numeric value. Otherwise OMIT the key.
  Do NOT guess or infer.
- sentiment_score (float in [-1, 1]):
  ALWAYS include. Compute from overall tone: -1 very negative, 0 neutral/mixed, +1 very positive.

Journal entry:
{journal_text}
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    raw = (response.text or "").strip()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return {"sentiment_score": 0.0}

    out = {k: data[k] for k in data if k in RISK_KEYS}

    try:
        sent = float(out.get("sentiment_score", 0.0))
    except (TypeError, ValueError):
        sent = 0.0
    out["sentiment_score"] = max(-1.0, min(1.0, sent))

    for k in ("sleep_hours", "deadlines_next_7_days", "work_hours", "stress_self_report"):
        if k in out and (out[k] is None or out[k] == ""):
            out.pop(k, None)

    return out
