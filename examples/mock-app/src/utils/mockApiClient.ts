import { setApiBaseUrl, setDefaultHeaders } from "kf-ai-sdk";

// Initialize API client for mock environment
export function initializeMockApi() {
  // Set base URL to match our Vite mock API
  setApiBaseUrl("");

  // Set initial role header
  const currentRole = localStorage.getItem("currentRole") || "admin";
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
    product: "product",
    order: "order",
    user: "user",
  };

  const mappedBo = baseMapping[bo_id] || bo_id;

  if (method === "list") {
    // Convert SDK list request to mock API format
    const queryParams = new URLSearchParams();

    if (options?.Page) queryParams.append("Page", String(options.Page));
    if (options?.PageSize)
      queryParams.append("PageSize", String(options.PageSize));
    if (options?.Sort) queryParams.append("Sort", JSON.stringify(options.Sort));
    if (options?.Filter)
      queryParams.append("Filter", JSON.stringify(options.Filter));
    if (options?.Search) queryParams.append("Search", String(options.Search));

    const queryString = queryParams.toString();
    return `${mappedBo}/list${queryString ? "?" + queryString : ""}`;
  }

  if (method === "count") {
    // Convert SDK count request to mock API format
    const queryParams = new URLSearchParams();

    if (options?.Sort) queryParams.append("Sort", JSON.stringify(options.Sort));
    if (options?.Filter)
      queryParams.append("Filter", JSON.stringify(options.Filter));
    if (options?.Search) queryParams.append("Search", String(options.Search));

    const queryString = queryParams.toString();
    return `${mappedBo}/count${queryString ? "?" + queryString : ""}`;
  }

  return `${mappedBo}/${method}`;
}
