import { setApiBaseUrl, setDefaultHeaders } from "kf-ai-sdk";

export function initializeMockApi() {
  setApiBaseUrl("/api/bo");

  // Get initial role from localStorage or default to buyer
  const currentRole = localStorage.getItem("currentRole") || "buyer";
  const userId = currentRole === "buyer" ? "buyer_001" : "seller_001";

  setDefaultHeaders({
    "Content-Type": "application/json",
    "x-user-role": currentRole,
    "x-user-id": userId,
  });

  // Listen for role changes and update headers
  window.addEventListener("roleChanged", ((event: CustomEvent) => {
    const { role } = event.detail;
    const newUserId = role === "buyer" ? "buyer_001" : "seller_001";

    localStorage.setItem("currentRole", role);
    setDefaultHeaders({
      "Content-Type": "application/json",
      "x-user-role": role,
      "x-user-id": newUserId,
    });

    console.log(`[API] Role changed to: ${role}, User ID: ${newUserId}`);
  }) as EventListener);
}
