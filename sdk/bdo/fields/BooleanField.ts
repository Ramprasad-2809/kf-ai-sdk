// ============================================================
// BOOLEAN FIELD
// Field for true/false values
// ============================================================

import type { BooleanFieldType } from "../../types/base-fields";
import type { FieldConfigType, ValidationResultType } from "../core/types";
import { BaseField } from "./BaseField";

/**
 * Field definition for boolean fields
 *
 * @example
 * ```typescript
 * readonly IsActive = new BooleanField({
 *   id: "IsActive",
 *   label: "Is Active"
 * });
 * ```
 */
export class BooleanField extends BaseField<BooleanFieldType> {
  constructor(config: FieldConfigType) {
    super(config);
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
