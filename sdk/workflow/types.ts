// ============================================================
// Workflow Types - Business Process / Activity Operations
// ============================================================

import type {
  ListOptionsType,
  ListResponseType,
  MetricOptionsType,
  MetricResponseType,
  DraftResponseType,
  CreateUpdateResponseType,
} from "../types/common";

import type {
  StringFieldType,
  SelectFieldType,
  DateTimeFieldType,
  ReferenceFieldType,
} from "../types/base-fields";
import type { UserRefType } from "../types/base-fields";

/**
 * Response from Workflow.start()
 */
export interface WorkflowStartResponseType {
  activityId: string;
  activityInstanceId: string;
}

/**
 * Response from the activity progress endpoint
 */
export interface ActivityProgressType {
  Stage?: string;
  Progress?: number;
  [key: string]: any;
}

/**
 * System fields present on every activity instance response.
 * Returned alongside activity-specific fields from `list()` and `read()`.
 */
export type ActivityInstanceFieldsType = {
  _id: StringFieldType;
  Status: SelectFieldType<"InProgress" | "Completed">;
  AssignedTo: ReferenceFieldType<UserRefType>;
  CompletedAt: DateTimeFieldType;
};

/**
 * Unified activity operations — returned by Workflow.activity(activityId)
 *
 * List-level methods operate on the activity as a whole.
 * Instance-level methods accept `instanceId` as their first parameter.
 */
export interface ActivityOperations<T> {
  // ── List-level ──────────────────────────────────────────────

  /** List activity instances (POST .../list) */
  list(options?: ListOptionsType): Promise<ListResponseType<ActivityInstanceFieldsType & T>>;

  /** Get activity metrics (POST .../metric) */
  metric(options: Omit<MetricOptionsType, "Type">): Promise<MetricResponseType>;

  // ── Instance-level ──────────────────────────────────────────

  /** Read the activity instance data (GET .../read) */
  read(instanceId: string): Promise<ActivityInstanceFieldsType & T>;

  /** Update the activity instance (POST .../update) */
  update(instanceId: string, data: Partial<T>): Promise<CreateUpdateResponseType>;

  /** Start a draft edit session (PATCH .../draft) */
  draftStart(instanceId: string, data: Partial<T>): Promise<DraftResponseType>;

  /** End a draft edit session and commit (POST .../draft) */
  draftEnd(instanceId: string, data: Partial<T>): Promise<CreateUpdateResponseType>;

  /** Complete the activity (POST .../done) */
  complete(instanceId: string): Promise<CreateUpdateResponseType>;

  /** Get activity progress (GET .../progress) */
  progress(instanceId: string): Promise<ActivityProgressType>;
}
