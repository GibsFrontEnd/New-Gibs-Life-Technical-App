import axios from "axios";
import { SERVER_URL } from "./constants";

/**
 * Policy numbers use the legacy GIBS format (e.g. GOTB/26/00941/HO) and are placed in URL
 * paths. IIS rejects/mangles an encoded slash (%2F) in a path, so every %2F in the path part
 * of an API URL is swapped for a token. The API turns the token back into "/" on route values
 * (see SlashTokenRouteValuesMiddleware). Query strings are left alone.
 */
export const SLASH_TOKEN = "~S~";

const isApiUrl = (url: string) => !/^https?:\/\//i.test(url) || (!!SERVER_URL && url.startsWith(SERVER_URL));

export const slashSafe = (url: string): string => {
  if (!url || !isApiUrl(url)) return url;
  const cut = url.search(/[?#]/);
  const path = cut === -1 ? url : url.slice(0, cut);
  const rest = cut === -1 ? "" : url.slice(cut);
  return path.replace(/%2f/gi, SLASH_TOKEN) + rest;
};

const addInterceptor = (instance: any) => {
  instance.interceptors.request.use((config: any) => {
    if (typeof config.url === "string") config.url = slashSafe(config.url);
    return config;
  });
  return instance;
};

// Cover the default axios instance and every instance created later (axios.create)
const originalCreate = axios.create.bind(axios);
(axios as any).create = (...args: any[]) => addInterceptor((originalCreate as any)(...args));
addInterceptor(axios);

// Cover plain fetch calls
const originalFetch = window.fetch.bind(window);
window.fetch = ((input: any, init?: any) =>
  originalFetch(typeof input === "string" ? slashSafe(input) : input, init)) as typeof window.fetch;
