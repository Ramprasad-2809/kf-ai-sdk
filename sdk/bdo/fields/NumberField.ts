// ============================================================
// NUMBER FIELD
// Field for numeric values
// ============================================================

import type { NumberFieldType } from "../../types/base-fields";
import type { FieldConfig, ValidationResult } from "../core/types";
import { BaseField } from "./BaseField";

/**
 * Field definition for numeric fields
 *
 * @example
 * ```typescript
 * readonly Price = new NumberField({
 *   id: "Price",
 *   label: "Price"
 * });
 * ```
 */
export class NumberField extends BaseField<NumberFieldType> {
  constructor(config: FieldConfig) {
    super(config);
  }

  validate(value: NumberFieldType | undefined): ValidationResult {
    if (value !== undefined && value !== null && (typeof value !== "number" || isNaN(value))) {
      return {
        valid: false,
        errors: [`${this.label} must be a valid number`],
      };
    }
    return { valid: true, errors: [] };
  }
}
