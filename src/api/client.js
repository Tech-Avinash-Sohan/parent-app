// One fetch wrapper for the whole app:
// - adds the Bearer token, refreshes it once when it expires (single refresh even if 10 calls fail together)
// - 401 after refresh -> signed out, 402 -> parent app not paid yet (server sends next_step)
// - timeouts, offline detection and readable error messages from Django REST Framework errors
import { Platform } from "react-native";
import { ENV } from "../config/env";
import { tokenStorage } from "./tokenStorage";

export class ApiError extends Error {
  constructor(message, { status = 0, data = null, network = false, timeout = false } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.network = network;
    this.timeout = timeout;
  }
}

const handlers = { onSignedOut: () => {}, onPaymentRequired: () => {} };
export const setApiHandlers = (h) => Object.assign(handlers, h);

/** Turn a DRF error body into one readable line. */
export function errorMessage(data, status) {
  if (!data) return status >= 500 ? "The server had a problem. Please try again." : `Request failed (${status}).`;
  if (typeof data === "string") return data.slice(0, 200);
  if (data.detail) return String(data.detail);
  if (Array.isArray(data.non_field_errors)) return data.non_field_errors.join(" ");
  const first = Object.entries(data).find(([, v]) => v);
  if (first) {
    const [k, v] = first;
    const msg = Array.isArray(v) ? v.join(" ") : typeof v === "object" ? JSON.stringify(v) : String(v);
    return k === "detail" ? msg : `${k.replace(/_/g, " ")}: ${msg}`;
  }
  return `Request failed (${status}).`;
}

/** Field errors for forms: { mobile: "This field is required." } */
export function fieldErrors(err) {
  const out = {};
  const d = err?.data;
  if (d && typeof d === "object" && !d.detail) {
    for (const [k, v] of Object.entries(d)) out[k] = Array.isArray(v) ? v.join(" ") : String(v);
  }
  return out;
}

/** Lists come either plain or paginated ({results}). */
export const rows = (d) => (Array.isArray(d) ? d : d?.results || []);

const qs = (params) => {
  if (!params) return "";
  const p = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  return p.length ? `?${p.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&")}` : "";
};

export const url = (path, params) => `${ENV.API_URL}${path}${qs(params)}`;

async function rawFetch(path, { method = "GET", body, params, auth = true, headers = {}, accept = "json", form = false } = {}) {
  const h = { Accept: accept === "json" ? "application/json" : "text/html", ...headers };
  if (body !== undefined && !form) h["Content-Type"] = "application/json";
  if (auth) {
    const t = tokenStorage.get();
    if (t?.access) h.Authorization = `Bearer ${t.access}`;
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ENV.API_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(url(path, params), {
      method, headers: h, signal: ctrl.signal,
      body: body === undefined ? undefined : form ? body : JSON.stringify(body),
    });
  } catch (e) {
    if (e?.name === "AbortError") throw new ApiError("The server is taking too long. Please try again.", { timeout: true, network: true });
    throw new ApiError("No internet connection, or the server can't be reached.", { network: true });
  } finally {
    clearTimeout(timer);
  }
  const text = await res.text();
  let data = text;
  if (accept === "json") {
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  }
  return { res, data };
}

let refreshing = null;
async function refreshTokens() {
  if (!refreshing) {
    refreshing = (async () => {
      const t = tokenStorage.get();
      if (!t?.refresh) return false;
      const { res, data } = await rawFetch("/auth/token/refresh/", { method: "POST", body: { refresh: t.refresh }, auth: false });
      if (!res.ok || !data?.access) return false;
      await tokenStorage.save(data);
      return true;
    })().catch(() => false).finally(() => { setTimeout(() => { refreshing = null; }, 0); });
  }
  return refreshing;
}

async function request(path, opts = {}) {
  const auth = opts.auth !== false;
  if (auth) {
    const t = tokenStorage.get();
    if (t?.refresh && t.expiresAt && t.expiresAt - Date.now() < 60_000) await refreshTokens();
  }
  let { res, data } = await rawFetch(path, opts);
  if (res.status === 401 && auth) {
    if (await refreshTokens()) ({ res, data } = await rawFetch(path, opts));
    if (res.status === 401) {
      await tokenStorage.clear();
      handlers.onSignedOut();
      throw new ApiError("Your session has ended. Please log in again.", { status: 401, data });
    }
  }
  if (res.status === 402) {
    handlers.onPaymentRequired(data?.next_step || "payment");
    throw new ApiError(errorMessage(data, 402), { status: 402, data });
  }
  if (!res.ok) throw new ApiError(errorMessage(data, res.status), { status: res.status, data });
  return data;
}

export const api = {
  get: (path, params, opts) => request(path, { ...opts, params }),
  post: (path, body = {}, opts) => request(path, { ...opts, method: "POST", body }),
  patch: (path, body = {}, opts) => request(path, { ...opts, method: "PATCH", body }),
  delete: (path, opts) => request(path, { ...opts, method: "DELETE" }),
  /** Printable HTML pages (certificates). */
  html: (path) => request(path, { accept: "html" }),
  /** Multipart upload of one picked file ({uri, name, mimeType}) -> {url}. */
  async upload(file) {
    const fd = new FormData();
    if (Platform.OS === "web") {
      const blob = file.file || (await (await fetch(file.uri)).blob());
      fd.append("file", blob, file.name);
    } else {
      fd.append("file", { uri: file.uri, name: file.name, type: file.mimeType || "application/octet-stream" });
    }
    return request("/uploads/", { method: "POST", body: fd, form: true });
  },
};
