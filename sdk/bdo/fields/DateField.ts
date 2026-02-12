// ============================================================
// DATE FIELD
// Field for date-only values (no time component)
// ============================================================

import type { DateFieldType } from "../../types/base-fields";
import type { DateFieldMetaType, ValidationResultType } from "../core/types";
import { BaseField } from "./BaseField";

/**
 * Field definition for date-only fields (YYYY-MM-DD)
 *
 * @example
 * ```typescript
 * readonly BirthDate = new DateField({
 *   _id: "BirthDate", Name: "Birth Date", Type: "Date",
 * });
 * ```
 */
export class DateField extends BaseField<DateFieldType> {
  constructor(meta: DateFieldMetaType) {
    super(meta);
  }

  validate(value: DateFieldType | undefined): ValidationResultType {
    if (value === undefined || value === null || (value as string) === "") {
      return { valid: true, errors: [] };
    }

    if (typeof value !== "string") {
      return {
        valid: false,
        errors: [`${this.label} must be a valid date string`],
      };
    }

    // Enforce date-only format: YYYY-MM-DD (reject time components)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return {
        valid: false,
        errors: [`${this.label} must be in YYYY-MM-DD format`],
      };
    }

    const date = new Date(value + "T00:00:00");
    if (isNaN(date.getTime())) {
      return {
        valid: false,
        errors: [`${this.label} is not a valid date`],
      };
    }

    return { valid: true, errors: [] };
  }
}
