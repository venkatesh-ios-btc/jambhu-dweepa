import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(() => ({
  server: {
    // 127.0.0.1 avoids macOS services answering on [::1] (same AirTunes 403 as with localhost).
    host: "127.0.0.1",
    // Avoid 8080 — AirPlay/AirTunes often uses it.
    port: 5173,
    // If 5173 is still taken (e.g. old Vite), use the next free port instead of failing.
    strictPort: false,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5050",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));