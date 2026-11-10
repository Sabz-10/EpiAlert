"""
EpiAlert - Historical Weather Data Collection

Fetches hourly temperature, humidity and precipitation
for Tamil Nadu districts using the Open-Meteo Archive API.

This is a supporting utility.
Weather data is NOT used in the currently evaluated ML model.

Current collection period: January 1-7, 2025.
"""
import pandas as pd
import requests
# Read district coordinates
districts = pd.read_csv("geo/districts.csv")
# Open-Meteo API URL
url = "https://archive-api.open-meteo.com/v1/archive"

# Store weather records for all districts
all_weather = []

# Visit each district
for _, district in districts.iterrows():

    print("Fetching weather for:", district["district"])

    params = {
        "latitude": district["lat"],
        "longitude": district["lon"],
        "start_date": "2025-01-01",
        "end_date": "2025-01-07",
        "hourly": "temperature_2m,relative_humidity_2m,precipitation",
        "timezone": "Asia/Kolkata"
    }

    try:
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()

        weather_data = response.json()
        hourly = weather_data["hourly"]

        weather_df = pd.DataFrame({
            "district": district["district"],
            "time": hourly["time"],
            "temperature": hourly["temperature_2m"],
            "humidity": hourly["relative_humidity_2m"],
            "rainfall": hourly["precipitation"]
        })

        all_weather.append(weather_df)

    except requests.RequestException as error:
        print("Could not fetch", district["district"], error)

# Combine all district records
if all_weather:
    final_df = pd.concat(all_weather, ignore_index=True)

    final_df.to_csv("data/weather.csv", index=False)

    print("Weather data saved successfully!")
    print("Total records:", len(final_df))
else:
    print("No weather data was collected.")