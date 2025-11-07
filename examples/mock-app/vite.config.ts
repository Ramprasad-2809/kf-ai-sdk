import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { setupMockAPI } from "./mock-api/index.js";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "mock-api",
      configureServer(server) {
        setupMockAPI(server.middlewares);
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@sdk": path.resolve(__dirname, "../../sdk"),
      "@app": path.resolve(__dirname, "../../app"),
    },
  },
  server: {
    port: 3002,
  },
});
