// ============================================================
// REFERENCE FIELD
// Field for relationships to other Business Data Objects
// ============================================================

import type { ReferenceFieldType } from "../../types/base-fields";
import type { ReferenceFieldMetaType as ReferenceFieldMetaRawType, ValidationResultType } from "../core/types";
import { api } from "../../api/client";
import { BaseField } from "./BaseField";

/**
 * Field definition for reference/lookup fields.
 * Config is derived from View.DataObject in the raw meta.
 *
 * @template TRef - The type of the referenced record
 *
 * @example
 * ```typescript
 * readonly SupplierInfo = new ReferenceField<SupplierRefType>({
 *   _id: "SupplierInfo", Name: "Supplier", Type: "Reference",
 *   View: {
 *     DataObject: { Type: "BO", Id: "BDO_Supplier" },
 *     Fields: ["_id", "SupplierName", "Email"],
 *   },
 * });
 * ```
 */
export class ReferenceField<TRef = unknown> extends BaseField<
  ReferenceFieldType<TRef>
> {
  constructor(meta: ReferenceFieldMetaRawType) {
    super(meta);
  }

  get referenceBdo(): string {
    return (this._meta as ReferenceFieldMetaRawType).View?.DataObject?.Id ?? "";
  }

  get referenceFields(): readonly string[] {
    return (this._meta as ReferenceFieldMetaRawType).View?.Fields ?? ["_id"];
  }

  get searchFields(): readonly string[] {
    return (this._meta as ReferenceFieldMetaRawType).View?.Search ?? [];
  }

  validate(value: ReferenceFieldType<TRef> | undefined): ValidationResultType {
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
   * Fetch referenced records from the backend via the fetchField API.
   * Requires the field to be bound to a parent BDO.
   */
  async fetchOptions(instanceId: string): Promise<TRef[]> {
    if (!this._parentBoId) {
      throw new Error(
        `Field ${this.id} not bound to a BDO. Cannot fetch options.`
      );
    }
    return api(this._parentBoId).fetchField<TRef>(instanceId, this.id);
  }
}
