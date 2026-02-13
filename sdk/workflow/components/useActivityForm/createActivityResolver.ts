// ============================================================
// ACTIVITY RESOLVER
// ============================================================
// RHF resolver for Activity field type validation.
// Simplified version of createResolver — no expression engine,
// only field-level type validation via BaseField.validate().

import type { FieldValues } from "react-hook-form";
import type { Activity } from "../../Activity";
import type { BaseField } from "../../../bdo/fields/BaseField";
import type { ValidationResultType } from "../../../bdo/core/types";

/**
 * Creates a React Hook Form resolver for Activity field validation.
 *
 * Validates only editable fields using BaseField.validate().
 * Readonly fields (editable: false) are skipped.
 *
 * @param activity - The Activity instance with field definitions
 * @returns RHF Resolver function
 */
export function createActivityResolver<A extends Activity<any, any, any>>(
  activity: A,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (values: FieldValues, _context: any, options: any) => {
    const errors: Record<string, { type: string; message: string }> = {};
    const fields = activity._getFields();

    // If validating specific fields (blur/change), only validate those
    // If validating all (submit), options.names is undefined
    const fieldsToValidate = options?.names ?? Object.keys(fields);

    for (const fieldName of fieldsToValidate) {
      const field = fields[fieldName];
      if (!field) continue;

      // Skip validation for readonly fields
      if (field.readOnly) continue;

      const value = values[fieldName];

      const result: ValidationResultType = (
        field as BaseField<unknown>
      ).validate(value);

      if (!result.valid && result.errors.length > 0) {
        errors[fieldName] = {
          type: "validate",
          message: result.errors[0] || `${fieldName} is invalid`,
        };
      }
    }

    // Return format for RHF resolver
    if (Object.keys(errors).length === 0) {
      return { values, errors: {} };
    }
    return { values: {}, errors };
  };
}
