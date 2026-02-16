// ============================================================
// USE ACTIVITY FORM HOOK
// ============================================================
// React hook for building forms bound to workflow activity input fields.
// Accepts an Activity class instance and integrates with
// react-hook-form and the Workflow API client.

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useForm as useReactHookForm } from "react-hook-form";
import type { Path, FieldValues } from "react-hook-form";

import type { Activity } from "../../Activity";
import type {
  UseActivityFormOptions,
  UseActivityFormReturn,
  AllActivityFields,
} from "./types";

import { createActivityResolver } from "./createActivityResolver";
import { createActivityItemProxy } from "./createActivityItemProxy";
import { toError } from "../../../utils/error-handling";

// ============================================================
// MAIN HOOK
// ============================================================

export function useActivityForm<
  A extends Activity<any, any, any>,
>(
  activity: A,
  options: UseActivityFormOptions<A>,
): UseActivityFormReturn<A> {
  const {
    activity_instance_id,
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
  // FIELD DISCOVERY (memoized)
  // ============================================================

  const fields = useMemo(
    () => activity._getFields(),
    [activity],
  );

  // Identify readonly fields (editable: false) — these are "computed" in workflow context
  const readonlyFieldNames = useMemo<string[]>(
    () =>
      Object.keys(fields).filter(
        (k) => fields[k].readOnly,
      ),
    [fields],
  );

  // ============================================================
  // RESOLVER (field type validation)
  // ============================================================

  const resolver = useMemo(
    () => createActivityResolver(activity),
    [activity],
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

  const activityRef = useMemo(
    () => activity._getOps(),
    [activity],
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
        const data = await activityRef.read(activity_instance_id);

        if (!active) return;

        // Populate form with existing data
        if (data && typeof data === "object") {
          rhf.reset({ ...defaultValues, ...data } as any);
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
  }, [enabled, activityRef, activity_instance_id]);

  // ============================================================
  // DRAFT COMPUTATION ON BLUR
  // ============================================================

  const triggerDraftComputation = useCallback(
    async (_fieldName: string) => {
      // Only trigger if there are readonly/computed fields that might need updating
      if (readonlyFieldNames.length === 0) return;
      if (isComputingRef.current) return;

      if (computeTimeoutRef.current) {
        clearTimeout(computeTimeoutRef.current);
      }

      computeTimeoutRef.current = setTimeout(async () => {
        if (isComputingRef.current) return;
        isComputingRef.current = true;

        try {
          const currentValues = rhf.getValues();

          // Build payload excluding readonly/computed fields
          const payload: Record<string, unknown> = {};
          const readonlySet = new Set(readonlyFieldNames);

          Object.keys(currentValues).forEach((key) => {
            if (!readonlySet.has(key)) {
              (payload as any)[key] = (currentValues as any)[key];
            }
          });

          const response = await activityRef.draftStart(activity_instance_id, payload as any);

          // Apply computed fields returned from the server
          if (response && typeof response === "object") {
            Object.entries(response).forEach(([key, value]) => {
              if (readonlySet.has(key)) {
                const current = rhf.getValues(key as any);
                if (current !== value) {
                  rhf.setValue(key as Path<FieldValues>, value as any, {
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
    [activityRef, readonlyFieldNames, rhf],
  );

  // ============================================================
  // REGISTER (enhanced with onBlur draft computation + auto-disable)
  // ============================================================

  const register = useCallback(
    (name: string, registerOptions?: any) => {
      const field = fields[name];
      const isReadonly = field ? field.readOnly : false;

      const originalOnBlur = registerOptions?.onBlur;

      const enhancedOnBlur = async (e: any) => {
        if (originalOnBlur) {
          await originalOnBlur(e);
        }

        // Mode-aware validation
        let isValid = true;
        const shouldTriggerOnBlur =
          mode === "onBlur" || mode === "onTouched" || mode === "all";

        if (shouldTriggerOnBlur) {
          isValid = await rhf.trigger(name as Path<FieldValues>);
        } else {
          const fieldState = rhf.getFieldState(name as any, rhf.formState);
          isValid = !fieldState.error;
        }

        // Fire draft computation if field is valid
        if (isValid) {
          await triggerDraftComputation(name);
        }
      };

      const result = rhf.register(name as Path<FieldValues>, {
        ...registerOptions,
        onBlur: enhancedOnBlur,
        ...(isReadonly ? { disabled: true } : {}),
      });

      // For readonly fields, add disabled flag to the return
      if (isReadonly) {
        return { ...result, disabled: true as const };
      }

      return result;
    },
    [rhf, fields, triggerDraftComputation, mode],
  ) as UseActivityFormReturn<A>["register"];

  // ============================================================
  // HANDLE SUBMIT — activity.update() + activity.draftEnd()
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
            // Build clean payload (exclude readonly/computed fields)
            const cleanedData: Record<string, unknown> = {};
            const readonlySet = new Set(readonlyFieldNames);

            Object.keys(data).forEach((key) => {
              if (!readonlySet.has(key) && (data as any)[key] !== undefined) {
                cleanedData[key] = (data as any)[key];
              }
            });

            // Save via activity.update() then activity.draftEnd()
            await activityRef.update(activity_instance_id, cleanedData as any);
            await activityRef.draftEnd(activity_instance_id, cleanedData as any);

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
    [rhf, activityRef, readonlyFieldNames],
  ) as UseActivityFormReturn<A>["handleSubmit"];

  // ============================================================
  // HANDLE COMPLETE — activity.complete()
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
    [rhf, activityRef],
  ) as UseActivityFormReturn<A>["handleComplete"];

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
    control: rhf.control as any,

    // Flattened form state
    errors: rhf.formState.errors as any,
    isValid: rhf.formState.isValid,
    isDirty: rhf.formState.isDirty,
    isSubmitting: rhf.formState.isSubmitting || isSubmitting,
    isSubmitSuccessful: rhf.formState.isSubmitSuccessful,

    // Loading
    isLoading,
    loadError,
    hasError,

    // Operations
    clearErrors,
  };
}
