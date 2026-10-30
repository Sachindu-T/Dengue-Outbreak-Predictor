from curl_cffi import request
from django.shortcuts import render
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
from .chatbot import ask_chatbot as ask_dengue_chatbot
# Create your views here.
from curl_cffi import request
from django.shortcuts import render
from django.conf import settings
import pandas as pd
from pathlib import Path
import pickle
import os
import joblib
import pathlib
import numpy as np


BASE_DIR = os.path.abspath('.')

def predict_model(name, model, n_periods):
    """Forecast n_periods ahead with a saved candidate model."""
    if name == 'SeasonalNaive':
        # model is the last 52 weekly values; repeat them cyclically
        return np.resize(model, n_periods)
    return model.predict(n_periods=n_periods)  
    
def PredictTemperature(year, week, district):
    model_path = os.path.join(BASE_DIR,f'model\\saved_models_temperature\\{district}.pkl')
    try:
        with open(model_path, 'rb') as f:
            temp_model = joblib.load(f)

    except FileNotFoundError:
        print(model_path)
        return f"Temperature model for {district} not found."
    # Last week used for training
    last_year = 2026
    last_week = 32
    # Calculate how many weeks ahead
    weeks_ahead = ( (year - last_year) * 52 + (week - last_week) )

    if weeks_ahead <= 0:
        return "Predictions can only perform for future data."
    # Forecast
    predictions = predict_model(temp_model['model_name'], temp_model['model'], weeks_ahead)

    return float(round(predictions[-1],2))


print(type(PredictTemperature(2026,52,'Colombo')))

def PredictRainfall(year, week, district):
    model_path = os.path.join(BASE_DIR,f'model\\saved_models_rainfall\\{district}.pkl')
    try:
        with open(model_path, 'rb') as f:
            rainfall_model = joblib.load(f)

    except FileNotFoundError:
        print(model_path)
        return f"Temperature model for {district} not found."
    # Last week used for training
    last_year = 2026
    last_week = 32
    # Calculate how many weeks ahead
    weeks_ahead = ( (year - last_year) * 52 + (week - last_week) )

    if weeks_ahead <= 0:
        return "Predictions can only perform for future data."
    # Forecast
    predictions = predict_model(rainfall_model['model_name'], rainfall_model['model'], weeks_ahead)

    return float(round(predictions[-1],2))
    

def next_week(year, week):

    if week >= 52:
        return year + 1, 1

    return year, week + 1

def predictDengue(year, week, district):
    file_path = os.path.join(BASE_DIR, 'structured_data', 'Population_Data.csv')
    population_df = pd.read_csv(file_path)
    population_series = population_df.loc[population_df['District'] == district, 'Population Count']
    if population_series.empty:
        raise ValueError(f"Population data for {district} not found.")
    population = population_series.iloc[0]

    model_path = os.path.join(BASE_DIR,'model\\best_model.pkl')
    try:
        with open(model_path, 'rb') as f:
                dengue_model = joblib.load(f)
    
    except FileNotFoundError:
        print(model_path)
        return f"Model not found."

    dengue_path = os.path.join(BASE_DIR,'structured_data','Dengue_Data.csv')
    dengue_df = pd.read_csv(dengue_path)
    dengue_df= dengue_df.rename(columns={'week_of_year': 'week'})
    dengue_df = dengue_df[dengue_df['district'] == district].copy()
    dengue_df = dengue_df.sort_values(['year', 'week']).reset_index(drop=True)

    history = dengue_df[['year', 'week', 'cases']].copy()
    current_year = int(history.iloc[-1]['year'])
    current_week = int(history.iloc[-1]['week'])

    predictions = []

    while (current_year < year or (current_year == year and current_week < week)):

        current_year, current_week = next_week(
            current_year,
            current_week
        )

        cases = history['cases'].tolist()

        lag_1 = cases[-1]
        lag_2 = cases[-2]
        lag_4 = cases[-4]

        rolling_4 = sum(cases[-4:]) / 4
        rolling_8 = sum(cases[-8:]) / 8

        input_data = pd.DataFrame([{
            'year': year,
            'week_of_year': week,
            'district': district,
            'Population Count': population,
            'mean_temperature': PredictTemperature(year, week, district),
            'weekly_rainfall': PredictRainfall(year, week, district),
            'cases_lag_1': lag_1,
            'cases_lag_2': lag_2,
            'cases_lag_4': lag_4,
            'cases_rolling_4': rolling_4,
            'cases_rolling_8': rolling_8
        }])

        prediction = dengue_model.predict(input_data)[0]
        prediction = max(0, float(prediction))

        history.loc[len(history)] = [
            current_year,
            current_week,
            prediction
        ]


        predictions.append({
            'year': current_year,
            'week_of_year': current_week,
            'district': district,
            'predicted_cases': round(
                prediction,
                2
            )
        })
    predicted_cases = int(round((predictions[-1])['predicted_cases']))
    return predicted_cases


@csrf_exempt
@csrf_exempt
def chatbot(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body.decode('utf-8') if request.body else "{}")
            message = data.get("message") or data.get("question")
            if not message:
                return JsonResponse({"error": "No question or message provided"}, status=400)
            
            result = ask_dengue_chatbot(message)
            return JsonResponse(result)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "POST request required"}, status=405)

        
def predictOutbreak(district,cases):
    bedsByDistricts = pd.read_csv(os.path.join(BASE_DIR,'structured_data','Hospital_Bed_Counts.csv'))
    weekly_bed_capacity = bedsByDistricts[bedsByDistricts['District'] == district][['beds for dengue']].values[0][0]
    capacity_utilization = round(((cases / weekly_bed_capacity) * 100),2)
    if capacity_utilization < 70:
        return ["🟢 Normal", capacity_utilization]
    elif capacity_utilization < 85:
        return ["🟡 Warning", capacity_utilization]
    elif capacity_utilization < 100:
        return ["🟠 High Risk", capacity_utilization]
    else:
        return ["🔴 Capacity Outbreak", capacity_utilization]


@csrf_exempt
def api_predict(request):
    if request.method == "POST":
        data = json.loads(request.body)
        district = data.get("districtId") or data.get("district")
        year = int(data.get("year"))
        week = int(data.get("week"))
        
        # 1. Calls your own predictDengue function!
        predicted_cases = predictDengue(year, week, district)
        temp = PredictTemperature(year, week, district)
        rainfall = PredictRainfall(year, week, district)

        # 2. Simple hospital capacity math
        bedsByDistricts = pd.read_csv(os.path.join(BASE_DIR,'structured_data','Hospital_Bed_Counts.csv'))
        beds_needed = int(predicted_cases)
        beds = bedsByDistricts.loc[bedsByDistricts['District'] == district,'beds for dengue']
        dengue_beds = int(beds.iloc[0]) if not beds.empty else 0  # or load from your bed dataset
        utilization = int((beds_needed / dengue_beds) * 100) if dengue_beds > 0 else 0

        risk = "Critical" if utilization >= 100 else "High" if utilization >= 75 else "Moderate" if utilization >= 40 else "Normal"

        return JsonResponse({
            "predictedCases": predicted_cases,
            "lowerBound": max(0, int(predicted_cases * 0.8)),
            "upperBound": int(predicted_cases * 1.2),
            "risk": risk,
            "capacityUtilization": utilization,
            "bedsNeeded": beds_needed,
            "dengueBeds": dengue_beds,
            "forecastedTemp": temp,
            "forecastedRain": rainfall,
            "district": {"id": district.lower(), "name": district}
        })
    return JsonResponse({"error": "POST request required"}, status=405)