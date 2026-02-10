// ============================================================
// OBJECT FIELD
// Field for nested object values
// ============================================================

import type { ObjectFieldType } from "../../types/base-fields";
import type { FieldConfigType, ValidationResultType } from "../core/types";
import { BaseField } from "./BaseField";

/**
 * Field definition for nested object fields
 *
 * @example
 * ```typescript
 * readonly Config = new ObjectField({
 *   id: "Config",
 *   label: "Configuration"
 * });
 * ```
 */
export class ObjectField<
  T extends Record<string, unknown> = Record<string, unknown>,
> extends BaseField<ObjectFieldType<T>> {
  constructor(config: FieldConfigType) {
    super(config);
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
