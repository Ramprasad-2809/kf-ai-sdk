// ============================================================
// ACTIVITY RESOLVER
// ============================================================
// RHF resolver for Activity field validation.
// Accepts either an Activity instance or a fields map (for
// metadata-driven forms). Validates using BaseField.validate()
// plus constraint validation (required, length, number precision).

import type { FieldValues } from 'react-hook-form';
import type { Activity } from '../../../workflow/Activity';
import type { BaseField } from '../../../bdo/fields/BaseField';
import type { ValidationResultType } from '../../../bdo/core/types';
import { validateConstraints } from '../useBDOForm/createResolver';

/**
 * Creates a React Hook Form resolver for Activity field validation.
 *
 * Validates only editable fields using BaseField.validate() + constraint checks.
 * Readonly fields (readOnly: true) are skipped.
 *
 * @param activityOrFields - An Activity instance or a Record of field name to BaseField
 * @returns RHF Resolver function
 */
export function createActivityResolver<A extends Activity<any, any, any>>(
  activityOrFields: A | Record<string, BaseField<unknown>>,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (values: FieldValues, _context: any, options: any) => {
    const errors: Record<string, { type: string; message: string }> = {};

    // Accept either an Activity instance or a raw fields map
    const fields: Record<string, BaseField<unknown>> =
      '_getFields' in activityOrFields
        ? (activityOrFields as A)._getFields()
        : activityOrFields;

    // If validating specific fields (blur/change), only validate those
    // If validating all (submit), options.names is undefined
    const fieldsToValidate = options?.names ?? Object.keys(fields);

    for (const fieldName of fieldsToValidate) {
      const field = fields[fieldName];
      if (!field) continue;

      // Skip validation for readonly fields
      if (field.readOnly) continue;

      let value = values[fieldName];

      // Coerce string values from HTML inputs to the expected type
      if (typeof value === 'string' && field.meta.Type === 'Number') {
        value = value === '' ? undefined : Number(value);
      }

      // 1. Type validation
      const typeResult: ValidationResultType = (
        field as BaseField<unknown>
      ).validate(value);

      if (!typeResult.valid && typeResult.errors.length > 0) {
        errors[fieldName] = {
          type: 'validate',
          message: typeResult.errors[0] || `${fieldName} is invalid`,
        };
        continue;
      }

      // 2. Constraint validation (required, length, number precision)
      const constraintResult = validateConstraints(
        field as BaseField<unknown>,
        value,
      );
      if (!constraintResult.valid && constraintResult.errors.length > 0) {
        errors[fieldName] = {
          type: 'constraint',
          message: constraintResult.errors[0],
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
