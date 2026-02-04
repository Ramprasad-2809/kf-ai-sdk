// ============================================================
// BOOLEAN FIELD
// Field for true/false values
// ============================================================

import type { BooleanFieldType } from "../../types/base-fields";
import type { FieldConfig, ValidationResult } from "../core/types";
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
  constructor(config: FieldConfig) {
    super(config);
  }

  validate(value: BooleanFieldType | undefined): ValidationResult {
    if (value !== undefined && value !== null && typeof value !== "boolean") {
      return {
        valid: false,
        errors: [`${this.label} must be a boolean`],
      };
    }
    return { valid: true, errors: [] };
  }
}
