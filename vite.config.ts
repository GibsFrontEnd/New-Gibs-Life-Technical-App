//@ts-ignore
import { defineConfig } from "vite";
//@ts-ignore
import react from "@vitejs/plugin-react";
//@ts-ignore
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
