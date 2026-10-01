import React, { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

const RISK_BADGES = {
  Normal: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
  Low: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
  Moderate: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
  High: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800",
  Critical: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
};

export const CapacityTable = ({ rows = [] }) => {
  const [sortKey, setSortKey] = useState("peakUtilization");
  const [sortDir, setSortDir] = useState("desc");

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortDir === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [rows, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  };

  const getSortIcon = (key) => {
    if (sortKey !== key) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 ml-1 inline" />;
    return sortDir === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-emerald-700 ml-1 inline" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-emerald-700 ml-1 inline" />
    );
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-left text-sm">
        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold">
          <tr>
            <th
              onClick={() => handleSort("name")}
              className="py-3 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              District {getSortIcon("name")}
            </th>
            <th
              onClick={() => handleSort("totalBeds")}
              className="py-3 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-right"
            >
              Total Beds {getSortIcon("totalBeds")}
            </th>
            <th
              onClick={() => handleSort("dengueBeds")}
              className="py-3 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-right"
            >
              Dengue Beds {getSortIcon("dengueBeds")}
            </th>
            <th
              onClick={() => handleSort("dengueShare")}
              className="py-3 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-right"
            >
              Share {getSortIcon("dengueShare")}
            </th>
            <th
              onClick={() => handleSort("peakWeeklyCases")}
              className="py-3 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-right"
            >
              Peak Weekly Cases {getSortIcon("peakWeeklyCases")}
            </th>
            <th
              onClick={() => handleSort("peakUtilization")}
              className="py-3 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-right"
            >
              Peak Utilisation {getSortIcon("peakUtilization")}
            </th>
            <th className="py-3 px-4 text-center">Risk Level</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 bg-white dark:bg-slate-800">
          {sortedRows.map((r) => (
            <tr key={r.id || r.name} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/50 transition-colors">
              <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                <div>{r.name}</div>
                <div className="text-xs text-slate-400 dark:text-slate-400 font-normal">{r.province} Province</div>
              </td>
              <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-300 font-mono">
                {Number(r.totalBeds).toLocaleString()}
              </td>
              <td className="py-3 px-4 text-right text-slate-900 dark:text-white font-semibold font-mono">
                {Number(r.dengueBeds).toLocaleString()}
              </td>
              <td className="py-3 px-4 text-right text-slate-500 dark:text-slate-400 font-mono">
                {r.dengueShare}%
              </td>
              <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-200 font-mono">
                {Number(r.peakWeeklyCases).toLocaleString()}
              </td>
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="w-24 bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        r.risk === "Critical"
                          ? "bg-rose-500"
                          : r.risk === "High"
                          ? "bg-orange-500"
                          : r.risk === "Moderate"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(r.peakUtilization, 100)}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs font-semibold w-10 text-right text-slate-800 dark:text-slate-200">
                    {r.peakUtilization}%
                  </span>
                </div>
              </td>
              <td className="py-3 px-4 text-center">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    RISK_BADGES[r.risk] || RISK_BADGES.Normal
                  }`}
                >
                  {r.risk}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
