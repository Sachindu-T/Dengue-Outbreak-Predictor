# DenguePredict — Sri Lanka Surveillance Dashboard (React Frontend)

A clean, modern, and easily understandable React frontend for the **Dengue Outbreak Predictor & Hospital Bed Capacity Forecasting System** (Capstone Project DS4105, Sabaragamuwa University of Sri Lanka).

---

## 🚀 Key Features

1. **Overview Dashboard (`/`)**:
   - 4 National KPIs: Reported Cases (with YoY trend), Highest Burden District, National Incidence per 100k, and Hospital Capacity Watch.
   - Interactive Recharts Bar Chart: Nationwide annual cases (2019 – 2024).
   - Recharts Line Chart: Top 5 district trajectories.

2. **Scenario Prediction (`/prediction`)**:
   - Input controls for District, Year, Epidemiological Week (1–52 with monsoon season context slider), Mean Temperature (°C), and Rainfall (mm).
   - **Autofill Weather** feature for Sri Lanka's seasonal baseline.
   - Connected to Django backend `POST /api/predict`.
   - Real-time confidence intervals, 6 key risk indicators, and Hospital Bed Capacity Outlook gauge.

3. **Historical Epidemiological Analysis (`/historical`)**:
   - Year filter (2019 – 2024).
   - Top 12 District Ranking with high-burden coloring.
   - 12-Month National Monthly Seasonality Wave showing bimodal monsoon peaks.
   - Longitudinal profile per district: Total cases vs single peak-week record.

4. **Population & Weather (`/demographics`)**:
   - Census district population ranking.
   - Cases per 100,000 population incidence rates colored by risk scale.
   - Dual-axis multi-year weather trends (Rainfall mm + Temperature °C).
   - Monthly meteorological distribution per season.

5. **Hospital Bed Capacity (`/capacity`)**:
   - Summary statistics on total hospital beds, dedicated dengue beds (30% quota), strained districts (&ge;70%), and critical surge districts (&ge;95%).
   - Comparative bar chart of total licensed beds vs dengue beds across 14 largest districts.
   - Interactive sortable district capacity and risk register.

6. **Dengue AI Assistant (Floating Widget)**:
   - Interactive floating AI chat modal at the bottom right.
   - Connects to Django RAG Chatbot `POST /api/chatbot`.
   - Quick inquiry chips for symptoms, prevention, bed capacity thresholds, and Western province dynamics.

---

## 🛠️ Tech Stack

- **Framework**: [React 18 / 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: TypeScript
- **Routing**: [React Router v6/v7](https://reactrouter.com/)
- **Styling**: [Tailwind CSS v3](https://tailwindcss.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 📂 Project Structure

```text
frontend-new/
├── src/
│   ├── api/
│   │   └── client.ts            # API client connecting to Django backend (:8000)
│   ├── data/
│   │   ├── districts.ts         # 25 Sri Lankan districts metadata & coordinates
│   │   └── mockData.ts          # Deterministic fixtures for surveillance charts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx       # Navigation bar with backend status indicator
│   │   │   └── PageLayout.tsx   # Reusable page container with eyebrow & title
│   │   ├── cards/
│   │   │   └── MetricCard.tsx   # KPI cards with color schemes and trend pills
│   │   ├── charts/
│   │   │   ├── AnnualCasesChart.tsx
│   │   │   ├── TopDistrictsChart.tsx
│   │   │   ├── DistrictRankingChart.tsx
│   │   │   ├── MonthlySeasonalityChart.tsx
│   │   │   ├── DistrictYearlyChart.tsx
│   │   │   ├── WeatherChart.tsx
│   │   │   └── CapacityChart.tsx
│   │   ├── prediction/
│   │   │   ├── PredictionForm.tsx
│   │   │   └── PredictionResults.tsx
│   │   ├── capacity/
│   │   │   └── CapacityTable.tsx
│   │   └── chatbot/
│   │       └── ChatAssistant.tsx
│   ├── pages/
│   │   ├── Overview.tsx         # Route: /
│   │   ├── Prediction.tsx       # Route: /prediction
│   │   ├── Historical.tsx       # Route: /historical
│   │   ├── Demographics.tsx     # Route: /demographics
│   │   └── Capacity.tsx         # Route: /capacity
│   ├── App.tsx                  # App root & route configuration
│   ├── main.tsx                 # Vite DOM entry
│   └── index.css                # Tailwind base & fonts
├── index.html                   # HTML template with Google Fonts
├── vite.config.ts               # Vite configuration with /api proxy
├── tailwind.config.js           # Theme and color definitions
└── package.json                 # Project dependencies
```

---

## 🏃 Running the Application

### 1. Start the React Frontend

```bash
cd "d:\Data science-SUSL\Semester 04\Capstone Preoject ii\DenguePredict\Capstone Project\frontend-new"
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### 2. Start the Django Backend (Optional for live ML/RAG)

```bash
cd "d:\Data science-SUSL\Semester 04\Capstone Preoject ii\DenguePredict\Capstone Project\backend"
python manage.py runserver 8000
```
When running, the frontend automatically detects the server and switches the header pill to **"Backend Connected"**.
