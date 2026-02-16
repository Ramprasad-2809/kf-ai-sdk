// ============================================================
// ACTIVITY BASE CLASS
// ============================================================
// Lean abstract base class for typed workflow activities.
// Replaces ActivityForm — no public getFields(), no phantom types,
// no exported meta type.
//
// Each activity subclass defines:
//   - meta: { businessProcessId, activityId }
//   - Typed field instances as class properties
//
// Methods:
//   activity.getInProgressList(options)   // list in-progress activity instances
//   activity.getCompletedList(options)    // list completed activity instances
//   activity.inProgressMetrics(options)   // get in-progress aggregated metrics
//   activity.completedMetrics(options)    // get completed aggregated metrics
//   activity.getInstance(instanceId)      // get typed ActivityInstance

import { Workflow } from "./client";
import { createActivityInstance } from "./ActivityInstance";
import type { ActivityInstanceType } from "./ActivityInstance";
import type { ActivityInstanceFieldsType, ActivityOperations } from "./types";
import type {
  ListOptionsType,
  ListResponseType,
  MetricOptionsType,
  MetricResponseType,
} from "../types/common";
import { BaseField } from "../bdo/fields/BaseField";

// ============================================================
// ABSTRACT BASE CLASS
// ============================================================

/**
 * Abstract base class for workflow activities.
 *
 * Extend this class to define typed activity input fields.
 * Each activity is a typed class with field definitions and data operations.
 *
 * @template TEntity - The full entity type with all fields
 * @template TEditable - Fields the user can edit
 * @template TReadonly - Fields that are read-only (computed / system)
 *
 * @example
 * ```typescript
 * class EmployeeInputActivity extends Activity<
 *   EmployeeInputEntityType,
 *   EmployeeInputEditable,
 *   EmployeeInputReadonly
 * > {
 *   readonly meta = {
 *     businessProcessId: "SimpleLeaveProcess",
 *     activityId: "EMPLOYEE_INPUT",
 *   };
 *
 *   readonly StartDate = new DateTimeField({ id: "StartDate", label: "Start Date" });
 *   readonly EndDate = new DateTimeField({ id: "EndDate", label: "End Date" });
 *   readonly LeaveDays = new NumberField({ id: "LeaveDays", label: "Leave Days", editable: false });
 * }
 *
 * const activity = new EmployeeInputActivity();
 * const inProgress = await activity.getInProgressList({ Page: 1, PageSize: 10 });
 * const completed = await activity.getCompletedList({ Page: 1, PageSize: 10 });
 * const instance = await activity.getInstance("inst_123");
 * instance.StartDate.get();  // typed value
 * instance.StartDate.set("2026-03-01");
 * await instance.update({ StartDate: "2026-03-01" });
 * ```
 */
export abstract class Activity<
  TEntity extends Record<string, unknown>,
  TEditable extends Record<string, unknown> = TEntity,
  // eslint-disable-next-line @typescript-eslint/ban-types
  TReadonly extends Record<string, unknown> = {},
> {
  /**
   * Activity metadata — identifies the business process and activity
   */
  abstract readonly meta: {
    readonly businessProcessId: string;
    readonly activityId: string;
  };

  // ============================================================
  // ACTIVITY OPERATIONS (internal)
  // ============================================================

  /**
   * Get ActivityOperations for this activity.
   * @internal
   */
  private _ops(): ActivityOperations<TEntity> {
    return new Workflow<TEntity>(this.meta.businessProcessId)
      .activity(this.meta.activityId);
  }

  // ============================================================
  // FIELD DISCOVERY (internal)
  // ============================================================

  private _fieldsCache: Record<string, BaseField<unknown>> | null = null;

  /**
   * Discover BaseField instances from subclass properties.
   * @internal
   */
  private _discoverFields(): Record<string, BaseField<unknown>> {
    if (this._fieldsCache) return this._fieldsCache;

    const fields: Record<string, BaseField<unknown>> = {};
    for (const key of Object.keys(this)) {
      const value = (this as Record<string, unknown>)[key];
      if (value instanceof BaseField) {
        fields[key] = value;
      }
    }

    this._fieldsCache = fields;
    return fields;
  }

  // ============================================================
  // PUBLIC METHODS
  // ============================================================

  /**
   * List in-progress activity instances with optional filtering/pagination.
   */
  async getInProgressList(
    options?: ListOptionsType,
  ): Promise<ListResponseType<ActivityInstanceFieldsType & TEntity>> {
    return this._ops().inProgressList(options);
  }

  /**
   * List completed activity instances with optional filtering/pagination.
   */
  async getCompletedList(
    options?: ListOptionsType,
  ): Promise<ListResponseType<ActivityInstanceFieldsType & TEntity>> {
    return this._ops().completedList(options);
  }

  /**
   * Get aggregated metrics for in-progress activity instances.
   */
  async inProgressMetrics(
    options: Omit<MetricOptionsType, "Type">,
  ): Promise<MetricResponseType> {
    return this._ops().inProgressMetric(options);
  }

  /**
   * Get aggregated metrics for completed activity instances.
   */
  async completedMetrics(
    options: Omit<MetricOptionsType, "Type">,
  ): Promise<MetricResponseType> {
    return this._ops().completedMetric(options);
  }

  /**
   * Get a typed ActivityInstance with field accessors and persistence methods.
   *
   * @param instanceId - The activity instance identifier
   * @returns ActivityInstance with typed field accessors
   */
  async getInstance(
    instanceId: string,
  ): Promise<ActivityInstanceType<TEntity, TEditable, TReadonly>> {
    const ops = this._ops();
    const data = await ops.read(instanceId);
    const fields = this._discoverFields();
    return createActivityInstance<TEntity, TEditable, TReadonly>(
      ops,
      instanceId,
      data as TEntity,
      fields,
    );
  }

  // ============================================================
  // INTERNAL ACCESSORS (used by useActivityForm hook)
  // ============================================================

  /**
   * Get discovered fields — used internally by useActivityForm hook.
   * @internal
   */
  _getFields(): Record<string, BaseField<unknown>> {
    return this._discoverFields();
  }

  /**
   * Get ActivityOperations — used internally by useActivityForm hook.
   * @internal
   */
  _getOps(): ActivityOperations<TEntity> {
    return this._ops();
  }
}
