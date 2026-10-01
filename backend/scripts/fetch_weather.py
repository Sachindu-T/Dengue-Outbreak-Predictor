import requests
import pandas as pd
import time
import os

def fetch_sri_lanka_weather(start_date="2019-12-01", end_date="2026-08-01", output_csv="cleaned_weather.csv"):
    districts = {
        'Ampara': (7.29, 81.67), 'Anuradhapura': (8.31, 80.41), 'Badulla': (6.99, 81.05),
        'Batticaloa': (7.71, 81.69), 'Colombo': (6.92, 79.86), 'Galle': (6.05, 80.21),
        'Gampaha': (7.08, 80.00), 'Hambantota': (6.12, 81.11), 'Jaffna': (9.66, 80.02),
        'Kalutara': (6.58, 80.16), 'Kandy': (7.29, 80.63), 'Kegalle': (7.25, 80.34),
        'Kilinochchi': (9.38, 80.39), 'Kurunegala': (7.48, 80.36), 'Mannar': (8.98, 79.90),
        'Matale': (7.46, 80.62), 'Matara': (6.13, 80.34), 'Monaragala': (6.87, 81.34),
        'Mullaitivu': (9.26, 80.81), 'Nuwara Eliya': (6.97, 80.78), 'Polonnaruwa': (7.94, 81.00),
        'Puttalam': (8.03, 79.82), 'Ratnapura': (6.68, 80.39), 'Trincomalee': (8.57, 81.23),
        'Vavuniya': (8.75, 80.49)
    }

    all_data = []

    for district, (lat, lon) in districts.items():
        print(f"Fetching weather for {district}...")
        url = f"https://archive-api.open-meteo.com/v1/archive?latitude={lat}&longitude={lon}&start_date={start_date}&end_date={end_date}&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,rain_sum,wind_speed_10m_max&timezone=Asia%2FColombo"
        
        success = False
        retries = 3
        while not success and retries > 0:
            try:
                response = requests.get(url)
                response.raise_for_status()
                data = response.json()
                
                daily_data = data.get('daily', {})
                if daily_data:
                    df = pd.DataFrame(daily_data)
                    df['district'] = district
                    all_data.append(df)
                    success = True
                    time.sleep(2)  # Pause to avoid rate limits
                else:
                    print(f"No daily data returned for {district}")
                    break
            except Exception as e:
                print(f"Failed for {district}, retries left {retries-1}: {e}")
                retries -= 1
                time.sleep(10)

    if all_data:
        weather_df = pd.concat(all_data, ignore_index=True)
        weather_df.to_csv(output_csv, index=False)
        print(f"Weather data saved to {output_csv}. Total rows: {len(weather_df)}")
    else:
        print("No data was fetched.")

if __name__ == "__main__":
    # Example usage
    fetch_sri_lanka_weather(start_date="2019-12-01", end_date="2026-08-01", output_csv="cleaned_weather.csv")
