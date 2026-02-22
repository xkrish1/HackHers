import math

def clamp(val, min_val=0, max_val=1):
    return max(min_val, min(val, max_val))

def calculate_risk(inputs: dict):
    # Default weights
    weights = {
        "sleep": 0.30,
        "deadlines": 0.25,
        "stress": 0.20,
        "workload": 0.15,
        "sentiment": 0.10,
    }

    components = {}

    # Sleep
    sleep_hours = inputs.get("sleep_hours")
    if sleep_hours is not None:
        components["sleep"] = clamp((7.5 - sleep_hours) / 3.5)

    # Deadlines
    deadlines = inputs.get("deadlines_next_7_days")
    if deadlines is not None:
        components["deadlines"] = clamp(deadlines / 6)

    # Work hours
    work_hours = inputs.get("work_hours")
    if work_hours is not None:
        components["workload"] = clamp((work_hours - 20) / 25)

    # Self stress
    stress = inputs.get("stress_self_report")
    if stress is not None:
        components["stress"] = clamp((stress - 1) / 9)

    # Sentiment
    sentiment = inputs.get("sentiment_score")
    if sentiment is not None:
        components["sentiment"] = clamp((-sentiment + 1) / 2)

    # If nothing provided
    if not components:
        return {
            "error": "No valid inputs provided"
        }

    # Re-normalize weights dynamically
    active_weights_sum = sum(weights[k] for k in components.keys())

    S = sum(
        (weights[k] / active_weights_sum) * components[k]
        for k in components.keys()
    )

    # Logistic transformation
    k = 6
    t = 0.55
    P = 1 / (1 + math.exp(-k * (S - t)))

    return {
        "burnout_probability": round(P * 100, 2),
        "risk_index_raw": round(S, 3),
        "inputs_used": list(components.keys()),
        "factors": {k: round(v, 3) for k, v in components.items()}
    }