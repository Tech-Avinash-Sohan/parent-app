const M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n) => String(n).padStart(2, "0");
const toIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayISO = () => toIso(new Date());
export const addDays = (iso, n) => { const d = new Date(`${iso}T00:00:00`); d.setDate(d.getDate() + n); return toIso(d); };
export const monthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

const parse = (v) => new Date(String(v).length === 10 ? `${v}T00:00:00` : v);

export function fDate(v) {
  if (!v) return "—";
  const d = parse(v);
  return Number.isNaN(d.getTime()) ? String(v) : `${pad(d.getDate())} ${M[d.getMonth()]} ${d.getFullYear()}`;
}
export function fTime(v) {
  if (!v) return "";
  if (/^\d{1,2}:\d{2}/.test(v)) {
    let [h, m] = v.split(":").map(Number);
    const ap = h >= 12 ? "pm" : "am";
    h = h % 12 || 12;
    return `${h}:${pad(m)} ${ap}`;
  }
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : fTime(`${d.getHours()}:${pad(d.getMinutes())}`);
}
export const fDateTime = (v) => (v ? `${fDate(v)}, ${fTime(v)}` : "—");
export function timeAgo(v) {
  const s = Math.max(0, (Date.now() - new Date(v).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} d ago`;
  return fDate(v);
}
export const inr = (n) => (n === null || n === undefined || n === "" ? "—" : `₹${Math.round(Number(n)).toLocaleString("en-IN")}`);
export const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };
export const initials = (name = "") => name.split(" ").filter(Boolean).slice(0, 2).map((x) => x[0].toUpperCase()).join("");
export const firstName = (name = "") => name.split(" ")[0];
export const isMobile = (m) => /^[6-9]\d{9}$/.test(String(m || "").trim());
export const escapeHtml = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
