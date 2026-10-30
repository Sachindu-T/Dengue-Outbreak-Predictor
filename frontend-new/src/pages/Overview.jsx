import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Activity, MapPin, Users, ArrowRight, Calendar, Loader2 } from "lucide-react";
import { PageLayout } from "../components/layout/PageLayout";
import { MetricCard } from "../components/cards/MetricCard";
import { AnnualCasesChart } from "../components/charts/AnnualCasesChart";
import { TopDistrictsChart } from "../components/charts/TopDistrictsChart";
import { fetchOverview } from "../api/client";
import { YEARS } from "../utils/districts";

export const OverviewPage = () => {
  const [selectedYear, setSelectedYear] = useState(2024);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    fetchOverview(selectedYear)
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
  }, [selectedYear]);

  return (
    <PageLayout
      eyebrow={`National Surveillance · ${selectedYear}`}
      title="Dengue Situation Overview"
      description="Consolidated national surveillance indicators, annual caseload dynamics, and leading district burden across Sri Lanka directly from backend records."
      actions={
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Year Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 shadow-sm transition-colors">
            <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
            >
              {(data?.availableYears || YEARS).map((y) => (
                <option key={y} value={y} className="dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  {y}
                </option>
              ))}
            </select>
          </div>

          <Link
            to="/prediction"
            className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-sm transition-all"
          >
            <span>Run Prediction Model</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      }
    >
      {loading && !data && (
        <div className="flex items-center justify-center p-12 text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
          <span className="text-sm">Fetching national surveillance metrics from backend...</span>
        </div>
      )}

      {error && !data && (
        <div className="p-4 mb-6 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
          Notice: {error}. Please ensure Django backend is running.
        </div>
      )}

      {/* 3 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <MetricCard
          label="Reported Cases"
          value={data ? data.totalCases.toLocaleString() : "..."}
          context={`${selectedYear} national annual total cases`}
          icon={Activity}
          trend={data && data.yoyChange !== 0 ? { value: data.yoyChange, label: "vs prior year" } : undefined}
          color="emerald"
        />

        <MetricCard
          label="Highest Burden District"
          value={data ? data.topDistrictName : "..."}
          context={data ? `${data.topDistrictCases.toLocaleString()} reported cases in ${selectedYear}` : "Loading..."}
          icon={MapPin}
          color="rose"
        />

        <MetricCard
          label="National Incidence"
          value={data ? `${data.nationalIncidence}` : "..."}
          context={`Cases per 100,000 residents (${selectedYear})`}
          icon={Users}
          color="teal"
        />
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Annual Cases */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Annual Nationwide Caseload
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ground-truth surveillance totals
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-100 dark:border-emerald-800/60">
              Selected: {selectedYear}
            </span>
          </div>
          <AnnualCasesChart selectedYear={selectedYear} data={data?.annualTrend} />
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Historical Ground Truth</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              {selectedYear}: {data ? data.totalCases.toLocaleString() : "..."} cases
            </span>
          </div>
        </div>

        {/* Chart 2: Top Districts Longitudinal Trajectory */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Leading District Trajectories
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Top 5 endemic epicenters across surveillance years
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-100 dark:border-emerald-800/60">
              Multi-Year View
            </span>
          </div>
          <TopDistrictsChart trendData={data?.topDistrictsTrend} topDistricts={data?.topDistricts} />
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Western Province Dominance</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              Top: {data ? data.topDistrictName : "Colombo"}
            </span>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};
