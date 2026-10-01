import React from "react";
import { DISTRICTS } from "../../utils/districts";
import { SRI_LANKA_REAL_PATH, projectGeoToSvg } from "../../utils/sriLankaMap";

/**
 * Signature High-Fidelity Sri Lanka Island Backdrop
 * Displays the authentic geographic coastline of Sri Lanka with all peninsulas,
 * bays, and islands, complete with 25 geo-located district surveillance radar nodes.
 */
export const SriLankaBackdrop = () => {
  // High-transmission endemic epicenters highlighted with pulsing radar rings
  const radarEpicenters = new Set(["colombo", "gampaha", "kandy", "galle", "jaffna", "kalutara"]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 flex items-center justify-end select-none"
    >
      {/* Ambient Atmospheric Glow Orbs */}
      <div className="absolute right-0 top-1/4 w-[480px] h-[480px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 blur-[120px] pointer-events-none" />
      <div className="absolute right-1/4 bottom-10 w-[360px] h-[360px] rounded-full bg-teal-500/10 dark:bg-teal-500/10 blur-[100px] pointer-events-none" />

      {/* Map SVG Container */}
      <div className="relative w-full max-w-[440px] sm:max-w-[500px] lg:max-w-[620px] xl:max-w-[680px] mr-0 md:mr-6 lg:mr-14 opacity-40 dark:opacity-35 transition-opacity duration-500">
        <svg
          viewBox="0 0 500 750"
          className="w-full h-auto drop-shadow-[0_0_25px_rgba(16,185,129,0.15)]"
          fill="none"
        >
          <defs>
            {/* Sri Lanka landmass gradient fill */}
            <linearGradient id="slIslandGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0d9488" stopOpacity="0.12" />
              <stop offset="50%" stopColor="#059669" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0.04" />
            </linearGradient>

            {/* Glowing coastline stroke gradient */}
            <linearGradient id="slStrokeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.65" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.4" />
            </linearGradient>

            {/* Bathymetry secondary contour line filter */}
            <filter id="slGlow" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Secondary depth echo outline */}
          <path
            d={SRI_LANKA_REAL_PATH}
            fill="none"
            stroke="url(#slStrokeGradient)"
            strokeWidth="3.5"
            strokeOpacity="0.15"
            strokeLinejoin="round"
            filter="url(#slGlow)"
          />

          {/* Authentic Sri Lanka Coastline & Boundary Vector */}
          <path
            d={SRI_LANKA_REAL_PATH}
            fill="url(#slIslandGradient)"
            stroke="url(#slStrokeGradient)"
            strokeWidth="1.6"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* 25 Administrative District Surveillance Nodes */}
          {DISTRICTS.map((d) => {
            const [cx, cy] = projectGeoToSvg(d.centroid);
            const isEpicenter = radarEpicenters.has(d.id);

            return (
              <g key={d.id} className="cursor-default">
                {/* Pulsing Radar Ring on Core Endemic Epicenters */}
                {isEpicenter && (
                  <>
                    <circle
                      cx={cx}
                      cy={cy}
                      r="9"
                      className="fill-emerald-400/20 dark:fill-emerald-400/30 animate-ping"
                      style={{ animationDuration: "3.2s" }}
                    />
                    <circle
                      cx={cx}
                      cy={cy}
                      r="14"
                      className="fill-teal-400/10 dark:fill-teal-400/15 animate-pulse"
                    />
                  </>
                )}

                {/* Outer Ring */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isEpicenter ? "3.5" : "2.5"}
                  className={
                    isEpicenter
                      ? "fill-emerald-500 dark:fill-emerald-400 stroke-white/40 dark:stroke-slate-900/60"
                      : "fill-teal-600/70 dark:fill-teal-400/70"
                  }
                  strokeWidth="0.8"
                />

                {/* Center Core Dot */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isEpicenter ? "1.6" : "1.2"}
                  className="fill-white dark:fill-slate-950"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Subtle bottom fade to blend with page footer */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-50 dark:from-slate-950 via-slate-50/60 dark:via-slate-950/60 to-transparent pointer-events-none" />
    </div>
  );
};

export default SriLankaBackdrop;
