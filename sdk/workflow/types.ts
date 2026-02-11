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

/**
 * Response from the activity progress endpoint
 */
export interface ActivityProgressType {
  Stage?: string;
  Progress?: number;
  [key: string]: any;
}

/**
 * Activity instance operations — returned by Workflow.activity()
 */
export interface ActivityOperations<T> {
  /** Complete the activity (POST .../done) */
  complete(): Promise<CreateUpdateResponseType>;

  /** Read the activity instance data (GET .../read) */
  read(): Promise<T>;

  /** Get activity progress (GET .../progress) */
  progress(): Promise<ActivityProgressType>;

  /** Update the activity instance (POST .../update) */
  update(data: Partial<T>): Promise<CreateUpdateResponseType>;

  /** Start a draft edit session (PATCH .../draft) */
  draftStart(data: Partial<T>): Promise<DraftResponseType>;

  /** End a draft edit session and commit (POST .../draft) */
  draftEnd(data: Partial<T>): Promise<CreateUpdateResponseType>;
}

/**
 * Task listing operations — returned by Workflow.task()
 */
export interface TaskOperations<T> {
  /** List tasks (POST .../task/list) */
  listTasks(options?: ListOptionsType): Promise<ListResponseType<T>>;

  /** Get task metrics (POST .../task/metric) */
  taskMetric(options: Omit<MetricOptionsType, "Type">): Promise<MetricResponseType>;

  /** List my items (POST .../myitem/list) */
  listMyItems(options?: ListOptionsType): Promise<ListResponseType<T>>;

  /** Get my item metrics (POST .../myitem/metric) */
  myItemMetric(options: Omit<MetricOptionsType, "Type">): Promise<MetricResponseType>;

  /** List participated items (POST .../participated/list) */
  listParticipated(options?: ListOptionsType): Promise<ListResponseType<T>>;

  /** Get participated metrics (POST .../participated/metric) */
  participatedMetric(options: Omit<MetricOptionsType, "Type">): Promise<MetricResponseType>;
}
