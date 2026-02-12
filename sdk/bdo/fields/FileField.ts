// ============================================================
// FILE FIELD
// Field for file attachments
// ============================================================

import type { FileFieldType } from "../../types/base-fields";
import type { FileFieldMetaType, ValidationResultType } from "../core/types";
import { BaseField } from "./BaseField";

/**
 * Field definition for file attachment fields
 *
 * @example
 * ```typescript
 * readonly Attachment = new FileField({
 *   _id: "Attachment", Name: "Attachment", Type: "File",
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

    if (typeof value !== "object" || Array.isArray(value)) {
      return {
        valid: false,
        errors: [`${this.label} must be a valid file object`],
      };
    }

    return { valid: true, errors: [] };
  }
}
