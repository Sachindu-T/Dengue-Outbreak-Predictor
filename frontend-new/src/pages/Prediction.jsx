import React, { useState, useEffect } from "react";
import { PageLayout } from "../components/layout/PageLayout";
import { PredictionForm } from "../components/prediction/PredictionForm";
import { PredictionResults } from "../components/prediction/PredictionResults";
import { predictOutbreak } from "../api/client";

export const PredictionPage = () => {
  const [input, setInput] = useState({
    districtId: "colombo",
    year: 2026,
    week: 35,
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initial load
  useEffect(() => {
    runPrediction(input);
  }, []);

  const runPrediction = async (params) => {
    setLoading(true);
    setError(null);
    setInput(params);
    try {
      const data = await predictOutbreak(params);
      setResult(data);
    } catch (err) {
      console.error("Prediction error:", err);
      setError(err?.message || "Failed to fetch prediction from Django backend.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      eyebrow="Scenario Forecasting"
      title="Outbreak & Hospital Bed Forecasting"
      description="Simulate Sri Lankan dengue caseloads and hospital ward pressure by epidemiological week and district. Mean temperature and rainfall are automatically predicted by backend ARIMA models."
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Form (4 cols on desktop) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm sticky top-20 transition-colors duration-200">
          <div className="border-b border-slate-100 dark:border-slate-700/60 pb-3 mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Scenario Parameters
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure surveillance district and epidemiological week
            </p>
          </div>

          <PredictionForm onPredict={runPrediction} loading={loading} />
        </div>

        {/* Right Results (8 cols on desktop) */}
        <div className="lg:col-span-8">
          {loading && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Running Django ML & Time Series Models...</p>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/40 rounded-2xl p-6 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200">
              <h3 className="font-bold text-base mb-1">Backend Connection Required</h3>
              <p className="text-sm leading-relaxed mb-3">{error}</p>
              <p className="text-xs text-rose-600 dark:text-rose-300">
                Please ensure your Django backend is running in terminal:
                <code className="ml-1.5 px-2 py-0.5 bg-rose-100 dark:bg-rose-900/60 rounded font-mono font-bold">
                  python manage.py runserver 8000
                </code>
              </p>
            </div>
          )}

          {!loading && result && <PredictionResults result={result} input={input} />}
        </div>

      </div>
    </PageLayout>
  );
};
