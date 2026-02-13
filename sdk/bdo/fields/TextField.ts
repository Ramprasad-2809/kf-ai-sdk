// ============================================================
// TEXT FIELD
// Field for multi-line text values (replaces TextAreaField)
// ============================================================

import type { TextFieldMetaType, ValidationResultType } from "../core/types";
import { BaseField } from "./BaseField";

/** Text field value type */
export type TextFieldValueType = string;

/**
 * Field definition for multi-line text fields
 *
 * @example
 * ```typescript
 * readonly Description = new TextField({
 *   _id: "Description", Name: "Description", Type: "Text",
 *   Constraint: { Format: "Markdown" },
 * });
 * ```
 */
export class TextField extends BaseField<TextFieldValueType> {
  constructor(meta: TextFieldMetaType) {
    super(meta);
  }

  /** Text-specific: format */
  get format(): "Plain" | "Markdown" {
    return (this._meta as TextFieldMetaType).Constraint?.Format ?? "Plain";
  }

  validate(value: TextFieldValueType | undefined): ValidationResultType {
    if (value !== undefined && value !== null && typeof value !== "string") {
      return {
        valid: false,
        errors: [`${this.label} must be a string`],
      };
    }
    return { valid: true, errors: [] };
  }
}
