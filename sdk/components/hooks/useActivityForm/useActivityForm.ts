// ============================================================
// USE ACTIVITY FORM HOOK (v2 — Metadata-driven)
// ============================================================
// React hook for building forms bound to workflow activity input fields.
// Fetches BP metadata at runtime, discovers Input fields dynamically,
// and uses update() on blur (not draftStart/draftEnd).

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useForm as useReactHookForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import type { Path, FieldValues } from 'react-hook-form';

import type { Activity } from '../../../workflow/Activity';
import type {
  UseActivityFormOptions,
  UseActivityFormReturn,
  AllActivityFields,
} from './types';

import { createActivityResolver } from './createActivityResolver';
import { createActivityItemProxy } from './createActivityItemProxy';
import { toError } from '../../../utils/error-handling';
import { getBdoSchema } from '../../../api/metadata';
import {
  buildFieldsFromInput,
  createFieldFromMeta,
  findFieldInBpActivities,
} from '../../../workflow/createFieldFromMeta';
import type { BaseField } from '../../../bdo/fields/BaseField';

// ============================================================
// FIELD VALUE COERCION (HTML inputs return strings)
// ============================================================

/** Coerce form value to match field's expected type before sending to API */
function coerceFieldValue(
  field: BaseField<unknown>,
  value: unknown,
): unknown {
  const type = field.meta.Type;
  // Number: string → number
  if (typeof value === 'string' && type === 'Number') {
    return value === '' ? undefined : Number(value);
  }
  // Date/DateTime: empty string → undefined
  if (
    typeof value === 'string' &&
    value === '' &&
    (type === 'Date' || type === 'DateTime')
  ) {
    return undefined;
  }
  // DateTime: normalize to HH:MM:SS and ensure Z suffix
  if (typeof value === 'string' && value !== '' && type === 'DateTime') {
    let normalized = value;
    if (normalized.endsWith('Z')) normalized = normalized.slice(0, -1);
    const timePart = normalized.split('T')[1] || '';
    if ((timePart.match(/:/g) || []).length === 1) {
      normalized += ':00';
    }
    return normalized + 'Z';
  }
  return value;
}

// ============================================================
// MAIN HOOK
// ============================================================

export function useActivityForm<A extends Activity<any, any, any>>(
  activity: A,
  options: UseActivityFormOptions<A>,
): UseActivityFormReturn<A> {
  const {
    activity_instance_id,
    defaultValues = {},
    mode = 'onBlur',
    enabled = true,
  } = options;

  // ============================================================
  // STATE
  // ============================================================

  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extra readonly fields discovered from read() response (Context-derived)
  const [extraReadonlyFields, setExtraReadonlyFields] = useState<
    Record<string, BaseField<unknown>>
  >({});

  // Prevent concurrent update calls
  const isComputingRef = useRef(false);

  // ============================================================
  // 1. FETCH BP METADATA
  // ============================================================

  const { data: bpSchema, isLoading: isBpLoading } = useQuery({
    queryKey: ['bp-metadata', activity.meta.businessProcessId],
    queryFn: () => getBdoSchema(activity.meta.businessProcessId),
    staleTime: 30 * 60 * 1000,
  });

  // ============================================================
  // 2. EXTRACT ACTIVITY DEFINITION FROM BP BLOB
  // ============================================================

  const activityDef = useMemo(() => {
    const blob = bpSchema?.BDOBlob;
    if (!blob?.Activity) return null;
    return (
      (blob.Activity as any[]).find(
        (a: any) => a.Id === activity.meta.activityId,
      ) ?? null
    );
  }, [bpSchema, activity.meta.activityId]);

  const isMetadataLoading = isBpLoading;

  // ============================================================
  // 5. BUILD DYNAMIC FIELDS FROM INPUT METADATA
  // ============================================================

  const dynamicFields = useMemo(() => {
    if (!activityDef?.Input) return activity._getFields(); // fallback to class fields
    return buildFieldsFromInput(activityDef.Input as Record<string, Record<string, unknown>>);
  }, [activityDef, activity]);

  // ============================================================
  // 5b. COMBINE ALL FIELDS (Input + extra readonly from Context)
  // ============================================================

  const allFields = useMemo(
    () => ({
      ...extraReadonlyFields, // readonly fields from other activities
      ...dynamicFields, // Input fields (editable + readonly)
    }),
    [extraReadonlyFields, dynamicFields],
  );

  // Identify readonly fields (Formula fields, or fields with ReadOnly: true)
  const readonlyFieldNames = useMemo<string[]>(
    () => Object.keys(allFields).filter((k) => allFields[k].readOnly),
    [allFields],
  );

  // ============================================================
  // 6. RESOLVER (from dynamic fields — type + constraint validation)
  // ============================================================

  const resolver = useMemo(
    () => createActivityResolver(dynamicFields),
    [dynamicFields],
  );

  // ============================================================
  // REACT HOOK FORM
  // ============================================================

  const rhf = useReactHookForm({
    mode,
    defaultValues: defaultValues as any,
    resolver,
  });

  // ============================================================
  // ITEM PROXY (always in sync with RHF state)
  // ============================================================

  const item = useMemo(
    () => createActivityItemProxy(activity, rhf as any),
    [activity, rhf],
  );

  // ============================================================
  // ACTIVITY OPERATIONS
  // ============================================================

  const activityRef = useMemo(() => activity._getOps(), [activity]);

  // ============================================================
  // LOAD EXISTING DATA — activity.read() on mount
  // ============================================================

  useEffect(() => {
    if (!enabled || isMetadataLoading) return;

    let active = true;

    const loadData = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const data = await activityRef.read(activity_instance_id);

        if (!active) return;

        // Populate form with existing data
        if (data && typeof data === 'object') {
          rhf.reset({ ...defaultValues, ...data } as any);

          // Detect extra fields from Context (not in Input metadata)
          const activitySystemFields = new Set([
            '_id',
            'BPInstanceId',
            'Status',
            'AssignedTo',
            'CompletedAt',
            '_created_at',
            '_modified_at',
            '_created_by',
            '_modified_by',
            '_v',
            '_m_v',
          ]);

          const extras: Record<string, BaseField<unknown>> = {};
          for (const key of Object.keys(data)) {
            if (!dynamicFields[key] && !activitySystemFields.has(key)) {
              // Look up field definition from other activities in the BP
              const fieldDef = findFieldInBpActivities(
                activityDef,
                bpSchema,
                key,
              );
              if (fieldDef) {
                extras[key] = createFieldFromMeta(key, {
                  ...fieldDef,
                  ReadOnly: true,
                });
              }
            }
          }
          if (Object.keys(extras).length > 0) {
            setExtraReadonlyFields(extras);
          }
        }
      } catch (error) {
        if (!active) return;
        console.error('Failed to read activity data:', error);
        setLoadError(toError(error));
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, isMetadataLoading, activityRef, activity_instance_id]);

  // ============================================================
  // SYNC FIELD — validate + send single field value to API
  // ============================================================

  const syncField = useCallback(
    async (fieldName: string) => {
      if (isComputingRef.current) return;
      isComputingRef.current = true;

      try {
        const isValid = await rhf.trigger(fieldName as Path<FieldValues>);
        if (!isValid) return;

        const rawValue = rhf.getValues(fieldName as any);
        const field = allFields[fieldName];
        const value = field
          ? coerceFieldValue(field, rawValue)
          : rawValue;

        const response = await activityRef.update(activity_instance_id, {
          [fieldName]: value,
        } as any);

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
    },
    [activityRef, readonlyFieldNames, allFields, rhf, activity_instance_id],
  );

  // ============================================================
  // MODE-AWARE HANDLER ENHANCEMENT
  // Injects syncField into onChange/onBlur based on consumer's mode
  // ============================================================

  const syncOnChange = mode === 'onChange' || mode === 'all';
  const syncOnBlur = mode === 'onBlur' || mode === 'onTouched' || mode === 'all';

  // ============================================================
  // REGISTER (enhanced with mode-aware sync + auto-disable)
  // ============================================================

  const register = useCallback(
    (name: string, registerOptions?: any) => {
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
    },
    [rhf, allFields, syncField, syncOnBlur, syncOnChange],
  ) as UseActivityFormReturn<A>['register'];

  // ============================================================
  // ENHANCED CONTROL (for Controller — same sync behavior as register)
  // ============================================================

  const enhancedControl = useMemo(
    () =>
      new Proxy(rhf.control, {
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
      }),
    [rhf.control, syncField, syncOnChange, syncOnBlur],
  );

  // ============================================================
  // HANDLE SUBMIT — activity.update()
  // ============================================================

  const handleSubmit = useCallback(
    (
      onSuccess?: (
        data: AllActivityFields<A>,
        e?: React.BaseSyntheticEvent,
      ) => void | Promise<void>,
      onError?: (
        error: any,
        e?: React.BaseSyntheticEvent,
      ) => void | Promise<void>,
    ) => {
      return rhf.handleSubmit(
        async (data, event) => {
          setIsSubmitting(true);

          try {
            // Only send dirty (changed) fields — matches useForm update behavior
            const cleanedData: Record<string, unknown> = {};
            const readonlySet = new Set(readonlyFieldNames);
            const dirtyFields = rhf.formState.dirtyFields;

            for (const [key, value] of Object.entries(data)) {
              if (!readonlySet.has(key) && dirtyFields[key]) {
                const field = allFields[key];
                cleanedData[key] = field
                  ? coerceFieldValue(field, value)
                  : value;
              }
            }

            // Save via activity.update()
            if (Object.keys(cleanedData).length > 0) {
              await activityRef.update(
                activity_instance_id,
                cleanedData as any,
              );
            }

            await onSuccess?.(data as AllActivityFields<A>, event);
          } catch (error) {
            onError?.(toError(error), event);
          } finally {
            setIsSubmitting(false);
          }
        },
        (errors, event) => {
          onError?.(errors, event);
        },
      );
    },
    [rhf, activityRef, readonlyFieldNames, allFields, activity_instance_id],
  ) as UseActivityFormReturn<A>['handleSubmit'];

  // ============================================================
  // HANDLE COMPLETE — activity.update() + activity.complete()
  // ============================================================

  const handleComplete = useCallback(
    (
      onSuccess?: (
        data: AllActivityFields<A>,
        e?: React.BaseSyntheticEvent,
      ) => void | Promise<void>,
      onError?: (
        error: any,
        e?: React.BaseSyntheticEvent,
      ) => void | Promise<void>,
    ) => {
      return rhf.handleSubmit(
        async (data, event) => {
          setIsSubmitting(true);

          try {
            // Only send dirty (changed) fields — matches useForm update behavior
            const cleanedData: Record<string, unknown> = {};
            const readonlySet = new Set(readonlyFieldNames);
            const dirtyFields = rhf.formState.dirtyFields;

            for (const [key, value] of Object.entries(data)) {
              if (!readonlySet.has(key) && dirtyFields[key]) {
                const field = allFields[key];
                cleanedData[key] = field
                  ? coerceFieldValue(field, value)
                  : value;
              }
            }

            if (Object.keys(cleanedData).length > 0) {
              await activityRef.update(
                activity_instance_id,
                cleanedData as any,
              );
            }
            await activityRef.complete(activity_instance_id);
            await onSuccess?.(data as AllActivityFields<A>, event);
          } catch (error) {
            onError?.(toError(error), event);
          } finally {
            setIsSubmitting(false);
          }
        },
        (errors, event) => {
          onError?.(errors, event);
        },
      );
    },
    [rhf, activityRef, readonlyFieldNames, allFields, activity_instance_id],
  ) as UseActivityFormReturn<A>['handleComplete'];

  // ============================================================
  // CLEAR ERRORS
  // ============================================================

  const clearErrors = useCallback((): void => {
    rhf.clearErrors();
  }, [rhf]);

  // ============================================================
  // RETURN
  // ============================================================

  const hasError = !!loadError;

  return {
    // Item proxy
    item,

    // Activity reference
    activity,

    // Form methods
    register,
    handleSubmit,
    handleComplete,
    watch: rhf.watch as any,
    setValue: rhf.setValue as any,
    getValues: rhf.getValues as any,
    reset: rhf.reset as any,
    trigger: rhf.trigger as any,
    control: enhancedControl as any,

    // Flattened form state
    errors: rhf.formState.errors as any,
    isValid: rhf.formState.isValid,
    isDirty: rhf.formState.isDirty,
    isSubmitting: rhf.formState.isSubmitting || isSubmitting,
    isSubmitSuccessful: rhf.formState.isSubmitSuccessful,

    // Loading
    isLoading: isLoading || isMetadataLoading,
    isMetadataLoading,
    loadError,
    hasError,

    // Metadata
    bpMetadata: bpSchema ?? null,

    // Operations
    clearErrors,
  };
}
