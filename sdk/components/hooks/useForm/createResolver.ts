import type { FieldValues } from "react-hook-form";
import type { BaseBdo, BaseField, ValidationResult } from "../../../bdo";

/**
 * Creates a React Hook Form resolver for field validation.
 *
 * This resolver is called automatically by RHF based on the `mode` option:
 * - "onBlur": Called when field loses focus (validates only that field via options.names)
 * - "onChange": Called on value change (validates only that field via options.names)
 * - "onSubmit": Called on submit (validates all fields, options.names is undefined)
 *
 * Validation order:
 * 1. Type validation (from field.validate())
 * 2. Expression validation (from backend rules via bdo.validateFieldExpression())
 *
 * Note: Readonly fields are skipped during validation — only editable fields are validated.
 *
 * @param bdo - The BDO instance with field definitions
 * @returns RHF Resolver function
 */
export function createResolver<B extends BaseBdo<any, any, any>>(
  bdo: B,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (values: FieldValues, _context: any, options: any) => {
    const errors: Record<string, { type: string; message: string }> = {};
    const fields = bdo.getFields();

    // If validating specific fields (blur/change), only validate those
    // If validating all (submit), options.names is undefined
    const fieldsToValidate = options?.names ?? Object.keys(fields);

    for (const fieldName of fieldsToValidate) {
      // Skip _id field - not user-editable
      if (fieldName === "_id") continue;

      // Skip validation for readonly and system fields
      if (!fields[fieldName]?.meta.isEditable) continue;

      const field = fields[fieldName];
      if (!field) continue;

      const value = values[fieldName];

      // 1. Type validation (existing)
      const typeResult: ValidationResult = (
        field as BaseField<unknown>
      ).validate(value);

      if (!typeResult.valid && typeResult.errors.length > 0) {
        errors[fieldName] = {
          type: "validate",
          message: typeResult.errors[0] || `${fieldName} is invalid`,
        };
        continue; // Skip expression validation if type validation fails
      }

      // 2. Expression validation (from backend rules)
      if (bdo.hasMetadata()) {
        const exprResult = bdo.validateFieldExpression(
          fieldName,
          value,
          values as Record<string, unknown>
        );

        if (!exprResult.valid && exprResult.errors.length > 0) {
          errors[fieldName] = {
            type: "validate",
            message: exprResult.errors[0],
          };
        }
      }
    }

    // Return format for RHF resolver
    if (Object.keys(errors).length === 0) {
      return { values, errors: {} };
    }
    return { values: {}, errors };
  };
}
