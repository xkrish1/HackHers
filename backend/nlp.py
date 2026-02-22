import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def extract_emotions(json_data: dict) -> list[str]:
    journal_text = json_data["journal_text"]

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=f"Extract the emotions from this journal entry and return them as a comma-separated list with no extra text: {journal_text}"
    )

    emotions = [e.strip() for e in response.text.split(",")]
    return emotions
