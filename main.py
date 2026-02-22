from fastapi import FastAPI
from pydantic import BaseModel
from risk_engine import calculate_risk

app = FastAPI()

class ScoreInput(BaseModel):
    sleep_hours: float
    deadlines_next_7_days: int
    work_hours: float
    stress_self_report: float
    sentiment_score: float

@app.post("/score")
def score(data: ScoreInput):
    return calculate_risk(data.dict())

from forecast import forecast_risk

class ForecastInput(BaseModel):
    past_scores: list[float]

@app.post("/forecast")
def forecast(data: ForecastInput):
    return forecast_risk(data.past_scores)