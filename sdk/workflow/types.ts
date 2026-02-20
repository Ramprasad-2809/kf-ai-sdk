// ============================================================
// Workflow Types - Business Process / Activity Operations
// ============================================================

import type {
  ListResponseType,
  ListOptionsType,
  CountResponseType,
  DraftResponseType,
  CreateUpdateResponseType,
} from "../types/common";

import type {
  StringFieldType,
  SelectFieldType,
  DateTimeFieldType,
} from "../types/base-fields";

/**
 * Response from Workflow.start()
 */
export interface WorkflowStartResponseType {
  BPInstanceId: string;
  ActivityId: string;
  _id: string;
}

/**
 * Response from the activity progress endpoint.
 * Both global (Workflow.progress()) and instance-level (ActivityInstance.progress())
 * return ActivityProgressType[].
 */
export interface ActivityProgressType {
  ActivityId: string;
  ActivityInstanceId: string;
  ActivityType: string;
  AssignedTo: { Type: string; _id: string }[];
  CompletedAt: string | null;
  CompletedBy: { _id: string; _name: string } | null;
  Status: "COMPLETED" | "IN_PROGRESS";
  _name: string;
}

/**
 * System fields present on every activity instance response.
 * Returned alongside activity-specific fields from `list()` and `read()`.
 */
export type ActivityAssigneeType = { _id: string; Type: string };

export type ActivityInstanceFieldsType = {
  _id: StringFieldType;
  BPInstanceId: StringFieldType;
  Status: SelectFieldType<"InProgress" | "Completed">;
  AssignedTo: ActivityAssigneeType[];
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

  /** List in-progress activity instances (POST .../inprogress/list) */
  inProgressList(options?: ListOptionsType): Promise<ListResponseType<ActivityInstanceFieldsType & T>>;

  /** List completed activity instances (POST .../completed/list) */
  completedList(options?: ListOptionsType): Promise<ListResponseType<ActivityInstanceFieldsType & T>>;

  /** Get in-progress activity count (POST .../inprogress/metric) */
  inProgressMetric(options?: ListOptionsType): Promise<CountResponseType>;

  /** Get completed activity count (POST .../completed/metric) */
  completedMetric(options?: ListOptionsType): Promise<CountResponseType>;

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
  progress(instanceId: string): Promise<ActivityProgressType[]>;
}
