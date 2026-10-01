import React, { useState, useEffect } from "react";

/**
 * High-Fidelity Aedes aegypti Vector SVG Glyph
 * Features striped abdomen, slender proboscis, jointed legs, and rapid-fluttering translucent wings.
 */
const MosquitoGlyph = () => {
  return (
    <svg
      width="46"
      height="34"
      viewBox="0 0 46 34"
      fill="none"
      aria-hidden="true"
      className="drop-shadow-md select-none pointer-events-none"
    >
      {/* Rapid fluttering translucent wings */}
      <g style={{ transformOrigin: "22px 14px" }} className="animate-wing-left">
        <ellipse
          cx="14"
          cy="9"
          rx="10"
          ry="3.2"
          fill="#2dd4bf"
          opacity="0.8"
          transform="rotate(-18 14 9)"
        />
      </g>
      <g style={{ transformOrigin: "22px 14px" }} className="animate-wing-right">
        <ellipse
          cx="30"
          cy="9"
          rx="10"
          ry="3.2"
          fill="#2dd4bf"
          opacity="0.8"
          transform="rotate(18 30 9)"
        />
      </g>

      {/* Abdomen with distinct Aedes white stripes */}
      <path d="M23 16 L34 24 L31 27 L21 20 Z" fill="#042f2e" className="dark:fill-[#022c22]" />
      <path
        d="M26 19 l1.2 1 M28.4 20.8 l1.2 1 M30.8 22.6 l1.2 1"
        stroke="#ffffff"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Thorax + Head */}
      <ellipse cx="21" cy="15" rx="3.4" ry="2.6" fill="#064e3b" className="dark:fill-[#042f2e]" />
      <circle cx="16.8" cy="14.2" r="1.7" fill="#064e3b" className="dark:fill-[#042f2e]" />

      {/* Sharp Piercing Needle Proboscis */}
      <path
        d="M15.4 14.4 L8 16.5"
        stroke="#064e3b"
        strokeWidth="1"
        strokeLinecap="round"
        className="dark:stroke-[#0f766e]"
      />

      {/* Jointed Vector Legs */}
      <path
        d="M20 17 l-5 7 M22 17.5 l-1 9 M24 17.8 l4 8 M19 13.5 l-7 -4 M25 13 l6 -5"
        stroke="#064e3b"
        strokeWidth="0.9"
        strokeLinecap="round"
        className="dark:stroke-[#0f766e]"
      />
    </svg>
  );
};

/**
 * Occasional Ambient Flying Mosquito
 * Launches periodic realistic flight patterns across the viewport without obstructing UI content.
 */
export const AmbientMosquito = () => {
  const [flightState, setFlightState] = useState(null); // null | { id: number, direction: 'ltr' | 'rtl' }

  useEffect(() => {
    let flightCounter = 0;

    // Launch first ambient flight after 3 seconds so the user immediately sees it
    const initialTimer = setTimeout(() => {
      flightCounter++;
      setFlightState({ id: flightCounter, direction: "ltr" });
    }, 3000);

    // Subsequent ambient flights every 26 seconds
    const intervalTimer = setInterval(() => {
      flightCounter++;
      const direction = flightCounter % 2 === 1 ? "ltr" : "rtl";
      setFlightState({ id: flightCounter, direction });
    }, 26000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, []);

  const handleAnimationEnd = () => {
    setFlightState(null);
  };

  if (!flightState) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-20 overflow-hidden"
    >
      <div
        key={flightState.id}
        onAnimationEnd={handleAnimationEnd}
        className={`absolute ${
          flightState.direction === "ltr"
            ? "animate-mosquito-flight"
            : "animate-mosquito-flight-alt"
        }`}
      >
        <MosquitoGlyph />
      </div>
    </div>
  );
};

export default AmbientMosquito;
