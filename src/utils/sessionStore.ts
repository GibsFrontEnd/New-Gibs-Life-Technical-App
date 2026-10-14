//@ts-nocheck
// The sign-in session lives in an HttpOnly cookie that the API sets. Scripts on the page cannot read it,
// so a script injected into the app cannot steal it. This file is the only place that knows that.
//
// The rest of the app still reads "token", "unEncryptedUser", "userRole", "agentId" ... through
// localStorage. Those names are kept (so no screen had to change), but they are answered from memory here
// and never written to the browser's storage: closing the tab or reloading forgets them, and the page asks
// the API (GET /Auth/me, using the cookie) who is signed in.
//
// "token" is a stand-in: it has the shape of a token and carries what the real token says about the user
// (names, ids: the API sends that copy as "claims"), so screens that read those keep working. It has no
// signature and the API does not accept it: the real token is not in the page.
// Import this first thing in main.tsx.
import axios from "axios";
import { encryptData } from "./encrypt-utils";

/** Local `npm run dev` talks to an API on another site, which cannot keep the cookie: it uses the token. */
export const USE_TOKEN_MODE = import.meta.env.DEV;
const SET_USER_KEY = true; // this app also keeps the encrypted "user" entry

const IDENTITY_KEYS = [
  "token", "authToken", "refreshToken", "encryptedToken",
  "user", "userInfo", "currentUser", "unEncryptedUser", "username",
  "userRole", "agentId", "agentName",
];
const STAND_IN_TAIL = ".cookie-session";

const memory = new Map<string, string>();
let expiresAt = 0; // ms
let realToken: string | null = null; // dev token mode only

const apiBase = (): string => (window as any).APP_CONFIG?.API_BASE_URL || (window as any).APP_CONFIG?.SERVER_URL || "";
const originOf = (url: string): string | null => {
  try {
    return new URL(url, window.location.href).origin;
  } catch {
    return null;
  }
};
const nativeFetch = window.fetch.bind(window);

// ── stand-in token ───────────────────────────────────────────────────────────
const b64u = (o: any) => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64u = (s: string) => {
  const p = s.replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(decodeURIComponent(escape(atob(p + "=".repeat((4 - (p.length % 4)) % 4)))));
};
const isStandIn = (t?: string | null) => !!t && t.endsWith(STAND_IN_TAIL);
const isJwt = (t?: string | null) => !!t && t.split(".").length === 3 && t.startsWith("eyJ");
const claimsOfToken = (t: string): any => {
  try {
    return fromB64u(t.split(".")[1]);
  } catch {
    return {};
  }
};
const makeStandIn = (claims: any) => `${b64u({ alg: "none", typ: "JWT" })}.${b64u(claims || {})}${STAND_IN_TAIL}`;

/** The value the screens should keep as "token" for a login / session answer from the API. */
export const standInToken = (data: any): string => {
  if (USE_TOKEN_MODE && data?.token) return data.token;
  if (data?.token && !data?.claims) return makeStandIn(claimsOfToken(data.token));
  return makeStandIn(data?.claims || {});
};

// ── storage shim ────────────────────────────────────────────────────────────
const isTarget = (s: Storage) => s === window.localStorage || s === window.sessionStorage;
const proto = Storage.prototype;
const nativeGet = proto.getItem;
const nativeSet = proto.setItem;
const nativeRemove = proto.removeItem;

proto.getItem = function (key: string) {
  if (isTarget(this) && IDENTITY_KEYS.includes(key)) {
    if (key === "token" || key === "authToken") return hasValidSession() ? memory.get("token") ?? null : null;
    return memory.get(key) ?? null;
  }
  return nativeGet.call(this, key);
};
proto.setItem = function (key: string, value: string) {
  if (isTarget(this) && IDENTITY_KEYS.includes(key)) {
    if (key === "token" || key === "authToken") return holdToken(String(value));
    memory.set(key, String(value));
    return;
  }
  return nativeSet.call(this, key, value);
};
proto.removeItem = function (key: string) {
  if (isTarget(this) && IDENTITY_KEYS.includes(key)) {
    if (key === "token") endSession(); // every sign-out path removes "token": also end the session at the API
    memory.delete(key);
    return;
  }
  return nativeRemove.call(this, key);
};

// Anything an earlier version left in storage is removed.
for (const key of IDENTITY_KEYS) {
  try {
    nativeRemove.call(window.localStorage, key);
    nativeRemove.call(window.sessionStorage, key);
  } catch {
    /* storage unavailable */
  }
}

/** A real token handed to the page is swapped for its stand-in (unless local dev needs it). */
function holdToken(value: string) {
  if (isStandIn(value)) {
    memory.set("token", value);
    const exp = claimsOfToken(value).exp;
    expiresAt = exp ? exp * 1000 : Date.now() + 55 * 60 * 1000;
  } else if (isJwt(value)) {
    const claims = claimsOfToken(value);
    expiresAt = claims.exp ? claims.exp * 1000 : Date.now() + 55 * 60 * 1000;
    if (USE_TOKEN_MODE) {
      realToken = value;
      memory.set("token", value);
    } else {
      memory.set("token", makeStandIn(claims));
    }
  } else {
    memory.set("token", value);
    expiresAt = Date.now() + 55 * 60 * 1000;
  }
}

// ── session ─────────────────────────────────────────────────────────────────
export const hasValidSession = (): boolean => memory.has("token") && Date.now() < expiresAt;

/**
 * Rebuilds what the sign-in page keeps (token, role, agent id and name, user) from a login or /Auth/me
 * answer. The rules are the sign-in page's own.
 */
export const applyLogin = (data: any) => {
  if (!data) return;
  const claims = data.claims || (data.token ? claimsOfToken(data.token) : {});
  if (data.expiresAt) expiresAt = new Date(data.expiresAt).getTime();
  else if (claims.exp) expiresAt = claims.exp * 1000;
  else expiresAt = Date.now() + 55 * 60 * 1000;
  realToken = USE_TOKEN_MODE && data.token ? data.token : null;
  memory.set("token", realToken || makeStandIn(claims));

  let role = "agent";
  const type = (data.userType || "").toLowerCase();
  if (type === "customer" || type === "insured") role = "customer";
  else if (type === "admin" || type === "administrator") role = "admin";
  memory.set("userRole", role);

  let agentId: string | null = null;
  let agentName: string | null = null;
  if (data.agent) {
    agentId = data.agent.agentID || data.agent.id || null;
    agentName = data.agent.agentName || data.agent.agent || data.agent.description || null;
  } else if (!data.userType && data.agentID) {
    // the agent portal sign-in
    agentId = data.agentID;
    agentName = data.agentName || "Agent";
  }
  if (agentId) memory.set("agentId", String(agentId));
  else memory.delete("agentId");
  if (agentName) memory.set("agentName", String(agentName));
  else memory.delete("agentName");

  const { token: _t, accessToken: _a, claims: _c, ...rest } = data;
  const user = !data.userType && data.agentID ? { ...rest, agentCode: data.agentID } : rest;
  memory.set("unEncryptedUser", JSON.stringify(user));
  if (SET_USER_KEY) memory.set("user", encryptData(user));
};

let serviceToken: { value: string; until: number } | null = null;
let ending: Promise<void> | null = null;
/** Signs out: forgets the session here and has the API remove the cookie. */
export const endSession = (): Promise<void> => {
  const hadSession = memory.has("token");
  memory.clear();
  expiresAt = 0;
  realToken = null;
  serviceToken = null;
  if (!hadSession) return Promise.resolve();
  ending = nativeFetch(`${apiBase()}/Auth/logout`, { method: "POST", credentials: "include", keepalive: true })
    .then(() => undefined)
    .catch(() => undefined);
  return ending;
};

/** On start-up (and reload): asks the API who the cookie belongs to. Nothing is stored. */
export const bootstrapSession = async (): Promise<void> => {
  if (USE_TOKEN_MODE) {
    try {
      const saved = JSON.parse(nativeGet.call(window.sessionStorage, "dev_session") || "null");
      if (saved?.token && Date.now() < new Date(saved.expiresAt || 0).getTime()) applyLogin(saved);
    } catch {
      /* none */
    }
    return;
  }
  try {
    const response = await nativeFetch(`${apiBase()}/Auth/me`, { credentials: "include", headers: { Accept: "application/json" } });
    if (!response.ok) return;
    applyLogin(await response.json());
  } catch {
    /* offline or not signed in: the sign-in page takes over */
  }
};

const rememberDevSession = (data: any) => {
  if (!USE_TOKEN_MODE || !data) return;
  try {
    nativeSet.call(window.sessionStorage, "dev_session", JSON.stringify(data));
  } catch {
    /* ignore */
  }
};

// ── a short token for other company services that cannot see the cookie ─────
const getServiceToken = async (): Promise<string | null> => {
  if (realToken) return realToken;
  if (serviceToken && Date.now() < serviceToken.until) return serviceToken.value;
  try {
    const r = await nativeFetch(`${apiBase()}/Auth/service-token`, { method: "POST", credentials: "include" });
    if (!r.ok) return null;
    const { token, expiresIn } = await r.json();
    serviceToken = { value: token, until: Date.now() + Math.max(0, (expiresIn || 120) - 20) * 1000 };
    return token;
  } catch {
    return null;
  }
};

// ── requests ────────────────────────────────────────────────────────────────
const sameApi = (url: string) => originOf(url) === originOf(apiBase());
const isCompanyApi = (url: string): boolean => {
  try {
    const abs = new URL(url, window.location.href);
    if (abs.origin === window.location.origin) return false; // our own static files
    if (abs.hostname === "newgibsonline.com" || abs.hostname.endsWith(".newgibsonline.com")) return true;
    return sameApi(url);
  } catch {
    return false;
  }
};
const isLoginUrl = (url: string) => {
  try {
    return /\/(auth\/login|agents\/agent\/authenticate)$/i.test(new URL(url, window.location.href).pathname);
  } catch {
    return false;
  }
};
// "no usable token": nothing, the stand-in, or a leftover "null"/"undefined" from a screen with no session
const isPlaceholder = (value: string | null | undefined) => {
  if (!value) return true;
  const raw = value.replace(/^Bearer\s+/i, "").trim();
  return raw === "null" || raw === "undefined" || raw === "" || raw === "[object Object]" || isStandIn(raw) || !raw.includes(".");
};

window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  let login = false;
  try {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url;
    if (isCompanyApi(url)) {
      const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
      if (isPlaceholder(headers.get("Authorization"))) {
        headers.delete("Authorization");
        if (hasValidSession()) {
          if (!sameApi(url)) {
            const t = await getServiceToken();
            if (t) headers.set("Authorization", `Bearer ${t}`);
          } else if (realToken) {
            headers.set("Authorization", `Bearer ${realToken}`);
          }
        }
      }
      if (USE_TOKEN_MODE && isLoginUrl(url)) {
        headers.set("X-Session-Mode", "token");
        login = true;
      }
      init = { ...init, headers, ...(sameApi(url) && !USE_TOKEN_MODE ? { credentials: "include" as RequestCredentials } : {}) };
    }
  } catch {
    /* never block a request over this */
  }
  const response = await nativeFetch(input as any, init);
  if (login && response.ok) response.clone().json().then(rememberDevSession).catch(() => {});
  return response;
};

axios.interceptors.request.use(async (config) => {
  try {
    const target = new URL(config.url || "", config.baseURL || window.location.href).href;
    if (isCompanyApi(target)) {
      if (isPlaceholder(config.headers?.Authorization as string | undefined)) {
        delete config.headers.Authorization;
        if (hasValidSession()) {
          if (!sameApi(target)) {
            const t = await getServiceToken();
            if (t) config.headers.Authorization = `Bearer ${t}`;
          } else if (realToken) {
            config.headers.Authorization = `Bearer ${realToken}`;
          }
        }
      }
      if (USE_TOKEN_MODE && isLoginUrl(target)) config.headers["X-Session-Mode"] = "token";
      if (sameApi(target) && !USE_TOKEN_MODE) config.withCredentials = true;
    }
  } catch {
    /* never block a request over this */
  }
  return config;
});
axios.interceptors.response.use((response) => {
  if (USE_TOKEN_MODE && isLoginUrl(response.config?.url || "")) rememberDevSession(response.data);
  return response;
});
