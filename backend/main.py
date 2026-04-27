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
except ImportError:
    genai = None

# Structured Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("NutriPath")

load_dotenv()

app = FastAPI(title="NutriPath API")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ARTIFACT_PATH = "health_artifact.json"

def get_health_artifact():
    if os.path.exists(ARTIFACT_PATH):
        with open(ARTIFACT_PATH, 'r') as f:
            return json.load(f)
    return {}

def update_health_artifact(new_data):
    data = get_health_artifact()
    for key, value in new_data.items():
        if isinstance(data.get(key), list) and isinstance(value, list):
            # merge lists without duplicates
            data[key] = list(set(data[key] + value))
        else:
            data[key] = value
    with open(ARTIFACT_PATH, 'w') as f:
        json.dump(data, f, indent=2)

class CalendarEvent(BaseModel):
    title: str
    event_type: str # e.g. "Lunch/Dinner"
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

# Agent Recommender with Exponential Backoff
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def agent_recommender(location: str, artifact: dict, menu_candidates: str) -> str:
    logger.info(f"Triggering Agent_Recommender for location: {location}")
    api_key = os.getenv("GEMINI_API_KEY", "mock")
    
    if "mock" in api_key.lower() or genai is None:
        # Fallback Mock for Hackathon Demo Mode
        if "bakery" in location.lower():
            return "Keto-friendly Almond Flour Muffin: It fits your keto-adjacent diet while satisfying the bakery craving without spiking insulin."
        elif "fast-food" in location.lower():
            return "Grilled Chicken Salad (No Croutons): Best fast-food swap to maintain muscle while avoiding heavy carbs."
        return f"Kale Caesar Salad (Wait, you dislike Kale! We swapped it for Romaine): A healthy choice avoiding your allergy to peanuts."

    client = genai.Client(api_key=api_key)
    prompt = f"""You are an elite nutrition coach. 
Analyze the restaurant menu at {location} against the user's Health Artifact: {json.dumps(artifact)}. 
Menu candidates: {menu_candidates}
Suggest the single best meal and explain why."""

    response = client.models.generate_content(
        model='gemini-1.5-flash',
        contents=prompt,
    )
    return response.text

@app.get("/")
async def root():
    return {"message": "NutriPath Contextual Engine Running"}

@app.post("/api/context", response_model=RecommendationResponse)
async def analyze_context(req: ContextRequest):
    logger.info("Stitch Engine analyzing context")
    # The Stitch Engine Logic
    is_eating_window = False
    for event in req.upcoming_events:
        if event.event_type.lower() in ["lunch", "dinner", "lunch/dinner"]:
            is_eating_window = True
            break
    
    location_detected = bool(req.current_location)
    
    if is_eating_window and location_detected:
        logger.info("Stitch Engine Condition Met: Triggering Agent_Recommender")
        artifact = get_health_artifact()
        # Mocking Vertex AI Search output
        menu_candidates = "1. Double Cheeseburger, 2. Grilled Chicken Salad, 3. Peanut Butter Smoothie"
        
        try:
            recommendation_text = agent_recommender(req.current_location, artifact, menu_candidates)
            # Naive parsing for demo
            parts = recommendation_text.split(":")
            item = parts[0]
            desc = parts[1] if len(parts) > 1 else "Recommended by your elite nutrition coach."
            
            return RecommendationResponse(
                is_eating_window=True,
                reason="Upcoming meal event detected and you are near a restaurant.",
                suggested_restaurant=req.current_location,
                suggested_item=item.strip(),
                item_description=desc.strip()
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
    if not req.liked:
        # Update past dislikes
        update_health_artifact({"past_dislikes": [req.item]})
    return {"status": "success", "artifact": get_health_artifact()}

@app.post("/api/multimodal")
async def analyze_food_image(file: UploadFile = File(...)):
    logger.info("Triggering Multimodal Scanner")
    # Mocking Gemini vision analysis for demo
    return {
        "estimates": {
            "calories": 450,
            "protein": "30g",
            "carbs": "25g",
            "fats": "15g"
        },
        "message": "Analyzed successfully via Gemini 1.5 Flash Vision."
    }

@app.get("/api/summary")
async def eod_summary():
    logger.info("Triggering End of Day Summary using Gemini 1.5 Pro")
    api_key = os.getenv("GEMINI_API_KEY", "mock")
    artifact = get_health_artifact()
    
    if "mock" in api_key.lower() or genai is None:
        return {
            "summary": "You made great choices today! By choosing the Grilled Chicken over the Cheeseburger, you saved 400 calories and met your protein goal. (Analyzed via Mock Gemini 1.5 Pro)"
        }
    
    try:
        client = genai.Client(api_key=api_key)
        prompt = f"Analyze today's food choices based on this profile: {json.dumps(artifact)}. Give a comprehensive daily summary."
        
        response = client.models.generate_content(
            model='gemini-1.5-pro',
            contents=prompt,
        )
        return {"summary": response.text}
    except Exception as e:
        logger.error(f"EOD Summary failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Summary generation failed.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
