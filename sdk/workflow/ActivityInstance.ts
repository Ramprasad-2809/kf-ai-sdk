// ============================================================
// ACTIVITY INSTANCE CLASS
// ============================================================
// Wraps an activity instance record with field accessors (BDO Item pattern)
// plus workflow-specific persistence methods.
//
// Field Accessor Pattern:
//   instance.StartDate.get()         // read value
//   instance.StartDate.set("2026-03-01")  // set value (editable only)
//   instance.StartDate.meta          // field metadata
//   instance.LeaveDays.get()         // read computed/readonly
//   instance._id                     // instance ID
//   instance.toJSON()                // plain object
//   instance.validate()              // validate all fields
//
// Persistence Methods:
//   instance.update(data)   // regular update -> ops.update()
//   instance.save(data)     // commit draft  -> ops.draftEnd()
//   instance.complete()     // complete      -> ops.complete()
//   instance.progress()     // get progress  -> ops.progress()

import type { ValidationResultType, BaseFieldMetaType } from "../bdo/core/types";
import type { BaseField } from "../bdo/fields/BaseField";
import type { ActivityOperations, ActivityProgressType } from "./types";
import type { CreateUpdateResponseType } from "../types/common";

// ============================================================
// ACCESSOR TYPES
// ============================================================

/**
 * Editable field accessor — has get(), set(), validate(), meta
 */
export interface EditableFieldAccessor<T> {
  readonly label: string;
  readonly required: boolean;
  readonly readOnly: boolean;
  readonly defaultValue: unknown;
  readonly meta: BaseFieldMetaType;
  get(): T | undefined;
  set(value: T): void;
  validate(): ValidationResultType;
}

/**
 * Readonly field accessor — has get(), validate(), meta (NO set)
 */
export interface ReadonlyFieldAccessor<T> {
  readonly label: string;
  readonly required: boolean;
  readonly readOnly: boolean;
  readonly defaultValue: unknown;
  readonly meta: BaseFieldMetaType;
  get(): T | undefined;
  validate(): ValidationResultType;
}

// ============================================================
// MAPPED ACCESSOR TYPES
// ============================================================

type EditableAccessors<T> = {
  [K in keyof T]: EditableFieldAccessor<T[K]>;
};

type ReadonlyAccessors<T> = {
  [K in keyof T]: ReadonlyFieldAccessor<T[K]>;
};

/**
 * Full ActivityInstance type with field accessors and persistence methods.
 */
export type ActivityInstanceType<
  TEntity extends Record<string, unknown>,
  TEditable extends Record<string, unknown> = TEntity,
  TReadonly extends Record<string, unknown> = {},
> = ActivityInstance<TEntity, TEditable> &
  EditableAccessors<TEditable> &
  ReadonlyAccessors<TReadonly> &
  { readonly _id: string };

// ============================================================
// ACTIVITY INSTANCE CLASS
// ============================================================

/**
 * ActivityInstance wraps a single activity instance record with:
 * - BDO Item-style field accessors (get/set/meta/validate)
 * - Workflow persistence methods (update, save, complete, progress)
 *
 * @template TEntity - Full entity type (all fields)
 * @template TEditable - Editable subset of fields
 */
export class ActivityInstance<
  TEntity extends Record<string, unknown>,
  TEditable extends Record<string, unknown> = TEntity,
> {
  readonly _id: string;
  private readonly _data: Record<string, unknown>;
  private readonly _ops: ActivityOperations<TEntity>;
  private readonly _fields: Record<string, BaseField<unknown>>;
  private readonly _accessorCache: Map<string, EditableFieldAccessor<unknown> | ReadonlyFieldAccessor<unknown>> = new Map();

  constructor(
    ops: ActivityOperations<TEntity>,
    instanceId: string,
    data: Record<string, unknown>,
    fields: Record<string, BaseField<unknown>>,
  ) {
    this._ops = ops;
    this._id = instanceId;
    this._data = { ...data };
    this._fields = fields;
  }

  // ============================================================
  // BDO ITEM METHODS
  // ============================================================

  /**
   * Convert the instance to a plain object
   */
  toJSON(): Partial<TEntity> {
    return { ...this._data } as Partial<TEntity>;
  }

  /**
   * Validate all fields and return combined results
   */
  validate(): ValidationResultType {
    const allErrors: string[] = [];

    for (const [fieldId, fieldDef] of Object.entries(this._fields)) {
      const value = this._data[fieldId];
      const result = fieldDef.validate(value);
      if (!result.valid) {
        allErrors.push(...result.errors);
      }
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
    };
  }

  // ============================================================
  // WORKFLOW PERSISTENCE METHODS
  // ============================================================

  /**
   * Regular update — calls ActivityOperations.update()
   */
  async update(data: Partial<TEditable>): Promise<CreateUpdateResponseType> {
    return this._ops.update(this._id, data as Partial<TEntity>);
  }

  /**
   * Commit draft — calls ActivityOperations.draftEnd()
   */
  async save(data: Partial<TEditable>): Promise<CreateUpdateResponseType> {
    return this._ops.draftEnd(this._id, data as Partial<TEntity>);
  }

  /**
   * Complete the activity — calls ActivityOperations.complete()
   */
  async complete(): Promise<CreateUpdateResponseType> {
    return this._ops.complete(this._id);
  }

  /**
   * Get activity progress — calls ActivityOperations.progress()
   */
  async progress(): Promise<ActivityProgressType> {
    return this._ops.progress(this._id);
  }

  // ============================================================
  // FIELD ACCESSOR (internal)
  // ============================================================

  /** @internal */
  _getAccessor(fieldId: string): EditableFieldAccessor<unknown> | ReadonlyFieldAccessor<unknown> {
    if (this._accessorCache.has(fieldId)) {
      return this._accessorCache.get(fieldId)!;
    }

    const fieldDef = this._fields[fieldId];
    const meta: BaseFieldMetaType = fieldDef?.meta ?? {
      _id: fieldId,
      Name: fieldId,
      Type: "String",
    };
    const isReadOnly = fieldDef?.readOnly ?? false;

    const validate = (): ValidationResultType => {
      if (fieldDef) {
        return fieldDef.validate(this._data[fieldId]);
      }
      return { valid: true, errors: [] };
    };

    let accessor: EditableFieldAccessor<unknown> | ReadonlyFieldAccessor<unknown>;

    if (!isReadOnly) {
      accessor = {
        label: fieldDef?.label ?? fieldId,
        required: fieldDef?.required ?? false,
        readOnly: false,
        defaultValue: fieldDef?.defaultValue,
        meta,
        get: () => this._data[fieldId],
        set: (value: unknown) => {
          this._data[fieldId] = value;
        },
        validate,
      };
    } else {
      accessor = {
        label: fieldDef?.label ?? fieldId,
        required: fieldDef?.required ?? false,
        readOnly: true,
        defaultValue: fieldDef?.defaultValue,
        meta,
        get: () => this._data[fieldId],
        validate,
      };
    }

    this._accessorCache.set(fieldId, accessor);
    return accessor;
  }
}

// ============================================================
// FACTORY FUNCTION
// ============================================================

/**
 * Creates an ActivityInstance with Proxy-based field accessors.
 * Fields are discovered from the provided fields map.
 *
 * @param ops - ActivityOperations for API calls
 * @param instanceId - The activity instance ID
 * @param data - Raw instance data from the API
 * @param fields - Map of field name -> BaseField instance
 * @returns Proxied ActivityInstance with typed field accessors
 */
export function createActivityInstance<
  TEntity extends Record<string, unknown>,
  TEditable extends Record<string, unknown> = TEntity,
  TReadonly extends Record<string, unknown> = {},
>(
  ops: ActivityOperations<TEntity>,
  instanceId: string,
  data: TEntity,
  fields: Record<string, BaseField<unknown>>,
): ActivityInstanceType<TEntity, TEditable, TReadonly> {
  const instance = new ActivityInstance<TEntity, TEditable>(
    ops,
    instanceId,
    data as Record<string, unknown>,
    fields,
  );

  return new Proxy(instance, {
    get(target, prop, receiver) {
      // Handle ActivityInstance's own methods and properties first
      if (
        prop === "validate" ||
        prop === "toJSON" ||
        prop === "update" ||
        prop === "save" ||
        prop === "complete" ||
        prop === "progress" ||
        prop === "_ops" ||
        prop === "_data" ||
        prop === "_fields" ||
        prop === "_accessorCache" ||
        prop === "_getAccessor"
      ) {
        return Reflect.get(target, prop, receiver);
      }

      // Handle symbol properties
      if (typeof prop === "symbol") {
        return Reflect.get(target, prop, receiver);
      }

      // _id is returned directly
      if (prop === "_id") {
        return target._id;
      }

      // Return field accessor
      return target._getAccessor(prop as string);
    },

    has(target, prop) {
      if (typeof prop === "symbol") return false;
      if (
        prop === "validate" ||
        prop === "toJSON" ||
        prop === "update" ||
        prop === "save" ||
        prop === "complete" ||
        prop === "progress" ||
        prop === "_id"
      ) {
        return true;
      }
      return prop in target["_fields"];
    },

    ownKeys(target) {
      return [
        ...Object.keys(target["_fields"]),
        "_id",
        "validate",
        "toJSON",
        "update",
        "save",
        "complete",
        "progress",
      ];
    },

    getOwnPropertyDescriptor(_, prop) {
      if (typeof prop === "symbol") return undefined;
      return {
        configurable: true,
        enumerable: prop !== "validate" && prop !== "toJSON" &&
                    prop !== "update" && prop !== "save" &&
                    prop !== "complete" && prop !== "progress",
      };
    },
  }) as ActivityInstanceType<TEntity, TEditable, TReadonly>;
}
