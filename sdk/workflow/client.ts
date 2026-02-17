// ============================================================
// Workflow Client - Business Process / Activity Operations
// ============================================================

import {
  getApiBaseUrl,
  getDefaultHeaders,
} from "../api/client";
import type {
  ListResponseType,
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
 * const { BPInstanceId, ActivityId, _id } = await wf.start();
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
 * // List operations (by status — filtering/pagination handled server-side)
 * await act.inProgressList();
 * await act.completedList();
 * await act.inProgressMetric();
 * await act.completedMetric();
 *
 * // Process progress (requires instance_id)
 * const progress = await wf.progress("bp_inst_123");
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

    const responseData = await response.json();
    return responseData.Data;
  }

  /**
   * Get progress for a specific process instance.
   * Returns a list of progress entries for each stage/activity.
   *
   * @param instance_id - The business process instance ID (from start().BPInstanceId)
   */
  async progress(instance_id: string): Promise<ActivityProgressType[]> {
    const response = await fetch(
      `${getApiBaseUrl()}/api/app/process/${this.bp_id}/${instance_id}/progress`,
      {
        method: "GET",
        headers: getDefaultHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get process progress: ${response.statusText}`);
    }

    const responseData = await response.json();
    return responseData.Data;
  }

  /**
   * Get all operations for a specific activity
   * @param activity_id - Activity identifier
   */
  activity(activity_id: string): ActivityOperations<T> {
    const base = `/api/app/process/${this.bp_id}/${activity_id}`;

    return {
      // ── List-level ────────────────────────────────────────────

      async inProgressList(): Promise<ListResponseType<ActivityInstanceFieldsType & T>> {
        const response = await fetch(`${getApiBaseUrl()}${base}/inprogress/list`, {
          method: "GET",
          headers: getDefaultHeaders(),
        });

        if (!response.ok) {
          throw new Error(`Failed to list in-progress activities: ${response.statusText}`);
        }

        return response.json();
      },

      async completedList(): Promise<ListResponseType<ActivityInstanceFieldsType & T>> {
        const response = await fetch(`${getApiBaseUrl()}${base}/completed/list`, {
          method: "GET",
          headers: getDefaultHeaders(),
        });

        if (!response.ok) {
          throw new Error(`Failed to list completed activities: ${response.statusText}`);
        }

        return response.json();
      },

      async inProgressMetric(): Promise<MetricResponseType> {
        const response = await fetch(`${getApiBaseUrl()}${base}/inprogress/metric`, {
          method: "GET",
          headers: getDefaultHeaders(),
        });

        if (!response.ok) {
          throw new Error(`Failed to get in-progress activity metrics: ${response.statusText}`);
        }

        return response.json();
      },

      async completedMetric(): Promise<MetricResponseType> {
        const response = await fetch(`${getApiBaseUrl()}${base}/completed/metric`, {
          method: "GET",
          headers: getDefaultHeaders(),
        });

        if (!response.ok) {
          throw new Error(`Failed to get completed activity metrics: ${response.statusText}`);
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

      async progress(instanceId: string): Promise<ActivityProgressType[]> {
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
