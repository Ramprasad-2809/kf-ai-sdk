// ============================================================
// SHARED FORM UTILITIES
// ============================================================
// Coercion functions shared between useBDOForm and useActivityForm.

import type {
  UseFormReturn,
  Control,
  Path,
  FieldValues,
} from 'react-hook-form';
import type { MutableRefObject } from 'react';
import type { BaseField } from '../../../bdo/fields/BaseField';

/** Coerce form value to match field's expected type (HTML inputs return strings) */
export function coerceFieldValue(
  field: BaseField<unknown>,
  value: unknown,
): unknown {
  const type = field.meta.Type;
  if (typeof value === 'string' && type === 'Number') {
    return value === '' ? undefined : Number(value);
  }
  // Date/DateTime: empty string → undefined (don't send to backend)
  if (
    typeof value === 'string' &&
    value === '' &&
    (type === 'Date' || type === 'DateTime')
  ) {
    return undefined;
  }
  // DateTime: normalize to HH:MM:SS and ensure Z suffix for API request format
  if (typeof value === 'string' && value !== '' && type === 'DateTime') {
    let normalized = value;
    if (normalized.endsWith('Z')) normalized = normalized.slice(0, -1);
    // HTML datetime-local may omit seconds (e.g. "2026-02-18T15:12")
    const timePart = normalized.split('T')[1] || '';
    if ((timePart.match(/:/g) || []).length === 1) {
      normalized += ':00';
    }
    return normalized + 'Z';
  }
  return value;
}

/**
 * Strip trailing Z from DateTime response values for HTML datetime-local inputs.
 * Takes a fields map (use bdo.getFields() for BDO forms).
 */
export function coerceRecordForForm(
  fields: Record<string, BaseField<unknown>>,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...data };
  for (const [key, value] of Object.entries(result)) {
    if (
      typeof value === 'string' &&
      fields[key]?.meta.Type === 'DateTime' &&
      value.endsWith('Z')
    ) {
      result[key] = value.slice(0, -1);
    }
  }
  return result;
}

// ============================================================
// SYNC UTILITIES
// ============================================================
// Shared per-field sync pattern used by useBDOForm and useActivityForm.
//   createSyncField         → validate → coerce → API call → reset dirty → update readonly
//   createEnhancedRegister  → inject syncField into register's onBlur/onChange
//   createEnhancedControl   → inject syncField into Controller's control.register

/** API function signature for per-field sync */
export type SyncApiFnType = (
  fieldName: string,
  value: unknown,
) => Promise<unknown>;

export interface CreateSyncFieldOptionsType {
  apiFn: SyncApiFnType;
  allFields: Record<string, BaseField<unknown>>;
  readonlyFieldNames: string[];
  rhf: UseFormReturn;
  isComputingRef: MutableRefObject<boolean>;
}

/**
 * Factory that returns a `syncField(fieldName)` function.
 * Validates the field, coerces its value, sends it to the API,
 * resets dirty state, and updates computed/readonly fields from the response.
 */
export function createSyncField(
  opts: CreateSyncFieldOptionsType,
): (fieldName: string) => Promise<void> {
  const { apiFn, allFields, readonlyFieldNames, rhf, isComputingRef } = opts;

  return async (fieldName: string) => {
    if (isComputingRef.current) return;
    isComputingRef.current = true;

    try {
      const isValid = await rhf.trigger(fieldName as Path<FieldValues>);
      if (!isValid) return;

      const rawValue = rhf.getValues(fieldName as any);
      const field = allFields[fieldName];
      const value = field ? coerceFieldValue(field, rawValue) : rawValue;

      const response = await apiFn(fieldName, value);

      // If apiFn chose not to sync (e.g. draft not ready), skip cleanup
      if (response === undefined) return;

      // Field saved — reset dirty state so it's not re-sent on submit
      rhf.resetField(fieldName as Path<FieldValues>, {
        defaultValue: rawValue,
        keepTouched: true,
        keepError: true,
      } as any);

      // Update computed/readonly fields from response
      if (response && typeof response === 'object') {
        const responseData =
          (response as any).Data ?? (response as any);
        if (responseData && typeof responseData === 'object') {
          const readonlySet = new Set(readonlyFieldNames);
          for (const key of Object.keys(responseData)) {
            if (readonlySet.has(key) && responseData[key] !== undefined) {
              const current = rhf.getValues(key as any);
              if (current !== responseData[key]) {
                rhf.setValue(
                  key as Path<FieldValues>,
                  responseData[key] as any,
                  { shouldDirty: false, shouldValidate: false },
                );
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('syncField failed:', error);
    } finally {
      isComputingRef.current = false;
    }
  };
}

export interface CreateEnhancedRegisterOptionsType {
  rhf: UseFormReturn;
  allFields: Record<string, BaseField<unknown>>;
  syncField: (fieldName: string) => Promise<void>;
  syncOnBlur: boolean;
  syncOnChange: boolean;
}

/**
 * Factory that returns an enhanced `register` function.
 * Injects syncField into onBlur/onChange based on mode, and auto-disables readonly fields.
 */
export function createEnhancedRegister(
  opts: CreateEnhancedRegisterOptionsType,
) {
  const { rhf, allFields, syncField, syncOnBlur, syncOnChange } = opts;

  return (name: string, registerOptions?: any) => {
    const field = allFields[name];
    const isReadonly = field ? field.readOnly : false;

    const result = rhf.register(name as Path<FieldValues>, {
      ...registerOptions,
      ...(syncOnBlur
        ? {
            onBlur: async (e: any) => {
              await registerOptions?.onBlur?.(e);
              await syncField(name);
            },
          }
        : {}),
      ...(syncOnChange
        ? {
            onChange: async (e: any) => {
              await registerOptions?.onChange?.(e);
              await syncField(name);
            },
          }
        : {}),
      ...(isReadonly ? { disabled: true } : {}),
    });

    if (isReadonly) {
      return { ...result, disabled: true as const };
    }

    return result;
  };
}

export interface CreateEnhancedControlOptionsType {
  control: Control;
  syncField: (fieldName: string) => Promise<void>;
  syncOnBlur: boolean;
  syncOnChange: boolean;
}

/**
 * Factory that returns a Proxy over RHF's `control` object.
 * Intercepts `control.register` to inject syncField into onChange/onBlur
 * for Controller components.
 */
export function createEnhancedControl(
  opts: CreateEnhancedControlOptionsType,
): Control {
  const { control, syncField, syncOnBlur, syncOnChange } = opts;

  return new Proxy(control, {
    get(target, prop, receiver) {
      if (prop === 'register') {
        return (name: string, options?: any) => {
          const result = target.register(name as any, options);
          const originalOnChange = result.onChange;
          const originalOnBlur = result.onBlur;

          return {
            ...result,
            ...(syncOnChange
              ? {
                  onChange: async (event: any) => {
                    await originalOnChange(event);
                    await syncField(name);
                  },
                }
              : {}),
            ...(syncOnBlur
              ? {
                  onBlur: async (event: any) => {
                    await originalOnBlur(event);
                    await syncField(name);
                  },
                }
              : {}),
          };
        };
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}
