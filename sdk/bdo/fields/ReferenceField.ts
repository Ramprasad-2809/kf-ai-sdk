// ============================================================
// REFERENCE FIELD
// Field for relationships to other Business Data Objects
// ============================================================

import type { ReferenceFieldType } from "../../types/base-fields";
import type { ReferenceFieldConfig, ValidationResult, ReferenceFieldMeta } from "../core/types";
import { api } from "../../api/client";
import { BaseField } from "./BaseField";

/**
 * Field definition for reference/lookup fields
 *
 * @template TRef - The type of the referenced record
 *
 * @example
 * ```typescript
 * readonly SupplierInfo = new ReferenceField<SupplierType>({
 *   id: "SupplierInfo",
 *   label: "Supplier",
 *   referenceBdo: "BDO_Supplier",
 *   referenceFields: ["_id", "SupplierName", "Email"]
 * });
 * ```
 */
export class ReferenceField<TRef = unknown> extends BaseField<
  ReferenceFieldType<TRef>
> {
  protected readonly referenceBdo: string;
  protected readonly referenceFields: readonly string[];

  constructor(config: ReferenceFieldConfig<TRef>) {
    super(config);
    this.referenceBdo = config.referenceBdo;
    this.referenceFields = config.referenceFields ?? ["_id"];
  }

  validate(value: ReferenceFieldType<TRef> | undefined): ValidationResult {
    if (value === undefined || value === null) {
      return { valid: true, errors: [] };
    }

    if (typeof value !== "object") {
      return {
        valid: false,
        errors: [`${this.label} must be a valid reference object`],
      };
    }

    const refObj = value as Record<string, unknown>;
    if (!("_id" in refObj) || typeof refObj._id !== "string") {
      return {
        valid: false,
        errors: [`${this.label} must have a valid _id`],
      };
    }

    return { valid: true, errors: [] };
  }

  /**
   * Fetch referenced records from the backend, returned as typed TRef[]
   */
  async fetchOptions(instanceId?: string): Promise<TRef[]> {
    if (!this._parentBoId) {
      throw new Error(
        `Field ${this.id} not bound to a BDO. Cannot fetch options.`
      );
    }
    return api(this._parentBoId).fetchField<TRef>(instanceId ?? "new", this.id);
  }

  /**
   * Get field metadata including reference info
   */
  override get meta(): ReferenceFieldMeta {
    return {
      id: this.id,
      label: this.label,
      isEditable: this.editable,
      reference: {
        bdo: this.referenceBdo,
        fields: [...this.referenceFields],
      },
    };
  }
}
