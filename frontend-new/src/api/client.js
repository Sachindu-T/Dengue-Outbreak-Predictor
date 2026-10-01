import { getDistrictById, DISTRICTS } from "../utils/districts";

const BACKEND_URL = "http://localhost:8000";

/**
 * Predict Dengue Cases & Hospital Capacity
 * Connects directly to backend POST /api/predict (myApp.views.api_predict)
 * Receives ML predictions + ARIMA weather + bed capacity with zero client-side calculations.
 */
export async function predictOutbreak(params) {
  const districtObj = getDistrictById(params.districtId) || DISTRICTS[0];

  const res = await fetch(`${BACKEND_URL}/api/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      districtId: districtObj.name,
      district: districtObj.name,
      year: Number(params.year),
      week: Number(params.week),
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Backend error (${res.status}): ${errorText}`);
  }

  return await res.json();
}

/**
 * Ask AI Dengue Assistant
 * Connects directly to backend POST /api/chatbot (myApp.views.chatbot)
 */
export async function askChatbot(message) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/chatbot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, question: message }),
    });

    if (res.ok) {
      const data = await res.json();
      const replyText = data.reply || data.a || data.answer || (typeof data === "string" ? data : "");
      if (replyText) {
        return {
          reply: replyText,
          disclaimer: "Grounded clinical guidelines response from backend RAG pipeline.",
          isLiveBackend: true,
        };
      }
    }
  } catch (err) {
    console.error("Backend /api/chatbot request failed:", err);
  }

  return {
    reply: "Could not reach the Django chatbot service. Please ensure the backend is running at http://localhost:8000.",
    disclaimer: "Connection error",
    isLiveBackend: false,
  };
}

/**
 * Fetch Overview Surveillance Data
 * Connects to GET /api/overview?year=...
 */
export async function fetchOverview(year = 2024) {
  const res = await fetch(`${BACKEND_URL}/api/overview?year=${year}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch overview data: ${res.statusText}`);
  }
  return await res.json();
}

/**
 * Fetch Historical Surveillance Data
 * Connects to GET /api/historical with granular year/month options
 */
export async function fetchHistorical(params = {}) {
  let queryObj = {};
  if (typeof params === "object" && params !== null && typeof params.toFixed !== "function") {
    const {
      year = 2024,
      rankingYear,
      rankingMonth,
      seasonalityYear,
      seasonalityMonth,
      district = "Colombo",
    } = params;

    queryObj.year = String(year);
    queryObj.district = district;
    if (rankingYear !== undefined && rankingYear !== null) queryObj.rankingYear = String(rankingYear);
    if (rankingMonth !== undefined && rankingMonth !== null && rankingMonth !== "all") queryObj.rankingMonth = String(rankingMonth);
    if (seasonalityYear !== undefined && seasonalityYear !== null) queryObj.seasonalityYear = String(seasonalityYear);
    if (seasonalityMonth !== undefined && seasonalityMonth !== null && seasonalityMonth !== "all") queryObj.seasonalityMonth = String(seasonalityMonth);
  } else {
    // Positional fallback: (year, month, district)
    const year = params || 2024;
    const month = arguments[1];
    const district = arguments[2] || "Colombo";
    queryObj.year = String(year);
    queryObj.district = district;
    if (month !== null && month !== undefined && month !== "all") {
      queryObj.month = String(month);
    }
  }

  const query = new URLSearchParams(queryObj);
  const res = await fetch(`${BACKEND_URL}/api/historical?${query.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch historical data: ${res.statusText}`);
  }
  return await res.json();
}

/**
 * Fetch Hospital Capacity Surveillance Data
 * Connects to GET /api/capacity?year=...
 */
export async function fetchCapacity(year = 2024) {
  const res = await fetch(`${BACKEND_URL}/api/capacity?year=${year}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch capacity data: ${res.statusText}`);
  }
  return await res.json();
}

/**
 * Fetch Demographics & Climate Surveillance Data
 * Connects to GET /api/demographics?year=...
 */
export async function fetchDemographics(year = 2024) {
  const res = await fetch(`${BACKEND_URL}/api/demographics?year=${year}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch demographics data: ${res.statusText}`);
  }
  return await res.json();
}

/**
 * Health check for backend connection
 */
export async function checkBackendStatus() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${BACKEND_URL}/api/overview?year=2024`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.status === 200;
  } catch {
    return false;
  }
}
