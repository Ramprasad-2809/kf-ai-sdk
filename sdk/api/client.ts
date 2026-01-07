// ============================================================
// API Client - Simple CRUD Operations
// ============================================================

import type {
  ListOptions,
  ListResponse,
  ReadResponse,
  CreateUpdateResponse,
  DeleteResponse,
  CountResponse,
  DateTimeEncoded,
  DateEncoded,
  MetricOptions,
  MetricResponse,
  PivotOptions,
  PivotResponse,
  DraftResponse,
  FieldsResponse,
} from "../types/common";

/**
 * API client interface for a specific Business Object
 */
export interface ResourceClient<T = any> {
  // ============================================================
  // BASIC CRUD OPERATIONS
  // ============================================================

  /** Get single record by ID */
  get(id: string): Promise<T>;

  /** Create new record */
  create(data: Partial<T> & { _id?: string }): Promise<CreateUpdateResponse>;

  /** Update existing record */
  update(id: string, data: Partial<T>): Promise<CreateUpdateResponse>;

  /** Delete record by ID */
  delete(id: string): Promise<DeleteResponse>;

  /** List records with optional filtering, sorting, and pagination */
  list(options?: ListOptions): Promise<ListResponse<T>>;

  /** Get count of records matching the same criteria as list */
  count(options?: ListOptions): Promise<CountResponse>;

  // ============================================================
  // DRAFT/INTERACTIVE OPERATIONS
  // ============================================================

  /**
   * Create draft - compute fields without persisting
   * POST /{bo_id}/draft
   */
  draft(data: Partial<T>): Promise<DraftResponse>;

  /**
   * Update draft (commit) - compute and prepare for update
   * POST /{bo_id}/{instance_id}/draft
   */
  draftUpdate(id: string, data: Partial<T>): Promise<CreateUpdateResponse>;

  /**
   * Update draft (patch) - compute fields during editing
   * PATCH /{bo_id}/{instance_id}/draft
   */
  draftPatch(id: string, data: Partial<T>): Promise<DraftResponse>;

  // ============================================================
  // QUERY OPERATIONS
  // ============================================================

  /**
   * Get aggregated metrics grouped by dimensions
   * POST /{bo_id}/metric
   */
  metric(options: Omit<MetricOptions, "Type">): Promise<MetricResponse>;

  /**
   * Get pivot table data
   * POST /{bo_id}/pivot
   */
  pivot(options: Omit<PivotOptions, "Type">): Promise<PivotResponse>;

  // ============================================================
  // METADATA OPERATIONS
  // ============================================================

  /**
   * Get field definitions for this Business Object
   * GET /{bo_id}/fields
   */
  fields(): Promise<FieldsResponse>;

  /**
   * Fetch reference data for a specific field (for lookup and dropdown fields)
   * GET /{bo_id}/{instance_id}/field/{field_id}/fetch
   */
  fetchField(instanceId: string, fieldId: string): Promise<any>;
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
  baseUrl: "",
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
 * Get current default headers
 */
export function getDefaultHeaders(): Record<string, string> {
  return { ...apiConfig.headers };
}

/**
 * Get current base URL
 */
export function getApiBaseUrl(): string {
  return apiConfig.baseUrl || "";
}

/**
 * Recursively process an object to decode datetime fields
 */
function decodeResponseData<T>(data: any): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => decodeResponseData(item)) as T;
  }

  if (typeof data === "object") {
    // Check for datetime encoding
    if ("$__dt__" in data) {
      return new Date((data as DateTimeEncoded).$__dt__ * 1000) as T;
    }

    // Check for date encoding
    if ("$__d__" in data) {
      return new Date((data as DateEncoded).$__d__) as T;
    }

    // Recursively process object properties
    const result: any = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = decodeResponseData(value);
    }
    return result as T;
  }

  return data as T;
}

/**
 * Create a resource client for the specified Business Object
 * @param bo_id - Business Object identifier (e.g., "user", "leave", "vendor")
 * @returns Resource client with CRUD operations matching API spec
 */
export function api<T = any>(bo_id: string): ResourceClient<T> {
  const baseUrl = apiConfig.baseUrl;
  const defaultHeaders = apiConfig.headers;

  return {
    async get(id: string): Promise<T> {
      const response = await fetch(`${baseUrl}/api/app/${bo_id}/${id}/read`, {
        method: "GET",
        headers: defaultHeaders,
      });

      if (!response.ok) {
        throw new Error(`Failed to get ${bo_id} ${id}: ${response.statusText}`);
      }

      const responseData: ReadResponse<T> = await response.json();
      return decodeResponseData<T>(responseData.Data);
    },

    async create(
      data: Partial<T> & { _id?: string }
    ): Promise<CreateUpdateResponse> {
      const response = await fetch(`${baseUrl}/api/app/${bo_id}/create`, {
        method: "POST",
        headers: defaultHeaders,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to create ${bo_id}: ${response.statusText}`);
      }

      return response.json();
    },

    async update(id: string, data: Partial<T>): Promise<CreateUpdateResponse> {
      const response = await fetch(`${baseUrl}/api/app/${bo_id}/${id}/update`, {
        method: "POST",
        headers: defaultHeaders,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to update ${bo_id} ${id}: ${response.statusText}`
        );
      }

      return response.json();
    },

    async delete(id: string): Promise<DeleteResponse> {
      const response = await fetch(`${baseUrl}/api/app/${bo_id}/${id}/delete`, {
        method: "DELETE",
        headers: defaultHeaders,
      });

      if (!response.ok) {
        throw new Error(
          `Failed to delete ${bo_id} ${id}: ${response.statusText}`
        );
      }

      return response.json();
    },

    async list(options?: ListOptions): Promise<ListResponse<T>> {
      const requestBody: ListOptions = {
        Type: "List",
        ...options,
      };

      const response = await fetch(`${baseUrl}/api/app/${bo_id}/list`, {
        method: "POST",
        headers: defaultHeaders,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Failed to list ${bo_id}: ${response.statusText}`);
      }

      const responseData: ListResponse<any> = await response.json();
      return {
        Data: responseData.Data.map((item) => decodeResponseData<T>(item)),
      };
    },

    async count(options?: ListOptions): Promise<CountResponse> {
      // Note: Count uses metric endpoint with Count aggregation
      const requestBody = {
        Type: "Metric",
        GroupBy: [],
        Metric: [{ Field: "_id", Type: "Count" }],
        ...(options?.Filter && { Filter: options.Filter }),
      };

      const response = await fetch(`${baseUrl}/api/app/${bo_id}/metric`, {
        method: "POST",
        headers: defaultHeaders,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Failed to count ${bo_id}: ${response.statusText}`);
      }

      const result = await response.json();
      // Extract count from metric response
      const count = result.Data?.[0]?.count__id ?? 0;
      return { Count: count };
    },

    // ============================================================
    // DRAFT/INTERACTIVE OPERATIONS
    // ============================================================

    async draft(data: Partial<T>): Promise<DraftResponse> {
      const response = await fetch(`${baseUrl}/api/app/${bo_id}/draft`, {
        method: "POST",
        headers: defaultHeaders,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to create draft for ${bo_id}: ${response.statusText}`
        );
      }

      return response.json();
    },

    async draftUpdate(
      id: string,
      data: Partial<T>
    ): Promise<CreateUpdateResponse> {
      const response = await fetch(`${baseUrl}/api/app/${bo_id}/${id}/draft`, {
        method: "POST",
        headers: defaultHeaders,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to update draft for ${bo_id} ${id}: ${response.statusText}`
        );
      }

      return response.json();
    },

    async draftPatch(id: string, data: Partial<T>): Promise<DraftResponse> {
      const response = await fetch(`${baseUrl}/api/app/${bo_id}/${id}/draft`, {
        method: "PATCH",
        headers: defaultHeaders,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to patch draft for ${bo_id} ${id}: ${response.statusText}`
        );
      }

      return response.json();
    },

    // ============================================================
    // QUERY OPERATIONS
    // ============================================================

    async metric(
      options: Omit<MetricOptions, "Type">
    ): Promise<MetricResponse> {
      const requestBody: MetricOptions = {
        Type: "Metric",
        ...options,
      };

      const response = await fetch(`${baseUrl}/api/app/${bo_id}/metric`, {
        method: "POST",
        headers: defaultHeaders,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to get metrics for ${bo_id}: ${response.statusText}`
        );
      }

      return response.json();
    },

    async pivot(options: Omit<PivotOptions, "Type">): Promise<PivotResponse> {
      const requestBody: PivotOptions = {
        Type: "Pivot",
        ...options,
      };

      const response = await fetch(`${baseUrl}/api/app/${bo_id}/pivot`, {
        method: "POST",
        headers: defaultHeaders,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to get pivot data for ${bo_id}: ${response.statusText}`
        );
      }

      return response.json();
    },

    // ============================================================
    // METADATA OPERATIONS
    // ============================================================

    async fields(): Promise<FieldsResponse> {
      const response = await fetch(`${baseUrl}/api/app/${bo_id}/fields`, {
        method: "GET",
        headers: defaultHeaders,
      });

      if (!response.ok) {
        throw new Error(
          `Failed to get fields for ${bo_id}: ${response.statusText}`
        );
      }

      return response.json();
    },

    async fetchField(instanceId: string, fieldId: string): Promise<any> {
      const response = await fetch(
        `${baseUrl}/api/app/${bo_id}/${instanceId}/field/${fieldId}/fetch`,
        {
          method: "GET",
          headers: defaultHeaders,
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch field ${fieldId} for ${bo_id}: ${response.statusText}`
        );
      }

      return response.json();
    },
  };
}
