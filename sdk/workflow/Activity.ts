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
//   activity.getInProgressList()          // list in-progress activity instances
//   activity.getCompletedList()           // list completed activity instances
//   activity.inProgressCount()            // get in-progress count (returns number)
//   activity.completedCount()             // get completed count (returns number)
//   activity.inProgressMetric(options)    // get in-progress aggregated metrics
//   activity.completedMetric(options)     // get completed aggregated metrics
//   activity.getInstance(instanceId)      // get typed ActivityInstance

import { Workflow } from "./client";
import { createActivityInstance } from "./ActivityInstance";
import type { ActivityInstanceType } from "./ActivityInstance";
import type { ActivityInstanceFieldsType, ActivityOperations } from "./types";
import type {
  ListOptionsType,
  MetricOptionsType,
  MetricResponseType,
} from "../types/common";
import { BaseField } from "../bdo/fields/BaseField";

/** Activity system fields treated as readonly on list results */
type ActivitySystemReadonlyType = Omit<ActivityInstanceFieldsType, '_id'>;

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
 * const inProgress = await activity.getInProgressList();
 * const completed = await activity.getCompletedList();
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
   * List in-progress activity instances.
   * Each row is wrapped in an ActivityInstance proxy with field accessors.
   */
  async getInProgressList(
    options?: ListOptionsType,
  ): Promise<ActivityInstanceType<
    ActivityInstanceFieldsType & TEntity,
    TEditable,
    TReadonly & ActivitySystemReadonlyType
  >[]> {
    const ops = this._ops();
    const response = await ops.inProgressList(options);
    const fields = this._discoverFields();
    return response.Data.map((data) =>
      createActivityInstance<
        ActivityInstanceFieldsType & TEntity,
        TEditable,
        TReadonly & ActivitySystemReadonlyType
      >(ops, (data as any)._id, data as (ActivityInstanceFieldsType & TEntity), fields),
    );
  }

  /**
   * List completed activity instances.
   * Each row is wrapped in an ActivityInstance proxy with field accessors.
   */
  async getCompletedList(
    options?: ListOptionsType,
  ): Promise<ActivityInstanceType<
    ActivityInstanceFieldsType & TEntity,
    TEditable,
    TReadonly & ActivitySystemReadonlyType
  >[]> {
    const ops = this._ops();
    const response = await ops.completedList(options);
    const fields = this._discoverFields();
    return response.Data.map((data) =>
      createActivityInstance<
        ActivityInstanceFieldsType & TEntity,
        TEditable,
        TReadonly & ActivitySystemReadonlyType
      >(ops, (data as any)._id, data as (ActivityInstanceFieldsType & TEntity), fields),
    );
  }

  /**
   * Get count of in-progress activity instances.
   * Returns a number (same as BDO count()).
   */
  async inProgressCount(options?: ListOptionsType): Promise<number> {
    const response = await this._ops().inProgressCount(options);
    return response.Count;
  }

  /**
   * Get count of completed activity instances.
   * Returns a number (same as BDO count()).
   */
  async completedCount(options?: ListOptionsType): Promise<number> {
    const response = await this._ops().completedCount(options);
    return response.Count;
  }

  /**
   * Get aggregated metrics for in-progress activity instances.
   * Accepts MetricOptionsType (without Type) for custom aggregations (Sum, Avg, etc.).
   */
  async inProgressMetric(options: Omit<MetricOptionsType, 'Type'>): Promise<MetricResponseType> {
    return this._ops().inProgressMetric(options);
  }

  /**
   * Get aggregated metrics for completed activity instances.
   * Accepts MetricOptionsType (without Type) for custom aggregations (Sum, Avg, etc.).
   */
  async completedMetric(options: Omit<MetricOptionsType, 'Type'>): Promise<MetricResponseType> {
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
