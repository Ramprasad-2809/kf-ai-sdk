// ============================================================
// BASE FIELD CLASS
// Abstract base class for all field types
// ============================================================

import type { FieldConfig, ValidationResult, FieldMeta } from "../core/types";

/**
 * Abstract base class for all field definitions
 *
 * @template T - The TypeScript type of the field value
 *
 * @example
 * ```typescript
 * class CustomField extends BaseField<MyType> {
 *   validate(value: MyType | undefined): ValidationResult {
 *     // Custom validation logic
 *   }
 * }
 * ```
 */
export abstract class BaseField<T> {
  readonly id: string;
  readonly label: string;
  protected _parentBoId?: string;

  constructor(config: FieldConfig) {
    this.id = config.id;
    this.label = config.label;
  }

  /**
   * Bind this field to a parent BDO
   * Called by BaseBdo.initFields() to enable fetchOptions
   */
  setParentBoId(boId: string): void {
    this._parentBoId = boId;
  }

  /**
   * Get the parent BDO ID
   */
  get parentBoId(): string | undefined {
    return this._parentBoId;
  }

  /**
   * Validate a value for this field
   * Override in subclasses for custom validation
   */
  abstract validate(value: T | undefined): ValidationResult;

  /**
   * Get the field configuration
   */
  getConfig(): FieldConfig {
    return {
      id: this.id,
      label: this.label,
    };
  }

  /**
   * Get field metadata (id, label, and field-specific info)
   */
  get meta(): FieldMeta {
    return {
      id: this.id,
      label: this.label,
    };
  }
}
