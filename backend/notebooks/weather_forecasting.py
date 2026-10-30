import pandas as pd
import numpy as np
import os
import joblib
import pmdarima as pm
from sklearn.metrics import mean_absolute_error, mean_squared_error
from statsmodels.tsa.holtwinters import ExponentialSmoothing


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

evaluation_results = []

TEST_WEEKS = 52
SEASON = 52

# Candidate models and the metric used to pick the winner ('MAE' or 'RMSE')
MODEL_NAMES = ['SeasonalNaive', 'ARIMA', 'SARIMA']
SELECTION_METRIC = 'RMSE'


# ------------------------------------------------------------
# Model helpers
# ------------------------------------------------------------

def fit_model(name, series):
    """Fit one candidate model on the given series."""

    if name == 'SeasonalNaive':
        # Just remember the last full season; forecast repeats it
        return series.iloc[-SEASON:].values

    if name == 'ARIMA':
        return pm.auto_arima(
            series,
            seasonal=False,
            stepwise=True,
            suppress_warnings=True,
            error_action='ignore'
        )

    if name == 'SARIMA':
        return pm.auto_arima(
            series,
            seasonal=True,
            m=SEASON,
            stepwise=True,
            suppress_warnings=True,
            error_action='ignore'
        )

    raise ValueError(f"Unknown model: {name}")


def predict_model(name, model, n_periods):
    """Forecast n_periods ahead with a fitted candidate model."""

    if name == 'SeasonalNaive':
        # np.resize repeats the stored season cyclically
        return np.resize(model, n_periods)

    return model.predict(n_periods=n_periods)


def forecast_from_saved(saved, n_periods):
    """
    Use this wherever you load a saved .pkl to forecast:
        saved = joblib.load(path)
        preds = forecast_from_saved(saved, 12)
    """
    return predict_model(saved['model_name'], saved['model'], n_periods)


def train_best_model(series, model_file, district, variable):
    """
    1. Fit every candidate on the train split and score it on the last TEST_WEEKS.
    2. Pick the best by SELECTION_METRIC.
    3. Refit the best model on ALL data and save it.
    """

    train = series.iloc[:-TEST_WEEKS]
    test = series.iloc[-TEST_WEEKS:]

    rows = []

    for name in MODEL_NAMES:

        try:
            print(f"  Training {name}...")

            model = fit_model(name, train)

            predictions = predict_model(
                name,
                model,
                len(test)
            )

            mae = mean_absolute_error(test, predictions)
            rmse = np.sqrt(mean_squared_error(test, predictions))

            print(f"  {name:<14} MAE: {mae:.3f}  RMSE: {rmse:.3f}")

            rows.append({
                'district': district,
                'variable': variable,
                'model': name,
                'MAE': mae,
                'RMSE': rmse
            })

        except Exception as e:
            print(f"  {name} failed: {e}")

    if not rows:
        print(f"No model could be trained for {district} ({variable}).")
        return

    best_row = min(rows, key=lambda r: r[SELECTION_METRIC])
    best_name = best_row['model']

    for r in rows:
        r['selected'] = (r['model'] == best_name)

    evaluation_results.extend(rows)

    print(f"Best model: {best_name} ({SELECTION_METRIC}: {best_row[SELECTION_METRIC]:.3f})")

    # Train final model using all data

    final_model = fit_model(best_name, series)

    joblib.dump(
        {'model_name': best_name, 'model': final_model},
        model_file
    )

    print(f"{variable.capitalize()} model saved ({best_name}).")


# ------------------------------------------------------------
# Main loop
# ------------------------------------------------------------

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

        print("Temperature model already exists...")

    else:

        print("Comparing temperature models...")

        train_best_model(
            temperature_series,
            temperature_file,
            district,
            'temperature'
        )


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

    else:

        print("Comparing rainfall models...")

        train_best_model(
            rainfall_series,
            rainfall_file,
            district,
            'rainfall'
        )


results_df = pd.DataFrame(evaluation_results)

print("\n================ MODEL EVALUATION ================\n")
print(results_df)

if not results_df.empty:

    print("\n================ SELECTED MODELS ================\n")
    print(results_df[results_df['selected']].drop(columns='selected'))

    results_df.to_csv(
        os.path.join(BASE_DIR, 'backend', 'model', 'model_comparison.csv'),
        index=False
    )