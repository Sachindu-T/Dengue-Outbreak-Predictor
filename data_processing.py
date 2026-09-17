"""
Shared data loading and cleaning functions used by both the Jupyter notebook
and the Flask app (app.py).

All four raw CSVs are loaded and cleaned here exactly once, eliminating
code duplication between the analysis notebook and the web application.
"""
import os
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def load_dengue():
    df = pd.read_csv(os.path.join(BASE_DIR, "All Dengue Data.csv"))
    df.fillna(0, inplace=True)
    df["start.date"] = pd.to_datetime(df["start.date"])
    df["month"] = df["start.date"].dt.month
    return df


def load_weekly_weather():
    """Reproduces the cleaning: drop unused columns, rename,
    bucket into custom 7-day epi-weeks anchored at 2019-12-28, then
    aggregate to one row per district/year/week."""
    df = pd.read_csv(os.path.join(BASE_DIR, "cleaned_weather.csv"))
    drop_cols = [c for c in ["temperature_2m_min", "temperature_2m_max",
                              "precipitation_sum", "wind_speed_10m_max"] if c in df.columns]
    df.drop(columns=drop_cols, inplace=True)
    df.rename(columns={"temperature_2m_mean": "mean temperature",
                        "rain_sum": "rainfall", "time": "date"}, inplace=True)

    df["date"] = pd.to_datetime(df["date"])
    df = df[df["date"] >= "2019-12-28"].copy()

    anchor_date = pd.to_datetime("2019-12-28")
    df["days_diff"] = (df["date"] - anchor_date).dt.days
    df["custom_week_index"] = df["days_diff"] // 7
    df["week_start"] = anchor_date + pd.to_timedelta(df["custom_week_index"] * 7, unit="D")
    df["week_end"] = df["week_start"] + pd.Timedelta(days=6)
    df["year"] = df["week_end"].dt.year

    min_week_per_year = df.groupby("year")["custom_week_index"].transform("min")
    df["yearly_week_num"] = (df["custom_week_index"] - min_week_per_year) + 1

    weekly = df.groupby(["district", "year", "yearly_week_num", "week_start", "week_end"]).agg(
        mean_temperature=("mean temperature", "mean"),
        weekly_rainfall=("rainfall", "sum"),
    ).reset_index()
    weekly["mean_temperature"] = weekly["mean_temperature"].round(2)
    weekly["month"] = pd.to_datetime(weekly["week_start"]).dt.month
    return weekly


def load_population():
    df = pd.read_csv(os.path.join(BASE_DIR, "population_data.csv"))
    df.rename(columns={"district": "District", "total": "Population Count"}, inplace=True)
    df = df.drop(0).reset_index(drop=True)
    return df


def load_hospital_beds():
    df = pd.read_csv(os.path.join(BASE_DIR, "Hospital_Bed_Counts_final.csv"))
    df.fillna(0, inplace=True)
    df["beds for dengue"] = (df["Total Hospital Beds"] * 0.3).astype(int)
    return df


def compute_beds_by_district(hospital_df):
    return (
        hospital_df.groupby("District")
        .agg({"Total Hospital Beds": "sum", "beds for dengue": "sum"})
        .reset_index()
        .sort_values("beds for dengue", ascending=False)
    )


def load_all():
    """Load and clean all four datasets; return as a dict for convenience."""
    dengue_df = load_dengue()
    weekly_weather = load_weekly_weather()
    population_df = load_population()
    hospital_df = load_hospital_beds()
    beds_by_district = compute_beds_by_district(hospital_df)
    return {
        "dengue_df": dengue_df,
        "weekly_weather": weekly_weather,
        "population_df": population_df,
        "hospital_df": hospital_df,
        "beds_by_district": beds_by_district,
    }
