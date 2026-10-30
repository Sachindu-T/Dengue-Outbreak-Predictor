import os

import pandas as pd
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
STRUCTURED_DATA_DIR = os.path.join(BASE_DIR, 'structured_data')

MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
WEEKS_PER_YEAR = 52

# Hospital bed records carry two non-standard labels; map them onto the
# administrative districts used by the dengue, population and weather datasets.
DISTRICT_ALIASES = {
    'Kalmunai': 'Ampara',
    'Puttlam': 'Puttalam',
}

PROVINCE_BY_DISTRICT = {
    'Colombo': 'Western', 'Gampaha': 'Western', 'Kalutara': 'Western',
    'Kandy': 'Central', 'Matale': 'Central', 'Nuwara Eliya': 'Central',
    'Galle': 'Southern', 'Matara': 'Southern', 'Hambantota': 'Southern',
    'Jaffna': 'Northern', 'Kilinochchi': 'Northern', 'Mannar': 'Northern',
    'Mullaitivu': 'Northern', 'Vavuniya': 'Northern',
    'Batticaloa': 'Eastern', 'Ampara': 'Eastern', 'Trincomalee': 'Eastern',
    'Kurunegala': 'North Western', 'Puttalam': 'North Western',
    'Anuradhapura': 'North Central', 'Polonnaruwa': 'North Central',
    'Badulla': 'Uva', 'Monaragala': 'Uva',
    'Ratnapura': 'Sabaragamuwa', 'Kegalle': 'Sabaragamuwa',
}

RISK_MODERATE = 40
RISK_HIGH = 75
RISK_CRITICAL = 100


def _read_csv(filename):
    """Load a structured CSV and drop the unnamed index column it was saved with."""
    df = pd.read_csv(os.path.join(STRUCTURED_DATA_DIR, filename))
    return df.drop(columns=[c for c in df.columns if str(c).startswith('Unnamed')])


def _load_dengue():
    return _read_csv('Dengue_Data.csv')


def _load_population():
    return _read_csv('Population_Data.csv')


def _load_weather():
    return _read_csv('Weekly_Weather.csv')


def _load_beds():
    """District-level bed counts with aliases folded into the 25 districts."""
    beds = _read_csv('Hospital_Bed_Counts.csv')
    beds['District'] = (
        beds['District'].astype(str).str.strip().replace(DISTRICT_ALIASES)
    )
    return beds.groupby('District', as_index=False).agg({
        'Total Hospital Beds': 'sum',
        'beds for dengue': 'sum',
    })


def _available_years(df):
    return sorted(int(y) for y in df['year'].unique())


def _latest_complete_year(avail_years):
    """The last year is treated as partial, so the previous year is 'complete'."""
    return avail_years[-2] if len(avail_years) > 1 else avail_years[0]


def _to_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _resolve_year(value, avail_years):
    year = _to_int(value)
    if not year:
        return _latest_complete_year(avail_years)
    if year < avail_years[0]:
        return avail_years[0]
    if year > avail_years[-1]:
        return avail_years[-1]
    return year


def _parse_month_index(value):
    """Return a 0-indexed month (0-11) or None when no month filter is supplied."""
    if value is None:
        return None
    text = str(value).strip()
    if text in ('', 'all', 'None', 'null'):
        return None
    month = _to_int(text)
    if month is None or not 0 <= month <= 11:
        return None
    return month


def _month_from_week(week):
    """Approximate the calendar month (1-12) of an epidemiological week."""
    return min(12, ((int(week) - 1) * 12 // WEEKS_PER_YEAR) + 1)


def _population_map(pop_df):
    return dict(zip(pop_df['District'], pop_df['Population Count']))


def _risk_label(utilization):
    if utilization >= RISK_CRITICAL:
        return 'Critical'
    if utilization >= RISK_HIGH:
        return 'High'
    if utilization >= RISK_MODERATE:
        return 'Moderate'
    return 'Normal'


def _get_only(request):
    return None if request.method == 'GET' else JsonResponse(
        {'error': 'GET request required'}, status=405
    )


@csrf_exempt
def api_overview(request):
    method_error = _get_only(request)
    if method_error:
        return method_error

    dengue_df = _load_dengue()
    pop_df = _load_population()

    avail_years = _available_years(dengue_df)
    year = _resolve_year(request.GET.get('year'), avail_years)

    annual_series = dengue_df.groupby('year')['cases'].sum()
    annual_trend = [
        {'year': int(y), 'cases': int(round(c))}
        for y, c in annual_series.items()
    ]

    curr_cases = int(round(annual_series.get(year, 0)))
    prev_cases = int(round(annual_series.get(year - 1, 0)))
    yoy_change = (
        round(((curr_cases - prev_cases) / prev_cases) * 100, 1)
        if prev_cases > 0 else 0.0
    )

    pop_map = _population_map(pop_df)
    df_yr = dengue_df[dengue_df['year'] == year]
    dist_cases = df_yr.groupby('district')['cases'].sum().sort_values(ascending=False)

    top_districts = []
    for name, cases in dist_cases.items():
        population = int(pop_map.get(name, 0))
        case_count = int(round(cases))
        per_100k = int(round((case_count / population) * 100000)) if population else 0
        top_districts.append({
            'id': str(name).lower(),
            'name': str(name),
            'cases': case_count,
            'population': population,
            'per100k': per_100k,
        })

    top_5_names = [d['name'] for d in top_districts[:5]]
    yearly_district = dengue_df.groupby(['year', 'district'])['cases'].sum()
    top_districts_trend = [
        {
            'year': int(y),
            **{name: int(round(yearly_district.get((y, name), 0))) for name in top_5_names},
        }
        for y in avail_years
    ]

    total_pop = int(sum(pop_map.values()))
    national_incidence = int(round((curr_cases / total_pop) * 100000)) if total_pop else 0

    return JsonResponse({
        'selectedYear': int(year),
        'availableYears': avail_years,
        'totalCases': curr_cases,
        'yoyChange': yoy_change,
        'topDistrictName': top_districts[0]['name'] if top_districts else 'N/A',
        'topDistrictCases': top_districts[0]['cases'] if top_districts else 0,
        'nationalIncidence': national_incidence,
        'annualTrend': annual_trend,
        'topDistricts': top_districts[:5],
        'topDistrictsTrend': top_districts_trend,
    })


@csrf_exempt
def api_historical(request):
    method_error = _get_only(request)
    if method_error:
        return method_error

    dengue_df = _load_dengue()
    dengue_df['month'] = dengue_df['week_of_year'].apply(_month_from_week)
    pop_map = _population_map(_load_population())

    avail_years = _available_years(dengue_df)

    base_year = _resolve_year(request.GET.get('year'), avail_years)
    ranking_year = _resolve_year(request.GET.get('rankingYear', base_year), avail_years)
    seasonality_year = _resolve_year(request.GET.get('seasonalityYear', base_year), avail_years)

    ranking_month = _parse_month_index(request.GET.get('rankingMonth'))
    seasonality_month = _parse_month_index(
        request.GET.get('seasonalityMonth', request.GET.get('month'))
    )

    district = request.GET.get('district', 'Colombo')

    # District rankings for the ranking year, optionally narrowed to one month.
    df_rank = dengue_df[dengue_df['year'] == ranking_year]
    if ranking_month is not None:
        df_rank = df_rank[df_rank['month'] == ranking_month + 1]
    rank_series = df_rank.groupby('district')['cases'].sum().sort_values(ascending=False)
    district_rankings = [
        {
            'id': str(name).lower(),
            'name': str(name),
            'cases': int(round(cases)),
            'population': int(pop_map.get(name, 0)),
        }
        for name, cases in rank_series.items()
    ]

    # Monthly seasonality for the seasonality year (only months with data).
    df_season = dengue_df[dengue_df['year'] == seasonality_year]
    month_series = df_season.groupby('month')['cases'].sum().sort_index()
    monthly_trend = [
        {
            'month': MONTH_NAMES[int(m) - 1],
            'monthIndex': int(m) - 1,
            'cases': int(round(cases)),
        }
        for m, cases in month_series.items()
    ]

    # Weekly breakdown inside the chosen month.
    weekly_wave = []
    if seasonality_month is not None:
        df_month = df_season[df_season['month'] == seasonality_month + 1]
        week_series = df_month.groupby('week_of_year')['cases'].sum().sort_index()
        weekly_wave = [
            {'week': f'Wk {int(w)}', 'weekNum': int(w), 'cases': int(round(cases))}
            for w, cases in week_series.items()
        ]

    # Longitudinal history for the selected district across all years.
    df_dist = dengue_df[dengue_df['district'].str.lower() == str(district).lower()]
    district_history = []
    for y in avail_years:
        dy = df_dist[df_dist['year'] == y]
        total = int(round(dy['cases'].sum())) if not dy.empty else 0
        if total > 0:
            peak_row = dy.loc[dy['cases'].idxmax()]
            peak_week = int(peak_row['week_of_year'])
            peak_cases = int(round(peak_row['cases']))
        else:
            peak_week, peak_cases = 1, 0
        district_history.append({
            'year': int(y),
            'total': total,
            'peakWeek': peak_week,
            'peakCases': peak_cases,
        })

    return JsonResponse({
        'selectedYear': int(base_year),
        'rankingYear': int(ranking_year),
        'rankingMonth': ranking_month,
        'seasonalityYear': int(seasonality_year),
        'seasonalityMonth': seasonality_month,
        'selectedDistrict': district,
        'availableYears': avail_years,
        'monthlyTrend': monthly_trend,
        'districtRankings': district_rankings,
        'weeklyWave': weekly_wave,
        'districtHistory': district_history,
    })


@csrf_exempt
def api_capacity(request):
    method_error = _get_only(request)
    if method_error:
        return method_error

    dengue_df = _load_dengue()
    beds_df = _load_beds()

    avail_years = _available_years(dengue_df)
    year = _resolve_year(request.GET.get('year'), avail_years)

    df_yr = dengue_df[dengue_df['year'] == year]
    peak_by_district = df_yr.groupby('district')['cases'].max().to_dict()

    metrics = []
    for _, bed in beds_df.iterrows():
        name = str(bed['District'])
        total_beds = int(bed['Total Hospital Beds'])
        dengue_beds = int(bed['beds for dengue'])
        peak_cases = int(round(peak_by_district.get(name, 0)))

        # One admitted dengue patient occupies one dedicated bed for the week.
        beds_needed = peak_cases
        utilization = int(round((beds_needed / dengue_beds) * 100)) if dengue_beds > 0 else 0

        metrics.append({
            'id': name.lower(),
            'name': name,
            'province': PROVINCE_BY_DISTRICT.get(name, 'Other'),
            'totalBeds': total_beds,
            'dengueBeds': dengue_beds,
            'dengueShare': int(round((dengue_beds / total_beds) * 100)) if total_beds > 0 else 0,
            'peakWeeklyCases': peak_cases,
            'bedsNeeded': beds_needed,
            'peakUtilization': utilization,
            'risk': _risk_label(utilization),
        })

    metrics.sort(key=lambda m: m['peakUtilization'], reverse=True)

    return JsonResponse({
        'selectedYear': int(year),
        'availableYears': avail_years,
        'metrics': metrics,
        'summary': {
            'totalHospitalBeds': sum(m['totalBeds'] for m in metrics),
            'totalDengueBeds': sum(m['dengueBeds'] for m in metrics),
            'strainedDistricts': sum(1 for m in metrics if m['peakUtilization'] >= RISK_HIGH),
            'criticalDistricts': sum(1 for m in metrics if m['peakUtilization'] >= RISK_CRITICAL),
            'avgUtilization': int(
                round(sum(m['peakUtilization'] for m in metrics) / max(len(metrics), 1))
            ),
        },
    })


@csrf_exempt
def api_demographics(request):
    method_error = _get_only(request)
    if method_error:
        return method_error

    dengue_df = _load_dengue()
    pop_df = _load_population()
    weather_df = _load_weather()

    avail_years = _available_years(dengue_df)
    year = _resolve_year(request.GET.get('year'), avail_years)

    df_yr = dengue_df[dengue_df['year'] == year]
    cases_by_district = df_yr.groupby('district')['cases'].sum().to_dict()

    districts = []
    for _, row in pop_df.iterrows():
        name = str(row['District'])
        population = int(row['Population Count'])
        cases = int(round(cases_by_district.get(name, 0)))
        incidence = round((cases / population) * 100000, 1) if population else 0.0
        districts.append({
            'id': name.lower(),
            'name': name,
            'population': population,
            'male': int(row['male']),
            'female': int(row['female']),
            'cases': cases,
            'incidenceRate': incidence,
        })

    # Monthly weather for the selected year (only months that actually have data,
    # so partial years are not padded with invented values).
    weather_year = weather_df[weather_df['year'] == year].copy()
    weather_year['month'] = weather_year['yearly_week_num'].apply(_month_from_week)
    month_weather = weather_year.groupby('month').agg({
        'weekly_rainfall': 'mean',
        'mean_temperature': 'mean',
    }).sort_index()
    weather_monthly = [
        {
            'month': MONTH_NAMES[int(m) - 1],
            'rainfall': round(float(values['weekly_rainfall']), 1),
            'temperature': round(float(values['mean_temperature']), 1),
        }
        for m, values in month_weather.iterrows()
    ]

    # Long-term annual weather across all available years.
    year_weather = weather_df.groupby('year').agg({
        'weekly_rainfall': 'mean',
        'mean_temperature': 'mean',
    }).sort_index()
    weather_yearly = [
        {
            'year': int(y),
            'rainfall': round(float(values['weekly_rainfall']), 1),
            'temperature': round(float(values['mean_temperature']), 1),
        }
        for y, values in year_weather.iterrows()
    ]

    return JsonResponse({
        'selectedYear': int(year),
        'districts': districts,
        'weatherMonthly': weather_monthly,
        'weatherYearly': weather_yearly,
    })
