import { useMemo, useCallback, useEffect, useRef } from "react";
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
import { getBdoSchema } from "../../../api/metadata";
import { api } from "../../../api/client";
import type { BaseBdo } from "../../../bdo";
import type { CreateUpdateResponseType } from "../../../types/common";
import type { BaseField } from "../../../bdo/fields/BaseField";
import type {
  UseFormOptionsType,
  UseFormReturnType,
  HandleSubmitType,
  AllFieldsType,
  UpdatableBdo,
} from "./types";

/** Coerce form value to match field's expected type (HTML inputs return strings) */
function coerceFieldValue(field: BaseField<unknown>, value: unknown): unknown {
  const type = field.meta.Type;
  if (typeof value === "string" && type === "Number") {
    return value === "" ? undefined : Number(value);
  }
  // Date/DateTime: empty string → undefined (don't send to backend)
  if (typeof value === "string" && value === "" && (type === "Date" || type === "DateTime")) {
    return undefined;
  }
  // DateTime: normalize to HH:MM:SS and ensure Z suffix for API request format
  if (typeof value === "string" && value !== "" && type === "DateTime") {
    let normalized = value;
    if (normalized.endsWith("Z")) normalized = normalized.slice(0, -1);
    // HTML datetime-local may omit seconds (e.g. "2026-02-18T15:12")
    const timePart = normalized.split("T")[1] || "";
    if ((timePart.match(/:/g) || []).length === 1) {
      normalized += ":00";
    }
    return normalized + "Z";
  }
  return value;
}

/** Strip trailing Z from DateTime response values for HTML datetime-local inputs */
function coerceRecordForForm(bdo: BaseBdo<any, any, any>, data: Record<string, unknown>): Record<string, unknown> {
  const fields = bdo.getFields();
  const result = { ...data };
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === "string" && fields[key]?.meta.Type === "DateTime" && value.endsWith("Z")) {
      result[key] = value.slice(0, -1);
    }
  }
  return result;
}

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
 * - Draft auto-save: creates draft on form open, patches on field changes
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
    enableDraft: _enableDraft = false,
    enableConstraintValidation,
    enableExpressionValidation,
  } = options;

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
      const item = await (bdo as unknown as UpdatableBdo).get(recordId!);
      return coerceRecordForForm(bdo, item.toJSON() as Record<string, unknown>);
    },
    enabled: operation === "update" && !!recordId,
    staleTime: 0,
  });

  // ============================================================
  // DRAFT CREATION (Create Mode - Interactive)
  // ============================================================

  const {
    data: draftData,
    isLoading: isCreatingDraft,
    error: draftError,
  } = useQuery({
    queryKey: ["form-draft", bdo.meta._id],
    queryFn: async () => {
      return api(bdo.meta._id).draftInteraction({});
    },
    enabled: operation === "create",
    staleTime: Infinity,
    gcTime: 0,
    retry: 1,
  });

  // ============================================================
  // SCHEMA FETCHING (for expression validation)
  // ============================================================

  const { data: schema } = useQuery({
    queryKey: ["form-schema", bdo.meta._id],
    queryFn: () => getBdoSchema(bdo.meta._id),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    enabled: enableExpressionValidation !== false,
  });

  // Load metadata into bdo when schema is fetched
  useEffect(() => {
    if (schema?.BDOBlob) {
      bdo.loadMetadata(schema.BDOBlob);
    } else if (schema?.MetaBlob) {
      bdo.loadMetadata(schema.MetaBlob);
    }
  }, [schema, bdo]);

  // ============================================================
  // REACT HOOK FORM
  // ============================================================

  const form = useRHF<FieldValues>({
    mode,
    resolver: resolver as any,
    defaultValues: defaultValues as any,
    // NOTE: Don't use `values` prop — it continuously syncs and overrides
    // setValue() calls for unregistered fields (Image/File attachments).
    // Instead, we reset once when record arrives (see useEffect below).
  });

  // Reset form whenever record data changes (edit mode)
  // Track the record object reference — React Query returns a new object on each fetch,
  // so this resets the form both on initial load AND when navigating between records.
  const lastResetDataRef = useRef<Record<string, unknown> | null>(null);
  useEffect(() => {
    if (operation === "update" && record && record !== lastResetDataRef.current) {
      form.reset(record as FieldValues);
      lastResetDataRef.current = record;
    }
  }, [record, operation, form]);

  // Set draft _id into form values when it arrives
  useEffect(() => {
    if (draftData?._id) {
      form.setValue("_id" as any, draftData._id);
    }
  }, [draftData, form]);

  // ============================================================
  // ITEM PROXY
  // ============================================================

  const item = useMemo(
    () => createItemProxy(bdo, form as RHFUseFormReturn<FieldValues>),
    [bdo, form],
  );

  // ============================================================
  // SMART REGISTER (auto-disables readonly fields)
  // ============================================================

  const fields = bdo.getFields();

  const smartRegister = useCallback(
    (name: string, registerOptions?: RegisterOptions) => {
      const rhfResult = form.register(name as any, registerOptions);
      if (fields[name]?.readOnly) {
        return { ...rhfResult, disabled: true };
      }
      return rhfResult;
    },
    [form, fields],
  );

  // ============================================================
  // DRAFT AUTO-SAVE (Create Mode - patch dirty fields on change)
  // ============================================================

  const draftPatchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (operation !== "create" || !draftData?._id) return;

    const subscription = form.watch((_values, { type }) => {
      if (type !== "change") return;

      if (draftPatchTimeoutRef.current) {
        clearTimeout(draftPatchTimeoutRef.current);
      }

      draftPatchTimeoutRef.current = setTimeout(async () => {
        const currentValues = form.getValues();
        const dirtyFields = form.formState.dirtyFields;
        const dirtyData: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(currentValues)) {
          if (fields[key] && !fields[key].readOnly && dirtyFields[key]) {
            dirtyData[key] = coerceFieldValue(fields[key], value);
          }
        }

        if (Object.keys(dirtyData).length > 0) {
          try {
            await api(bdo.meta._id).draftInteraction({ _id: draftData._id, ...dirtyData });
          } catch {
            // Draft auto-save is best-effort — don't block user interaction
          }
        }
      }, 800);
    });

    return () => {
      subscription.unsubscribe();
      if (draftPatchTimeoutRef.current) {
        clearTimeout(draftPatchTimeoutRef.current);
      }
    };
  }, [form, operation, draftData, fields, bdo]);

  // ============================================================
  // CUSTOM HANDLE SUBMIT (with API call + payload filtering)
  // ============================================================

  const handleSubmit: HandleSubmitType<CreateUpdateResponseType> = useCallback(
    (onSuccess, onError) => {
      return form.handleSubmit(
        async (data, e) => {
          try {
            const filteredData: Record<string, unknown> = {};

            // Get ALL form values at once (includes setValue values for Image/File fields)
            const allValues = form.getValues() as Record<string, unknown>;
            if (operation === "create") {
              for (const [key, field] of Object.entries(fields)) {
                if (field.readOnly) continue;
                // Check both allValues and RHF resolved data for the value
                const value = allValues[key] !== undefined ? allValues[key] : data[key];
                if (value !== undefined) {
                  filteredData[key] = coerceFieldValue(field, value);
                }
              }
            } else {
              const dirtyFields = form.formState.dirtyFields;
              for (const [key, field] of Object.entries(fields)) {
                if (field.readOnly || !dirtyFields[key]) continue;
                const value = allValues[key] !== undefined ? allValues[key] : data[key];
                filteredData[key] = coerceFieldValue(field, value);
              }
            }

            let result: unknown;

            if (operation === "create") {
              filteredData._id = draftData?._id;
              result = await api(bdo.meta._id).draft(filteredData);
            } else {
              result = await api(bdo.meta._id).update(recordId!, filteredData);
            }

            onSuccess?.(result as any, e);
          } catch (error) {
            onError?.(error as Error, e);
          }
        },
        (errors, e) => {
          onError?.(errors as FieldErrors, e);
        },
      );
    },
    [form, bdo, operation, recordId, fields, draftData],
  );

  // ============================================================
  // RETURN
  // ============================================================

  return {
    item,

    bdo,
    operation,
    recordId,

    register: smartRegister as any,
    handleSubmit,

    watch: form.watch as any,
    setValue: form.setValue as any,
    getValues: form.getValues as any,
    reset: form.reset as any,
    trigger: form.trigger as any,
    control: form.control as unknown as Control<AllFieldsType<B>>,
    formState: form.formState as any,

    errors: form.formState.errors as any,
    isDirty: form.formState.isDirty,
    isValid: form.formState.isValid,
    isSubmitting: form.formState.isSubmitting,
    isSubmitSuccessful: form.formState.isSubmitSuccessful,
    dirtyFields: form.formState.dirtyFields as any,

    isLoading: isLoadingRecord || isCreatingDraft,
    isFetching: isFetchingRecord,

    loadError: (recordError ?? draftError) as Error | null,

    draftId: draftData?._id,
    isCreatingDraft,
  };
}
