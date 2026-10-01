# Project Cleanup & File Architecture Audit

> **Project**: Dengue Outbreak & Healthcare Capacity Predictor  
> **Date**: October 2026  
> **Status**: Production Audit & Architecture Rationalization  

---

## 1. Executive Architecture Overview

The system architecture is structured as follows:

```
Capstone Project/
├── backend/                       <-- ACTIVE DJANGO BACKEND (Port 8000)
│   ├── config/                    <-- Project settings & root routing
│   ├── myApp/                     <-- Active ML views, RAG chatbot, surveillance endpoints
│   ├── model/                     <-- Trained ML & ARIMA .pkl model files
│   └── structured_data/           <-- Official CSV ground-truth datasets
│
├── frontend-new/                  <-- ACTIVE REACT 19 FRONTEND (Port 5173)
│   ├── src/                       <-- Clean UI components, API client, live pages
│   ├── dist/                      <-- Production build
│   └── package.json
│
├── Dengue_Predictor_Final_Presentation.pptx    <-- Final presentation slides
├── Dengue_Predictor_Capstone_Final_Report.docx <-- Final project report
└── requirements.txt
```

All other files outside this core structure represent **legacy prototypes**, **one-off generator scripts**, **duplicate assets**, or **temporary caches**.

---

## 2. Inventory of Unnecessary, Obsolete & Duplicate Files

### Category A: Deprecated Codebases & Unused Frameworks
These were previous iterations of the system that are no longer part of the active web application:

| Path | Description | Recommended Action |
| :--- | :--- | :--- |
| `frontend/` | Legacy TanStack Start / Vite SSR frontend. Superseded by `frontend-new/`. Contains its own redundant `node_modules` (>500MB). | **Delete or Archive** |
| `backend/old_flask/` | Early Flask server prototype (`app.py`, `data_processing.py`, `ChatBot/`). Superseded by Django. | **Delete or Archive** |
| `.streamlit/` | Configuration directory from an early Streamlit prototype. | **Delete** |
| `data/` | Empty directory at the project root. | **Delete** |
| `model/` (at root) | Outdated duplicate of model folders (`saved_models_temprature`, `saved_models_weather`). The active models reside in `backend/model/`. | **Delete** |

---

### Category B: One-Off Report & Presentation Generator Scripts
These scripts were used to build the presentation deck (`.pptx`) and final report document (`.docx`). Because the final documents are already generated, these utility scripts and intermediate image folders can be moved to an archive folder or removed to declutter the root workspace:

| Path | Purpose / Nature | Recommended Action |
| :--- | :--- | :--- |
| `build_final_presentation.py` | Python-pptx deck generator script. | Archive in `scripts/archive/` or delete |
| `build_unique_presentation.py` | Alternate deck builder iteration. | Archive or delete |
| `build_capstone_report.py` | Word document report generator. | Archive or delete |
| `generate_report.py` | Early report draft script. | Archive or delete |
| `generate_chapter3_doc.py` | Standalone chapter 3 generator. | Archive or delete |
| `generate_premium_icons.py` | Generated PNG icons for slides. | Archive or delete |
| `generate_presentation_figures.py` | Matplotlib figure generation script. | Archive or delete |
| `generate_presentation_figures_part2.py` | Additional figure generator script. | Archive or delete |
| `report_sections/` | Modular chapter scripts (`chapter1.py` to `chapter6_7.py`). | Archive in `scripts/report_builders/` |
| `presentation_assets/` | Generated PNG figures used in slides. | Archive or keep if re-running pptx builder |
| `presentation_icons/` | Generated icon graphics for slides. | Archive or keep if re-running pptx builder |
| `extracted_template_assets/` | Temporary XML/image extracts from PowerPoint templates. | **Delete** |
| `test_footer.docx` | Scratch test document. | **Delete** |
| `test_t.docx` | Scratch test document. | **Delete** |
| `Chapter_3_Specification_and_Design.docx` | Intermediate chapter output (merged into main report). | Archive or delete |
| `Dengue_Predictor_Final_Report.docx` | Older report draft (superseded by `Dengue_Predictor_Capstone_Final_Report.docx`). | Archive or delete |

---

### Category C: Duplicate CSV Data Files in Root Directory
The following CSV files exist directly in the root directory. Clean, authoritative copies are already maintained in `backend/structured_data/`:

| Root File | Active Canonical Location | Recommendation |
| :--- | :--- | :--- |
| `cleaned_weather.csv` | `backend/structured_data/Weekly_Weather.csv` | **Delete** root copy |
| `forecast_weekly.csv` | Not referenced by any active service | **Delete** root copy |
| `Hospital_Bed_Counts.csv` | `backend/structured_data/Hospital_Bed_Counts.csv` | **Delete** root copy |
| `Hospital_ICU_Bed_Counts.csv` | Historical lookup, not referenced by active views | **Delete** root copy |
| `population_data.csv` | `backend/structured_data/Population_Data.csv` | **Delete** root copy |

---

### Category D: Temporary Caches & Build Outputs
These are auto-generated build caches and training logs:

| Path | Nature | Recommendation |
| :--- | :--- | :--- |
| `catboost_info/` | Training logs generated during CatBoost model experiments. | **Delete** |
| `__pycache__/` (root) | Python bytecode cache. | **Delete** |
| `backend/__pycache__/` | Python bytecode cache. | Safe to clean |
| `backend/dashboard/__pycache__/` | Python bytecode cache. | Safe to clean |
| `backend/myApp/__pycache__/` | Python bytecode cache. | Safe to clean |
| `backend/model/__pycache__/` | Python bytecode cache. | Safe to clean |

---

### Category E: Unused / Secondary Backend Files
Within the `backend/` folder:

| Path | Reason Unused | Recommendation |
| :--- | :--- | :--- |
| `backend/dashboard/` | Experimental secondary Django app. The active production app is `backend/myApp/` which handles prediction, chatbot, and all surveillance views. | Review for archive |
| `backend/myApp/check.py` | One-off CLI script for testing imports. | **Delete** |
| `backend/myApp/build_rag.py` | Standalone script for testing vector index creation. | Archive in `backend/scripts/` |
| `backend/notebooks/WeatherModelTraining.py` | Notebook export script from offline training. | Archive in `backend/scripts/` |

---

## 3. Recommended Clean Project Layout (Target State)

After cleaning, your workspace will be streamlined:

```
Capstone Project/
│
├── backend/
│   ├── config/                      <-- Django project settings, ASGI/WSGI, routing
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── ...
│   ├── myApp/                       <-- Core application
│   │   ├── chatbot.py               <-- RAG engine & vector retriever
│   │   ├── views.py                 <-- ML outbreak predictions & chatbot views
│   │   ├── surveillance_views.py    <-- CSV surveillance APIs (overview, history, capacity, demo)
│   │   └── urls.py                  <-- /api/ endpoints mapping
│   ├── model/                       <-- Active model files
│   │   ├── best_model.pkl           <-- Trained Dengue ML model
│   │   ├── saved_models_temperature/<-- 25 district temperature ARIMA models
│   │   └── saved_models_rainfall/   <-- 25 district rainfall ARIMA models
│   ├── structured_data/             <-- Clean CSV datasets
│   │   ├── Dengue_Data.csv
│   │   ├── Hospital_Bed_Counts.csv
│   │   ├── Population_Data.csv
│   │   └── Weekly_Weather.csv
│   └── manage.py
│
├── frontend-new/                    <-- Production React 19 Frontend (International Standard Structure)
│   ├── src/
│   │   ├── api/client.js            <-- Pure pass-through fetch client (ZERO mock math)
│   │   ├── components/              <-- Charts, backdrop, layout, chatbot, cards (.jsx)
│   │   ├── context/ThemeContext.jsx <-- Dark/light theme provider
│   │   ├── pages/                   <-- Overview, Prediction, Historical, Capacity, Demographics (.jsx)
│   │   ├── utils/districts.js       <-- 25 Sri Lankan district coordinates & metadata
│   │   ├── App.jsx                  <-- Root router & layout wrapper
│   │   ├── main.jsx                 <-- React 19 entry point
│   │   └── index.css                <-- Tailwind directives & animations
│   ├── dist/                        <-- Production build
│   ├── package.json                 <-- Standard Vite build script
│   └── vite.config.js               <-- Standard Vite configuration with API reverse proxy
│
├── docs/                            <-- Deliverables folder
│   ├── Dengue_Predictor_Final_Presentation.pptx
│   └── Dengue_Predictor_Capstone_Final_Report.docx
│
├── requirements.txt                 <-- Python dependencies
└── README.md
```

---

## 4. Safe Cleanup Script (Optional)

If you wish to automatically remove only the **100% safe scratch files** without affecting any models, datasets, or active source code, you can run this PowerShell command:

```powershell
# Remove empty folder
Remove-Item -Path ".\data" -Force -ErrorAction SilentlyContinue

# Remove temporary docx test files
Remove-Item -Path ".\test_footer.docx", ".\test_t.docx" -Force -ErrorAction SilentlyContinue

# Remove CatBoost training logs
Remove-Item -Path ".\catboost_info" -Recurse -Force -ErrorAction SilentlyContinue

# Remove Streamlit leftover
Remove-Item -Path ".\.streamlit" -Recurse -Force -ErrorAction SilentlyContinue

# Remove root duplicate model folder (active models are inside backend\model)
Remove-Item -Path ".\model" -Recurse -Force -ErrorAction SilentlyContinue

# Remove root duplicate CSVs (active ones are in backend\structured_data)
Remove-Item -Path ".\cleaned_weather.csv", ".\forecast_weekly.csv", ".\population_data.csv" -Force -ErrorAction SilentlyContinue
```
