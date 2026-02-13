// ============================================================
// BOOLEAN FIELD
// Field for true/false values
// ============================================================

import type { BooleanFieldType } from "../../types/base-fields";
import type { BooleanFieldMetaType, ValidationResultType } from "../core/types";
import { BaseField } from "./BaseField";

/**
 * Field definition for boolean fields
 *
 * @example
 * ```typescript
 * readonly IsActive = new BooleanField({
 *   _id: "IsActive", Name: "Is Active", Type: "Boolean",
 * });
 * ```
 */
export class BooleanField extends BaseField<BooleanFieldType> {
  constructor(meta: BooleanFieldMetaType) {
    super(meta);
  }

  validate(value: BooleanFieldType | undefined): ValidationResultType {
    if (value !== undefined && value !== null && typeof value !== "boolean") {
      return {
        valid: false,
        errors: [`${this.label} must be a boolean`],
      };
    }
    return { valid: true, errors: [] };
  }
}
