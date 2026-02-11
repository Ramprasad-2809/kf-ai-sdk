// ============================================================
// Workflow Client - Business Process / Activity Operations
// ============================================================

import {
  createResourceClient,
  getApiBaseUrl,
  getDefaultHeaders,
} from "../api/client";
import type { ResourceClient } from "../api/client";
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
  ActivityOperations,
  TaskOperations,
  ActivityProgressType,
} from "./types";

/**
 * Workflow client for Business Process / Activity operations.
 *
 * @example
 * ```typescript
 * const wf = new Workflow<LeaveType>("leave_bp");
 *
 * // Activity operations
 * const act = wf.activity("approve_task", "instance_123");
 * await act.read();
 * await act.complete();
 *
 * // Task listing
 * const t = wf.task("approve_task");
 * await t.listTasks({ Page: 1, PageSize: 10 });
 *
 * // Process operations
 * await wf.start(data);
 *
 * // BP Owner — ResourceClient for ADO access
 * wf.owner<VendorType>("vendor_ado").list();
 * ```
 */
export class Workflow<T = any> {
  private bp_id: string;

  constructor(bp_id: string) {
    this.bp_id = bp_id;
  }

  /**
   * Get activity operations for a specific task instance
   * @param task_id - Task identifier
   * @param task_instance_id - Task instance identifier
   */
  activity(task_id: string, task_instance_id: string): ActivityOperations<T> {
    const prefix = `/api/app/process/${this.bp_id}/${task_id}/${task_instance_id}`;

    return {
      async complete(): Promise<CreateUpdateResponseType> {
        const response = await fetch(`${getApiBaseUrl()}${prefix}/done`, {
          method: "POST",
          headers: getDefaultHeaders(),
        });

        if (!response.ok) {
          throw new Error(`Failed to complete activity: ${response.statusText}`);
        }

        return response.json();
      },

      async read(): Promise<T> {
        const response = await fetch(`${getApiBaseUrl()}${prefix}/read`, {
          method: "GET",
          headers: getDefaultHeaders(),
        });

        if (!response.ok) {
          throw new Error(`Failed to read activity: ${response.statusText}`);
        }

        const responseData: ReadResponseType<T> = await response.json();
        return responseData.Data;
      },

      async progress(): Promise<ActivityProgressType> {
        const response = await fetch(`${getApiBaseUrl()}${prefix}/progress`, {
          method: "GET",
          headers: getDefaultHeaders(),
        });

        if (!response.ok) {
          throw new Error(`Failed to get activity progress: ${response.statusText}`);
        }

        return response.json();
      },

      async update(data: Partial<T>): Promise<CreateUpdateResponseType> {
        const response = await fetch(`${getApiBaseUrl()}${prefix}/update`, {
          method: "POST",
          headers: getDefaultHeaders(),
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`Failed to update activity: ${response.statusText}`);
        }

        return response.json();
      },

      async draftStart(data: Partial<T>): Promise<DraftResponseType> {
        const response = await fetch(`${getApiBaseUrl()}${prefix}/draft`, {
          method: "PATCH",
          headers: getDefaultHeaders(),
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`Failed to start draft: ${response.statusText}`);
        }

        return response.json();
      },

      async draftEnd(data: Partial<T>): Promise<CreateUpdateResponseType> {
        const response = await fetch(`${getApiBaseUrl()}${prefix}/draft`, {
          method: "POST",
          headers: getDefaultHeaders(),
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`Failed to end draft: ${response.statusText}`);
        }

        return response.json();
      },
    };
  }

  /**
   * Get task listing operations
   * @param task_id - Task identifier
   */
  task(task_id: string): TaskOperations<T> {
    const prefix = `/api/app/process/${this.bp_id}/${task_id}`;

    return {
      async listTasks(options?: ListOptionsType): Promise<ListResponseType<T>> {
        const requestBody: ListOptionsType = {
          Type: "List",
          ...options,
        };

        const response = await fetch(`${getApiBaseUrl()}${prefix}/task/list`, {
          method: "POST",
          headers: getDefaultHeaders(),
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`Failed to list tasks: ${response.statusText}`);
        }

        return response.json();
      },

      async taskMetric(options: Omit<MetricOptionsType, "Type">): Promise<MetricResponseType> {
        const requestBody: MetricOptionsType = {
          Type: "Metric",
          ...options,
        };

        const response = await fetch(`${getApiBaseUrl()}${prefix}/task/metric`, {
          method: "POST",
          headers: getDefaultHeaders(),
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`Failed to get task metrics: ${response.statusText}`);
        }

        return response.json();
      },

      async listMyItems(options?: ListOptionsType): Promise<ListResponseType<T>> {
        const requestBody: ListOptionsType = {
          Type: "List",
          ...options,
        };

        const response = await fetch(`${getApiBaseUrl()}${prefix}/myitem/list`, {
          method: "POST",
          headers: getDefaultHeaders(),
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`Failed to list my items: ${response.statusText}`);
        }

        return response.json();
      },

      async myItemMetric(options: Omit<MetricOptionsType, "Type">): Promise<MetricResponseType> {
        const requestBody: MetricOptionsType = {
          Type: "Metric",
          ...options,
        };

        const response = await fetch(`${getApiBaseUrl()}${prefix}/myitem/metric`, {
          method: "POST",
          headers: getDefaultHeaders(),
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`Failed to get my item metrics: ${response.statusText}`);
        }

        return response.json();
      },

      async listParticipated(options?: ListOptionsType): Promise<ListResponseType<T>> {
        const requestBody: ListOptionsType = {
          Type: "List",
          ...options,
        };

        const response = await fetch(`${getApiBaseUrl()}${prefix}/participated/list`, {
          method: "POST",
          headers: getDefaultHeaders(),
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`Failed to list participated: ${response.statusText}`);
        }

        return response.json();
      },

      async participatedMetric(options: Omit<MetricOptionsType, "Type">): Promise<MetricResponseType> {
        const requestBody: MetricOptionsType = {
          Type: "Metric",
          ...options,
        };

        const response = await fetch(`${getApiBaseUrl()}${prefix}/participated/metric`, {
          method: "POST",
          headers: getDefaultHeaders(),
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`Failed to get participated metrics: ${response.statusText}`);
        }

        return response.json();
      },
    };
  }

  /**
   * Initiate a new flow
   * @param data - Initial data for the process
   */
  async start(data: Partial<T>): Promise<CreateUpdateResponseType> {
    const response = await fetch(
      `${getApiBaseUrl()}/api/app/process/${this.bp_id}/start`,
      {
        method: "POST",
        headers: getDefaultHeaders(),
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to start process: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Initiate flow via a specific activity
   * @param task_id - Task identifier to start through
   * @param data - Initial data for the process
   */
  async startViaActivity(task_id: string, data: Partial<T>): Promise<CreateUpdateResponseType> {
    const response = await fetch(
      `${getApiBaseUrl()}/api/app/process/${this.bp_id}/${task_id}/start`,
      {
        method: "POST",
        headers: getDefaultHeaders(),
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to start process via activity: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get a ResourceClient for an ADO scoped under this BP
   * @param ado_id - Associated Data Object identifier
   */
  owner<U = any>(ado_id: string): ResourceClient<U> {
    return createResourceClient<U>(`/api/app/process/${this.bp_id}/${ado_id}`);
  }

  /**
   * Get a ResourceClient for an ADO scoped under a subprocess
   * @param subprocess_id - Subprocess identifier
   * @param ado_id - Associated Data Object identifier
   */
  subprocessOwner<U = any>(subprocess_id: string, ado_id: string): ResourceClient<U> {
    return createResourceClient<U>(`/api/app/process/${this.bp_id}/${subprocess_id}/${ado_id}`);
  }
}
