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
  FileUploadRequestType,
  FileUploadResponseType,
  FileDownloadResponseType,
  AttachmentViewType,
} from "../types/common";

/**
 * API client interface for a specific Business Object
 */
export interface ResourceClientType<T = any> {
  // ============================================================
  // BASIC CRUD OPERATIONS
  // ============================================================

  /** Get single record by ID */
  get(id: string): Promise<T>;

  /** Create new record */
  create(
    data: Partial<T> & { _id?: string },
  ): Promise<CreateUpdateResponseType>;

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
    data: Partial<T> & { _id?: string },
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
   *
   * @template TResult - The type of data returned. Defaults to FetchFieldOptionType
   *   - For SelectField: FetchFieldOptionType[] (with Value/Label)
   *   - For ReferenceField: TRef[] (full entity objects)
   */
  fetchField<TResult = FetchFieldOptionType>(
    instanceId: string,
    fieldId: string,
  ): Promise<TResult[]>;

  // ============================================================
  // ATTACHMENT OPERATIONS
  // ============================================================

  /**
   * Get signed upload URLs for file attachments
   * POST /{bo_id}/{instance_id}/field/{field_id}/attachment/upload
   */
  getUploadUrl(
    instanceId: string,
    fieldId: string,
    files: FileUploadRequestType[],
  ): Promise<FileUploadResponseType[]>;

  /**
   * Get signed download URL for a single attachment
   * GET /{bo_id}/{instance_id}/field/{field_id}/attachment/{attachment_id}/read
   */
  getDownloadUrl(
    instanceId: string,
    fieldId: string,
    attachmentId: string,
    viewType?: AttachmentViewType,
  ): Promise<FileDownloadResponseType>;

  /**
   * Get signed download URLs for all attachments on a field
   * GET /{bo_id}/{instance_id}/field/{field_id}/attachment/read
   */
  getDownloadUrls(
    instanceId: string,
    fieldId: string,
    viewType?: AttachmentViewType,
  ): Promise<FileDownloadResponseType[]>;

  /**
   * Delete an attachment
   * DELETE /{bo_id}/{instance_id}/field/{field_id}/attachment/{attachment_id}/delete
   */
  deleteAttachment(
    instanceId: string,
    fieldId: string,
    attachmentId: string,
  ): Promise<void>;
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
 * Create a resource client for a given base path.
 * This is the shared implementation used by both `api()` and workflow owner methods.
 * @param basePath - URL path segment (e.g., "/api/app/user" or "/api/app/process/leave_bp/vendor_ado")
 * @returns Resource client with CRUD operations matching API spec
 */
export function createResourceClient<T = any>(
  basePath: string,
): ResourceClientType<T> {
  const baseUrl = apiConfig.baseUrl;

  return {
    async get(id: string): Promise<T> {
      const response = await fetch(`${baseUrl}${basePath}/${id}/read`, {
        method: "GET",
        headers: getDefaultHeaders(),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to get ${basePath} ${id}: ${response.statusText}`,
        );
      }

      const responseData: ReadResponseType<T> = await response.json();
      return responseData.Data;
    },

    async create(
      data: Partial<T> & { _id?: string },
    ): Promise<CreateUpdateResponseType> {
      const response = await fetch(`${baseUrl}${basePath}/create`, {
        method: "POST",
        headers: getDefaultHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to create ${basePath}: ${response.statusText}`);
      }

      return (await response.json()).Data;
    },

    async update(
      id: string,
      data: Partial<T>,
    ): Promise<CreateUpdateResponseType> {
      const response = await fetch(`${baseUrl}${basePath}/${id}/update`, {
        method: "POST",
        headers: getDefaultHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to update ${basePath} ${id}: ${response.statusText}`,
        );
      }

      return (await response.json()).Data;
    },

    async delete(id: string): Promise<DeleteResponseType> {
      const response = await fetch(`${baseUrl}${basePath}/${id}/delete`, {
        method: "DELETE",
        headers: getDefaultHeaders(),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to delete ${basePath} ${id}: ${response.statusText}`,
        );
      }

      return response.json();
    },

    async list(options?: ListOptionsType): Promise<ListResponseType<T>> {
      const requestBody: ListOptionsType = {
        Type: "List",
        ...options,
      };

      const response = await fetch(`${baseUrl}${basePath}/list`, {
        method: "POST",
        headers: getDefaultHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Failed to list ${basePath}: ${response.statusText}`);
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

      const response = await fetch(`${baseUrl}${basePath}/metric`, {
        method: "POST",
        headers: getDefaultHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Failed to count ${basePath}: ${response.statusText}`);
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
      const response = await fetch(`${baseUrl}${basePath}/draft`, {
        method: "POST",
        headers: getDefaultHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to create draft for ${basePath}: ${response.statusText}`,
        );
      }

      return response.json();
    },

    async draftUpdate(
      id: string,
      data: Partial<T>,
    ): Promise<CreateUpdateResponseType> {
      const response = await fetch(`${baseUrl}${basePath}/${id}/draft`, {
        method: "POST",
        headers: getDefaultHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to update draft for ${basePath} ${id}: ${response.statusText}`,
        );
      }

      return response.json();
    },

    async draftPatch(id: string, data: Partial<T>): Promise<DraftResponseType> {
      const response = await fetch(`${baseUrl}${basePath}/${id}/draft`, {
        method: "PATCH",
        headers: getDefaultHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to patch draft for ${basePath} ${id}: ${response.statusText}`,
        );
      }

      return response.json();
    },

    async draftInteraction(
      data: Partial<T> & { _id?: string },
    ): Promise<DraftResponseType & { _id: string }> {
      const response = await fetch(`${baseUrl}${basePath}/draft`, {
        method: "PATCH",
        headers: getDefaultHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to create interactive draft for ${basePath}: ${response.statusText}`,
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
      options: Omit<MetricOptionsType, "Type">,
    ): Promise<MetricResponseType> {
      const requestBody: MetricOptionsType = {
        Type: "Metric",
        ...options,
      };

      const response = await fetch(`${baseUrl}${basePath}/metric`, {
        method: "POST",
        headers: getDefaultHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to get metrics for ${basePath}: ${response.statusText}`,
        );
      }

      return response.json();
    },

    async pivot(
      options: Omit<PivotOptionsType, "Type">,
    ): Promise<PivotResponseType> {
      const requestBody: PivotOptionsType = {
        Type: "Pivot",
        ...options,
      };

      const response = await fetch(`${baseUrl}${basePath}/pivot`, {
        method: "POST",
        headers: getDefaultHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to get pivot data for ${basePath}: ${response.statusText}`,
        );
      }

      return response.json();
    },

    // ============================================================
    // METADATA OPERATIONS
    // ============================================================

    async fields(): Promise<FieldsResponseType> {
      const response = await fetch(`${baseUrl}${basePath}/fields`, {
        method: "GET",
        headers: getDefaultHeaders(),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to get fields for ${basePath}: ${response.statusText}`,
        );
      }

      return response.json();
    },

    async fetchField<TResult = FetchFieldOptionType>(
      instanceId: string,
      fieldId: string,
    ): Promise<TResult[]> {
      const response = await fetch(
        `${baseUrl}${basePath}/${instanceId}/field/${fieldId}/fetch`,
        {
          method: "GET",
          headers: getDefaultHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch field ${fieldId} for ${basePath}: ${response.statusText}`,
        );
      }

      const responseData: { Data: TResult[] } = await response.json();
      return responseData.Data;
    },

    // ============================================================
    // ATTACHMENT OPERATIONS
    // ============================================================

    async getUploadUrl(
      instanceId: string,
      fieldId: string,
      files: FileUploadRequestType[],
    ): Promise<FileUploadResponseType[]> {
      const response = await fetch(
        `${baseUrl}${basePath}/${instanceId}/field/${fieldId}/attachment/upload`,
        {
          method: "POST",
          headers: getDefaultHeaders(),
          body: JSON.stringify(files),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to get upload URL for ${basePath}/${fieldId}: ${response.statusText}`,
        );
      }

      const responseData: { Data: FileUploadResponseType[] } =
        await response.json();
      return responseData.Data;
    },

    async getDownloadUrl(
      instanceId: string,
      fieldId: string,
      attachmentId: string,
      viewType?: AttachmentViewType,
    ): Promise<FileDownloadResponseType> {
      let url = `${baseUrl}${basePath}/${instanceId}/field/${fieldId}/attachment/${attachmentId}/read`;
      if (viewType) url += `?view_type=${viewType}`;
      const response = await fetch(url, {
        method: "GET",
        headers: getDefaultHeaders(),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to get download URL for ${basePath}/${fieldId}/${attachmentId}: ${response.statusText}`,
        );
      }

      const responseData: { Data: FileDownloadResponseType } =
        await response.json();
      const downloadData = responseData.Data;
      // Normalize: runtime returns DownloadUrl, components expect URL
      if (downloadData && (downloadData as any).DownloadUrl && !(downloadData as any).URL) {
        (downloadData as any).URL = (downloadData as any).DownloadUrl;
      }
      return downloadData;
    },

    async getDownloadUrls(
      instanceId: string,
      fieldId: string,
      viewType?: AttachmentViewType,
    ): Promise<FileDownloadResponseType[]> {
      let url = `${baseUrl}${basePath}/${instanceId}/field/${fieldId}/attachment/read`;
      if (viewType) url += `?view_type=${viewType}`;
      const response = await fetch(url, {
        method: "GET",
        headers: getDefaultHeaders(),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to get download URLs for ${basePath}/${fieldId}: ${response.statusText}`,
        );
      }

      const responseData: { Data: FileDownloadResponseType[] } =
        await response.json();
      const downloadList = responseData.Data;
      // Normalize: runtime returns DownloadUrl, components expect URL
      if (Array.isArray(downloadList)) {
        downloadList.forEach((item) => {
          if (item && (item as any).DownloadUrl && !(item as any).URL) {
            (item as any).URL = (item as any).DownloadUrl;
          }
        });
      }
      return downloadList;
    },

    async deleteAttachment(
      instanceId: string,
      fieldId: string,
      attachmentId: string,
    ): Promise<void> {
      const response = await fetch(
        `${baseUrl}${basePath}/${instanceId}/field/${fieldId}/attachment/${attachmentId}/delete`,
        {
          method: "DELETE",
          headers: getDefaultHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to delete attachment ${attachmentId} for ${basePath}/${fieldId}: ${response.statusText}`,
        );
      }
    },
  };
}

/**
 * Create a resource client for the specified Business Object
 * @param bo_id - Business Object identifier (e.g., "user", "leave", "vendor")
 * @returns Resource client with CRUD operations matching API spec
 */
export function api<T = any>(bo_id: string): ResourceClientType<T> {
  return createResourceClient<T>(`/api/app/${bo_id}`);
}
