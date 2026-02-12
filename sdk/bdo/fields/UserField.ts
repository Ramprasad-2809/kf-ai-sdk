// ============================================================
// USER FIELD
// Field for user references
// ============================================================

import type { UserFieldType } from "../../types/base-fields";
import type { UserFieldMetaType, ValidationResultType } from "../core/types";
import { BaseField } from "./BaseField";

/**
 * Field definition for user reference fields
 *
 * @example
 * ```typescript
 * readonly _created_by = new UserField({
 *   _id: "_created_by", Name: "Created By", Type: "User", ReadOnly: true,
 * });
 * ```
 */
export class UserField extends BaseField<UserFieldType> {
  constructor(meta: UserFieldMetaType) {
    super(meta);
  }

  /** Business entity ID for user lookup */
  get businessEntity(): string | undefined {
    return (this._meta as UserFieldMetaType).View?.BusinessEntity;
  }

  validate(value: UserFieldType | undefined): ValidationResultType {
    if (value === undefined || value === null) {
      return { valid: true, errors: [] };
    }

    if (typeof value !== "object") {
      return {
        valid: false,
        errors: [`${this.label} must be a valid user object`],
      };
    }

    const userObj = value as Record<string, unknown>;
    if (!("_id" in userObj) || typeof userObj._id !== "string") {
      return {
        valid: false,
        errors: [`${this.label} must have a valid _id`],
      };
    }

    return { valid: true, errors: [] };
  }
}
