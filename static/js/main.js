// Dengue Watch — dashboard front end. Fetch + Chart.js + minimal DOM writes.
// Tab switching itself needs no JS at all — Bootstrap's data-bs-toggle="pill"
// handles that natively.

const palette = {
  pine: "#0E3B36",
  teal: "#1E7F72",
  tealLight: "#6FB6AA",
  amber: "#C98A2C",
  clay: "#D46A2E",
  red: "#B3382C",
  line: "#E1DED4",
  ink: "#4B5A56",
};
const districtColors = ["#1E7F72", "#C98A2C", "#D46A2E", "#5E7CE2", "#B3382C"];

Chart.defaults.font.family = "'IBM Plex Sans', sans-serif";
Chart.defaults.color = palette.ink;
Chart.defaults.borderColor = palette.line;

const charts = {}; // keep refs so tabs re-rendered on demand don't leak

function money(n) { return Number(n).toLocaleString(); }

async function getJSON(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`Request failed: ${url}`);
  return res.json();
}

function makeChart(id, config) {
  const el = document.getElementById(id);
  if (!el) return null;
  if (charts[id]) charts[id].destroy();
  charts[id] = new Chart(el.getContext("2d"), config);
  return charts[id];
}

/* ----------------------------------------------------------- OVERVIEW */
async function loadOverview() {
  const [summary, hospital, weather] = await Promise.all([
    getJSON("/api/historical/summary"),
    getJSON("/api/hospital"),
    getJSON("/api/weather/trends"),
  ]);

  const totalCases = summary.annual_cases.cases.reduce((a, b) => a + b, 0);
  const lastYearIdx = summary.annual_cases.years.length - 1;
  const lastYearCases = summary.annual_cases.cases[lastYearIdx];
  const prevYearCases = summary.annual_cases.cases[lastYearIdx - 1] || lastYearCases;
  const change = prevYearCases ? (((lastYearCases - prevYearCases) / prevYearCases) * 100).toFixed(1) : "0.0";
  const topDistrict = summary.district_totals.districts[0];
  const totalBeds = hospital.dengue_beds.reduce((a, b) => a + b, 0);

  document.getElementById("overviewStats").innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Total recorded cases</div>
      <div class="stat-value">${money(totalCases)}</div>
      <div class="stat-delta">Across ${summary.annual_cases.years.length} years, all districts</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">${summary.annual_cases.years[lastYearIdx]} vs prior year</div>
      <div class="stat-value">${change > 0 ? "+" : ""}${change}%</div>
      <div class="stat-delta">${money(lastYearCases)} cases in ${summary.annual_cases.years[lastYearIdx]}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Highest-burden district</div>
      <div class="stat-value">${topDistrict}</div>
      <div class="stat-delta">${money(summary.district_totals.cases[0])} cumulative cases</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Dengue bed capacity</div>
      <div class="stat-value">${money(totalBeds)}</div>
      <div class="stat-delta">Nationwide, ~30% of total beds</div>
    </div>`;

  makeChart("chartAnnual", {
    type: "bar",
    data: {
      labels: summary.annual_cases.years,
      datasets: [{ data: summary.annual_cases.cases, backgroundColor: palette.teal, borderRadius: 4, maxBarThickness: 34 }],
    },
    options: baseOptions({ legend: false }),
  });

  makeChart("chartTop5", {
    type: "line",
    data: {
      labels: summary.top5_trend[0]?.years || [],
      datasets: summary.top5_trend.map((d, i) => ({
        label: d.district,
        data: d.cases,
        borderColor: districtColors[i % districtColors.length],
        backgroundColor: districtColors[i % districtColors.length],
        tension: 0.35,
        pointRadius: 3,
      })),
    },
    options: baseOptions({ legend: true }),
  });
}

/* ----------------------------------------------------------- PREDICT */
function riskGaugeWidth(pct) { return Math.min(100, pct); }

function renderPredictResult(data) {
  const risk = data.risk;
  document.getElementById("predictResult").innerHTML = `
    <div class="result-head">
      <div class="result-cases">${money(data.predicted_cases)}<small>predicted cases, ${data.district} · week ${data.week}, ${data.year}</small></div>
      <span class="risk-badge ${risk.level}"><i class="bi bi-${risk.icon}"></i>${risk.label}</span>
    </div>

    <div class="gauge-wrap">
      <div class="gauge-track"><div class="gauge-fill ${risk.level}" style="width:${riskGaugeWidth(data.capacity_utilization)}%"></div></div>
      <div class="gauge-labels"><span>0%</span><span>Bed capacity used: ${data.capacity_utilization}%</span><span>100%+</span></div>
    </div>

    <div class="result-meta">
      <div><div class="meta-label">Weekly bed capacity</div><div class="meta-value">${money(data.weekly_bed_capacity)}</div></div>
      <div><div class="meta-label">Cases / 100k pop.</div><div class="meta-value">${data.cases_per_100k ?? "—"}</div></div>
      <div><div class="meta-label">Weather used</div><div class="meta-value">${data.inputs.mean_temperature}&deg;C · ${data.inputs.weekly_rainfall}mm</div></div>
    </div>

    <div class="model-tag"><i class="bi bi-${data.used_trained_model ? "cpu" : "calculator"}"></i>
      ${data.used_trained_model ? "Prediction from your trained model pipeline" : "Heuristic fallback — drop best_model.pkl into /model to use your trained model"}
    </div>`;
}

async function handlePredictSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Running…`;

  const body = {
    district: document.getElementById("fDistrict").value,
    year: document.getElementById("fYear").value,
    week: document.getElementById("fWeek").value,
    mean_temperature: document.getElementById("fTemp").value || null,
    weekly_rainfall: document.getElementById("fRain").value || null,
  };

  try {
    const data = await getJSON("/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    renderPredictResult(data);
    if (data.risk.level === "high" || data.risk.level === "critical") {
      Swal.fire({
        icon: "warning",
        title: `${data.risk.label} in ${data.district}`,
        text: `Predicted bed capacity utilization is ${data.capacity_utilization}% for week ${data.week}.`,
        confirmButtonColor: palette.teal,
      });
    } else {
      Swal.fire({
        icon: "success",
        title: "Prediction ready",
        text: `${money(data.predicted_cases)} cases forecast for ${data.district}.`,
        confirmButtonColor: palette.teal,
        timer: 1800,
        showConfirmButton: false,
      });
    }
  } catch (err) {
    Swal.fire({ icon: "error", title: "Couldn't run prediction", text: err.message, confirmButtonColor: palette.teal });
  } finally {
    btn.disabled = false;
    btn.innerHTML = original;
  }
}

/* --------------------------------------------------------- HISTORICAL */
let historicalLoaded = false;
async function loadHistorical() {
  const summary = await getJSON("/api/historical/summary");

  makeChart("chartDistrictTotals", {
    type: "bar",
    data: {
      labels: summary.district_totals.districts,
      datasets: [{ data: summary.district_totals.cases, backgroundColor: palette.pine, borderRadius: 3 }],
    },
    options: baseOptions({ legend: false, indexAxis: "y" }),
  });

  const yearSelect = document.getElementById("monthlyYearSelect");
  yearSelect.innerHTML = summary.monthly.map(m => `<option value="${m.year}">${m.year}</option>`).join("");
  yearSelect.value = summary.monthly[summary.monthly.length - 1].year;
  yearSelect.onchange = () => renderMonthlyChart(summary, Number(yearSelect.value));
  renderMonthlyChart(summary, Number(yearSelect.value));

  const districtSelect = document.getElementById("districtDeepSelect");
  districtSelect.innerHTML = summary.district_totals.districts.map(d => `<option value="${d}">${d}</option>`).join("");
  districtSelect.onchange = () => renderDistrictDeepDive(districtSelect.value);
  renderDistrictDeepDive(districtSelect.value);

  historicalLoaded = true;
}

function renderMonthlyChart(summary, year) {
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const row = summary.monthly.find(m => m.year === year);
  makeChart("chartMonthly", {
    type: "line",
    data: {
      labels: row.months.map(m => monthNames[m - 1]),
      datasets: [{ data: row.cases, borderColor: palette.clay, backgroundColor: palette.clay, tension: 0.35, fill: false, pointRadius: 3 }],
    },
    options: baseOptions({ legend: false }),
  });
}

async function renderDistrictDeepDive(district) {
  const data = await getJSON(`/api/historical/district/${encodeURIComponent(district)}`);
  makeChart("chartDistrictYearly", {
    type: "bar",
    data: { labels: data.years, datasets: [{ data: data.cases, backgroundColor: palette.teal, borderRadius: 4, maxBarThickness: 40 }] },
    options: baseOptions({ legend: false }),
  });
  document.getElementById("districtDeepStats").innerHTML = `
    <div class="result-meta" style="grid-template-columns:1fr;">
      <div><div class="meta-label">Total cases recorded</div><div class="meta-value">${money(data.total_cases)}</div></div>
      <div><div class="meta-label">Peak week</div><div class="meta-value">Week ${data.peak_week.week}, ${data.peak_week.year}</div></div>
      <div><div class="meta-label">Cases that week</div><div class="meta-value">${money(data.peak_week.cases)}</div></div>
    </div>`;
}

/* --------------------------------------------------------- POPULATION */
let populationLoaded = false;
async function loadPopulation() {
  const [pop, weather] = await Promise.all([getJSON("/api/population"), getJSON("/api/weather/trends")]);

  makeChart("chartPopulation", {
    type: "bar",
    data: { labels: pop.districts, datasets: [{ data: pop.population, backgroundColor: palette.pine, borderRadius: 3 }] },
    options: baseOptions({ legend: false, indexAxis: "y" }),
  });

  makeChart("chartCasesPer100k", {
    type: "bar",
    data: { labels: pop.districts, datasets: [{ data: pop.cases_per_100k, backgroundColor: palette.clay, borderRadius: 3 }] },
    options: baseOptions({ legend: false, indexAxis: "y" }),
  });

  makeChart("chartWeatherYearly", {
    type: "bar",
    data: {
      labels: weather.yearly.years,
      datasets: [
        { type: "bar", label: "Total rainfall (mm)", data: weather.yearly.total_rainfall, backgroundColor: palette.tealLight, yAxisID: "y", borderRadius: 3 },
        { type: "line", label: "Avg temp (°C)", data: weather.yearly.avg_temp, borderColor: palette.clay, backgroundColor: palette.clay, yAxisID: "y1", tension: 0.3 },
      ],
    },
    options: dualAxisOptions(),
  });

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  makeChart("chartWeatherMonthly", {
    type: "bar",
    data: {
      labels: weather.monthly.months.map(m => monthNames[m - 1]),
      datasets: [
        { type: "bar", label: "Avg rainfall (mm)", data: weather.monthly.avg_rainfall, backgroundColor: palette.tealLight, yAxisID: "y", borderRadius: 3 },
        { type: "line", label: "Avg temp (°C)", data: weather.monthly.avg_temp, borderColor: palette.clay, backgroundColor: palette.clay, yAxisID: "y1", tension: 0.3 },
      ],
    },
    options: dualAxisOptions(),
  });

  populationLoaded = true;
}

/* ----------------------------------------------------------- HOSPITAL */
let hospitalLoaded = false;
async function loadHospital() {
  const data = await getJSON("/api/hospital");
  makeChart("chartHospital", {
    type: "bar",
    data: {
      labels: data.districts,
      datasets: [
        { label: "Total beds", data: data.total_beds, backgroundColor: palette.line, borderRadius: 3 },
        { label: "Dengue beds", data: data.dengue_beds, backgroundColor: palette.teal, borderRadius: 3 },
      ],
    },
    options: baseOptions({ legend: true, indexAxis: "y" }),
  });

  const tbody = document.querySelector("#hospitalTable tbody");
  tbody.innerHTML = data.districts.map((d, i) => `
    <tr><td>${d}</td><td>${money(data.total_beds[i])}</td><td>${money(data.dengue_beds[i])}</td></tr>
  `).join("");

  hospitalLoaded = true;
}

/* ------------------------------------------------------------- CHATBOT */
function appendChatMessage(text, from, disclaimer) {
  const body = document.getElementById("chatBody");
  const wrap = document.createElement("div");
  wrap.className = `chat-msg ${from}`;
  wrap.innerHTML = `<div class="chat-bubble">${text}${disclaimer ? `<div class="chat-disclaimer">${disclaimer}</div>` : ""}</div>`;
  body.appendChild(wrap);
  body.scrollTop = body.scrollHeight;
}

async function sendChatMessage(message) {
  if (!message.trim()) return;
  appendChatMessage(message, "user");
  try {
    const data = await getJSON("/api/chatbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    appendChatMessage(data.reply, "bot", data.disclaimer);
  } catch (err) {
    appendChatMessage("Sorry, I couldn't reach the assistant just now.", "bot");
  }
}

/* --------------------------------------------------------- chart opts */
function baseOptions({ legend = false, indexAxis = "x" } = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis,
    plugins: { legend: { display: legend, labels: { boxWidth: 10, usePointStyle: true } } },
    scales: { x: { grid: { display: indexAxis === "y" } }, y: { grid: { color: palette.line } } },
  };
}
function dualAxisOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true, labels: { boxWidth: 10, usePointStyle: true } } },
    scales: {
      y: { position: "left", grid: { color: palette.line }, title: { display: true, text: "mm" } },
      y1: { position: "right", grid: { display: false }, title: { display: true, text: "°C" } },
    },
  };
}

/* ------------------------------------------------------------- wiring */
document.addEventListener("DOMContentLoaded", () => {
  loadOverview();

  document.getElementById("predictForm").addEventListener("submit", handlePredictSubmit);

  document.getElementById("tab-historical").addEventListener("shown.bs.tab", () => { if (!historicalLoaded) loadHistorical(); });
  document.getElementById("tab-population").addEventListener("shown.bs.tab", () => { if (!populationLoaded) loadPopulation(); });
  document.getElementById("tab-hospital").addEventListener("shown.bs.tab", () => { if (!hospitalLoaded) loadHospital(); });

  document.getElementById("chatForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("chatInput");
    sendChatMessage(input.value);
    input.value = "";
  });
  document.getElementById("chatQuick").addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (btn) sendChatMessage(btn.dataset.q);
  });
});
