// ============================================================
// SELECT FIELD
// Field for single selection from predefined options
// ============================================================

import type { SelectFieldConfig, SelectOption, ValidationResult, SelectFieldMeta } from "../core/types";
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
  readonly options: readonly SelectOption<T>[];

  constructor(config: SelectFieldConfig<T>) {
    super(config);
    this.options = config.options;
  }

  validate(value: T | undefined): ValidationResult {
    if (value === undefined || value === null || value === "") {
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
   * Get the available options
   */
  getOptions(): readonly SelectOption<T>[] {
    return this.options;
  }

  /**
   * Get the label for a value
   */
  getLabelForValue(value: T): string | undefined {
    return this.options.find((opt) => opt.value === value)?.label;
  }

  /**
   * Get field metadata including options and fetchOptions
   */
  override get meta(): SelectFieldMeta<T> {
    const fieldId = this.id;
    const parentBoId = this._parentBoId;

    return {
      id: this.id,
      label: this.label,
      options: this.options,
      fetchOptions: async (instanceId?: string): Promise<SelectOption<T>[]> => {
        if (!parentBoId) {
          throw new Error(
            `Field ${fieldId} not bound to a BDO. Cannot fetch options.`
          );
        }
        const effectiveInstanceId = instanceId ?? "new";
        const response = await api(parentBoId).fetchField<FetchFieldOptionType>(
          effectiveInstanceId,
          fieldId
        );
        return response.map((item) => ({
          value: item.Value as T,
          label: item.Label,
        }));
      },
    };
  }
}
