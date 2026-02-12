// ============================================================
// DATETIME FIELD
// Field for date and datetime values
// ============================================================

import type { DateTimeFieldMetaType, ValidationResultType } from "../core/types";
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
 *   _id: "_created_at", Name: "Created At", Type: "DateTime", ReadOnly: true,
 * });
 * ```
 */
export class DateTimeField extends BaseField<DateTimeValue> {
  constructor(meta: DateTimeFieldMetaType) {
    super(meta);
  }

  /** DateTime-specific: precision */
  get precision(): "Second" | "Millisecond" {
    return (this._meta as DateTimeFieldMetaType).Constraint?.Precision ?? "Second";
  }

  validate(value: DateTimeValue | undefined): ValidationResultType {
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
