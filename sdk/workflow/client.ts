// ============================================================
// Workflow Client - Business Process / Activity Operations
// ============================================================

import {
  getApiBaseUrl,
  getDefaultHeaders,
} from "../api/client";
import type {
  ListOptionsType,
  ListResponseType,
  MetricOptionsType,
  MetricResponseType,
  ReadResponseType,
  DraftResponseType,
  CreateUpdateResponseType,
} from "../types/common";
import type {
  ActivityInstanceFieldsType,
  ActivityOperations,
  ActivityProgressType,
  WorkflowStartResponseType,
} from "./types";

/**
 * Workflow client for Business Process / Activity operations.
 *
 * @example
 * ```typescript
 * const wf = new Workflow<LeaveType>("SimpleLeaveProcess");
 *
 * // Start workflow
 * const { activityId, activityInstanceId } = await wf.start();
 *
 * // Get activity operations
 * const act = wf.activity("EMPLOYEE_INPUT");
 *
 * // Instance operations (instanceId as first param)
 * await act.read("inst_123");
 * await act.draftStart("inst_123", data);
 * await act.draftEnd("inst_123", data);
 * await act.complete("inst_123");
 *
 * // List operations
 * await act.list({ Page: 1, PageSize: 10 });
 * await act.metric({ Metric: [...] });
 * ```
 */
export class Workflow<T = any> {
  private bp_id: string;

  constructor(bp_id: string) {
    this.bp_id = bp_id;
  }

  /**
   * Start a new workflow instance
   */
  async start(): Promise<WorkflowStartResponseType> {
    const response = await fetch(
      `${getApiBaseUrl()}/api/app/process/${this.bp_id}/start`,
      {
        method: "POST",
        headers: getDefaultHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to start process: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get all operations for a specific activity
   * @param activity_id - Activity identifier
   */
  activity(activity_id: string): ActivityOperations<T> {
    const base = `/api/app/process/${this.bp_id}/${activity_id}`;

    return {
      // ── List-level ────────────────────────────────────────────

      async list(options?: ListOptionsType): Promise<ListResponseType<ActivityInstanceFieldsType & T>> {
        const requestBody: ListOptionsType = {
          Type: "List",
          ...options,
        };

        const response = await fetch(`${getApiBaseUrl()}${base}/list`, {
          method: "POST",
          headers: getDefaultHeaders(),
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`Failed to list activities: ${response.statusText}`);
        }

        return response.json();
      },

      async metric(options: Omit<MetricOptionsType, "Type">): Promise<MetricResponseType> {
        const requestBody: MetricOptionsType = {
          Type: "Metric",
          ...options,
        };

        const response = await fetch(`${getApiBaseUrl()}${base}/metric`, {
          method: "POST",
          headers: getDefaultHeaders(),
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`Failed to get activity metrics: ${response.statusText}`);
        }

        return response.json();
      },

      // ── Instance-level ────────────────────────────────────────

      async read(instanceId: string): Promise<ActivityInstanceFieldsType & T> {
        const response = await fetch(`${getApiBaseUrl()}${base}/${instanceId}/read`, {
          method: "GET",
          headers: getDefaultHeaders(),
        });

        if (!response.ok) {
          throw new Error(`Failed to read activity: ${response.statusText}`);
        }

        const responseData: ReadResponseType<ActivityInstanceFieldsType & T> = await response.json();
        return responseData.Data;
      },

      async update(instanceId: string, data: Partial<T>): Promise<CreateUpdateResponseType> {
        const response = await fetch(`${getApiBaseUrl()}${base}/${instanceId}/update`, {
          method: "POST",
          headers: getDefaultHeaders(),
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`Failed to update activity: ${response.statusText}`);
        }

        return response.json();
      },

      async draftStart(instanceId: string, data: Partial<T>): Promise<DraftResponseType> {
        const response = await fetch(`${getApiBaseUrl()}${base}/${instanceId}/draft`, {
          method: "PATCH",
          headers: getDefaultHeaders(),
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`Failed to start draft: ${response.statusText}`);
        }

        return response.json();
      },

      async draftEnd(instanceId: string, data: Partial<T>): Promise<CreateUpdateResponseType> {
        const response = await fetch(`${getApiBaseUrl()}${base}/${instanceId}/draft`, {
          method: "POST",
          headers: getDefaultHeaders(),
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`Failed to end draft: ${response.statusText}`);
        }

        return response.json();
      },

      async complete(instanceId: string): Promise<CreateUpdateResponseType> {
        const response = await fetch(`${getApiBaseUrl()}${base}/${instanceId}/done`, {
          method: "POST",
          headers: getDefaultHeaders(),
        });

        if (!response.ok) {
          throw new Error(`Failed to complete activity: ${response.statusText}`);
        }

        return response.json();
      },

      async progress(instanceId: string): Promise<ActivityProgressType> {
        const response = await fetch(`${getApiBaseUrl()}${base}/${instanceId}/progress`, {
          method: "GET",
          headers: getDefaultHeaders(),
        });

        if (!response.ok) {
          throw new Error(`Failed to get activity progress: ${response.statusText}`);
        }

        return response.json();
      },
    };
  }
}
