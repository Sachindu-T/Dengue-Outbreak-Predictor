import os
import pandas as pd
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
STRUCTURED_DATA_DIR = os.path.join(BASE_DIR, 'structured_data')

MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

@csrf_exempt
def api_overview(request):
    try:
        year = int(request.GET.get('year', 2024))
    except (ValueError, TypeError):
        year = 2024

    dengue_path = os.path.join(STRUCTURED_DATA_DIR, 'Dengue_Data.csv')
    pop_path = os.path.join(STRUCTURED_DATA_DIR, 'Population_Data.csv')

    dengue_df = pd.read_csv(dengue_path)
    pop_df = pd.read_csv(pop_path)

    avail_years = sorted([int(y) for y in dengue_df['year'].unique()])
    if year not in avail_years:
        year = avail_years[-2] if len(avail_years) > 1 else avail_years[0]

    annual_series = dengue_df.groupby('year')['cases'].sum()
    annual_trend = [{'year': int(y), 'cases': int(round(c))} for y, c in annual_series.items()]

    curr_cases = int(round(annual_series.get(year, 0)))
    prev_cases = int(round(annual_series.get(year - 1, 0)))
    yoy_change = round(((curr_cases - prev_cases) / max(prev_cases, 1)) * 100, 1) if prev_cases > 0 else 0.0

    df_yr = dengue_df[dengue_df['year'] == year]
    dist_cases = df_yr.groupby('district')['cases'].sum().sort_values(ascending=False)
    pop_map = dict(zip(pop_df['District'], pop_df['Population Count']))

    top_districts = []
    for d_name, cases in dist_cases.items():
        pop = int(pop_map.get(d_name, 500000))
        c_int = int(round(cases))
        top_districts.append({
            'id': str(d_name).lower(),
            'name': str(d_name),
            'cases': c_int,
            'population': pop,
            'per100k': int(round((c_int / pop) * 100000))
        })

    top_5_names = [d['name'] for d in top_districts[:5]]
    top_districts_trend = []
    for y in avail_years:
        row = {'year': y}
        df_y = dengue_df[dengue_df['year'] == y]
        y_cases = df_y.groupby('district')['cases'].sum().to_dict()
        for name in top_5_names:
            row[name] = int(round(y_cases.get(name, 0)))
        top_districts_trend.append(row)

    total_pop = sum(pop_map.values())
    return JsonResponse({
        'selectedYear': int(year),
        'availableYears': avail_years,
        'totalCases': curr_cases,
        'yoyChange': yoy_change,
        'topDistrictName': top_districts[0]['name'] if top_districts else 'N/A',
        'topDistrictCases': top_districts[0]['cases'] if top_districts else 0,
        'nationalIncidence': int(round((curr_cases / max(total_pop, 1)) * 100000)),
        'annualTrend': annual_trend,
        'topDistricts': top_districts[:5],
        'topDistrictsTrend': top_districts_trend
    })

@csrf_exempt
def api_historical(request):
    dengue_path = os.path.join(STRUCTURED_DATA_DIR, 'Dengue_Data.csv')
    pop_path = os.path.join(STRUCTURED_DATA_DIR, 'Population_Data.csv')

    dengue_df = pd.read_csv(dengue_path)
    dengue_df['month'] = ((dengue_df['week_of_year'] - 1) * 12 // 52) + 1
    pop_df = pd.read_csv(pop_path)
    pop_map = dict(zip(pop_df['District'], pop_df['Population Count']))

    avail_years = sorted([int(y) for y in dengue_df['year'].unique()])

    # Base year (default 2024)
    try:
        base_year = int(request.GET.get('year', 2024))
    except (ValueError, TypeError):
        base_year = 2024
    if base_year not in avail_years:
        base_year = avail_years[0] if base_year < avail_years[0] else avail_years[-1]

    # Specific year for District Rankings (allows independent dropdown control)
    try:
        ranking_year = int(request.GET.get('rankingYear', base_year))
    except (ValueError, TypeError):
        ranking_year = base_year
    if ranking_year not in avail_years:
        ranking_year = base_year

    # Specific year for Seasonality Wave
    try:
        seasonality_year = int(request.GET.get('seasonalityYear', base_year))
    except (ValueError, TypeError):
        seasonality_year = base_year
    if seasonality_year not in avail_years:
        seasonality_year = base_year

    # Specific month for District Rankings (0-indexed or 1-indexed, 'all' = full annual)
    r_month_val = request.GET.get('rankingMonth')
    ranking_month = None
    if r_month_val is not None and str(r_month_val) not in ['', 'all', 'None', 'null']:
        try:
            m_num = int(r_month_val)
            ranking_month = m_num + 1 if 0 <= m_num <= 11 else (m_num if 1 <= m_num <= 12 else None)
        except (ValueError, TypeError):
            ranking_month = None

    # Specific month for Seasonality Wave
    s_month_val = request.GET.get('seasonalityMonth') or request.GET.get('month')
    seasonality_month = None
    if s_month_val is not None and str(s_month_val) not in ['', 'all', 'None', 'null']:
        try:
            m_num = int(s_month_val)
            seasonality_month = m_num + 1 if 0 <= m_num <= 11 else (m_num if 1 <= m_num <= 12 else None)
        except (ValueError, TypeError):
            seasonality_month = None

    district = request.GET.get('district', 'Colombo')

    # 1. District Rankings (filtered by ranking_year and ranking_month)
    df_rank_pool = dengue_df[dengue_df['year'] == ranking_year]
    if ranking_month is not None:
        df_rank = df_rank_pool[df_rank_pool['month'] == ranking_month]
    else:
        df_rank = df_rank_pool

    rank_series = df_rank.groupby('district')['cases'].sum().sort_values(ascending=False)
    district_rankings = [
        {'id': str(d).lower(), 'name': str(d), 'cases': int(round(c)), 'population': int(pop_map.get(d, 500000))}
        for d, c in rank_series.items()
    ]

    # 2. Monthly Seasonality (filtered by seasonality_year)
    df_season = dengue_df[dengue_df['year'] == seasonality_year]
    m_grp = df_season.groupby('month')['cases'].sum().to_dict()
    monthly_trend = [
        {'month': MONTH_NAMES[m - 1], 'monthIndex': m - 1, 'cases': int(round(m_grp.get(m, 0)))}
        for m in range(1, 13)
    ]

    # 3. Weekly Wave Breakdown for selected seasonality month
    weekly_wave = []
    if seasonality_month is not None:
        df_m = df_season[df_season['month'] == seasonality_month]
        w_grp = df_m.groupby('week_of_year')['cases'].sum().sort_index()
        weekly_wave = [
            {'week': f'Wk {w}', 'weekNum': int(w), 'cases': int(round(c))}
            for w, c in w_grp.items()
        ]

    # 4. District Longitudinal History across all available years (2020 - 2026)
    df_dist = dengue_df[dengue_df['district'].str.lower() == str(district).lower()]
    district_history = []
    for y in avail_years:
        dy = df_dist[df_dist['year'] == y]
        total = int(round(dy['cases'].sum())) if not dy.empty else 0
        if not dy.empty and total > 0:
            peak_row = dy.loc[dy['cases'].idxmax()]
            peak_week = int(peak_row['week_of_year'])
            peak_cases = int(round(peak_row['cases']))
        else:
            peak_week = 1
            peak_cases = 0
        district_history.append({'year': int(y), 'total': total, 'peakWeek': peak_week, 'peakCases': peak_cases})

    return JsonResponse({
        'selectedYear': int(base_year),
        'rankingYear': int(ranking_year),
        'rankingMonth': (ranking_month - 1) if ranking_month is not None else None,
        'seasonalityYear': int(seasonality_year),
        'seasonalityMonth': (seasonality_month - 1) if seasonality_month is not None else None,
        'selectedDistrict': district,
        'availableYears': avail_years,
        'monthlyTrend': monthly_trend,
        'districtRankings': district_rankings,
        'weeklyWave': weekly_wave,
        'districtHistory': district_history
    })

@csrf_exempt
def api_capacity(request):
    try:
        year = int(request.GET.get('year', 2024))
    except (ValueError, TypeError):
        year = 2024

    dengue_path = os.path.join(STRUCTURED_DATA_DIR, 'Dengue_Data.csv')
    beds_path = os.path.join(STRUCTURED_DATA_DIR, 'Hospital_Bed_Counts.csv')

    dengue_df = pd.read_csv(dengue_path)
    beds_df = pd.read_csv(beds_path).groupby('District', as_index=False).agg({
        'Total Hospital Beds': 'sum',
        'beds for dengue': 'sum'
    })

    avail_years = sorted([int(y) for y in dengue_df['year'].unique()])
    if year not in avail_years:
        year = avail_years[-2]

    df_yr = dengue_df[dengue_df['year'] == year]
    peaks = df_yr.groupby('district')['cases'].max().to_dict()

    metrics = []
    for _, row in beds_df.iterrows():
        d_name = str(row['District'])
        total_beds = int(row['Total Hospital Beds'])
        dengue_beds = int(row['beds for dengue'])
        peak_cases = int(round(peaks.get(d_name, 0)))
        utilization = int(round((beds_needed / max(dengue_beds, 1)) * 100))
        risk = 'Critical' if utilization >= 95 else 'High' if utilization >= 70 else 'Moderate' if utilization >= 40 else 'Normal'
        metrics.append({
            'id': d_name.lower(),
            'name': d_name,
            'province': 'Western' if d_name in ['Colombo', 'Gampaha', 'Kalutara'] else 'Other',
            'totalBeds': total_beds,
            'dengueBeds': dengue_beds,
            'dengueShare': int(round((dengue_beds / max(total_beds, 1)) * 100)),
            'peakWeeklyCases': peak_cases,
            'bedsNeeded': beds_needed,
            'peakUtilization': utilization,
            'risk': risk
        })

    metrics.sort(key=lambda m: m['peakUtilization'], reverse=True)
    strained = sum(1 for m in metrics if m['peakUtilization'] >= 70)
    critical = sum(1 for m in metrics if m['peakUtilization'] >= 95)
    total_beds_sum = sum(m['totalBeds'] for m in metrics)
    total_dengue_sum = sum(m['dengueBeds'] for m in metrics)
    avg_util = int(round(sum(m['peakUtilization'] for m in metrics) / max(len(metrics), 1)))

    return JsonResponse({
        'selectedYear': int(year),
        'availableYears': avail_years,
        'metrics': metrics,
        'summary': {
            'totalHospitalBeds': total_beds_sum,
            'totalDengueBeds': total_dengue_sum,
            'strainedDistricts': strained,
            'criticalDistricts': critical,
            'avgUtilization': avg_util
        }
    })

@csrf_exempt
def api_demographics(request):
    try:
        year = int(request.GET.get('year', 2024))
    except (ValueError, TypeError):
        year = 2024

    dengue_path = os.path.join(STRUCTURED_DATA_DIR, 'Dengue_Data.csv')
    pop_path = os.path.join(STRUCTURED_DATA_DIR, 'Population_Data.csv')
    weather_path = os.path.join(STRUCTURED_DATA_DIR, 'Weekly_Weather.csv')

    dengue_df = pd.read_csv(dengue_path)
    pop_df = pd.read_csv(pop_path)
    weather_df = pd.read_csv(weather_path)

    df_yr = dengue_df[dengue_df['year'] == year]
    cases_map = df_yr.groupby('district')['cases'].sum().to_dict()

    districts = []
    for _, row in pop_df.iterrows():
        d_name = str(row['District'])
        pop = int(row['Population Count'])
        cases = int(round(cases_map.get(d_name, 0)))
        incidence = round((cases / max(pop, 1)) * 100000, 1)
        districts.append({
            'id': d_name.lower(),
            'name': d_name,
            'population': pop,
            'male': int(row['male']),
            'female': int(row['female']),
            'cases': cases,
            'incidenceRate': incidence
        })

    w_yr = weather_df[weather_df['year'] == year].copy()
    if w_yr.empty:
        w_yr = weather_df[weather_df['year'] == 2024].copy()
    w_yr['month'] = ((w_yr['yearly_week_num'] - 1) * 12 // 52) + 1

    m_weather = w_yr.groupby('month').agg({
        'weekly_rainfall': 'mean',
        'mean_temperature': 'mean'
    }).to_dict(orient='index')

    weather_monthly = [
        {
            'month': MONTH_NAMES[m - 1],
            'rainfall': round(float(m_weather.get(m, {}).get('weekly_rainfall', 15.0)), 1),
            'temperature': round(float(m_weather.get(m, {}).get('mean_temperature', 27.5)), 1)
        }
        for m in range(1, 13)
    ]

    y_weather = weather_df.groupby('year').agg({
        'weekly_rainfall': 'mean',
        'mean_temperature': 'mean'
    }).to_dict(orient='index')

    weather_yearly = [
        {
            'year': int(y),
            'rainfall': round(float(vals['weekly_rainfall']), 1),
            'temperature': round(float(vals['mean_temperature']), 1)
        }
        for y, vals in y_weather.items()
    ]

    return JsonResponse({
        'selectedYear': int(year),
        'districts': districts,
        'weatherMonthly': weather_monthly,
        'weatherYearly': weather_yearly
    })
