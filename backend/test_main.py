from fastapi.testclient import TestClient
from main import app, get_health_artifact

client = TestClient(app)

def test_stitch_engine_triggers_on_lunch():
    response = client.post(
        "/api/context",
        json={
            "current_time": "12:00",
            "current_location": "Sweetgreen",
            "upcoming_events": [
                {"title": "Lunch", "event_type": "Lunch", "start_time": "12:30", "end_time": "13:30"}
            ]
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_eating_window"] == True
    assert "Kale" in data["suggested_item"]

def test_stitch_engine_ignores_without_event():
    response = client.post(
        "/api/context",
        json={
            "current_time": "15:00",
            "current_location": "Sweetgreen",
            "upcoming_events": [
                {"title": "Sync", "event_type": "Meeting", "start_time": "15:30", "end_time": "16:30"}
            ]
        }
    )
    assert response.status_code == 200
    assert response.json()["is_eating_window"] == False

def test_scenario_bakery_keto():
    response = client.post(
        "/api/context",
        json={
            "current_time": "10:00",
            "current_location": "Local Bakery",
            "upcoming_events": [
                {"title": "Morning Snack", "event_type": "Lunch", "start_time": "10:30", "end_time": "11:00"}
            ]
        }
    )
    data = response.json()
    assert data["is_eating_window"] == True
    assert "Keto-friendly" in data["suggested_item"]

def test_scenario_fast_food_swap():
    response = client.post(
        "/api/context",
        json={
            "current_time": "19:00",
            "current_location": "Fast-food Drive Thru",
            "upcoming_events": [
                {"title": "Dinner", "event_type": "Dinner", "start_time": "19:30", "end_time": "20:30"}
            ]
        }
    )
    data = response.json()
    assert data["is_eating_window"] == True
    assert "Grilled Chicken" in data["suggested_item"]

def test_integration_feedback_updates_artifact():
    # Provide negative feedback
    item = "Test Bad Food"
    response = client.post("/api/feedback", json={"item": item, "liked": False})
    assert response.status_code == 200
    
    # Check artifact updated
    artifact = get_health_artifact()
    assert item in artifact["past_dislikes"]
