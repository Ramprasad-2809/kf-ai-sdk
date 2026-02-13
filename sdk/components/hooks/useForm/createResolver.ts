import type { FieldValues } from "react-hook-form";
import type { BaseBdo } from "../../../bdo";
import type { ValidationResultType } from "../../../bdo/core/types";
import type { BaseField } from "../../../bdo/fields/BaseField";

/**
 * Validate field value against constraint metadata.
 */
export function validateConstraints(field: BaseField<unknown>, value: unknown): ValidationResultType {
  const errors: string[] = [];

  // Required
  if (field.required && (value === undefined || value === null || value === "")) {
    errors.push(`${field.label} is required`);
    return { valid: false, errors };
  }

  // Skip further checks if value is empty (not required)
  if (value === undefined || value === null || value === "") {
    return { valid: true, errors: [] };
  }

  // String length
  if ("length" in field && typeof (field as any).length === "number" && typeof value === "string") {
    if (value.length > (field as any).length) {
      errors.push(`${field.label} must be at most ${(field as any).length} characters`);
    }
  }

  // Number integerPart / fractionPart
  if ("integerPart" in field && typeof value === "number") {
    const intPart = Math.floor(Math.abs(value));
    const maxDigits = (field as any).integerPart ?? 9;
    if (intPart.toString().length > maxDigits) {
      errors.push(`${field.label} integer part must be at most ${maxDigits} digits`);
    }
    const fracPart = (field as any).fractionPart;
    if (fracPart !== undefined) {
      const decStr = value.toString().split(".")[1] ?? "";
      if (decStr.length > fracPart) {
        errors.push(`${field.label} can have at most ${fracPart} decimal places`);
      }
    }
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true, errors: [] };
}

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
 * 2. Constraint validation (required, length, etc. from field meta)
 * 3. Expression validation (from backend rules via bdo.validateFieldExpression())
 *
 * Note: Readonly fields are skipped during validation — only editable fields are validated.
 *
 * @param bdo - The BDO instance with field definitions
 * @param resolverOptions - Options for the resolver
 * @returns RHF Resolver function
 */
export function createResolver<B extends BaseBdo<any, any, any>>(
  bdo: B,
  resolverOptions?: { enableConstraintValidation?: boolean },
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

      // Skip validation for readonly fields
      if (fields[fieldName]?.readOnly) continue;

      const field = fields[fieldName];
      if (!field) continue;

      const value = values[fieldName];

      // 1. Type validation (existing)
      const typeResult: ValidationResultType = (
        field as BaseField<unknown>
      ).validate(value);

      if (!typeResult.valid && typeResult.errors.length > 0) {
        errors[fieldName] = {
          type: "validate",
          message: typeResult.errors[0] || `${fieldName} is invalid`,
        };
        continue; // Skip further validation if type validation fails
      }

      // 2. Constraint validation (NEW)
      if (resolverOptions?.enableConstraintValidation !== false) {
        const constraintResult = validateConstraints(field as BaseField<unknown>, value);
        if (!constraintResult.valid && constraintResult.errors.length > 0) {
          errors[fieldName] = {
            type: "constraint",
            message: constraintResult.errors[0],
          };
          continue;
        }
      }

      // 3. Expression validation (from backend rules)
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
