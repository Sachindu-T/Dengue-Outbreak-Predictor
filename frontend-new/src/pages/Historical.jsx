import React, { useState, useEffect } from "react";
import { PageLayout } from "../components/layout/PageLayout";
import { DistrictRankingChart } from "../components/charts/DistrictRankingChart";
import { MonthlySeasonalityChart } from "../components/charts/MonthlySeasonalityChart";
import { DistrictYearlyChart } from "../components/charts/DistrictYearlyChart";
import { DISTRICTS, YEARS, MONTHS } from "../utils/districts";
import { fetchHistorical } from "../api/client";
import { Calendar, Loader2, RefreshCw } from "lucide-react";

export const HistoricalPage = () => {
  const [rankingYear, setRankingYear] = useState(2024);
  const [rankingMonth, setRankingMonth] = useState("all");
  const [seasonalityYear, setSeasonalityYear] = useState(2024);
  const [seasonalityMonth, setSeasonalityMonth] = useState("all");
  const [selectedDistrict, setSelectedDistrict] = useState("colombo");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentDistObj = DISTRICTS.find((d) => d.id === selectedDistrict);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchHistorical({
      year: rankingYear,
      rankingYear,
      rankingMonth: rankingMonth === "all" ? null : Number(rankingMonth),
      seasonalityYear,
      seasonalityMonth: seasonalityMonth === "all" ? null : Number(seasonalityMonth),
      district: currentDistObj?.name || "Colombo",
    })
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [rankingYear, rankingMonth, seasonalityYear, seasonalityMonth, selectedDistrict]);

  const handleSyncAllYears = (y) => {
    setRankingYear(y);
    setSeasonalityYear(y);
  };

  const availableYears = data?.availableYears || YEARS;

  return (
    <PageLayout
      eyebrow="Retrospective Surveillance"
      title="Historical Epidemiological Analysis"
      description="Compare multi-year district rankings, seasonal monsoon transmission curves, and longitudinal annual trends across Sri Lanka."
      actions={
        <div className="flex items-center gap-2">
          {/* Global Year Fast Sync */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 shadow-sm transition-colors">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Sync Year:</span>
            <select
              value={rankingYear}
              onChange={(e) => handleSyncAllYears(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
            >
              {availableYears.map((y) => (
                <option key={y} value={y} className="dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  {y} {y === 2020 ? "(2020 Baseline)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      }
    >
      {loading && !data && (
        <div className="flex items-center justify-center p-12 text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
          <span className="text-sm">Fetching historical surveillance records from backend...</span>
        </div>
      )}

      {error && !data && (
        <div className="p-4 mb-6 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
          Notice: {error}. Please ensure Django backend is running with the historical endpoint.
        </div>
      )}

      {/* Top 2 charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* District Ranking */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3 mb-4 gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                District Ranking ({rankingYear})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {rankingMonth === "all"
                  ? `Annual ground-truth caseload for ${rankingYear}`
                  : `Caseload ranking for ${MONTHS[Number(rankingMonth)]} ${rankingYear}`}
              </p>
            </div>

            {/* Dual Dropdowns: Year & Month for District Ranking */}
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              {/* Year selector */}
              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1">
                <span className="text-[11px] text-slate-400 font-medium">Year:</span>
                <select
                  value={rankingYear}
                  onChange={(e) => setRankingYear(Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-emerald-600 dark:text-emerald-400 outline-none cursor-pointer"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y} className="dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month selector */}
              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1">
                <span className="text-[11px] text-slate-400 font-medium">Month:</span>
                <select
                  value={rankingMonth}
                  onChange={(e) => setRankingMonth(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                >
                  <option value="all" className="dark:bg-slate-800">All Months (Annual)</option>
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i} className="dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                      {m} (Month {i + 1})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <DistrictRankingChart
            year={rankingYear}
            monthIndex={rankingMonth === "all" ? null : Number(rankingMonth)}
            limit={12}
            rankingsData={data?.districtRankings}
          />
        </div>

        {/* Monthly Seasonality Wave */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3 mb-4 gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Monthly Seasonality Wave ({seasonalityYear})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {seasonalityMonth === "all"
                  ? `Bimodal transmission curve across 12 months (${seasonalityYear})`
                  : `Weekly progression inside ${MONTHS[Number(seasonalityMonth)]} ${seasonalityYear}`}
              </p>
            </div>

            {/* Dual Dropdowns: Year & Month for Seasonality Wave */}
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              {/* Year selector */}
              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1">
                <span className="text-[11px] text-slate-400 font-medium">Year:</span>
                <select
                  value={seasonalityYear}
                  onChange={(e) => setSeasonalityYear(Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-emerald-600 dark:text-emerald-400 outline-none cursor-pointer"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y} className="dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month selector */}
              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1">
                <span className="text-[11px] text-slate-400 font-medium">Period:</span>
                <select
                  value={seasonalityMonth}
                  onChange={(e) => setSeasonalityMonth(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                >
                  <option value="all" className="dark:bg-slate-800">All 12 Months</option>
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i} className="dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                      {m} (Weekly breakdown)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <MonthlySeasonalityChart
            year={seasonalityYear}
            monthIndex={seasonalityMonth === "all" ? null : Number(seasonalityMonth)}
            monthlyData={data?.monthlyTrend}
            weeklyWaveData={data?.weeklyWave}
          />
        </div>
      </div>

      {/* District Yearly Longitudinal Progression */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3 mb-4 gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              District Longitudinal History (2020 – 2026)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Examining epidemic severity for <strong className="text-emerald-700 dark:text-emerald-400">{currentDistObj?.name}</strong> across all recorded surveillance years (Annual Totals & Single-Week Peaks)
            </p>
          </div>

          {/* District selector dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">District:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer focus:ring-2 focus:ring-emerald-600"
            >
              {DISTRICTS.map((d) => (
                <option key={d.id} value={d.id} className="dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  {d.name} ({d.province})
                </option>
              ))}
            </select>
          </div>
        </div>

        <DistrictYearlyChart districtId={selectedDistrict} data={data?.districtHistory} />
      </div>
    </PageLayout>
  );
};
