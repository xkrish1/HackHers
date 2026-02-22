import math

def clamp(val, min_val=0, max_val=1):
    return max(min_val, min(val, max_val))

def calculate_risk(inputs: dict):
    sleep_hours = inputs["sleep_hours"]
    deadlines = inputs["deadlines_next_7_days"]
    work_hours = inputs["work_hours"]
    stress = inputs["stress_self_report"]
    sentiment = inputs["sentiment_score"]

    R_sleep = clamp((7.5 - sleep_hours) / 3.5)
    R_deadlines = clamp(deadlines / 6)
    R_work = clamp((work_hours - 20) / 25)
    R_stress = clamp((stress - 1) / 9)
    R_sent = clamp((-sentiment + 1) / 2)

    S = (
        0.30 * R_sleep +
        0.25 * R_deadlines +
        0.20 * R_stress +
        0.15 * R_work +
        0.10 * R_sent
    )

    k = 6
    t = 0.55
    P = 1 / (1 + math.exp(-k * (S - t)))

    return {
        "burnout_probability": round(P * 100, 2),
        "risk_index_raw": round(S, 3),
        "factors": {
            "sleep": round(R_sleep, 3),
            "deadlines": round(R_deadlines, 3),
            "stress": round(R_stress, 3),
            "workload": round(R_work, 3),
            "sentiment": round(R_sent, 3),
        }
    }