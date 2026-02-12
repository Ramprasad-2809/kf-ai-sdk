// ============================================================
// STRING FIELD
// Field for text values
// ============================================================

import type { StringFieldType } from "../../types/base-fields";
import type { StringFieldMetaType, ValidationResultType } from "../core/types";
import { BaseField } from "./BaseField";

/**
 * Field definition for string/text fields
 *
 * @example
 * ```typescript
 * readonly Title = new StringField({
 *   _id: "Title", Name: "Title", Type: "String",
 *   Constraint: { Length: 255 },
 * });
 * ```
 */
export class StringField extends BaseField<StringFieldType> {
  constructor(meta: StringFieldMetaType) {
    super(meta);
  }

  /** String-specific: max length constraint */
  get length(): number | undefined {
    return (this._meta as StringFieldMetaType).Constraint?.Length;
  }

  validate(value: StringFieldType | undefined): ValidationResultType {
    if (value !== undefined && value !== null && typeof value !== "string") {
      return {
        valid: false,
        errors: [`${this.label} must be a string`],
      };
    }
    return { valid: true, errors: [] };
  }
}
