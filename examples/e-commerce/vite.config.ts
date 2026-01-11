import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { setupMockAPI } from "./mock-api/index.js";

export default defineConfig({
  plugins: [
    react(),
    // Mock API disabled - using external server at http://runtime1001.localhost:8085
    // {
    //   name: "mock-api",
    //   configureServer(server) {
    //     setupMockAPI(server.middlewares);
    //   },
    // },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@sdk": path.resolve(__dirname, "../../sdk"),
      "@app": path.resolve(__dirname, "../../app"),
      // Force all imports to use app's versions (fixes context sharing issues)
      "@tanstack/react-query": path.resolve(__dirname, "node_modules/@tanstack/react-query"),
      "react": path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
    dedupe: ["@tanstack/react-query", "react", "react-dom"],
  },
  server: {
    port: 3003,
    proxy: {
      "/api": {
        target: "http://runtime1001.localhost:8085",
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.setHeader("Cookie", "__USID=US_CjtU7R0ADc");
          });
        },
      },
    },
  },
});
