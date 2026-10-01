# import pandas as pd
# import numpy as np
# import os
# import pmdarima as pm
# from sympy import series



# BASE_DIR = os.getcwd()  # Get the current working directory
# weather_df = pd.read_csv(os.path.join(BASE_DIR, 'backend', 'structured_data', 'Weekly_Weather.csv'))

# districts = weather_df['district'].unique()

# district_data = {}

# for district in districts:
#     district_df = weather_df[weather_df['district'] == district]
#     district_data[district] = district_df

# tempo_models = {}
# rainfall_models = {}

# for district, df in district_data.items():
#     df = df.sort_values(['year', 'week_start'])
#     df.set_index('week_start', inplace=True)
#     tempo_series = df['mean_temperature']

#     # Fit the ARIMA model
#     model = pm.auto_arima(tempo_series, seasonal=True, m=52, stepwise=True, suppress_warnings=True)
#     tempo_models[district] = model

#     rainfall_series = df['weekly_rainfall']
#     # Fit the ARIMA model
#     model = pm.auto_arima(rainfall_series, seasonal=True, m=52, stepwise=True, suppress_warnings=True)
#     rainfall_models[district] = model

# import pandas as pd
# import numpy as np
# import os
# import pmdarima as pm

# from sklearn.metrics import mean_absolute_error, mean_squared_error


# # ============================================================
# # 1. LOAD WEATHER DATA
# # ============================================================

# BASE_DIR = os.getcwd()

# weather_df = pd.read_csv(
#     os.path.join(
#         BASE_DIR,
#         'backend',
#         'structured_data',
#         'Weekly_Weather.csv'
#     )
# )


# # ============================================================
# # 2. GET DISTRICTS
# # ============================================================

# districts = weather_df['district'].unique()

# district_data = {}

# for district in districts:
#     district_df = weather_df[
#         weather_df['district'] == district
#     ].copy()

#     district_data[district] = district_df


# # ============================================================
# # 3. MODEL STORAGE
# # ============================================================

# tempo_models = {}
# rainfall_models = {}

# evaluation_results = []


# # Number of weeks used for testing
# TEST_WEEKS = 52


# # ============================================================
# # 4. TRAIN + EVALUATE MODELS
# # ============================================================

# for district, df in district_data.items():

#     print(f"\nProcessing district: {district}")

#     # Sort chronologically
#     df = df.sort_values(
#         ['year', 'week_start']
#     ).copy()

#     # Set date as index
#     df['week_start'] = pd.to_datetime(df['week_start'])
#     df.set_index('week_start', inplace=True)


#     # ========================================================
#     # TEMPERATURE MODEL
#     # ========================================================

#     temperature_series = df['mean_temperature'].dropna()

#     if len(temperature_series) > TEST_WEEKS:

#         # Train / test split
#         train_temp = temperature_series.iloc[:-TEST_WEEKS]
#         test_temp = temperature_series.iloc[-TEST_WEEKS:]

#         print("Training temperature ARIMA...")

#         temp_model = pm.auto_arima(
#             train_temp,
#             seasonal=True,
#             m=52,
#             stepwise=True,
#             suppress_warnings=True,
#             error_action='ignore'
#         )

#         # Forecast test period
#         temp_predictions = temp_model.predict(
#             n_periods=len(test_temp)
#         )

#         # Evaluation
#         temp_mae = mean_absolute_error(
#             test_temp,
#             temp_predictions
#         )

#         temp_rmse = np.sqrt(
#             mean_squared_error(
#                 test_temp,
#                 temp_predictions
#             )
#         )

#         evaluation_results.append({
#             'district': district,
#             'variable': 'temperature',
#             'MAE': temp_mae,
#             'RMSE': temp_rmse
#         })

#         print(f"Temperature MAE  : {temp_mae:.3f}")
#         print(f"Temperature RMSE : {temp_rmse:.3f}")


#         # ----------------------------------------------------
#         # FINAL MODEL
#         # Train again using ALL available data
#         # ----------------------------------------------------

#         final_temp_model = pm.auto_arima(
#             temperature_series,
#             seasonal=True,
#             m=52,
#             stepwise=True,
#             suppress_warnings=True,
#             error_action='ignore'
#         )

#         tempo_models[district] = final_temp_model


#     # ========================================================
#     # RAINFALL MODEL
#     # ========================================================

#     rainfall_series = df['weekly_rainfall'].dropna()

#     if len(rainfall_series) > TEST_WEEKS:

#         # Train / test split
#         train_rain = rainfall_series.iloc[:-TEST_WEEKS]
#         test_rain = rainfall_series.iloc[-TEST_WEEKS:]

#         print("Training rainfall ARIMA...")

#         rain_model = pm.auto_arima(
#             train_rain,
#             seasonal=True,
#             m=52,
#             stepwise=True,
#             suppress_warnings=True,
#             error_action='ignore'
#         )

#         # Forecast test period
#         rain_predictions = rain_model.predict(
#             n_periods=len(test_rain)
#         )

#         # Evaluation
#         rain_mae = mean_absolute_error(
#             test_rain,
#             rain_predictions
#         )

#         rain_rmse = np.sqrt(
#             mean_squared_error(
#                 test_rain,
#                 rain_predictions
#             )
#         )

#         evaluation_results.append({
#             'district': district,
#             'variable': 'rainfall',
#             'MAE': rain_mae,
#             'RMSE': rain_rmse
#         })

#         print(f"Rainfall MAE  : {rain_mae:.3f}")
#         print(f"Rainfall RMSE : {rain_rmse:.3f}")


#         # ----------------------------------------------------
#         # FINAL MODEL
#         # Train again using ALL available data
#         # ----------------------------------------------------

#         final_rain_model = pm.auto_arima(
#             rainfall_series,
#             seasonal=True,
#             m=52,
#             stepwise=True,
#             suppress_warnings=True,
#             error_action='ignore'
#         )

#         rainfall_models[district] = final_rain_model


# # ============================================================
# # 5. CREATE EVALUATION TABLE
# # ============================================================

# results_df = pd.DataFrame(evaluation_results)

# print("\n================ MODEL EVALUATION ================\n")

# print(results_df)



import pandas as pd
import numpy as np
import os
import joblib
import pmdarima as pm

from sklearn.metrics import mean_absolute_error, mean_squared_error


BASE_DIR = os.getcwd()

weather_df = pd.read_csv(
    os.path.join(
        BASE_DIR,
        'backend',
        'structured_data',
        'Weekly_Weather.csv'
    )
)

districts = weather_df['district'].unique()

temperature_path = os.path.join(
    BASE_DIR,
    'backend',
    'model',
    'saved_models_temperature'
)

rainfall_path = os.path.join(
    BASE_DIR,
    'backend',
    'model',
    'saved_models_rainfall'
)

os.makedirs(temperature_path, exist_ok=True)
os.makedirs(rainfall_path, exist_ok=True)

tempo_models = {}
rainfall_models = {}

evaluation_results = []

TEST_WEEKS = 52


for district in districts:

    print(f"\nProcessing district: {district}")

    district_df = weather_df[
        weather_df['district'] == district
    ].copy()

    district_df = district_df.sort_values(
        ['year', 'week_start']
    )

    district_df['week_start'] = pd.to_datetime(
        district_df['week_start']
    )

    district_df.set_index(
        'week_start',
        inplace=True
    )


    # Temperature

    temperature_series = district_df[
        'mean_temperature'
    ].dropna()

    temperature_file = os.path.join(
        temperature_path,
        f"{district}.pkl"
    )

    if os.path.exists(temperature_file):

        print("odel already exists...")

        # temp_model = joblib.load(
        #     temperature_file
        # )

    else:

        print("Training temperature ARIMA...")

        train_temp = temperature_series.iloc[:-TEST_WEEKS]
        test_temp = temperature_series.iloc[-TEST_WEEKS:]

        temp_model = pm.auto_arima(
            train_temp,
            seasonal=True,
            m=52,
            stepwise=True,
            suppress_warnings=True,
            error_action='ignore',
            njobs=-1  
        )

        temp_predictions = temp_model.predict(
            n_periods=len(test_temp)
        )

        temp_mae = mean_absolute_error(
            test_temp,
            temp_predictions
        )

        temp_rmse = np.sqrt(
            mean_squared_error(
                test_temp,
                temp_predictions
            )
        )

        print(f"Temperature MAE  : {temp_mae:.3f}")
        print(f"Temperature RMSE : {temp_rmse:.3f}")

        evaluation_results.append({
            'district': district,
            'variable': 'temperature',
            'MAE': temp_mae,
            'RMSE': temp_rmse
        })

        # Train final model using all data

        temp_model = pm.auto_arima(
            temperature_series,
            seasonal=True,
            m=52,
            stepwise=True,
            suppress_warnings=True,
            error_action='ignore',
            njobs=-1
        )

        joblib.dump(
            temp_model,
            temperature_file
        )

        print("Temperature model saved.")


    # tempo_models[district] = temp_model


    # Rainfall

    rainfall_series = district_df[
        'weekly_rainfall'
    ].dropna()

    rainfall_file = os.path.join(
        rainfall_path,
        f"{district}.pkl"
    )

    if os.path.exists(rainfall_file):

        print("Rainfall model already exists...")

        # rain_model = joblib.load(
        #     rainfall_file
        # )

    else:

        print("Training rainfall ARIMA...")

        train_rain = rainfall_series.iloc[:-TEST_WEEKS]
        test_rain = rainfall_series.iloc[-TEST_WEEKS:]

        rain_model = pm.auto_arima(
            train_rain,
            seasonal=True,
            m=52,
            stepwise=True,
            suppress_warnings=True,
            error_action='ignore'
        )

        rain_predictions = rain_model.predict(
            n_periods=len(test_rain)
        )

        rain_mae = mean_absolute_error(
            test_rain,
            rain_predictions
        )

        rain_rmse = np.sqrt(
            mean_squared_error(
                test_rain,
                rain_predictions
            )
        )

        print(f"Rainfall MAE  : {rain_mae:.3f}")
        print(f"Rainfall RMSE : {rain_rmse:.3f}")

        evaluation_results.append({
            'district': district,
            'variable': 'rainfall',
            'MAE': rain_mae,
            'RMSE': rain_rmse
        })

        # Train final model using all data

        rain_model = pm.auto_arima(
            rainfall_series,
            seasonal=True,
            m=52,
            stepwise=True,
            suppress_warnings=True,
            error_action='ignore'
        )

        joblib.dump(
            rain_model,
            rainfall_file
        )

        print("Rainfall model saved.")


    # rainfall_models[district] = rain_model


results_df = pd.DataFrame(evaluation_results)

print("\n================ MODEL EVALUATION ================\n")
print(results_df)