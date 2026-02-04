// ============================================================
// FIELD ACCESSOR
// Base accessor for reading and writing field values
// ============================================================

import type { ValidationResult, FieldAccessorInterface, FieldMeta } from "../core/types";
import type { BaseField } from "../fields/BaseField";

/**
 * Accessor for reading and writing field values
 *
 * Provides get/set methods with validation support.
 *
 * @template T - The type of the field value
 *
 * @example
 * ```typescript
 * const accessor = item.field("Title");
 * const value = accessor.get();
 * accessor.set("New Value");
 * const result = accessor.validate();
 * ```
 */
export class FieldAccessor<T> implements FieldAccessorInterface<T> {
  protected readonly _field: BaseField<T>;
  protected readonly _getValue: () => T | undefined;
  protected readonly _setValue: (value: T) => void;

  constructor(
    field: BaseField<T>,
    getValue: () => T | undefined,
    setValue: (value: T) => void
  ) {
    this._field = field;
    this._getValue = getValue;
    this._setValue = setValue;
  }

  /**
   * Get the current field value
   */
  get(): T | undefined {
    return this._getValue();
  }

  /**
   * Set the field value
   */
  set(value: T): void {
    this._setValue(value);
  }

  /**
   * Validate the current value
   */
  validate(): ValidationResult {
    return this._field.validate(this._getValue());
  }

  /**
   * Get the field definition
   */
  getField(): BaseField<T> {
    return this._field;
  }

  /**
   * Get field metadata (id, label, etc.)
   */
  get meta(): FieldMeta {
    return {
      id: this._field.id,
      label: this._field.label,
    };
  }
}
