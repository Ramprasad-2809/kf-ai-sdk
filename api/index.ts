// ============================================================
// API Client - Simple CRUD Operations
// ============================================================

import type { 
  ListOptions, 
  ListResponse, 
  ReadResponse, 
  CreateUpdateResponse, 
  DeleteResponse,
  DateTimeEncoded,
  DateEncoded 
} from "../app/types/common";

// Re-export types from app layer for consistency
export type {
  SortDirection,
  SortOption,
  Sort,
  Filter,
  FilterCondition,
  FilterOperator,
  FilterRHSType,
  ListOptions,
  ListResponse,
  ReadResponse,
  CreateUpdateResponse,
  DeleteResponse,
  DateTimeEncoded,
  DateEncoded,
} from "../app/types/common";

/**
 * API client interface for a specific Business Object
 */
export interface ResourceClient<T = any> {
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
  baseUrl: process.env.API_BASE_URL || "http://localhost:3000/api/app",
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
 * Utility functions for datetime encoding/decoding
 */

/**
 * Encode a Date object to API datetime format
 */
export function encodeDatetime(date: Date): DateTimeEncoded {
  return { $__dt__: date.getTime() / 1000 };
}

/**
 * Decode API datetime format to Date object
 */
export function decodeDatetime(encoded: DateTimeEncoded): Date {
  return new Date(encoded.$__dt__ * 1000);
}

/**
 * Encode a Date object to API date format (YYYY-MM-DD)
 */
export function encodeDate(date: Date): DateEncoded {
  return { $__d__: date.toISOString().split('T')[0] };
}

/**
 * Decode API date format to Date object
 */
export function decodeDate(encoded: DateEncoded): Date {
  return new Date(encoded.$__d__);
}

/**
 * Recursively process an object to decode datetime fields
 */
function decodeResponseData<T>(data: any): T {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => decodeResponseData(item)) as T;
  }
  
  if (typeof data === 'object') {
    // Check for datetime encoding
    if ('$__dt__' in data) {
      return decodeDatetime(data as DateTimeEncoded) as T;
    }
    
    // Check for date encoding
    if ('$__d__' in data) {
      return decodeDate(data as DateEncoded) as T;
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
      const response = await fetch(`${baseUrl}/${bo_id}/${id}/read`, {
        method: "GET",
        headers: defaultHeaders,
      });

      if (!response.ok) {
        throw new Error(`Failed to get ${bo_id} ${id}: ${response.statusText}`);
      }

      const responseData: ReadResponse<T> = await response.json();
      return decodeResponseData<T>(responseData.Data);
    },

    async create(data: Partial<T> & { _id?: string }): Promise<CreateUpdateResponse> {
      const response = await fetch(`${baseUrl}/${bo_id}/create`, {
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
      const response = await fetch(`${baseUrl}/${bo_id}/${id}/update`, {
        method: "POST",
        headers: defaultHeaders,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to update ${bo_id} ${id}: ${response.statusText}`);
      }

      return response.json();
    },

    async delete(id: string): Promise<DeleteResponse> {
      const response = await fetch(`${baseUrl}/${bo_id}/${id}/delete`, {
        method: "DELETE",
        headers: defaultHeaders,
      });

      if (!response.ok) {
        throw new Error(`Failed to delete ${bo_id} ${id}: ${response.statusText}`);
      }

      return response.json();
    },

    async list(options?: ListOptions): Promise<ListResponse<T>> {
      const requestBody: ListOptions = {
        Type: "List",
        ...options,
      };
      
      const response = await fetch(`${baseUrl}/${bo_id}/list`, {
        method: "POST",
        headers: defaultHeaders,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Failed to list ${bo_id}: ${response.statusText}`);
      }

      const responseData: ListResponse<any> = await response.json();
      return {
        Data: responseData.Data.map(item => decodeResponseData<T>(item)),
      };
    },
  };
}