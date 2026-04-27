<p align="center">
  <img src="https://img.shields.io/badge/Gemini_1.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Cloud_Run-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
</p>

# 🥗 NutriFloat — Contextual Nutrition Agent

> A smart, agentic web application that **pre-emptively suggests healthy meals** based on your schedule, location, and nutritional preferences — powered by Google Gemini.

NutriFloat acts as a proactive nutrition assistant. It analyzes simulated Google Calendar and Maps data to detect "eating windows," then queries Gemini 1.5 Flash to recommend the best menu item at your current location — while remembering your preferences across sessions.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Proactive Nudge Engine** | Detects eating windows from calendar + location context and triggers recommendations automatically |
| **Gemini-Powered Suggestions** | Uses Gemini 1.5 Flash to analyze restaurant menus against your health profile |
| **Nutri-Scan Camera** | Snap a photo of any food — the multimodal API estimates calories, protein, carbs, and fat |
| **Behavioral Feedback Loop** | Thumbs up/down feedback refines future suggestions via persistent Health Artifact |
| **End-of-Day Summary** | Gemini 1.5 Pro generates a comprehensive daily nutrition report |
| **Antigravity UI** | Obsidian-dark, monospace-precise design with Framer Motion micro-animations |

---

## 🏗️ Architecture

```mermaid
sequenceDiagram
    participant Client as React Frontend
    participant API as FastAPI Backend
    participant Artifact as Health Artifact (JSON)
    participant Gemini as Gemini 1.5 Flash

    Client->>API: POST /api/context (Location, Time, Calendar)
    API->>API: Stitch Engine — Evaluate Eating Window
    opt Is Eating Window
        API->>Artifact: Fetch User Preferences
        Artifact-->>API: Likes, Dislikes, Goals
        API->>Gemini: "Given preferences X and menu Y, pick the best meal"
        Gemini-->>API: Recommendation + Rationale
        API-->>Client: Smart Suggestion
    end
    Client->>API: POST /api/feedback (Accept / Reject)
    API->>Artifact: Update Preference Matrix
    Client->>API: POST /api/multimodal (Food Photo)
    API->>Gemini: Vision Analysis
    Gemini-->>API: Macro Estimates
    API-->>Client: Calories, Protein, Carbs, Fat
```

---

## 📁 Project Structure

```text
NutriPath/
├── backend/
│   ├── main.py              # FastAPI server — 4 API endpoints
│   ├── test_main.py          # Pytest test suite (5 tests)
│   ├── requirements.txt      # Python dependencies
│   ├── Dockerfile            # Container definition for Cloud Run
│   ├── .env.example          # Environment variable template
│   └── .env                  # Local secrets (git-ignored)
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Full UI — Dashboard, Nutri-Scan, routing
│   │   ├── HealthContext.jsx  # Global state + API integration layer
│   │   ├── main.jsx          # React entry point
│   │   └── index.css         # Design tokens + utility classes
│   ├── index.html            # HTML shell with Google Fonts
│   ├── tailwind.config.js    # Antigravity design system tokens
│   └── package.json          # Node dependencies
├── docker-compose.yml        # One-command local dev orchestration
├── cloudbuild.yaml           # GCP Cloud Build CI/CD pipeline
├── LICENSE                   # MIT
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and **npm**
- **Python** 3.10+
- (Optional) **Docker** & **Docker Compose**

### 1. Clone

```bash
git clone https://github.com/guruprasadsa/Nutripath.git
cd Nutripath
```

### 2. Backend

```bash
cd backend
cp .env.example .env          # Edit with your Gemini API key (or leave as "mock")
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

### 4. Docker (Alternative)

```bash
docker-compose up
```

Both services start automatically — backend on `:8000`, frontend on `:5173`.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/api/context` | Stitch Engine — analyzes context and returns meal recommendation |
| `POST` | `/api/feedback` | Accepts/rejects a suggestion, updates Health Artifact |
| `POST` | `/api/multimodal` | Uploads a food photo for vision-based macro estimation |
| `GET` | `/api/summary` | End-of-day nutrition summary via Gemini 1.5 Pro |

---

## 🧪 Running Tests

```bash
cd backend
pip install pytest httpx
pytest test_main.py -v
```

---

## ☁️ Deploying to Cloud Run

1. Set your GCP project: `gcloud config set project YOUR_PROJECT_ID`
2. Trigger Cloud Build: `gcloud builds submit --config cloudbuild.yaml`
3. The pipeline builds the Docker image, pushes to GCR, and deploys to Cloud Run.

---

## 🎨 Design System

NutriFloat uses the **Antigravity** design language:

| Token | Value | Usage |
|---|---|---|
| `--bg-base` | `#0A0A0D` | Root background |
| `--accent-jade` | `#2EFF9A` | Primary accent — positive states |
| `--accent-mauve` | `#C4A8FF` | Secondary accent — rejected states |
| Font: Display | `Instrument Serif` | Headlines, large numbers |
| Font: Mono | `DM Mono` | Labels, data, chips |
| Font: Sans | `Figtree` | Body text |

---

## 📄 License

MIT — see [LICENSE](./LICENSE).
