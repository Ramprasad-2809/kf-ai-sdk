// ============================================================
// USE ACTIVITY FORM HOOK
// ============================================================
// React hook for building forms bound to workflow activity input fields.
// Wraps react-hook-form and integrates with the Workflow API client.

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useForm as useReactHookForm } from "react-hook-form";
import type { Path } from "react-hook-form";

import type {
  UseActivityFormOptions,
  UseActivityFormReturn,
  ActivityFieldConfig,
} from "./types";

import { parseActivityFields } from "./fieldParser";
import { Workflow } from "../../client";
import { toError } from "../../../utils/error-handling";

// ============================================================
// MAIN HOOK
// ============================================================

export function useActivityForm<
  T extends Record<string, any> = Record<string, any>,
>(options: UseActivityFormOptions<T>): UseActivityFormReturn<T> {
  const {
    bp_id,
    task_id,
    task_instance_id,
    fields,
    defaultValues = {},
    mode = "onBlur",
    enabled = true,
  } = options;

  // ============================================================
  // STATE
  // ============================================================

  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prevent concurrent draft calls
  const isComputingRef = useRef(false);
  const computeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ============================================================
  // PARSE FIELD DEFINITIONS (memoized)
  // ============================================================

  const fieldConfigs = useMemo(
    () => parseActivityFields(fields),
    [fields]
  );

  const computedFields = useMemo<Array<keyof T>>(
    () =>
      Object.keys(fieldConfigs).filter(
        (k) => fieldConfigs[k].computed
      ) as Array<keyof T>,
    [fieldConfigs]
  );

  const requiredFields = useMemo<Array<keyof T>>(
    () =>
      Object.keys(fieldConfigs).filter(
        (k) => fieldConfigs[k].required
      ) as Array<keyof T>,
    [fieldConfigs]
  );

  // ============================================================
  // DEFAULT VALUES (merge schema defaults + user defaults)
  // ============================================================

  const mergedDefaults = useMemo(() => {
    const vals: Record<string, any> = {};

    // Apply type-appropriate defaults from field configs
    for (const [fieldId, cfg] of Object.entries(fieldConfigs)) {
      if (cfg.defaultValue !== undefined) {
        vals[fieldId] = cfg.defaultValue;
      }
    }

    // User-provided defaults override
    Object.assign(vals, defaultValues);

    return vals as Partial<T>;
  }, [fieldConfigs, defaultValues]);

  // ============================================================
  // REACT HOOK FORM
  // ============================================================

  const rhf = useReactHookForm<T>({
    mode,
    defaultValues: mergedDefaults as any,
  });

  // ============================================================
  // WORKFLOW CLIENT
  // ============================================================

  const activityRef = useMemo(
    () => new Workflow<T>(bp_id).activity(task_id, task_instance_id),
    [bp_id, task_id, task_instance_id]
  );

  // ============================================================
  // LOAD EXISTING DATA — activity.read() on mount
  // ============================================================

  useEffect(() => {
    if (!enabled) return;

    let active = true;

    const loadData = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const data = await activityRef.read();

        if (!active) return;

        // Populate form with existing data
        if (data && typeof data === "object") {
          rhf.reset({ ...mergedDefaults, ...data } as any);
        }
      } catch (error) {
        if (!active) return;
        console.error("Failed to read activity data:", error);
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
  }, [enabled, activityRef]); // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================================
  // DRAFT COMPUTATION ON BLUR
  // ============================================================

  const triggerDraftComputation = useCallback(
    async (_fieldName: string) => {
      // Only trigger if there are computed fields that might need updating
      if (computedFields.length === 0) return;
      if (isComputingRef.current) return;

      if (computeTimeoutRef.current) {
        clearTimeout(computeTimeoutRef.current);
      }

      computeTimeoutRef.current = setTimeout(async () => {
        if (isComputingRef.current) return;
        isComputingRef.current = true;

        try {
          const currentValues = rhf.getValues();

          // Build payload excluding computed fields
          const payload: Partial<T> = {};
          const computedSet = new Set(computedFields as string[]);

          Object.keys(currentValues).forEach((key) => {
            if (!computedSet.has(key)) {
              (payload as any)[key] = (currentValues as any)[key];
            }
          });

          const response = await activityRef.draftStart(payload);

          // Apply computed fields returned from the server
          if (response && typeof response === "object") {
            Object.entries(response).forEach(([key, value]) => {
              if (computedSet.has(key)) {
                const current = rhf.getValues(key as any);
                if (current !== value) {
                  rhf.setValue(key as Path<T>, value as any, {
                    shouldDirty: false,
                    shouldValidate: false,
                  });
                }
              }
            });
          }
        } catch (error) {
          console.warn("Draft computation failed:", error);
        } finally {
          isComputingRef.current = false;
        }
      }, 300);
    },
    [activityRef, computedFields, rhf]
  );

  // ============================================================
  // REGISTER (enhanced with onBlur draft computation)
  // ============================================================

  const register = useCallback(
    <K extends Path<T>>(name: K, options?: any) => {
      const fieldConfig = fieldConfigs[name as string];
      const fieldValidation = fieldConfig?.validation || {};

      const originalOnBlur = options?.onBlur;

      const enhancedOnBlur = async (e: any) => {
        if (originalOnBlur) {
          await originalOnBlur(e);
        }

        // Mode-aware validation
        let isValid = true;
        const shouldTriggerOnBlur =
          mode === "onBlur" || mode === "onTouched" || mode === "all";

        if (shouldTriggerOnBlur) {
          isValid = await rhf.trigger(name);
        } else {
          const fieldState = rhf.getFieldState(name, rhf.formState);
          isValid = !fieldState.error;
        }

        // Fire draft computation if field is valid
        if (isValid) {
          await triggerDraftComputation(name as string);
        }
      };

      return rhf.register(name, {
        ...fieldValidation,
        ...options,
        onBlur: enhancedOnBlur,
      });
    },
    [rhf, fieldConfigs, triggerDraftComputation, mode]
  );

  // ============================================================
  // HANDLE SUBMIT — activity.update() + activity.draftEnd()
  // ============================================================

  const handleSubmit = useCallback(
    (
      onSuccess?: (
        data: T,
        e?: React.BaseSyntheticEvent
      ) => void | Promise<void>,
      onError?: (
        error: import("react-hook-form").FieldErrors<T> | Error,
        e?: React.BaseSyntheticEvent
      ) => void | Promise<void>
    ) => {
      return rhf.handleSubmit(
        async (data, event) => {
          setIsSubmitting(true);

          try {
            // Build clean payload (exclude computed fields)
            const cleanedData: Partial<T> = {};
            const computedSet = new Set(computedFields as string[]);

            Object.keys(data).forEach((key) => {
              if (!computedSet.has(key) && (data as any)[key] !== undefined) {
                (cleanedData as any)[key] = (data as any)[key];
              }
            });

            // Save via activity.update() then activity.draftEnd()
            await activityRef.update(cleanedData);
            await activityRef.draftEnd(cleanedData);

            await onSuccess?.(data, event);
          } catch (error) {
            onError?.(toError(error), event);
          } finally {
            setIsSubmitting(false);
          }
        },
        (errors, event) => {
          onError?.(errors, event);
        }
      );
    },
    [rhf, activityRef, computedFields]
  );

  // ============================================================
  // HANDLE COMPLETE — activity.complete()
  // ============================================================

  const handleComplete = useCallback(
    (
      onSuccess?: (
        data: T,
        e?: React.BaseSyntheticEvent
      ) => void | Promise<void>,
      onError?: (
        error: import("react-hook-form").FieldErrors<T> | Error,
        e?: React.BaseSyntheticEvent
      ) => void | Promise<void>
    ) => {
      return rhf.handleSubmit(
        async (data, event) => {
          setIsSubmitting(true);

          try {
            await activityRef.complete();
            await onSuccess?.(data, event);
          } catch (error) {
            onError?.(toError(error), event);
          } finally {
            setIsSubmitting(false);
          }
        },
        (errors, event) => {
          onError?.(errors, event);
        }
      );
    },
    [rhf, activityRef]
  );

  // ============================================================
  // FIELD HELPERS
  // ============================================================

  const getField = useCallback(
    <K extends keyof T>(name: K): ActivityFieldConfig | null => {
      return fieldConfigs[name as string] || null;
    },
    [fieldConfigs]
  );

  const getFields = useCallback((): Record<keyof T, ActivityFieldConfig> => {
    const typed: Record<keyof T, ActivityFieldConfig> = {} as any;
    Object.entries(fieldConfigs).forEach(([key, cfg]) => {
      (typed as any)[key] = cfg;
    });
    return typed;
  }, [fieldConfigs]);

  const isFieldRequired = useCallback(
    <K extends keyof T>(name: K): boolean => {
      return fieldConfigs[name as string]?.required ?? false;
    },
    [fieldConfigs]
  );

  const isFieldComputed = useCallback(
    <K extends keyof T>(name: K): boolean => {
      return fieldConfigs[name as string]?.computed ?? false;
    },
    [fieldConfigs]
  );

  const clearErrors = useCallback((): void => {
    rhf.clearErrors();
  }, [rhf]);

  // ============================================================
  // RETURN
  // ============================================================

  const hasError = !!loadError;

  return {
    // Form methods
    register,
    handleSubmit,
    handleComplete,
    watch: rhf.watch as any,
    setValue: rhf.setValue,
    reset: rhf.reset,

    // Flattened form state
    errors: rhf.formState.errors,
    isValid: rhf.formState.isValid,
    isDirty: rhf.formState.isDirty,
    isSubmitting: rhf.formState.isSubmitting || isSubmitting,
    isSubmitSuccessful: rhf.formState.isSubmitSuccessful,

    // Loading
    isLoading,
    loadError,
    hasError,

    // Field info
    fieldConfigs,
    computedFields,
    requiredFields,
    getField,
    getFields,
    isFieldRequired,
    isFieldComputed,

    // Operations
    clearErrors,
  };
}
