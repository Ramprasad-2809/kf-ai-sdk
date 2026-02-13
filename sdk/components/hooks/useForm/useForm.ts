import { useMemo, useCallback, useEffect } from "react";
import {
  useForm as useRHF,
  type FieldValues,
  type FieldErrors,
  type Control,
  type RegisterOptions,
  type UseFormReturn as RHFUseFormReturn,
} from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { createResolver } from "./createResolver";
import { createItemProxy } from "./createItemProxy";
import { useDraftInteraction } from "./useDraftInteraction";
import { getBdoSchema } from "../../../api/metadata";
import type { BaseBdo } from "../../../bdo";
import type {
  UseFormOptionsType,
  UseFormReturnType,
  HandleSubmitType,
  AllFieldsType,
  CreatableBdo,
  UpdatableBdo,
  InteractiveCreatableBdo,
} from "./types";

/**
 * A form hook that integrates with React Hook Form.
 *
 * Features:
 * - Automatic validation via resolver (no need to pass rules to register)
 * - Automatic API calls via handleSubmit (create for new records, update for edit)
 * - Item proxy always in sync with form state
 * - Simple create/edit mode switching via recordId
 * - Full access to all RHF methods and state
 * - Smart register: auto-disables readonly fields
 * - Payload filtering: handleSubmit auto-filters to editable fields only
 * - Constraint validation: auto-validates required, length, etc. from field meta
 * - Interactive draft mode: real-time server-side computation on field blur/change
 */
export function useForm<B extends BaseBdo<any, any, any>>(
  options: UseFormOptionsType<B>,
): UseFormReturnType<B> {
  const {
    bdo,
    recordId,
    operation: explicitOperation,
    defaultValues,
    mode = "onBlur",
    enableDraft,
    enableConstraintValidation,
    enableExpressionValidation,
  } = options;

  // ============================================================
  // INTERACTION MODE RESOLUTION
  // ============================================================

  const explicitInteractionMode = (options as any).interactionMode as
    | "interactive"
    | "non-interactive"
    | undefined;

  const interactionMode =
    explicitInteractionMode ??
    (enableDraft === true
      ? "interactive"
      : enableDraft === false
        ? "non-interactive"
        : "interactive");

  const isInteractive = interactionMode === "interactive";

  // Infer operation from recordId if not explicitly provided
  const operation = explicitOperation ?? (recordId ? "update" : "create");

  // ============================================================
  // RESOLVER (memoized)
  // ============================================================

  const resolver = useMemo(
    () => createResolver(bdo, { enableConstraintValidation }),
    [bdo, enableConstraintValidation],
  );

  // ============================================================
  // RECORD FETCHING (Edit Mode)
  // ============================================================

  const {
    data: record,
    isLoading: isLoadingRecord,
    isFetching: isFetchingRecord,
    error: recordError,
  } = useQuery({
    queryKey: ["form-record", bdo.meta._id, recordId],
    queryFn: async () => {
      // bdo.get returns ItemWithData - extract raw data via toJSON
      // Safe: update operation requires UpdatableBdo (enforced by UseFormOptionsType)
      const item = await (bdo as unknown as UpdatableBdo).get(recordId!);
      return item.toJSON();
    },
    enabled: operation === "update" && !!recordId,
    staleTime: 0, // Always fetch fresh data for forms
  });

  // ============================================================
  // SCHEMA FETCHING (for expression validation)
  // ============================================================

  const { data: schema } = useQuery({
    queryKey: ["form-schema", bdo.meta._id],
    queryFn: () => getBdoSchema(bdo.meta._id),
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
    enabled: enableExpressionValidation !== false,
  });

  // Load metadata into bdo when schema is fetched
  useEffect(() => {
    if (schema?.BOBlob) {
      bdo.loadMetadata(schema.BOBlob);
    }
  }, [schema, bdo]);

  // ============================================================
  // REACT HOOK FORM
  // ============================================================

  const form = useRHF<FieldValues>({
    mode,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: resolver as any, // Validation integrated here!
    defaultValues: defaultValues as any,
    // `values` prop reactively updates form when record loads
    values:
      operation === "update" && record ? (record as FieldValues) : undefined,
  });

  // ============================================================
  // FIELD DEFINITIONS
  // ============================================================

  const fields = bdo.getFields();

  // ============================================================
  // DRAFT INTERACTION
  // ============================================================

  const {
    draftId,
    isInitializingDraft,
    isInteracting,
    interactionError,
    triggerInteraction,
    commitDraft,
  } = useDraftInteraction({
    bdo: bdo as unknown as InteractiveCreatableBdo,
    form,
    mode,
    fields,
    enabled: isInteractive && operation === "create",
  });

  // ============================================================
  // ITEM PROXY
  // ============================================================

  const item = useMemo(
    () =>
      createItemProxy(bdo, form as RHFUseFormReturn<FieldValues>),
    [bdo, form],
  );

  // ============================================================
  // SMART REGISTER (auto-disables readonly fields + interaction trigger)
  // ============================================================

  const smartRegister = useCallback(
    (name: string, registerOptions?: RegisterOptions) => {
      const rhfResult = form.register(name as any, registerOptions);

      // If field is readonly, add disabled: true
      if (fields[name]?.readOnly) {
        return { ...rhfResult, disabled: true };
      }

      // In interactive mode, wrap onBlur for blur-triggered interaction
      if (
        isInteractive &&
        (mode === "onBlur" || mode === "onTouched" || mode === "all")
      ) {
        const originalOnBlur = rhfResult.onBlur;
        return {
          ...rhfResult,
          onBlur: async (e: React.FocusEvent) => {
            await originalOnBlur(e); // RHF validation first
            triggerInteraction(); // then server interaction
          },
        };
      }

      return rhfResult;
    },
    [form, fields, isInteractive, mode, triggerInteraction],
  );

  // ============================================================
  // WATCH SUBSCRIPTION (for onChange/all mode interaction)
  // ============================================================

  useEffect(() => {
    if (!isInteractive || (mode !== "onChange" && mode !== "all")) return;

    const subscription = form.watch((_value, { type }) => {
      // RHF fires with type: "change" for user input,
      // type: undefined for programmatic setValue — prevents re-trigger loops
      if (type === "change") {
        triggerInteraction(); // debounced inside useDraftInteraction
      }
    });

    return () => subscription.unsubscribe();
  }, [isInteractive, mode, form, triggerInteraction]);

  // ============================================================
  // CUSTOM HANDLE SUBMIT (with API call + payload filtering)
  // ============================================================

  const handleSubmit: HandleSubmitType = useCallback(
    (onSuccess, onError) => {
      return form.handleSubmit(
        // onValid - validation passed, make API call
        async (data, e) => {
          try {
            const filteredData: Record<string, unknown> = {};
            let result: unknown;

            if (isInteractive && operation === "create") {
              // Interactive create - send only dirty, non-readonly fields
              // (record already exists from init, so only send changes)
              const dirtyFields = form.formState.dirtyFields;
              for (const [key, value] of Object.entries(data)) {
                if (fields[key] && !fields[key].readOnly && dirtyFields[key]) {
                  filteredData[key] = value;
                }
              }
              result = await commitDraft(filteredData);
            } else if (operation === "create") {
              // Non-interactive create - send all known, non-readonly fields
              for (const [key, value] of Object.entries(data)) {
                if (fields[key] && !fields[key].readOnly) {
                  filteredData[key] = value;
                }
              }
              result = await (bdo as unknown as CreatableBdo).create(filteredData);
            } else {
              // Update (always non-interactive) - send only dirty, non-readonly fields
              const dirtyFields = form.formState.dirtyFields;
              for (const [key, value] of Object.entries(data)) {
                if (fields[key] && !fields[key].readOnly && dirtyFields[key]) {
                  filteredData[key] = value;
                }
              }
              result = await (bdo as unknown as UpdatableBdo).update(recordId!, filteredData);
            }

            // Success callback
            onSuccess?.(result as any, e);
          } catch (error) {
            // API error
            onError?.(error as Error, e);
          }
        },
        // onInvalid - validation failed
        (errors, e) => {
          onError?.(errors as FieldErrors, e);
        },
      );
    },
    [form, bdo, operation, recordId, fields, isInteractive, commitDraft],
  );

  // ============================================================
  // RETURN
  // ============================================================

  return {
    // Item - synced with form
    item,

    // BDO reference
    bdo,
    operation,
    recordId,

    // Smart register (auto-disables readonly fields)
    register: smartRegister as any,

    // Custom handleSubmit (handles API call + filters payload)
    handleSubmit,

    // RHF methods (spread, but handleSubmit is overridden above)
    watch: form.watch as any,
    setValue: form.setValue as any,
    getValues: form.getValues as any,
    reset: form.reset as any,
    trigger: form.trigger as any,
    control: form.control as unknown as Control<AllFieldsType<B>>,
    formState: form.formState as any,

    // Flattened state for convenience
    errors: form.formState.errors as any,
    isDirty: form.formState.isDirty,
    isValid: form.formState.isValid,
    isSubmitting: form.formState.isSubmitting,
    isSubmitSuccessful: form.formState.isSubmitSuccessful,
    dirtyFields: form.formState.dirtyFields as any,

    // Loading states
    isLoading: isLoadingRecord || isInitializingDraft,
    isFetching: isFetchingRecord,

    // Error
    loadError: recordError as Error | null,

    // Draft / Interactive mode
    draftId,
    isInitializingDraft,
    isInteracting,
    interactionError,
  };
}
