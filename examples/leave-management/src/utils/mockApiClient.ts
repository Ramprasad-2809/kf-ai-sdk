import { setApiBaseUrl, setDefaultHeaders } from "../../../../sdk";

// Initialize API client for leave management mock environment
export function initializeMockApi() {
  // Set base URL to match our Vite mock API
  setApiBaseUrl("/api/bo");

  // Set initial role header
  const currentRole = localStorage.getItem("currentRole") || "manager";
  setDefaultHeaders({
    "Content-Type": "application/json",
    "x-user-role": currentRole,
    "x-user-id": "user_001",
  });

  // Listen for role changes
  window.addEventListener("roleChanged", (event: any) => {
    const { role } = event.detail;
    localStorage.setItem("currentRole", role);

    setDefaultHeaders({
      "Content-Type": "application/json",
      "x-user-role": role,
      "x-user-id": "user_001",
    });

    console.log(`API client role changed to: ${role}`);
  });
}

// Transform API requests to match mock API format
export function transformApiRequest(
  bo_id: string,
  method: string,
  options?: any
) {
  const baseMapping: Record<string, string> = {
    "leave-request": "leave-request",
    "leave-balance": "leave-balance",
  };

  const mappedBo = baseMapping[bo_id] || bo_id;

  if (method === "list") {
    // Convert SDK list request to mock API format
    const queryParams = new URLSearchParams();

    if (options?.Page) queryParams.append("Page", String(options.Page));
    if (options?.PageSize)
      queryParams.append("PageSize", String(options.PageSize));

    return {
      endpoint: `/${mappedBo}/list`,
      method: "POST",
      body: options,
    };
  }

  if (method === "count") {
    return {
      endpoint: `/${mappedBo}/count`,
      method: "POST", 
      body: options,
    };
  }

  if (method === "read" && options?.id) {
    return {
      endpoint: `/${mappedBo}/${options.id}/read`,
      method: "GET",
    };
  }

  if (method === "create") {
    return {
      endpoint: `/${mappedBo}/create`,
      method: "POST",
      body: options,
    };
  }

  if (method === "update" && options?.id) {
    return {
      endpoint: `/${mappedBo}/${options.id}/update`,
      method: "POST",
      body: options,
    };
  }

  // Default passthrough
  return {
    endpoint: `/${mappedBo}`,
    method: method.toUpperCase(),
    body: options,
  };
}