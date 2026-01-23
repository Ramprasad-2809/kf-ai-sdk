// ============================================================
// API Client - Simple CRUD Operations
// ============================================================

import type {
  ListOptionsType,
  ListResponseType,
  ReadResponseType,
  CreateUpdateResponseType,
  DeleteResponseType,
  CountResponseType,
  MetricOptionsType,
  MetricResponseType,
  PivotOptionsType,
  PivotResponseType,
  DraftResponseType,
  FieldsResponseType,
  FetchFieldOptionType,
  FetchFieldResponseType,
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
  create(data: Partial<T> & { _id?: string }): Promise<CreateUpdateResponseType>;

  /** Update existing record */
  update(id: string, data: Partial<T>): Promise<CreateUpdateResponseType>;

  /** Delete record by ID */
  delete(id: string): Promise<DeleteResponseType>;

  /** List records with optional filtering, sorting, and pagination */
  list(options?: ListOptionsType): Promise<ListResponseType<T>>;

  /** Get count of records matching the same criteria as list */
  count(options?: ListOptionsType): Promise<CountResponseType>;

  // ============================================================
  // DRAFT/INTERACTIVE OPERATIONS
  // ============================================================

  /**
   * Create draft - compute fields without persisting
   * POST /{bo_id}/draft
   */
  draft(data: Partial<T>): Promise<DraftResponseType>;

  /**
   * Update draft (commit) - compute and prepare for update
   * POST /{bo_id}/{instance_id}/draft
   */
  draftUpdate(id: string, data: Partial<T>): Promise<CreateUpdateResponseType>;

  /**
   * Update draft (patch) - compute fields during editing
   * PATCH /{bo_id}/{instance_id}/draft
   */
  draftPatch(id: string, data: Partial<T>): Promise<DraftResponseType>;

  /**
   * Interactive draft - create/update draft without instance ID
   * PATCH /{bo_id}/draft
   * Used in interactive mode for create operations
   */
  draftInteraction(
    data: Partial<T> & { _id?: string }
  ): Promise<DraftResponseType & { _id: string }>;

  // ============================================================
  // QUERY OPERATIONS
  // ============================================================

  /**
   * Get aggregated metrics grouped by dimensions
   * POST /{bo_id}/metric
   */
  metric(options: Omit<MetricOptionsType, "Type">): Promise<MetricResponseType>;

  /**
   * Get pivot table data
   * POST /{bo_id}/pivot
   */
  pivot(options: Omit<PivotOptionsType, "Type">): Promise<PivotResponseType>;

  // ============================================================
  // METADATA OPERATIONS
  // ============================================================

  /**
   * Get field definitions for this Business Object
   * GET /{bo_id}/fields
   */
  fields(): Promise<FieldsResponseType>;

  /**
   * Fetch reference data for a specific field (for lookup and dropdown fields)
   * GET /{bo_id}/{instance_id}/field/{field_id}/fetch
   */
  fetchField(instanceId: string, fieldId: string): Promise<FetchFieldOptionType[]>;
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

      const responseData: ReadResponseType<T> = await response.json();
      return responseData.Data;
    },

    async create(
      data: Partial<T> & { _id?: string }
    ): Promise<CreateUpdateResponseType> {
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

    async update(id: string, data: Partial<T>): Promise<CreateUpdateResponseType> {
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

    async delete(id: string): Promise<DeleteResponseType> {
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

    async list(options?: ListOptionsType): Promise<ListResponseType<T>> {
      const requestBody: ListOptionsType = {
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

      const responseData: ListResponseType<T> = await response.json();
      return responseData;
    },

    async count(options?: ListOptionsType): Promise<CountResponseType> {
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

    async draft(data: Partial<T>): Promise<DraftResponseType> {
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
    ): Promise<CreateUpdateResponseType> {
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

    async draftPatch(id: string, data: Partial<T>): Promise<DraftResponseType> {
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

    async draftInteraction(
      data: Partial<T> & { _id?: string }
    ): Promise<DraftResponseType & { _id: string }> {
      const response = await fetch(`${baseUrl}/api/app/${bo_id}/draft`, {
        method: "PATCH",
        headers: defaultHeaders,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to create interactive draft for ${bo_id}: ${response.statusText}`
        );
      }

      const json = await response.json();
      // API returns {"Data":{"_id":"..."},"ValidationFailures":[]}
      // Extract _id from Data wrapper and return flat structure
      return {
        ...json.Data,
        _id: json.Data._id,
      };
    },

    // ============================================================
    // QUERY OPERATIONS
    // ============================================================

    async metric(
      options: Omit<MetricOptionsType, "Type">
    ): Promise<MetricResponseType> {
      const requestBody: MetricOptionsType = {
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

    async pivot(options: Omit<PivotOptionsType, "Type">): Promise<PivotResponseType> {
      const requestBody: PivotOptionsType = {
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

    async fields(): Promise<FieldsResponseType> {
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

    async fetchField(
      instanceId: string,
      fieldId: string
    ): Promise<FetchFieldOptionType[]> {
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

      const responseData: FetchFieldResponseType = await response.json();
      return responseData.Data;
    },
  };
}
