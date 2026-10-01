import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Activity,
  LayoutDashboard,
  Radar,
  BarChart3,
  CloudRain,
  BedDouble,
  Menu,
  X,
  Wifi,
  WifiOff,
  Sun,
  Moon,
} from "lucide-react";
import { checkBackendStatus } from "../../api/client";
import { useTheme } from "../../context/ThemeContext";

const NAV_LINKS = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/prediction", label: "Prediction", icon: Radar },
  { to: "/historical", label: "Historical Analysis", icon: BarChart3 },
  { to: "/demographics", label: "Population & Weather", icon: CloudRain },
  { to: "/capacity", label: "Hospital Capacity", icon: BedDouble },
];

export const Navbar = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    checkBackendStatus().then(setBackendOnline);
    const interval = setInterval(() => {
      checkBackendStatus().then(setBackendOnline);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center shadow-sm group-hover:bg-emerald-800 transition-colors">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white tracking-tight text-base leading-none">
              DenguePredict
            </div>
            <div className="text-[10px] uppercase font-semibold text-emerald-700 dark:text-emerald-400 tracking-wider mt-0.5">
              Sri Lanka Surveillance
            </div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  active
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/60"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? "text-emerald-700 dark:text-emerald-400" : "text-slate-400"}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Status Badges & Controls */}
        <div className="flex items-center gap-2.5">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-colors"
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Backend Status indicator */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
              backendOnline === true
                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                : backendOnline === false
                ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
            }`}
          >
            {backendOnline === true ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Backend Live</span>
              </>
            ) : backendOnline === false ? (
              <>
                <WifiOff className="w-3 h-3 text-rose-500" />
                <span>Backend Offline</span>
              </>
            ) : (
              <>
                <Wifi className="w-3 h-3 text-slate-400 animate-pulse" />
                <span>Connecting...</span>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-1">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold ${
                  active
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};
