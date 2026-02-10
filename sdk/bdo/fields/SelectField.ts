// ============================================================
// SELECT FIELD
// Field for single selection from predefined options
// ============================================================

import type { SelectFieldConfigType, SelectOptionType, ValidationResultType, SelectFieldMetaType } from "../core/types";
import type { FetchFieldOptionType } from "../../types/common";
import { api } from "../../api/client";
import { BaseField } from "./BaseField";

/**
 * Field definition for select fields with predefined options
 *
 * @template T - Union type of allowed option values
 *
 * @example
 * ```typescript
 * readonly Status = new SelectField<"active" | "inactive" | "pending">({
 *   id: "Status",
 *   label: "Status",
 *   options: [
 *     { value: "active", label: "Active" },
 *     { value: "inactive", label: "Inactive" },
 *     { value: "pending", label: "Pending" }
 *   ]
 * });
 * ```
 */
export class SelectField<T extends string = string> extends BaseField<T> {
  protected readonly options: readonly SelectOptionType<T>[];

  constructor(config: SelectFieldConfigType<T>) {
    super(config);
    this.options = config.options;
  }

  validate(value: T | undefined): ValidationResultType {
    if (value === undefined || value === null || value === "") {
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
  async fetchOptions(instanceId?: string): Promise<SelectOptionType<T>[]> {
    if (!this._parentBoId) {
      throw new Error(
        `Field ${this.id} not bound to a BDO. Cannot fetch options.`
      );
    }
    const response = await api(this._parentBoId).fetchField<FetchFieldOptionType>(
      instanceId ?? "new",
      this.id
    );
    return response.map((item) => ({
      value: item.Value as T,
      label: item.Label,
    }));
  }

  /**
   * Get field metadata including static options
   */
  override get meta(): SelectFieldMetaType<T> {
    return {
      id: this.id,
      label: this.label,
      isEditable: this.editable,
      options: this.options,
    };
  }
}
