import os
import json
import logging
from typing import List, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_exponential

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None

# Structured Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("NutriPath")

load_dotenv()

app = FastAPI(title="NutriPath API", version="1.0.0")

# CORS — configurable via env var; defaults to permissive for local dev
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    mode = "LIVE" if _get_gemini_client() else "DEMO (mock)"
    logger.info(f"NutriPath starting — mode={mode}, origins={ALLOWED_ORIGINS}")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("NutriPath shutting down")

ARTIFACT_PATH = "health_artifact.json"

# ---------------------------------------------------------------------------
# Gemini Client Singleton
# ---------------------------------------------------------------------------
def _get_gemini_client():
    """Returns a configured genai Client, or None if in mock mode."""
    api_key = os.getenv("GEMINI_API_KEY", "mock")
    if "mock" in api_key.lower() or genai is None:
        return None
    return genai.Client(api_key=api_key)

# ---------------------------------------------------------------------------
# Health Artifact Persistence (file-based; swap for Firestore in prod)
# ---------------------------------------------------------------------------
def get_health_artifact():
    if os.path.exists(ARTIFACT_PATH):
        with open(ARTIFACT_PATH, 'r') as f:
            return json.load(f)
    return {}

def update_health_artifact(new_data):
    data = get_health_artifact()
    for key, value in new_data.items():
        if isinstance(data.get(key), list) and isinstance(value, list):
            data[key] = list(set(data[key] + value))
        else:
            data[key] = value
    with open(ARTIFACT_PATH, 'w') as f:
        json.dump(data, f, indent=2)

# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------
class CalendarEvent(BaseModel):
    title: str
    event_type: str
    start_time: str
    end_time: str

class ContextRequest(BaseModel):
    current_time: str
    current_location: str
    upcoming_events: List[CalendarEvent]

class RecommendationResponse(BaseModel):
    is_eating_window: bool
    reason: str
    suggested_restaurant: Optional[str] = None
    suggested_item: Optional[str] = None
    item_description: Optional[str] = None

class FeedbackRequest(BaseModel):
    item: str
    liked: bool

# ---------------------------------------------------------------------------
# Agent Recommender — Gemini 2.0 Flash with tenacity retry
# ---------------------------------------------------------------------------
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def agent_recommender(location: str, artifact: dict, menu_candidates: str) -> str:
    logger.info(f"Triggering Agent_Recommender for location: {location}")
    client = _get_gemini_client()

    if client is None:
        # ---- Mock fallback for demo / offline mode ----
        if "bakery" in location.lower():
            return "Keto-friendly Almond Flour Muffin: It fits your keto-adjacent diet while satisfying the bakery craving without spiking insulin."
        elif "fast-food" in location.lower():
            return "Grilled Chicken Salad (No Croutons): Best fast-food swap to maintain muscle while avoiding heavy carbs."
        return "Kale Caesar Salad (Wait, you dislike Kale! We swapped it for Romaine): A healthy choice avoiding your allergy to peanuts."

    # ---- Live Gemini call ----
    prompt = f"""You are an elite nutrition coach. 
Analyze the restaurant menu at {location} against the user's Health Artifact: {json.dumps(artifact)}. 
Menu candidates: {menu_candidates}

Respond in EXACTLY this format:
ITEM_NAME: REASON_WHY

Example: Grilled Chicken Wrap: High protein, low carb, aligns with your weight-loss goal."""

    response = client.models.generate_content(
        model='gemini-2.0-flash',
        contents=prompt,
    )
    return response.text

# ---------------------------------------------------------------------------
# Multimodal Food Scanner — Gemini Vision
# ---------------------------------------------------------------------------
async def analyze_food_with_gemini(image_bytes: bytes, mime_type: str) -> dict:
    """Send a food photo to Gemini and get macro estimates back."""
    client = _get_gemini_client()

    if client is None:
        # Mock fallback
        return {
            "estimates": {"calories": 450, "protein": "30g", "carbs": "25g", "fats": "15g"},
            "message": "Analyzed via demo mode (no API key configured)."
        }

    prompt = """You are a professional nutritionist AI. Analyze this food photo and estimate its nutritional content.

Respond ONLY in this exact JSON format, no markdown, no extra text:
{"calories": <number>, "protein": "<number>g", "carbs": "<number>g", "fats": "<number>g", "food_name": "<name>"}"""

    response = client.models.generate_content(
        model='gemini-2.0-flash',
        contents=[
            prompt,
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
        ]
    )

    # Parse the JSON from Gemini's response
    try:
        raw = response.text.strip()
        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        result = json.loads(raw)
        return {
            "estimates": {
                "calories": result.get("calories", 0),
                "protein": result.get("protein", "0g"),
                "carbs": result.get("carbs", "0g"),
                "fats": result.get("fats", "0g")
            },
            "food_name": result.get("food_name", "Unknown"),
            "message": "Analyzed via Gemini 2.0 Flash Vision."
        }
    except (json.JSONDecodeError, KeyError) as e:
        logger.warning(f"Failed to parse Gemini vision response: {e}. Raw: {response.text[:200]}")
        return {
            "estimates": {"calories": 0, "protein": "0g", "carbs": "0g", "fats": "0g"},
            "message": f"Analysis returned but parsing failed. Raw: {response.text[:100]}"
        }

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/")
async def root():
    mode = "LIVE" if _get_gemini_client() else "DEMO (mock)"
    return {"message": "NutriPath Contextual Engine Running", "mode": mode}

@app.post("/api/context", response_model=RecommendationResponse)
async def analyze_context(req: ContextRequest):
    logger.info("Stitch Engine analyzing context")
    is_eating_window = False
    for event in req.upcoming_events:
        if event.event_type.lower() in ["lunch", "dinner", "lunch/dinner", "breakfast"]:
            is_eating_window = True
            break

    location_detected = bool(req.current_location)

    if is_eating_window and location_detected:
        logger.info("Stitch Engine Condition Met: Triggering Agent_Recommender")
        artifact = get_health_artifact()
        menu_candidates = "1. Double Cheeseburger, 2. Grilled Chicken Salad, 3. Peanut Butter Smoothie, 4. Quinoa Bowl, 5. Veggie Wrap"

        try:
            recommendation_text = agent_recommender(req.current_location, artifact, menu_candidates)
            parts = recommendation_text.split(":", 1)
            item = parts[0].strip()
            desc = parts[1].strip() if len(parts) > 1 else "Recommended by your nutrition coach."

            return RecommendationResponse(
                is_eating_window=True,
                reason="Upcoming meal event detected and you are near a restaurant.",
                suggested_restaurant=req.current_location,
                suggested_item=item,
                item_description=desc
            )
        except Exception as e:
            logger.error(f"Agent_Recommender failed: {str(e)}")
            raise HTTPException(status_code=500, detail="Recommendation generation failed.")

    logger.info("Stitch Engine Condition Not Met")
    return RecommendationResponse(
        is_eating_window=False,
        reason="No eating window detected or location missing."
    )

@app.post("/api/feedback")
async def receive_feedback(req: FeedbackRequest):
    logger.info(f"Received feedback: {req.liked} for item {req.item}")
    if req.liked:
        update_health_artifact({"liked_items": [req.item]})
    else:
        update_health_artifact({"past_dislikes": [req.item]})
    return {"status": "success", "artifact": get_health_artifact()}

@app.post("/api/multimodal")
async def analyze_food_image(file: UploadFile = File(...)):
    logger.info(f"Multimodal Scanner — received file: {file.filename}, type: {file.content_type}")
    image_bytes = await file.read()
    mime = file.content_type or "image/jpeg"
    result = await analyze_food_with_gemini(image_bytes, mime)
    return result

@app.get("/api/summary")
async def eod_summary():
    logger.info("Triggering End of Day Summary")
    client = _get_gemini_client()
    artifact = get_health_artifact()

    if client is None:
        return {
            "summary": "Great day! You chose the Grilled Chicken over the Cheeseburger, saving ~400 calories and hitting your protein goal. Your taste profile is trending towards savoury, high-protein meals. Keep it up! (Demo mode)"
        }

    try:
        prompt = f"""You are a friendly nutritionist. Based on this user's daily food log and preferences, write a short encouraging end-of-day summary (3-4 sentences).

User profile: {json.dumps(artifact)}

Be specific about what went well and one thing to improve tomorrow."""

        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
        )
        return {"summary": response.text}
    except Exception as e:
        logger.error(f"EOD Summary failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Summary generation failed.")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
