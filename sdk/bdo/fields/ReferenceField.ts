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
  readonly referenceBdo: string;
  readonly referenceFields: readonly string[];

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
   * Get reference metadata
   */
  getReference(): { bdo: string; fields: readonly string[] } {
    return {
      bdo: this.referenceBdo,
      fields: this.referenceFields,
    };
  }

  /**
   * Get field metadata including reference info and fetchOptions
   */
  override get meta(): ReferenceFieldMeta<TRef> {
    const fieldId = this.id;
    const parentBoId = this._parentBoId;

    return {
      id: this.id,
      label: this.label,
      reference: {
        bdo: this.referenceBdo,
        fields: [...this.referenceFields],
      },
      fetchOptions: async (instanceId?: string): Promise<TRef[]> => {
        if (!parentBoId) {
          throw new Error(
            `Field ${fieldId} not bound to a BDO. Cannot fetch options.`
          );
        }
        const effectiveInstanceId = instanceId ?? "new";
        return api(parentBoId).fetchField<TRef>(effectiveInstanceId, fieldId);
      },
    };
  }
}
