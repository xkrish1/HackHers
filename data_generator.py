import random

def generate_student_profile(scenario="balanced"):
    if scenario == "balanced":
        return {
            "sleep_hours": 7,
            "deadlines_next_7_days": 1,
            "work_hours": 20,
            "stress_self_report": 3,
            "sentiment_score": 0.4
        }
    elif scenario == "midterms":
        return {
            "sleep_hours": 5,
            "deadlines_next_7_days": 4,
            "work_hours": 30,
            "stress_self_report": 7,
            "sentiment_score": -0.4
        }
    elif scenario == "burnout":
        return {
            "sleep_hours": 4,
            "deadlines_next_7_days": 6,
            "work_hours": 40,
            "stress_self_report": 9,
            "sentiment_score": -0.8
        }