// ============================================================
// SELECT FIELD
// Field for single selection from predefined options
// ============================================================

import type { SelectFieldMetaType as SelectFieldMetaRawType, SelectOptionType, ValidationResultType } from "../core/types";
import type { FetchFieldOptionType } from "../../types/common";
import { api } from "../../api/client";
import { BaseField } from "./BaseField";

/**
 * Field definition for select fields.
 * Options are derived from Constraint.Enum in the raw meta.
 *
 * @template T - Union type of allowed option values
 *
 * @example
 * ```typescript
 * readonly Status = new SelectField<"active" | "inactive">({
 *   _id: "Status", Name: "Status", Type: "String",
 *   Constraint: { Enum: ["active", "inactive"] },
 * });
 * ```
 */
export class SelectField<T extends string | number = string> extends BaseField<T> {
  constructor(meta: SelectFieldMetaRawType) {
    super(meta);
  }

  /** Static options derived from Constraint.Enum */
  get options(): readonly SelectOptionType<T>[] {
    const enumValues = (this._meta as SelectFieldMetaRawType).Constraint?.Enum ?? [];
    return enumValues.map(v => ({ value: v as T, label: v }));
  }

  validate(value: T | undefined): ValidationResultType {
    if (value === undefined || value === null || (value as string) === "") {
      return { valid: true, errors: [] };
    }

    // Skip options check for dynamic-only selects (empty static options)
    if (this.options.length === 0) {
      return { valid: true, errors: [] };
    }

    const validValues = this.options.map((opt) => opt.value);
    if (!validValues.includes(value)) {
      return {
        valid: false,
        errors: [`${this.label} must be one of: ${validValues.join(", ")}`],
      };
    }

    return { valid: true, errors: [] };
  }

  /**
   * Fetch dynamic options from the backend, returned as typed SelectOption[]
   */
  async fetchOptions(instanceId: string = "draft"): Promise<SelectOptionType<T>[]> {
    if (!this._parentBoId) {
      throw new Error(
        `Field ${this.id} not bound to a BDO. Cannot fetch options.`
      );
    }
    const response = await api(this._parentBoId).fetchField<FetchFieldOptionType>(
      instanceId,
      this.id
    );
    return response.map((item) => ({
      value: item.Value as T,
      label: item.Label,
    }));
  }
}
