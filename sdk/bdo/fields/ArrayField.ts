// ============================================================
// ARRAY FIELD
// Field for array/multi-value fields
// ============================================================

import type { ArrayFieldType } from "../../types/base-fields";
import type { FieldConfig, ValidationResult } from "../core/types";
import { BaseField } from "./BaseField";

/**
 * Field definition for array/multi-value fields
 *
 * @template T - The type of array elements
 *
 * @example
 * ```typescript
 * readonly Tags = new ArrayField<string>({
 *   id: "Tags",
 *   label: "Tags"
 * });
 * ```
 */
export class ArrayField<T = unknown> extends BaseField<ArrayFieldType<T>> {
  constructor(config: FieldConfig) {
    super(config);
  }

  validate(value: ArrayFieldType<T> | undefined): ValidationResult {
    if (value !== undefined && value !== null && !Array.isArray(value)) {
      return {
        valid: false,
        errors: [`${this.label} must be an array`],
      };
    }
    return { valid: true, errors: [] };
  }
}
