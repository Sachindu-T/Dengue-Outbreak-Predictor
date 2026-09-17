import os
import joblib
import numpy as np
import pandas as pd
from flask import Flask, jsonify, render_template, request
from ChatBot.chatBot import chatbot_bp

from data_processing import (
    load_all,
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model", "best_model.pkl")

app = Flask(__name__)

app.register_blueprint(chatbot_bp)
# ---------------------------------------------------------------- load data
_data = load_all()
dengue_df = _data["dengue_df"]
weekly_weather = _data["weekly_weather"]
population_df = _data["population_df"]
beds_by_district = _data["beds_by_district"]

DISTRICTS = sorted(dengue_df["district"].unique().tolist())
YEARS = sorted(dengue_df["year"].unique().tolist())

# feature order the training notebook used — kept here so a real pipeline
# gets fed the exact same columns it was trained on
NUMERIC_FEATURES = [
    "year", "week_of_year", "Population Count", "mean_temperature",
    "weekly_rainfall", "cases_lag_1", "cases_lag_2", "cases_lag_4",
    "cases_rolling_4", "cases_rolling_8",
]

# ------------------------------------------------------------------- model
_model = None
_model_error = None
if os.path.exists(MODEL_PATH):
    try:
        _model = joblib.load(MODEL_PATH)
    except Exception as exc:  # pragma: no cover
        _model_error = str(exc)


def risk_band(capacity_utilization):
    if capacity_utilization < 70:
        return {"label": "Normal", "level": "normal", "icon": "circle-fill"}
    if capacity_utilization < 85:
        return {"label": "Warning", "level": "warning", "icon": "exclamation-triangle-fill"}
    if capacity_utilization < 100:
        return {"label": "High Risk", "level": "high", "icon": "exclamation-octagon-fill"}
    return {"label": "Critical", "level": "critical", "icon": "x-octagon-fill"}


def build_feature_row(district, year, week, mean_temperature, weekly_rainfall):
    """Recreate the lag / rolling-average features the model was trained on,
    using the most recent known history for the chosen district."""
    hist = dengue_df[dengue_df["district"] == district].sort_values(["year", "week"])
    recent = hist["cases"].tail(8).tolist()
    if not recent:
        recent = [0]

    def lag(n):
        return recent[-n] if len(recent) >= n else float(np.mean(recent))

    pop_row = population_df[population_df["District"] == district]
    population = float(pop_row["Population Count"].values[0]) if len(pop_row) else float(population_df["Population Count"].mean())

    row = {
        "district": district,
        "year": year,
        "week_of_year": week,
        "Population Count": population,
        "mean_temperature": mean_temperature,
        "weekly_rainfall": weekly_rainfall,
        "cases_lag_1": lag(1),
        "cases_lag_2": lag(2),
        "cases_lag_4": lag(4),
        "cases_rolling_4": float(np.mean(recent[-4:])),
        "cases_rolling_8": float(np.mean(recent[-8:])),
    }
    return row, population


def historical_weather_default(district, week):
    wx = weekly_weather[(weekly_weather["district"] == district) & (weekly_weather["yearly_week_num"] == week)]
    if len(wx):
        return round(float(wx["mean_temperature"].mean()), 2), round(float(wx["weekly_rainfall"].mean()), 2)
    return round(float(weekly_weather["mean_temperature"].mean()), 2), round(float(weekly_weather["weekly_rainfall"].mean()), 2)


def heuristic_predict(row, district, week):
    """Transparent fallback used only when no trained model file is present."""
    hist = dengue_df[(dengue_df["district"] == district) & (dengue_df["week"] == week)]
    baseline = hist["cases"].mean() if len(hist) else dengue_df["cases"].mean()
    rain_adj = 1 + (row["weekly_rainfall"] - weekly_weather["weekly_rainfall"].mean()) / 400
    temp_adj = 1 + (row["mean_temperature"] - weekly_weather["mean_temperature"].mean()) / 40
    lag_adj = 1 + 0.15 * (row["cases_rolling_4"] - baseline) / (baseline + 1)
    prediction = max(0, baseline * rain_adj * temp_adj * lag_adj)
    return round(prediction, 1)


# ------------------------------------------------------------------ routes
@app.route("/")
def index():
    return render_template(
        "index.html",
        districts=DISTRICTS,
        years=YEARS,
        model_loaded=_model is not None,
    )


@app.route("/api/meta")
def api_meta():
    return jsonify({
        "districts": DISTRICTS,
        "years": YEARS,
        "model_loaded": _model is not None,
        "model_error": _model_error,
    })


@app.route("/api/predict", methods=["POST"])
def api_predict():
    payload = request.get_json(force=True) or {}
    district = payload.get("district")
    year = int(payload.get("year"))
    week = int(payload.get("week"))

    if district not in DISTRICTS:
        return jsonify({"error": f"Unknown district '{district}'"}), 400
    if not (1 <= week <= 53):
        return jsonify({"error": "Week must be between 1 and 53"}), 400

    default_temp, default_rain = historical_weather_default(district, week)
    mean_temperature = float(payload.get("mean_temperature") or default_temp)
    weekly_rainfall = float(payload.get("weekly_rainfall") or default_rain)

    row, population = build_feature_row(district, year, week, mean_temperature, weekly_rainfall)

    used_model = False
    if _model is not None:
        try:
            X = pd.DataFrame([row])[["district"] + NUMERIC_FEATURES]
            prediction = float(max(0, _model.predict(X)[0]))
            used_model = True
        except Exception:
            prediction = heuristic_predict(row, district, week)
    else:
        prediction = heuristic_predict(row, district, week)

    bed_row = beds_by_district[beds_by_district["District"] == district]
    weekly_beds = int(bed_row["beds for dengue"].values[0]) if len(bed_row) else 1
    capacity_utilization = round((prediction / max(weekly_beds, 1)) * 100, 2)
    band = risk_band(capacity_utilization)
    cases_per_100k = round((prediction / population) * 100000, 2) if population else None

    return jsonify({
        "district": district,
        "year": year,
        "week": week,
        "inputs": {"mean_temperature": mean_temperature, "weekly_rainfall": weekly_rainfall},
        "predicted_cases": round(prediction),
        "cases_per_100k": cases_per_100k,
        "weekly_bed_capacity": weekly_beds,
        "capacity_utilization": capacity_utilization,
        "risk": band,
        "used_trained_model": used_model,
    })


@app.route("/api/historical/summary")
def api_historical_summary():
    annual = dengue_df.groupby("year")["cases"].sum().reset_index().sort_values("year")
    by_district = (
        dengue_df.groupby("district")["cases"].sum().reset_index()
        .sort_values("cases", ascending=False)
    )
    top5 = by_district.head(5)["district"].tolist()
    top5_trend = (
        dengue_df[dengue_df["district"].isin(top5)]
        .groupby(["year", "district"])["cases"].sum().reset_index()
    )
    monthly = dengue_df.groupby(["year", "month"])["cases"].sum().reset_index()

    return jsonify({
        "annual_cases": {"years": annual["year"].tolist(), "cases": annual["cases"].tolist()},
        "district_totals": {
            "districts": by_district["district"].tolist(),
            "cases": by_district["cases"].tolist(),
        },
        "top5_districts": top5,
        "top5_trend": [
            {
                "district": d,
                "years": top5_trend[top5_trend.district == d]["year"].tolist(),
                "cases": top5_trend[top5_trend.district == d]["cases"].tolist(),
            }
            for d in top5
        ],
        "monthly": [
            {
                "year": int(y),
                "months": monthly[monthly.year == y]["month"].tolist(),
                "cases": monthly[monthly.year == y]["cases"].tolist(),
            }
            for y in sorted(monthly["year"].unique())
        ],
    })


@app.route("/api/historical/district/<district>")
def api_historical_district(district):
    sub = dengue_df[dengue_df["district"] == district].sort_values(["year", "week"])
    if not len(sub):
        return jsonify({"error": "Unknown district"}), 404
    yearly = sub.groupby("year")["cases"].sum().reset_index()
    return jsonify({
        "district": district,
        "years": yearly["year"].tolist(),
        "cases": yearly["cases"].tolist(),
        "total_cases": int(sub["cases"].sum()),
        "peak_week": {
            "year": int(sub.loc[sub["cases"].idxmax(), "year"]),
            "week": int(sub.loc[sub["cases"].idxmax(), "week"]),
            "cases": int(sub["cases"].max()),
        },
    })


@app.route("/api/population")
def api_population():
    pop = population_df.merge(dengue_df.groupby("district")["cases"].sum().reset_index(),
                               left_on="District", right_on="district", how="left")
    pop["cases_per_100k"] = (pop["cases"] / pop["Population Count"] * 100000).round(2)
    pop = pop.sort_values("Population Count", ascending=False)
    return jsonify({
        "districts": pop["District"].tolist(),
        "population": pop["Population Count"].tolist(),
        "cases_per_100k": pop["cases_per_100k"].fillna(0).tolist(),
    })


@app.route("/api/weather/trends")
def api_weather_trends():
    yearly = weekly_weather.groupby("year").agg(
        avg_temp=("mean_temperature", "mean"),
        total_rainfall=("weekly_rainfall", "sum"),
    ).reset_index()
    monthly = weekly_weather.groupby("month").agg(
        avg_temp=("mean_temperature", "mean"),
        avg_rainfall=("weekly_rainfall", "mean"),
    ).reset_index().sort_values("month")
    by_district = weekly_weather.groupby("district").agg(
        avg_temp=("mean_temperature", "mean"),
        avg_rainfall=("weekly_rainfall", "mean"),
    ).reset_index().sort_values("avg_rainfall", ascending=False)

    return jsonify({
        "yearly": {
            "years": yearly["year"].tolist(),
            "avg_temp": yearly["avg_temp"].round(2).tolist(),
            "total_rainfall": yearly["total_rainfall"].round(1).tolist(),
        },
        "monthly": {
            "months": monthly["month"].tolist(),
            "avg_temp": monthly["avg_temp"].round(2).tolist(),
            "avg_rainfall": monthly["avg_rainfall"].round(1).tolist(),
        },
        "by_district": {
            "districts": by_district["district"].tolist(),
            "avg_temp": by_district["avg_temp"].round(2).tolist(),
            "avg_rainfall": by_district["avg_rainfall"].round(1).tolist(),
        },
    })


@app.route("/api/hospital")
def api_hospital():
    return jsonify({
        "districts": beds_by_district["District"].tolist(),
        "total_beds": beds_by_district["Total Hospital Beds"].tolist(),
        "dengue_beds": beds_by_district["beds for dengue"].tolist(),
    })


# ----------------------------------------------------------- rule-based bot
CHATBOT_INTENTS = [
    {
        "keys": ["symptom", "fever", "sign", "feel"],
        "reply": (
            "Common dengue symptoms are sudden high fever, severe headache, pain behind "
            "the eyes, joint and muscle pain, nausea, vomiting, and a skin rash that "
            "appears a few days in. Most people notice symptoms 4–10 days after being "
            "bitten by an infected mosquito."
        ),
    },
    {
        "keys": ["warning", "danger", "emergency", "severe", "worse", "bleed"],
        "reply": (
            "⚠️ Seek emergency care immediately if you notice: severe abdominal pain, "
            "persistent vomiting, bleeding gums or nose, blood in vomit or stool, "
            "difficulty breathing, extreme fatigue, or restlessness/confusion. These can "
            "signal severe dengue and need urgent hospital attention."
        ),
    },
    {
        "keys": ["prevent", "mosquito", "bite", "avoid", "protect"],
        "reply": (
            "To reduce your risk: empty or cover containers that collect standing water "
            "weekly, use mosquito repellent and screens, wear long sleeves at dawn/dusk "
            "when Aedes mosquitoes are most active, and support community clean-up drives "
            "in outbreak-prone weeks."
        ),
    },
    {
        "keys": ["treat", "medicine", "cure", "care", "home"],
        "reply": (
            "There's no specific antiviral cure — care is supportive. Rest, drink plenty "
            "of fluids, and use paracetamol for fever/pain. Avoid aspirin and ibuprofen, "
            "as they can increase bleeding risk. Monitor for warning signs and follow up "
            "with a clinician, especially after the fever breaks — that's when severe "
            "dengue can develop."
        ),
    },
    {
        "keys": ["test", "diagnos", "confirm"],
        "reply": (
            "A doctor can confirm dengue with an NS1 antigen test (useful in the first "
            "few days) or an IgM/IgG antibody test (useful after day 5). A complete "
            "blood count also helps track platelet and white cell trends."
        ),
    },
    {
        "keys": ["hospital", "bed", "capacity", "admit"],
        "reply": (
            "If you're tracking bed availability, check the Hospital Capacity tab for "
            "district-level dengue bed allocations. For an individual admission decision, "
            "that's always a clinician's call based on your symptoms and test results."
        ),
    },
    {
        "keys": ["risk", "outbreak", "district", "area", "predict"],
        "reply": (
            "Use the Outbreak Prediction tab to get a district- and week-specific case "
            "forecast and hospital-capacity risk band, based on recent case trends and "
            "weather."
        ),
    },
]

FALLBACK_REPLY = (
    "I can share general information on dengue symptoms, prevention, home care, testing, "
    "and warning signs — try asking about one of those. For anything about your own "
    "health, please consult a doctor or your nearest clinic."
)

DISCLAIMER = "This is general information, not a medical diagnosis. If you're unwell, please consult a healthcare professional."


@app.route("/api/chatbot", methods=["POST"])
def api_chatbot():
    payload = request.get_json(force=True) or {}
    message = (payload.get("message") or "").lower().strip()
    reply = FALLBACK_REPLY
    for intent in CHATBOT_INTENTS:
        if any(k in message for k in intent["keys"]):
            reply = intent["reply"]
            break
    return jsonify({"reply": reply, "disclaimer": DISCLAIMER})


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
