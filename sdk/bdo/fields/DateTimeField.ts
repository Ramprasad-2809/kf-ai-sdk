// ============================================================
// DATETIME FIELD
// Field for date and datetime values
// ============================================================

import type { FieldConfig, ValidationResult } from "../core/types";
import { BaseField } from "./BaseField";

/**
 * Date/DateTime field value type
 */
type DateTimeValue = string;

/**
 * Field definition for date and datetime fields
 *
 * @example
 * ```typescript
 * readonly CreatedAt = new DateTimeField({
 *   id: "_created_at",
 *   label: "Created At"
 * });
 * ```
 */
export class DateTimeField extends BaseField<DateTimeValue> {
  constructor(config: FieldConfig) {
    super(config);
  }

  validate(value: DateTimeValue | undefined): ValidationResult {
    if (value === undefined || value === null || value === "") {
      return { valid: true, errors: [] };
    }

    if (typeof value !== "string") {
      return {
        valid: false,
        errors: [`${this.label} must be a valid date string`],
      };
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return {
        valid: false,
        errors: [`${this.label} is not a valid date`],
      };
    }

    return { valid: true, errors: [] };
  }
}
