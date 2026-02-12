// ============================================================
// ARRAY FIELD
// Field for array/multi-value fields
// ============================================================

import type { ArrayFieldType } from "../../types/base-fields";
import type { ArrayFieldMetaType, BaseFieldMetaType, ValidationResultType } from "../core/types";
import { BaseField } from "./BaseField";

/**
 * Field definition for array/multi-value fields
 *
 * @template T - The type of array elements
 *
 * @example
 * ```typescript
 * readonly Tags = new ArrayField<string>({
 *   _id: "Tags", Name: "Tags", Type: "Array",
 * });
 * ```
 */
export class ArrayField<T = unknown> extends BaseField<ArrayFieldType<T>> {
  constructor(meta: ArrayFieldMetaType) {
    super(meta);
  }

  /** Element type descriptor for array items */
  get elementType(): BaseFieldMetaType | undefined {
    return (this._meta as ArrayFieldMetaType).Property;
  }

  validate(value: ArrayFieldType<T> | undefined): ValidationResultType {
    if (value !== undefined && value !== null && !Array.isArray(value)) {
      return {
        valid: false,
        errors: [`${this.label} must be an array`],
      };
    }
    return { valid: true, errors: [] };
  }
}
