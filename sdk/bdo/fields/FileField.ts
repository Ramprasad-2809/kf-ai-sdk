// ============================================================
// FILE FIELD
// Field for file attachments (array of files)
// ============================================================

import type { FileFieldType } from "../../types/base-fields";
import type { FileFieldMetaType, ValidationResultType } from "../core/types";
import { BaseField } from "./BaseField";

/**
 * Field definition for file attachment fields
 *
 * @example
 * ```typescript
 * readonly Attachments = new FileField({
 *   _id: "Attachments", Name: "Attachments", Type: "File",
 * });
 * ```
 */
export class FileField extends BaseField<FileFieldType> {
  constructor(meta: FileFieldMetaType) {
    super(meta);
  }

  validate(value: FileFieldType | undefined): ValidationResultType {
    if (value === undefined || value === null) {
      return { valid: true, errors: [] };
    }

    if (!Array.isArray(value)) {
      return {
        valid: false,
        errors: [`${this.label} must be an array of file objects`],
      };
    }

    for (const item of value) {
      if (!item || typeof item !== "object" || !item._id) {
        return {
          valid: false,
          errors: [`Each file in ${this.label} must have an _id`],
        };
      }
    }

    return { valid: true, errors: [] };
  }
}
