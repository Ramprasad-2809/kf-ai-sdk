// ============================================================
// BASE FIELD CLASS
// Abstract base class for all field types
// ============================================================

import type { BaseFieldMetaType, ValidationResultType } from "../core/types";

/**
 * Abstract base class for all field definitions.
 * Stores the raw backend meta JSON and exposes convenience getters.
 *
 * @template T - The TypeScript type of the field value
 */
export abstract class BaseField<T> {
  /** Full raw backend meta */
  protected readonly _meta: BaseFieldMetaType;
  protected _parentBoId?: string;

  constructor(meta: BaseFieldMetaType) {
    this._meta = meta;
  }

  // === Convenience getters (transform backend naming → SDK naming) ===

  get id(): string { return this._meta._id; }
  get label(): string { return this._meta.Name || this._meta._id; }
  get readOnly(): boolean { return this._meta.ReadOnly ?? false; }
  get required(): boolean { return this._meta.Constraint?.Required ?? this._meta.Required ?? false; }
  get defaultValue(): unknown { return this._meta.DefaultValue ?? this._meta.Constraint?.DefaultValue; }
  get primaryKey(): boolean { return this._meta.Constraint?.PrimaryKey ?? false; }

  /** Full raw meta (the exact JSON passed to constructor) */
  get meta(): BaseFieldMetaType { return this._meta; }

  /**
   * Validate a value for this field
   * Override in subclasses for custom validation
   */
  abstract validate(value: T | undefined): ValidationResultType;
}
