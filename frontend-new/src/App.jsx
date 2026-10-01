import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { SriLankaBackdrop } from "./components/backdrop/SriLankaBackdrop";
import { AmbientMosquito } from "./components/backdrop/AmbientMosquito";
import { Navbar } from "./components/layout/Navbar";
import { ChatAssistant } from "./components/chatbot/ChatAssistant";
import { OverviewPage } from "./pages/Overview";
import { PredictionPage } from "./pages/Prediction";
import { HistoricalPage } from "./pages/Historical";
import { DemographicsPage } from "./pages/Demographics";
import { CapacityPage } from "./pages/Capacity";

export const App = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200 relative overflow-x-hidden">
          {/* Animated Sri Lanka Map Backdrop with Blinking District Dots */}
          <SriLankaBackdrop />

          {/* Ambient Flying Mosquito (Periodic Flutter Flight) */}
          <AmbientMosquito />

          {/* Navigation Bar */}
          <Navbar />

          {/* Dynamic Route Content */}
          <div className="flex-1 relative z-10">
            <Routes>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/prediction" element={<PredictionPage />} />
              <Route path="/historical" element={<HistoricalPage />} />
              <Route path="/demographics" element={<DemographicsPage />} />
              <Route path="/capacity" element={<CapacityPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>

          {/* Global Floating AI Chat Assistant */}
          <ChatAssistant />

          {/* Footer */}
          <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-200">DenguePredict</span> — Sri Lanka Outbreak & Hospital Bed Capacity Surveillance
              </div>
              <div>
                Department of Computing & Information Systems · Sabaragamuwa University of Sri Lanka
              </div>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
