//@ts-ignore
import { defineConfig } from "vite";
//@ts-ignore
import react from "@vitejs/plugin-react";
//@ts-ignore
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";
import path from "node:path";

export default defineConfig({
  // Keep Vite's cache in a writable temp location instead of a user-specific
  // Dropbox path so dependency optimization can create temp folders safely.
  cacheDir: path.join("C:/tmp", "vite-cache", "Gibslife-technical"),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
