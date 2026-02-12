// ============================================================
// NUMBER FIELD
// Field for numeric values
// ============================================================

import type { NumberFieldType } from "../../types/base-fields";
import type { NumberFieldMetaType, ValidationResultType } from "../core/types";
import { BaseField } from "./BaseField";

/**
 * Field definition for numeric fields
 *
 * @example
 * ```typescript
 * readonly Price = new NumberField({
 *   _id: "Price", Name: "Price", Type: "Number",
 *   Constraint: { IntegerPart: 9, FractionPart: 2 },
 * });
 * ```
 */
export class NumberField extends BaseField<NumberFieldType> {
  constructor(meta: NumberFieldMetaType) {
    super(meta);
  }

  get integerPart(): number { return (this._meta as NumberFieldMetaType).Constraint?.IntegerPart ?? 9; }
  get fractionPart(): number | undefined { return (this._meta as NumberFieldMetaType).Constraint?.FractionPart; }

  validate(value: NumberFieldType | undefined): ValidationResultType {
    if (value !== undefined && value !== null && (typeof value !== "number" || isNaN(value))) {
      return {
        valid: false,
        errors: [`${this.label} must be a valid number`],
      };
    }
    return { valid: true, errors: [] };
  }
}
