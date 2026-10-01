import React, { useState, useEffect } from "react";
import { BedDouble, AlertCircle, Building2, TrendingUp, Calendar, Loader2 } from "lucide-react";
import { PageLayout } from "../components/layout/PageLayout";
import { CapacityChart } from "../components/charts/CapacityChart";
import { CapacityTable } from "../components/capacity/CapacityTable";
import { fetchCapacity } from "../api/client";
import { YEARS } from "../utils/districts";

export const CapacityPage = () => {
  const [selectedYear, setSelectedYear] = useState(2024);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    fetchCapacity(selectedYear)
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

  const capacityRows = data?.metrics || [];
  const totalNationalBeds = data?.summary?.totalHospitalBeds || 0;
  const totalDengueBeds = data?.summary?.totalDengueBeds || 0;
  const strainedCount = data?.summary?.strainedDistricts || 0;
  const criticalCount = data?.summary?.criticalDistricts || 0;

  return (
    <PageLayout
      eyebrow="Healthcare Preparedness"
      title="Hospital Bed Capacity & Surge Surveillance"
      description="Monitor district-level inpatient capacities, dedicated dengue beds, and modeled bed pressure during annual outbreak peaks directly from hospital records."
      actions={
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
      }
    >
      {loading && !data && (
        <div className="flex items-center justify-center p-12 text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
          <span className="text-sm">Fetching hospital capacity metrics from backend...</span>
        </div>
      )}

      {error && !data && (
        <div className="p-4 mb-6 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
          Notice: {error}. Please ensure Django backend is running with the capacity endpoint.
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-200">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Beds</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {totalNationalBeds.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 mt-1">Across 25 administrative districts</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-200">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Dengue Ward Beds</span>
            <BedDouble className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
            {totalDengueBeds.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 mt-1">Allocated across health divisions</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-200">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Strained Systems</span>
            <TrendingUp className="w-4 h-4 text-orange-500 dark:text-orange-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-orange-600 dark:text-orange-400">
            {strainedCount} Districts
          </div>
          <p className="text-xs text-slate-400 mt-1">&ge; 70% peak utilisation threshold</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-200">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Critical Overflow</span>
            <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
            {criticalCount} Districts
          </div>
          <p className="text-xs text-slate-400 mt-1">&ge; 95% surge capacity warning</p>
        </div>
      </div>

      {/* Bed Allocation Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm mb-6 transition-colors duration-200">
        <div className="border-b border-slate-100 dark:border-slate-700/60 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              District Bed Quota Allocation
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Comparison of total hospital beds vs dedicated dengue beds from backend Hospital_Bed_Counts.csv
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-100 dark:border-emerald-800/60 self-start sm:self-auto">
            {selectedYear} Capacity Registry
          </span>
        </div>
        <CapacityChart rows={capacityRows} />
      </div>

      {/* District Detail Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-200">
        <div className="border-b border-slate-100 dark:border-slate-700/60 pb-3 mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            District-Level Inpatient Inventory & Utilization Audit
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real data based on recorded hospital beds and peak weekly caseloads
          </p>
        </div>
        <CapacityTable rows={capacityRows} />
      </div>
    </PageLayout>
  );
};
