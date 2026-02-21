import os
from google import genai
from dotenv import load_dotenv  # type: ignore

# Load environment variables
load_dotenv()

# Create client
client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Hello, how are you?"
)

print(response.text)
