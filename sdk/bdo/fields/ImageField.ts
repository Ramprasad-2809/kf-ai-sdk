// ============================================================
// IMAGE FIELD
// Field for single image attachments (nullable)
// ============================================================

import type { ImageFieldType } from "../../types/base-fields";
import type { ImageFieldMetaType, ValidationResultType } from "../core/types";
import { BaseField } from "./BaseField";

/**
 * Field definition for single image attachment fields
 *
 * @example
 * ```typescript
 * readonly Avatar = new ImageField({
 *   _id: "Avatar", Name: "Avatar", Type: "Image",
 * });
 * ```
 */
export class ImageField extends BaseField<ImageFieldType> {
  constructor(meta: ImageFieldMetaType) {
    super(meta);
  }

  validate(value: ImageFieldType | undefined): ValidationResultType {
    if (value === undefined || value === null) {
      return { valid: true, errors: [] };
    }

    if (typeof value !== "object" || Array.isArray(value)) {
      return {
        valid: false,
        errors: [`${this.label} must be a valid image object`],
      };
    }

    if (!value._id || !value.FileName) {
      return {
        valid: false,
        errors: [`${this.label} must have _id and FileName`],
      };
    }

    return { valid: true, errors: [] };
  }
}
