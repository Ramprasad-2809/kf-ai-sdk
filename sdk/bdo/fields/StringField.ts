// ============================================================
// STRING FIELD
// Field for text values
// ============================================================

import type { StringFieldType } from "../../types/base-fields";
import type { FieldConfig, ValidationResult } from "../core/types";
import { BaseField } from "./BaseField";

/**
 * Field definition for string/text fields
 *
 * @example
 * ```typescript
 * readonly Title = new StringField({
 *   id: "Title",
 *   label: "Title"
 * });
 * ```
 */
export class StringField extends BaseField<StringFieldType> {
  constructor(config: FieldConfig) {
    super(config);
  }

  validate(value: StringFieldType | undefined): ValidationResult {
    if (value !== undefined && value !== null && typeof value !== "string") {
      return {
        valid: false,
        errors: [`${this.label} must be a string`],
      };
    }
    return { valid: true, errors: [] };
  }
}
