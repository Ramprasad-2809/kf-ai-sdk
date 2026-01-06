// ============================================================
// METADATA API CLIENT
// ============================================================
// Handles metadata/schema fetching operations for Business Objects

import type { ListOptions, ListResponse } from "../types/common";
import { getApiBaseUrl, getDefaultHeaders } from "./client";

// ============================================================
// METADATA API OPERATIONS
// ============================================================

/**
 * BDO Schema Structure (Business Object Metadata)
 */
export interface BackendSchema {
  [fieldName: string]: any;
}

/**
 * Get BDO schema/metadata by ID
 *
 * Endpoint: GET /api/app/metadata/{meta_id}/read
 *
 * @param metaId - The Business Object metadata ID (e.g., "Product", "Order")
 * @returns Promise resolving to the BDO schema
 *
 * @example
 * ```typescript
 * const schema = await getBdoSchema("Product");
 * console.log(schema.Fields); // Access field definitions
 * ```
 */
export async function getBdoSchema(metaId: string): Promise<BackendSchema> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getDefaultHeaders();

    const response = await fetch(`${baseUrl}/api/app/metadata/${metaId}/read`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch schema for ${metaId}: ${response.statusText}`
      );
    }

    const bdoSchema = await response.json();

    // Validate that response is a valid BDO schema object
    if (!bdoSchema || typeof bdoSchema !== "object") {
      throw new Error(`Invalid BDO schema response for ${metaId}`);
    }

    return bdoSchema as BackendSchema;
  } catch (error) {
    console.error(`Schema fetch error for ${metaId}:`, error);
    throw new Error(
      `Failed to load BDO schema: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Metadata item structure
 */
export interface MetadataItem {
  _id: string;
  Name: string;
  Kind: string;
  Description?: string;
  [key: string]: any;
}

/**
 * List all metadata items with optional filtering and pagination
 *
 * Endpoint: GET or POST /api/app/metadata/list
 *
 * @param options - Optional list options (filters, sorting, pagination)
 * @returns Promise resolving to list of metadata items
 *
 * @example
 * ```typescript
 * // List all metadata
 * const all = await listMetadata();
 *
 * // List with filters
 * const businessObjects = await listMetadata({
 *   Filter: {
 *     Operator: "AND",
 *     Condition: [{ LhsField: "Kind", Operator: "eq", RhsValue: "BusinessObject" }]
 *   }
 * });
 * ```
 */
export async function listMetadata(
  options?: ListOptions
): Promise<ListResponse<MetadataItem>> {
  try {
    const baseUrl = getApiBaseUrl();
    const headers = getDefaultHeaders();

    // Use GET for simple requests, POST for complex filters
    const method = options?.Filter || options?.Sort ? "POST" : "GET";

    const response = await fetch(`${baseUrl}/api/app/metadata/list`, {
      method,
      headers,
      ...(method === "POST" &&
        options && {
          body: JSON.stringify(options),
        }),
    });

    if (!response.ok) {
      throw new Error(`Failed to list metadata: ${response.statusText}`);
    }

    const result = await response.json();

    return result as ListResponse<MetadataItem>;
  } catch (error) {
    console.error("Metadata list error:", error);
    throw new Error(
      `Failed to list metadata: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
