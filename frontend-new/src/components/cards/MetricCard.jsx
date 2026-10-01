import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export const MetricCard = ({
  label,
  value,
  context,
  icon: Icon,
  trend,
  color = "emerald",
}) => {
  const isPositive = trend && trend.value > 0;
  const isNeutral = trend && trend.value === 0;

  const colorStyles = {
    emerald: {
      iconBg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/60",
      accent: "text-emerald-700 dark:text-emerald-400",
    },
    rose: {
      iconBg: "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-800/60",
      accent: "text-rose-700 dark:text-rose-400",
    },
    teal: {
      iconBg: "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 border-teal-100 dark:border-teal-800/60",
      accent: "text-teal-700 dark:text-teal-400",
    },
  }[color] || {
    iconBg: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    accent: "text-slate-700 dark:text-slate-300",
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-200">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </span>
        {Icon && (
          <div className={`p-2 rounded-xl border ${colorStyles.iconBg}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">
          {value}
        </span>

        {trend && (
          <span
            className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
              isNeutral
                ? "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                : isPositive
                ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400"
                : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400"
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5 inline" />
            ) : isNeutral ? null : (
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5 inline" />
            )}
            {trend.value > 0 ? `+${trend.value}%` : `${trend.value}%`}
          </span>
        )}
      </div>

      {context && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {context}
        </p>
      )}
    </div>
  );
};
