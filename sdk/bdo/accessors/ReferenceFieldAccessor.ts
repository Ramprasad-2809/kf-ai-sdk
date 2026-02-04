// ============================================================
// REFERENCE FIELD ACCESSOR
// Accessor for reference fields with reference metadata
// ============================================================

import type { ReferenceFieldAccessorInterface, FieldMeta } from "../core/types";
import type { ReferenceField } from "../fields/ReferenceField";
import { FieldAccessor } from "./FieldAccessor";

/**
 * Accessor for reference fields with access to reference metadata
 *
 * Extends FieldAccessor with methods to retrieve reference info.
 *
 * @template T - The type of the referenced record
 *
 * @example
 * ```typescript
 * const accessor = item.field("SupplierInfo") as ReferenceFieldAccessor<SupplierType>;
 * const ref = accessor.reference;
 * console.log(ref.bdo); // "BDO_Supplier"
 * ```
 */
export class ReferenceFieldAccessor<T>
  extends FieldAccessor<T>
  implements ReferenceFieldAccessorInterface<T>
{
  protected readonly _referenceField: ReferenceField<unknown>;

  constructor(
    field: ReferenceField<unknown>,
    getValue: () => T | undefined,
    setValue: (value: T) => void
  ) {
    super(field as unknown as import("../fields/BaseField").BaseField<T>, getValue, setValue);
    this._referenceField = field;
  }

  /**
   * Get field metadata including reference info
   */
  override get meta(): FieldMeta {
    const ref = this._referenceField.getReference();
    return {
      id: this._referenceField.id,
      label: this._referenceField.label,
      reference: {
        bdo: ref.bdo,
        fields: [...ref.fields],
      },
    };
  }

  /**
   * Get reference metadata
   */
  get reference(): { bdo: string; fields: string[] } {
    const ref = this._referenceField.getReference();
    return {
      bdo: ref.bdo,
      fields: [...ref.fields],
    };
  }

  /**
   * Get the _id of the referenced record
   */
  getReferenceId(): string | undefined {
    const value = this.get();
    if (value === undefined || value === null) return undefined;
    if (typeof value === "object" && "_id" in (value as object)) {
      return (value as Record<string, unknown>)._id as string;
    }
    return undefined;
  }
}
