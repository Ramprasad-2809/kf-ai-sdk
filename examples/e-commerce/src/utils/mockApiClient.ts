import { setApiBaseUrl, setDefaultHeaders } from "kf-ai-sdk";

export function initializeMockApi() {
  setApiBaseUrl("/api");

  // Get initial role from localStorage or default to buyer
  const currentRole = localStorage.getItem("currentRole") || "Buyer";
  const userId = getRoleUserId(currentRole);

  setDefaultHeaders({
    "Content-Type": "application/json",
    "x-user-role": currentRole,
    "x-user-id": userId,
  });

  // Listen for role changes and update headers
  window.addEventListener("roleChanged", ((event: CustomEvent) => {
    const { role } = event.detail;
    const newUserId = getRoleUserId(role);

    localStorage.setItem("currentRole", role);
    setDefaultHeaders({
      "Content-Type": "application/json",
      "x-user-role": role,
      "x-user-id": newUserId,
    });

    console.log(`[API] Role changed to: ${role}, User ID: ${newUserId}`);
  }) as EventListener);
}

function getRoleUserId(role: string): string {
  switch (role) {
    case "Buyer":
      return "buyer_001";
    case "Seller":
      return "seller_001";
    case "Admin":
      return "admin_001";
    case "InventoryManager":
      return "inventory_001";
    case "WarehouseStaff":
      return "warehouse_001";
    default:
      return "buyer_001";
  }
}
