# 🦟 DenguePredict — District-Level Dengue Forecasting & Decision-Support System for Sri Lanka

> A full-stack web application that forecasts dengue incidence one week ahead for all **25 administrative districts** of Sri Lanka, monitors hospital bed pressure, and provides a guideline-grounded clinical assistant — built as a Capstone Research Project at the **Sabaragamuwa University of Sri Lanka (SUSL)**.

---

## 📌 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [ML Model Performance](#ml-model-performance)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [API Endpoints](#api-endpoints)
- [Data Sources](#data-sources)
- [Screenshots](#screenshots)
- [Research](#research)
- [License](#license)

---

## Overview

DenguePredict is an integrated dengue surveillance and decision-support platform developed for the Sri Lankan public health context. It combines **machine learning forecasting**, **weather-aware predictions**, **hospital resource pressure estimation**, and a **RAG-powered clinical assistant** into a single, lightweight web dashboard accessible to district medical officers and public health planners.

The system forecasts dengue case counts one week into the future for each of Sri Lanka's 25 districts, translates those forecasts into a **Hospital Bed Pressure Index (HBPI)**, and surfaces guideline-grounded clinical information on demand — all without requiring specialised infrastructure.

---

## Key Features

| Feature | Description |
|---|---|
| 📊 **Weekly Forecasting** | One-week-ahead dengue case predictions for all 25 districts using an ensemble of ML models |
| 🌦️ **Weather Integration** | District-level temperature and rainfall forecasts via ARIMA / SARIMA / Seasonal Naive models, fed as covariates |
| 🏥 **Hospital Bed Pressure Index** | Translates predicted cases into a capacity pressure metric (Normal / Warning / Critical) per district |
| 🤖 **RAG Clinical Assistant** | AI chatbot grounded in 8 official Sri Lankan dengue clinical guidelines via FAISS + Qwen 3.8-27B (Groq) |
| 📈 **Historical Analysis** | Interactive district-level exploration of dengue trends from 2020 to 2026 |
| 🗺️ **Sri Lanka Map View** | Choropleth district map showing predicted risk levels |
| 👥 **Demographics Panel** | District population data and density visualisations |
| 🔢 **District Rankings** | Ranked table of districts by predicted case count and HBPI tier |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                 │
│  Overview · Prediction · Historical · Capacity · Demo   │
└────────────────────────┬────────────────────────────────┘
                         │  REST API (HTTP/JSON)
┌────────────────────────▼────────────────────────────────┐
│                 Django + Flask Backend                   │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  ML Models   │  │ Weather      │  │  RAG Chatbot  │  │
│  │  (sklearn /  │  │  Forecasting │  │  FAISS +      │  │
│  │  XGBoost)    │  │  (ARIMA/     │  │  Qwen 3.8-27B │  │
│  │              │  │   SARIMA)    │  │  via Groq API │  │
│  └──────────────┘  └──────────────┘  └───────────────┘  │
│                                                          │
│  Data: Dengue CSV · Weather CSV · Bed counts · Pop data  │
└─────────────────────────────────────────────────────────┘
```

---

## ML Model Performance

All models were evaluated on a held-out chronological test set of **1,620 district-week observations** (final ~20% of data, covering all 25 districts).

### Dengue Forecasting Models

| Model | MAE | RMSE | R² |
|---|---|---|---|
| **MLP Regressor** ⭐ | **11.25** | **21.50** | **0.897** |
| Extra Trees | 10.95 | 22.00 | 0.892 |
| Random Forest | 10.98 | 22.18 | 0.890 |
| XGBoost | 11.73 | 23.42 | 0.877 |
| Gradient Boosting | 11.43 | 23.60 | 0.875 |
| Ridge / Lasso / Linear | ~12.9 | ~23.5 | ~0.876 |

### Baselines

| Baseline | MAE | RMSE |
|---|---|---|
| Persistence (previous week) | 12.89 | 38.17 |
| Seasonal Naive (same week, prior year) | 28.90 | 63.41 |

The MLP achieved a **43.7% RMSE reduction** over persistence and **66.1%** over seasonal naive.

### Weather Forecasting Models (per district, best-of-3 selection)

| Variable | Model Selected | Median MAE | Median RMSE |
|---|---|---|---|
| Temperature | Seasonal Naive (21), ARIMA (2), SARIMA (2) | 0.74 °C | 0.96 °C |
| Rainfall | Seasonal Naive (20), ARIMA (5) | 34.56 mm | 52.20 mm |

### Top Feature Importances (Random Forest)

| Rank | Feature | Importance |
|---|---|---|
| 1 | `cases_lag_1` (1-week lag) | 56.66% |
| 2 | `cases_lag_2` (2-week lag) | 13.71% |
| 3 | `year` | 6.87% |
| 4 | `cases_rolling_4` (4-week rolling mean) | 4.94% |
| 5 | `week_of_year` | 4.89% |
| 6 | `weekly_rainfall` | 3.47% |
| 7 | `mean_temperature` | 2.71% |

---

## Tech Stack

### Backend
| Component | Technology |
|---|---|
| Web framework | Django + Flask |
| ML / Forecasting | scikit-learn, XGBoost, LightGBM, statsmodels, pmdarima |
| Vector store | FAISS |
| Embeddings | `sentence-transformers/all-MiniLM-L6-v2` |
| LLM API | Groq — Qwen 3.8-27B |
| Data processing | pandas, NumPy, joblib |
| Language | Python 3.12 |

### Frontend
| Component | Technology |
|---|---|
| Framework | React 19 (JSX) |
| Build tool | Vite 8 |
| Styling | Tailwind CSS 3 |
| Routing | React Router DOM 7 |
| Charts | Recharts |
| Icons | Lucide React |

---

## Project Structure

```
Capstone Project/
├── backend/
│   ├── myApp/                  # Django application
│   │   ├── views.py            # Core API views (prediction, historical, demographics)
│   │   ├── surveillance_views.py  # Capacity & HBPI endpoints
│   │   ├── chatbot.py          # RAG clinical assistant logic
│   │   ├── build_rag.py        # FAISS index builder
│   │   └── urls.py             # URL routing
│   ├── model/                  # Serialised ML models (.pkl)
│   ├── data/                   # Raw data files & clinical guideline PDFs
│   ├── structured_data/        # Cleaned CSVs (dengue, weather, population)
│   ├── faiss_index/            # Pre-built FAISS vector index
│   ├── notebooks/              # EDA and model training notebooks
│   ├── scripts/                # Data preprocessing scripts
│   ├── config/                 # Django settings
│   ├── manage.py
│   └── requirements.txt
│
└── frontend-new/
    ├── src/
    │   ├── pages/
    │   │   ├── Overview.jsx        # Dashboard home with map
    │   │   ├── Prediction.jsx      # Forecast page
    │   │   ├── Historical.jsx      # Historical trend analysis
    │   │   ├── Capacity.jsx        # Hospital bed pressure index
    │   │   └── Demographics.jsx    # District population charts
    │   ├── components/             # Shared UI components
    │   ├── api/                    # Axios API service layer
    │   ├── context/                # React context (global state)
    │   ├── utils/                  # Helper functions
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    ├── vite.config.js
    └── tailwind.config.js
```

---

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+ and npm / pnpm
- A [Groq API key](https://console.groq.com/) (free tier is sufficient for the RAG assistant)

---

### Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/DenguePredict.git
cd "DenguePredict/Capstone Project"

# 2. Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set environment variables
# Create a .env file in the project root:
#   GROQ_API_KEY=your_groq_api_key_here
#   SECRET_KEY=your_django_secret_key

# 5. Run Django migrations
cd backend
python manage.py migrate

# 6. (Optional) Rebuild the FAISS index from guideline PDFs
python myApp/build_rag.py

# 7. Start the backend server
python manage.py runserver
```

The backend API will be available at `http://localhost:8000`.

---

### Frontend Setup

```bash
# From the project root
cd frontend-new

# Install dependencies
npm install
# or: pnpm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

> **Note:** Ensure the backend is running before starting the frontend — all data is fetched via REST API calls.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/overview/` | Summary stats: total cases, active districts, trend |
| `GET` | `/api/prediction/?district=<name>` | One-week-ahead dengue forecast for a district |
| `GET` | `/api/historical/?district=<name>&year=<year>` | Historical weekly case data |
| `GET` | `/api/demographics/` | District population and density data |
| `GET` | `/api/capacity/` | Hospital bed counts and HBPI per district |
| `GET` | `/api/district-rankings/` | All districts ranked by predicted cases |
| `POST` | `/api/chat/` | RAG clinical assistant query (`{"message": "..."}`) |

---

## Data Sources

| Data | Source |
|---|---|
| Dengue surveillance (2020–2026) | [denguedatahub](https://github.com/thiyangt/denguedatahub) — T. S. Talagala; Epidemiology Unit, Ministry of Health, Sri Lanka |
| Weekly weather (temperature & rainfall) | [Open-Meteo Historical Weather API](https://open-meteo.com/en/docs/historical-weather-api) |
| District population (2025) | [Department of Census and Statistics, Sri Lanka](https://www.statistics.gov.lk/) |
| Hospital bed counts (2025) | [Directorate of Planning, Ministry of Health Sri Lanka](https://www.health.gov.lk/) |
| Clinical guidelines (RAG corpus) | National Dengue Control Unit, Ministry of Health Sri Lanka — 8 official documents including the National Dengue Guidelines 2024, Strategic Plan 2024–2030, Aedes Vector Guidelines 2nd ed. 2025, and more |

---

## Screenshots

![alt text](<Screenshot 2026-10-24 132724.png>)
![alt text](<Screenshot 2026-10-24 132747.png>)
![alt text](<Screenshot 2026-10-24 132900.png>)
![alt text](<Screenshot 2026-10-24 132915.png>)
![alt text](<Screenshot 2026-10-24 132946.png>)
![alt text](<Screenshot 2026-10-24 132959.png>)
![alt text](<Screenshot 2026-10-24 133033.png>)
![alt text](<Screenshot 2026-10-24 133154.png>)

---

## Research

This project was developed as a Capstone Research Project (Semester 4) at the **Department of Data Science, Sabaragamuwa University of Sri Lanka (SUSL)**.

**Key findings from the research paper:**
- The MLP Regressor achieved the best predictive performance: MAE = 11.25, RMSE = 21.50, R² = 0.897
- One- and two-week lagged case counts together account for **~70%** of predictive importance
- All 8 ML models substantially outperformed persistence and seasonal-naive baselines
- The Hospital Bed Pressure Index highlights the asymmetric vulnerability of peripherally resourced districts — Kilinochchi reaches Critical tier at just 140 predicted cases/week vs. 1,843 in Colombo

---

## License

This project is for academic research purposes. Please cite appropriately if you use the code or methodology.

---


