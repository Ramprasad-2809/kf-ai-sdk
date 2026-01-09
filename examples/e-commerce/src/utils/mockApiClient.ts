import { setApiBaseUrl, setDefaultHeaders } from "kf-ai-sdk";

export function initializeMockApi() {
  // Base URL empty - Vite proxy forwards /api/* to backend
  setApiBaseUrl("");

  // Set default headers - user context will be set by App.tsx after identity fetch
  setDefaultHeaders({
    "Content-Type": "application/json",
  });
}
