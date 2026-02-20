// ============================================================
// FIELD FACTORY — Runtime Field Construction from Metadata
// ============================================================
// Creates BaseField instances from raw BP activity Input metadata.
// Used by useActivityForm to dynamically build fields when BP
// metadata is fetched at runtime.

import { StringField } from '../bdo/fields/StringField';
import { NumberField } from '../bdo/fields/NumberField';
import { BooleanField } from '../bdo/fields/BooleanField';
import { DateField } from '../bdo/fields/DateField';
import { DateTimeField } from '../bdo/fields/DateTimeField';
import { TextField } from '../bdo/fields/TextField';
import { SelectField } from '../bdo/fields/SelectField';
import { ReferenceField } from '../bdo/fields/ReferenceField';
import { UserField } from '../bdo/fields/UserField';
import { FileField } from '../bdo/fields/FileField';
import type { BaseField } from '../bdo/fields/BaseField';

/**
 * Create a BaseField instance from raw Input field metadata.
 * Used by useActivityForm to dynamically construct fields from BP metadata.
 *
 * @param fieldId - The field identifier (e.g., "StartDate", "LeaveType")
 * @param meta - Raw field metadata from BP Activity Input definition
 * @returns A BaseField instance matching the metadata Type
 */
export function createFieldFromMeta(
  fieldId: string,
  meta: Record<string, unknown>,
): BaseField<unknown> {
  const fullMeta = { _id: fieldId, ...meta };
  const type = meta.Type as string;

  // String + Enum constraint → SelectField
  if (
    type === 'String' &&
    (meta.Constraint as Record<string, unknown> | undefined)?.Enum
  ) {
    return new SelectField(fullMeta as any);
  }

  switch (type) {
    case 'String':
      return new StringField(fullMeta as any);
    case 'Number':
      return new NumberField(fullMeta as any);
    case 'Boolean':
      return new BooleanField(fullMeta as any);
    case 'Date':
      return new DateField(fullMeta as any);
    case 'DateTime':
      return new DateTimeField(fullMeta as any);
    case 'Text':
      return new TextField(fullMeta as any);
    case 'Reference':
      return new ReferenceField(fullMeta as any);
    case 'User':
      return new UserField(fullMeta as any);
    case 'File':
      return new FileField(fullMeta as any);
    default:
      return new StringField(fullMeta as any);
  }
}

/**
 * Build a fields map from an Activity's Input metadata.
 *
 * @param input - The Input object from BP Activity definition
 *                (Record of fieldId → raw field metadata)
 * @returns Record of fieldId → BaseField instance
 */
export function buildFieldsFromInput(
  input: Record<string, Record<string, unknown>>,
): Record<string, BaseField<unknown>> {
  const fields: Record<string, BaseField<unknown>> = {};
  for (const [fieldId, fieldMeta] of Object.entries(input)) {
    fields[fieldId] = createFieldFromMeta(fieldId, fieldMeta);
  }
  return fields;
}

/**
 * Search all activities in a BP blob for a field definition by name.
 * Used to discover field metadata for Context-derived readonly fields.
 *
 * @param currentActivityDef - The current activity definition (to skip)
 * @param bpSchema - The full BP schema (with BDOBlob)
 * @param fieldName - The field name to search for
 * @returns The field metadata or null if not found
 */
export function findFieldInBpActivities(
  currentActivityDef: Record<string, unknown> | null,
  bpSchema: Record<string, unknown> | null | undefined,
  fieldName: string,
): Record<string, unknown> | null {
  const blob = (bpSchema as any)?.BDOBlob;
  if (!blob?.Activity) return null;

  const currentId = (currentActivityDef as any)?.Id;

  for (const activity of blob.Activity as any[]) {
    if (activity.Id === currentId) continue;
    if (activity.Input?.[fieldName]) {
      return activity.Input[fieldName];
    }
  }
  return null;
}
