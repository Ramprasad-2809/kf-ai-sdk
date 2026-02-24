// ============================================================
// USE ACTIVITY FORM HOOK (v2 — Metadata-driven)
// ============================================================
// React hook for building forms bound to workflow activity input fields.
// Fetches BP metadata at runtime, discovers Input fields dynamically,
// and uses update() on blur (not draftStart/draftEnd).

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useForm as useReactHookForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';

import type { Activity } from '../../../workflow/Activity';
import type { UseActivityFormOptions, UseActivityFormReturn } from './types';

import type { CreateUpdateResponseType } from '../../../types/common';
import { createActivityResolver } from './createActivityResolver';
import { createActivityItemProxy } from './createActivityItemProxy';
import {
  coerceFieldValue,
  coerceRecordForForm,
  createSyncField,
  createEnhancedRegister,
  createEnhancedControl,
} from '../useBDOForm/shared';
import { toError } from '../../../utils/error-handling';
import { getBdoSchema } from '../../../api/metadata';
import {
  buildFieldsFromInput,
  createFieldFromMeta,
  findFieldInBpActivities,
} from '../../../workflow/createFieldFromMeta';
import type { BaseField } from '../../../bdo/fields/BaseField';

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

  // Track last data reference to avoid unnecessary resets
  const lastResetDataRef = useRef<Record<string, unknown> | null>(null);

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

  // NOTE: Don't use `values` prop — it continuously syncs and overrides
  // setValue() calls for unregistered fields (Image/File attachments).
  // Instead, we reset once when record arrives (see useEffect below).
  const rhf = useReactHookForm({
    mode,
    defaultValues: defaultValues as any,
    resolver,
  });

  // ============================================================
  // ACTIVITY OPERATIONS
  // ============================================================

  const activityRef = useMemo(() => activity._getOps(), [activity]);

  // ============================================================
  // ITEM PROXY (always in sync with RHF state)
  // ============================================================

  const item = useMemo(
    () =>
      createActivityItemProxy(activity, rhf as any, activity_instance_id),
    [activity, rhf, activity_instance_id],
  );

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
          const coerced = coerceRecordForForm(
            dynamicFields,
            data as Record<string, unknown>,
          );
          const merged = { ...defaultValues, ...coerced };

          if (
            lastResetDataRef.current === null ||
            data !== lastResetDataRef.current
          ) {
            rhf.reset(merged as any);
            lastResetDataRef.current = data as Record<string, unknown>;
          }

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
  // PER-FIELD SYNC (shared with useBDOForm)
  // ============================================================

  const syncApiFn = useCallback(
    (fieldName: string, value: unknown) =>
      activityRef.update(activity_instance_id, {
        [fieldName]: value,
      } as any),
    [activityRef, activity_instance_id],
  );

  const syncField = useMemo(
    () =>
      createSyncField({
        apiFn: syncApiFn,
        allFields,
        readonlyFieldNames,
        rhf,
        isComputingRef,
      }),
    [syncApiFn, allFields, readonlyFieldNames, rhf],
  );

  const syncOnChange = mode === 'onChange' || mode === 'all';
  const syncOnBlur =
    mode === 'onBlur' || mode === 'onTouched' || mode === 'all';

  const register = useMemo(
    () =>
      createEnhancedRegister({
        rhf,
        allFields,
        syncField,
        syncOnBlur,
        syncOnChange,
      }),
    [rhf, allFields, syncField, syncOnBlur, syncOnChange],
  ) as UseActivityFormReturn<A>['register'];

  const enhancedControl = useMemo(
    () =>
      createEnhancedControl({
        control: rhf.control,
        syncField,
        syncOnBlur,
        syncOnChange,
      }),
    [rhf.control, syncField, syncOnBlur, syncOnChange],
  );

  // ============================================================
  // HANDLE SUBMIT — activity.update() + activity.complete()
  // ============================================================

  const handleSubmit = useCallback(
    (
      onSuccess?: (
        data: CreateUpdateResponseType,
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
            // Only send dirty (changed) fields — matches useBDOForm behavior
            // Use getValues() to capture Image/File values set via setValue()
            // that RHF resolver doesn't include in `data`
            const cleanedData: Record<string, unknown> = {};
            const readonlySet = new Set(readonlyFieldNames);
            const dirtyFields = rhf.formState.dirtyFields;
            const allValues = rhf.getValues() as Record<string, unknown>;

            for (const key of Object.keys(allValues)) {
              if (readonlySet.has(key) || !dirtyFields[key]) continue;
              const value =
                allValues[key] !== undefined
                  ? allValues[key]
                  : (data as Record<string, unknown>)[key];
              const field = allFields[key];
              cleanedData[key] = field
                ? coerceFieldValue(field, value)
                : value;
            }

            // Send remaining dirty fields via update
            if (Object.keys(cleanedData).length > 0) {
              await activityRef.update(
                activity_instance_id,
                cleanedData as any,
              );
            }

            // Complete the activity — advances the workflow
            const result = await activityRef.complete(activity_instance_id);

            await onSuccess?.(result, event);
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
