// ============================================================
// API Client - Simple CRUD Operations
// ============================================================

// Re-export types from app layer for consistency
export type {
  SortDirection,
  SortOption,
  Sort,
  Filter,
  ListOptions,
  ListResponse,
} from "../app/types/common";

/**
 * API client interface for a specific resource
 */
export interface ResourceClient<T = any> {
  /** Get single record by ID */
  get(id: string): Promise<T>;
  
  /** Create new record */
  create(data: Partial<T>): Promise<T>;
  
  /** Update existing record */
  update(id: string, data: Partial<T>): Promise<T>;
  
  /** Delete record by ID */
  delete(id: string): Promise<void>;
  
  /** List records with optional pagination and sorting */
  list(options?: ListOptions): Promise<ListResponse<T>>;
}

/**
 * Configuration options for the API client
 */
interface ApiConfig {
  baseUrl?: string;
  headers?: Record<string, string>;
}

/**
 * Global API configuration
 */
let apiConfig: ApiConfig = {
  baseUrl: process.env.API_BASE_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
};

/**
 * Set the base URL for all API requests
 */
export function setApiBaseUrl(baseUrl: string): void {
  apiConfig.baseUrl = baseUrl;
}

/**
 * Set default headers for all requests
 */
export function setDefaultHeaders(headers: Record<string, string>): void {
  apiConfig.headers = { ...apiConfig.headers, ...headers };
}

/**
 * Create a resource client for the specified resource type
 * @param resource - Resource name (e.g., "users", "products", "orders")
 * @returns Resource client with CRUD operations
 */
export function api<T = any>(resource: string): ResourceClient<T> {
  const baseUrl = apiConfig.baseUrl;
  const defaultHeaders = apiConfig.headers;

  return {
    async get(id: string): Promise<T> {
      const response = await fetch(`${baseUrl}/${resource}/${id}`, {
        method: "GET",
        headers: defaultHeaders,
      });

      if (!response.ok) {
        throw new Error(`Failed to get ${resource} ${id}: ${response.statusText}`);
      }

      return response.json();
    },

    async create(data: Partial<T>): Promise<T> {
      const response = await fetch(`${baseUrl}/${resource}`, {
        method: "POST",
        headers: defaultHeaders,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to create ${resource}: ${response.statusText}`);
      }

      return response.json();
    },

    async update(id: string, data: Partial<T>): Promise<T> {
      const response = await fetch(`${baseUrl}/${resource}/${id}`, {
        method: "PUT",
        headers: defaultHeaders,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to update ${resource} ${id}: ${response.statusText}`);
      }

      return response.json();
    },

    async delete(id: string): Promise<void> {
      const response = await fetch(`${baseUrl}/${resource}/${id}`, {
        method: "DELETE",
        headers: defaultHeaders,
      });

      if (!response.ok) {
        throw new Error(`Failed to delete ${resource} ${id}: ${response.statusText}`);
      }
    },

    async list(options?: ListOptions): Promise<ListResponse<T>> {
      const params = new URLSearchParams();
      
      if (options?.PageNumber) {
        params.append("PageNumber", options.PageNumber.toString());
      }
      
      if (options?.PageSize) {
        params.append("PageSize", options.PageSize.toString());
      }
      
      if (options?.q) {
        params.append("q", options.q);
      }
      
      if (options?.Sort) {
        params.append("Sort", JSON.stringify(options.Sort));
      }

      if (options?.Filter) {
        params.append("Filter", JSON.stringify(options.Filter));
      }

      const url = `${baseUrl}/${resource}${params.toString() ? `?${params}` : ""}`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: defaultHeaders,
      });

      if (!response.ok) {
        throw new Error(`Failed to list ${resource}: ${response.statusText}`);
      }

      return response.json();
    },
  };
}