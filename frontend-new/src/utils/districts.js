/**
 * Sri Lanka 25 Administrative Districts Metadata
 * Canonical geographic identifiers and centroid coordinates for surveillance mapping.
 */

export const DISTRICTS = [
  { id: "colombo", name: "Colombo", province: "Western", centroid: [79.9, 6.93] },
  { id: "gampaha", name: "Gampaha", province: "Western", centroid: [80.0, 7.1] },
  { id: "kalutara", name: "Kalutara", province: "Western", centroid: [80.05, 6.6] },
  { id: "kandy", name: "Kandy", province: "Central", centroid: [80.65, 7.3] },
  { id: "matale", name: "Matale", province: "Central", centroid: [80.65, 7.6] },
  { id: "nuwara-eliya", name: "Nuwara Eliya", province: "Central", centroid: [80.75, 6.97] },
  { id: "galle", name: "Galle", province: "Southern", centroid: [80.25, 6.15] },
  { id: "matara", name: "Matara", province: "Southern", centroid: [80.55, 6.05] },
  { id: "hambantota", name: "Hambantota", province: "Southern", centroid: [81.1, 6.25] },
  { id: "jaffna", name: "Jaffna", province: "Northern", centroid: [80.05, 9.68] },
  { id: "kilinochchi", name: "Kilinochchi", province: "Northern", centroid: [80.4, 9.4] },
  { id: "mannar", name: "Mannar", province: "Northern", centroid: [80.0, 8.9] },
  { id: "vavuniya", name: "Vavuniya", province: "Northern", centroid: [80.5, 8.75] },
  { id: "mullaitivu", name: "Mullaitivu", province: "Northern", centroid: [80.7, 9.15] },
  { id: "batticaloa", name: "Batticaloa", province: "Eastern", centroid: [81.5, 7.75] },
  { id: "ampara", name: "Ampara", province: "Eastern", centroid: [81.6, 7.15] },
  { id: "trincomalee", name: "Trincomalee", province: "Eastern", centroid: [81.1, 8.5] },
  { id: "kurunegala", name: "Kurunegala", province: "North Western", centroid: [80.35, 7.5] },
  { id: "puttalam", name: "Puttalam", province: "North Western", centroid: [79.95, 7.95] },
  { id: "anuradhapura", name: "Anuradhapura", province: "North Central", centroid: [80.5, 8.3] },
  { id: "polonnaruwa", name: "Polonnaruwa", province: "North Central", centroid: [81.0, 7.95] },
  { id: "badulla", name: "Badulla", province: "Uva", centroid: [81.05, 6.95] },
  { id: "monaragala", name: "Monaragala", province: "Uva", centroid: [81.35, 6.75] },
  { id: "ratnapura", name: "Ratnapura", province: "Sabaragamuwa", centroid: [80.45, 6.6] },
  { id: "kegalle", name: "Kegalle", province: "Sabaragamuwa", centroid: [80.35, 7.25] },
];

export const YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026];

export const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export const SRI_LANKA_OUTLINE = [
  [80.23, 9.83],
  [80.5, 9.6],
  [80.75, 9.4],
  [80.85, 9.1],
  [81.0, 8.8],
  [81.22, 8.58],
  [81.3, 8.3],
  [81.42, 8.05],
  [81.68, 7.75],
  [81.82, 7.42],
  [81.86, 7.05],
  [81.8, 6.7],
  [81.6, 6.42],
  [81.35, 6.2],
  [81.0, 6.0],
  [80.6, 5.92],
  [80.25, 6.02],
  [79.9, 6.45],
  [79.85, 6.93],
  [79.8, 7.5],
  [79.7, 8.0],
  [79.85, 8.5],
  [80.0, 9.0],
  [79.9, 9.5],
  [80.23, 9.83]
];

export function getDistrictById(id) {
  if (!id) return DISTRICTS[0];
  const query = String(id).toLowerCase().trim();
  return DISTRICTS.find((d) => d.id === query || d.name.toLowerCase() === query) || DISTRICTS[0];
}
