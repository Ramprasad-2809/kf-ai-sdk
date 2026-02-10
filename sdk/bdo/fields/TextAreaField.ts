// ============================================================
// TEXTAREA FIELD
// Field for multi-line text values
// ============================================================

import type { TextAreaFieldType } from "../../types/base-fields";
import type { FieldConfigType, ValidationResultType } from "../core/types";
import { BaseField } from "./BaseField";

/**
 * Field definition for multi-line text fields
 *
 * @example
 * ```typescript
 * readonly Description = new TextAreaField({
 *   id: "Description",
 *   label: "Description"
 * });
 * ```
 */
export class TextAreaField extends BaseField<TextAreaFieldType> {
  constructor(config: FieldConfigType) {
    super(config);
  }

  validate(value: TextAreaFieldType | undefined): ValidationResultType {
    if (value !== undefined && value !== null && typeof value !== "string") {
      return {
        valid: false,
        errors: [`${this.label} must be a string`],
      };
    }
    return { valid: true, errors: [] };
  }
}
