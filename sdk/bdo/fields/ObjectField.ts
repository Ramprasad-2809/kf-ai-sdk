// ============================================================
// OBJECT FIELD
// Field for nested object values
// ============================================================

import type { ObjectFieldType } from "../../types/base-fields";
import type { ObjectFieldMetaType, ValidationResultType } from "../core/types";
import { BaseField } from "./BaseField";

/**
 * Field definition for nested object fields
 *
 * @example
 * ```typescript
 * readonly Config = new ObjectField({
 *   _id: "Config", Name: "Configuration", Type: "Object",
 * });
 * ```
 */
export class ObjectField<
  T extends Record<string, unknown> = Record<string, unknown>,
> extends BaseField<ObjectFieldType<T>> {
  constructor(meta: ObjectFieldMetaType) {
    super(meta);
  }

  /** Nested property definitions */
  get properties(): Record<string, unknown> | undefined {
    return (this._meta as ObjectFieldMetaType).Property;
  }

  validate(value: ObjectFieldType<T> | undefined): ValidationResultType {
    if (value === undefined || value === null) {
      return { valid: true, errors: [] };
    }

    if (typeof value !== "object" || Array.isArray(value)) {
      return {
        valid: false,
        errors: [`${this.label} must be a valid object`],
      };
    }

    return { valid: true, errors: [] };
  }
}
