import pandas as pd
import numpy as np
import os
import joblib
import warnings
import pmdarima as pm
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from sklearn.metrics import mean_absolute_error, mean_squared_error
warnings.filterwarnings("ignore")

BASE_DIR = os.getcwd()
weather_file = os.path.join(BASE_DIR,'backend','structured_data','Weekly_Weather.csv')

temperature_path = os.path.join(BASE_DIR,'backend','model','saved_models_temperature')
rainfall_path = os.path.join(BASE_DIR,'backend','model','saved_models_rainfall')

os.makedirs(temperature_path, exist_ok=True)
os.makedirs(rainfall_path, exist_ok=True)

weather_df = pd.read_csv(weather_file)

weather_df['week_start'] = pd.to_datetime(weather_df['week_start'])

weather_df = weather_df.sort_values(['district', 'week_start'])

districts = weather_df['district'].unique()

print("Number of districts:", len(districts))
print("Districts:", districts)

TEST_WEEKS = 52
SEASONAL_PERIOD = 52

evaluation_results = []
best_models = {}


def calculate_metrics(actual, predicted):
    mae = mean_absolute_error(actual,predicted)
    rmse = np.sqrt(mean_squared_error(actual,predicted))
    return mae, rmse


def seasonal_naive_forecast(train, n_periods, season=52):
    if len(train) < season:
        raise ValueError(
            f"Not enough observations for seasonal naive. "
            f"Need at least {season} observations."
        )
    last_season = train.iloc[-season:].values
    repetitions = int(np.ceil(n_periods / season))
    forecast = np.tile(last_season,repetitions)[:n_periods]
    return forecast

def train_arima(train):
    model = pm.auto_arima(
        train,
        seasonal=False,
        stepwise=True,
        suppress_warnings=True,
        error_action='ignore',
        trace=False,
        max_p=5,
        max_q=5,
        max_d=2
    )

    return model

def train_sarima(train):
    model = pm.auto_arima(
        train,
        seasonal=True,
        m=SEASONAL_PERIOD,
        stepwise=True,
        suppress_warnings=True,
        error_action='ignore',
        trace=False,
        max_p=3,
        max_q=3,
        max_P=2,
        max_Q=2,
        max_d=2,
        max_D=1
    )
    return model

def train_holt_winters(train):
    model = ExponentialSmoothing(
        train,
        trend='add',
        seasonal='add',
        seasonal_periods=SEASONAL_PERIOD,
        initialization_method='estimated'
    ).fit(optimized=True)
    return model


def evaluate_models(train, test):

    model_predictions = {}
    fitted_models = {}

    print("  Training Seasonal Naive...")

    try:

        predictions = seasonal_naive_forecast(
            train,
            len(test),
            SEASONAL_PERIOD
        )

        mae, rmse = calculate_metrics(
            test,
            predictions
        )

        model_predictions['Seasonal Naive'] = predictions

        fitted_models['Seasonal Naive'] = None

        print(
            f"    MAE  : {mae:.4f}"
        )

        print(
            f"    RMSE : {rmse:.4f}"
        )

        yield {
            'model': 'Seasonal Naive',
            'MAE': mae,
            'RMSE': rmse,
            'fitted_model': None
        }

    except Exception as e:

        print(
            f"    Seasonal Naive failed: {e}"
        )


    # --------------------------------------------------------
    # MODEL 2: ARIMA
    # --------------------------------------------------------

    print("  Training ARIMA...")

    try:

        arima_model = train_arima(train)

        predictions = arima_model.predict(
            n_periods=len(test)
        )

        mae, rmse = calculate_metrics(
            test,
            predictions
        )

        model_predictions['ARIMA'] = predictions

        fitted_models['ARIMA'] = arima_model

        print(
            f"    ARIMA order: {arima_model.order}"
        )

        print(
            f"    MAE  : {mae:.4f}"
        )

        print(
            f"    RMSE : {rmse:.4f}"
        )

        yield {
            'model': 'ARIMA',
            'MAE': mae,
            'RMSE': rmse,
            'fitted_model': arima_model
        }

    except Exception as e:

        print(
            f"    ARIMA failed: {e}"
        )


    # --------------------------------------------------------
    # MODEL 3: SARIMA
    # --------------------------------------------------------

    print("  Training SARIMA...")

    try:

        sarima_model = train_sarima(train)

        predictions = sarima_model.predict(
            n_periods=len(test)
        )

        mae, rmse = calculate_metrics(
            test,
            predictions
        )

        model_predictions['SARIMA'] = predictions

        fitted_models['SARIMA'] = sarima_model

        print(
            f"    SARIMA order: "
            f"{sarima_model.order}"
        )

        print(
            f"    Seasonal order: "
            f"{sarima_model.seasonal_order}"
        )

        print(
            f"    MAE  : {mae:.4f}"
        )

        print(
            f"    RMSE : {rmse:.4f}"
        )

        yield {
            'model': 'SARIMA',
            'MAE': mae,
            'RMSE': rmse,
            'fitted_model': sarima_model
        }

    except Exception as e:

        print(
            f"    SARIMA failed: {e}"
        )


    # --------------------------------------------------------
    # MODEL 4: HOLT-WINTERS
    # --------------------------------------------------------

    print("  Training Holt-Winters...")

    try:

        hw_model = train_holt_winters(train)

        predictions = hw_model.forecast(
            len(test)
        )

        mae, rmse = calculate_metrics(
            test,
            predictions
        )

        model_predictions['Holt-Winters'] = predictions

        fitted_models['Holt-Winters'] = hw_model

        print(
            f"    MAE  : {mae:.4f}"
        )

        print(
            f"    RMSE : {rmse:.4f}"
        )

        yield {
            'model': 'Holt-Winters',
            'MAE': mae,
            'RMSE': rmse,
            'fitted_model': hw_model
        }

    except Exception as e:

        print(
            f"    Holt-Winters failed: {e}"
        )


# ============================================================
# 11. MAIN LOOP
# ============================================================

for district in districts:

    print("\n")
    print("=" * 70)
    print(f"PROCESSING DISTRICT: {district}")
    print("=" * 70)


    # --------------------------------------------------------
    # District data
    # --------------------------------------------------------

    district_df = weather_df[
        weather_df['district'] == district
    ].copy()

    district_df = district_df.sort_values(
        'week_start'
    )

    district_df.set_index(
        'week_start',
        inplace=True
    )


    # ========================================================
    # TEMPERATURE
    # ========================================================

    print("\n--- TEMPERATURE ---")

    temperature_series = district_df[
        'mean_temperature'
    ].dropna()

    temperature_series = temperature_series.astype(float)


    if len(temperature_series) <= TEST_WEEKS + SEASONAL_PERIOD:

        print(
            "Not enough temperature data. Skipping."
        )

    else:

        train_temp = temperature_series.iloc[
            :-TEST_WEEKS
        ]

        test_temp = temperature_series.iloc[
            -TEST_WEEKS:
        ]


        print(
            f"Training observations: {len(train_temp)}"
        )

        print(
            f"Testing observations : {len(test_temp)}"
        )


        temperature_results = []


        # ----------------------------------------------------
        # Evaluate all models
        # ----------------------------------------------------

        for result in evaluate_models(
            train_temp,
            test_temp
        ):

            temperature_results.append({
                'district': district,
                'variable': 'temperature',
                'model': result['model'],
                'MAE': result['MAE'],
                'RMSE': result['RMSE']
            })


        # ----------------------------------------------------
        # Create comparison table
        # ----------------------------------------------------

        temp_results_df = pd.DataFrame(
            temperature_results
        )


        if not temp_results_df.empty:

            temp_results_df = temp_results_df.sort_values(
                ['MAE', 'RMSE']
            ).reset_index(drop=True)


            print("\nTemperature model comparison:")

            print(
                temp_results_df[
                    [
                        'model',
                        'MAE',
                        'RMSE'
                    ]
                ].to_string(index=False)
            )


            # ------------------------------------------------
            # Select best model
            # ------------------------------------------------

            best_temp_model_name = (
                temp_results_df.iloc[0]['model']
            )

            best_temp_mae = (
                temp_results_df.iloc[0]['MAE']
            )

            best_temp_rmse = (
                temp_results_df.iloc[0]['RMSE']
            )


            print(
                f"\nBest temperature model: "
                f"{best_temp_model_name}"
            )

            print(
                f"Best MAE  : {best_temp_mae:.4f}"
            )

            print(
                f"Best RMSE : {best_temp_rmse:.4f}"
            )


            # ------------------------------------------------
            # Retrain best model on ALL data
            # ------------------------------------------------

            print(
                "\nRetraining best temperature model "
                "using all available data..."
            )


            if best_temp_model_name == 'Seasonal Naive':

                # Seasonal Naive does not require training
                final_temp_model = {
                    'model_type': 'Seasonal Naive',
                    'seasonal_period': SEASONAL_PERIOD
                }


            elif best_temp_model_name == 'ARIMA':

                final_temp_model = train_arima(
                    temperature_series
                )


            elif best_temp_model_name == 'SARIMA':

                final_temp_model = train_sarima(
                    temperature_series
                )


            elif best_temp_model_name == 'Holt-Winters':

                final_temp_model = train_holt_winters(
                    temperature_series
                )


            # ------------------------------------------------
            # Save final model
            # ------------------------------------------------

            temperature_file = os.path.join(
                temperature_path,
                f"{district}.pkl"
            )

            joblib.dump(
                final_temp_model,
                temperature_file
            )

            print(
                f"Temperature model saved: "
                f"{temperature_file}"
            )


            best_models[
                (district, 'temperature')
            ] = best_temp_model_name


            # Add district results
            evaluation_results.extend(
                temperature_results
            )


    # ========================================================
    # RAINFALL
    # ========================================================

    print("\n--- RAINFALL ---")

    rainfall_series = district_df[
        'weekly_rainfall'
    ].dropna()

    rainfall_series = rainfall_series.astype(float)


    if len(rainfall_series) <= TEST_WEEKS + SEASONAL_PERIOD:

        print(
            "Not enough rainfall data. Skipping."
        )

    else:

        train_rain = rainfall_series.iloc[
            :-TEST_WEEKS
        ]

        test_rain = rainfall_series.iloc[
            -TEST_WEEKS:
        ]


        print(
            f"Training observations: {len(train_rain)}"
        )

        print(
            f"Testing observations : {len(test_rain)}"
        )


        rainfall_results = []


        # ----------------------------------------------------
        # Evaluate all models
        # ----------------------------------------------------

        for result in evaluate_models(
            train_rain,
            test_rain
        ):

            rainfall_results.append({
                'district': district,
                'variable': 'rainfall',
                'model': result['model'],
                'MAE': result['MAE'],
                'RMSE': result['RMSE']
            })


        # ----------------------------------------------------
        # Comparison table
        # ----------------------------------------------------

        rain_results_df = pd.DataFrame(
            rainfall_results
        )


        if not rain_results_df.empty:

            rain_results_df = rain_results_df.sort_values(
                ['MAE', 'RMSE']
            ).reset_index(drop=True)


            print("\nRainfall model comparison:")

            print(
                rain_results_df[
                    [
                        'model',
                        'MAE',
                        'RMSE'
                    ]
                ].to_string(index=False)
            )


            # ------------------------------------------------
            # Select best model
            # ------------------------------------------------

            best_rain_model_name = (
                rain_results_df.iloc[0]['model']
            )

            best_rain_mae = (
                rain_results_df.iloc[0]['MAE']
            )

            best_rain_rmse = (
                rain_results_df.iloc[0]['RMSE']
            )


            print(
                f"\nBest rainfall model: "
                f"{best_rain_model_name}"
            )

            print(
                f"Best MAE  : {best_rain_mae:.4f}"
            )

            print(
                f"Best RMSE : {best_rain_rmse:.4f}"
            )


            # ------------------------------------------------
            # Retrain best model on ALL data
            # ------------------------------------------------

            print(
                "\nRetraining best rainfall model "
                "using all available data..."
            )


            if best_rain_model_name == 'Seasonal Naive':

                final_rain_model = {
                    'model_type': 'Seasonal Naive',
                    'seasonal_period': SEASONAL_PERIOD
                }


            elif best_rain_model_name == 'ARIMA':

                final_rain_model = train_arima(
                    rainfall_series
                )


            elif best_rain_model_name == 'SARIMA':

                final_rain_model = train_sarima(
                    rainfall_series
                )


            elif best_rain_model_name == 'Holt-Winters':

                final_rain_model = train_holt_winters(
                    rainfall_series
                )


            # ------------------------------------------------
            # Save final model
            # ------------------------------------------------

            rainfall_file = os.path.join(
                rainfall_path,
                f"{district}.pkl"
            )

            joblib.dump(
                final_rain_model,
                rainfall_file
            )

            print(
                f"Rainfall model saved: "
                f"{rainfall_file}"
            )


            best_models[
                (district, 'rainfall')
            ] = best_rain_model_name


            # Add district results
            evaluation_results.extend(
                rainfall_results
            )


# ============================================================
# 12. FINAL RESULTS
# ============================================================

results_df = pd.DataFrame(
    evaluation_results
)


print("\n")
print("=" * 80)
print("FINAL MODEL EVALUATION")
print("=" * 80)

print(
    results_df.to_string(index=False)
)


# ============================================================
# 13. SAVE EVALUATION RESULTS
# ============================================================

evaluation_file = os.path.join(
    BASE_DIR,
    'backend',
    'model',
    'weather_model_evaluation.csv'
)

results_df.to_csv(
    evaluation_file,
    index=False
)

print(
    f"\nEvaluation results saved to:"
    f"\n{evaluation_file}"
)


# ============================================================
# 14. BEST MODEL SUMMARY
# ============================================================

best_results = (
    results_df
    .sort_values(['district', 'variable', 'MAE', 'RMSE'])
    .groupby(
        ['district', 'variable'],
        as_index=False
    )
    .first()
)


print("\n")
print("=" * 80)
print("BEST MODEL FOR EACH DISTRICT")
print("=" * 80)

print(
    best_results[
        [
            'district',
            'variable',
            'model',
            'MAE',
            'RMSE'
        ]
    ].to_string(index=False)
)


# ============================================================
# 15. SAVE BEST MODEL SUMMARY
# ============================================================

best_model_file = os.path.join(
    BASE_DIR,
    'backend',
    'model',
    'best_weather_models.csv'
)

best_results.to_csv(
    best_model_file,
    index=False
)

print(
    f"\nBest model summary saved to:"
    f"\n{best_model_file}"
)

print("\nProcessing completed.")