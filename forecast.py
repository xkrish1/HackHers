import numpy as np

def forecast_risk(past_scores):
    days = np.arange(len(past_scores))
    slope, intercept = np.polyfit(days, past_scores, 1)

    forecast_days = 14
    future = []
    
    for d in range(1, forecast_days + 1):
        val = slope * (len(past_scores) + d) + intercept
        future.append(max(0, min(1, val)))

    sigma = np.std(past_scores)

    lower = [max(0, f - sigma) for f in future]
    upper = [min(1, f + sigma) for f in future]

    return {
        "forecast": future,
        "lower_bound": lower,
        "upper_bound": upper
    }