import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The dev server proxies /api requests to the backend so the frontend
// can just call fetch("/api/drones") without hardcoding a port number.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
});
