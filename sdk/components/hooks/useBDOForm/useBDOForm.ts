import { useMemo, useCallback, useEffect, useRef } from "react";
import {
  useForm as useRHF,
  type FieldValues,
  type FieldErrors,
  type Control,
  type UseFormReturn as RHFUseFormReturn,
} from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { createResolver } from "./createResolver";
import { createItemProxy } from "./createItemProxy";
import {
  coerceFieldValue,
  coerceRecordForForm,
  createSyncField,
  createEnhancedRegister,
  createEnhancedControl,
} from "./shared";
import { getBdoSchema } from "../../../api/metadata";
import { api } from "../../../api/client";
import type { BaseBdo } from "../../../bdo";
import type { CreateUpdateResponseType } from "../../../types/common";
import type {
  UseBDOFormOptionsType,
  UseBDOFormReturnType,
  HandleSubmitType,
  AllFieldsType,
  UpdatableBdo,
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
 * - Per-field sync: validates, sends to API, resets dirty, updates computed fields
 */
export function useBDOForm<B extends BaseBdo<any, any, any>>(
  options: UseBDOFormOptionsType<B>,
): UseBDOFormReturnType<B> {
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
      return coerceRecordForForm(bdo.getFields(), item.toJSON() as Record<string, unknown>);
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
  // PER-FIELD SYNC (validate → API call → reset dirty → update computed)
  // ============================================================

  const fields = bdo.getFields();
  const isComputingRef = useRef(false);

  const readonlyFieldNames = useMemo<string[]>(
    () => Object.keys(fields).filter((k) => fields[k].readOnly),
    [fields],
  );

  const syncApiFn = useCallback(
    async (fieldName: string, value: unknown) => {
      if (operation === "create" && draftData?._id) {
        return api(bdo.meta._id).draftInteraction({
          _id: draftData._id,
          [fieldName]: value,
        });
      } else if (operation === "update" && recordId) {
        return api(bdo.meta._id).update(recordId, {
          [fieldName]: value,
        });
      }
    },
    [operation, draftData, recordId, bdo],
  );

  const syncField = useMemo(
    () =>
      createSyncField({
        apiFn: syncApiFn,
        allFields: fields,
        readonlyFieldNames,
        rhf: form,
        isComputingRef,
      }),
    [syncApiFn, fields, readonlyFieldNames, form],
  );

  const syncOnChange = mode === "onChange" || mode === "all";
  const syncOnBlur =
    mode === "onBlur" || mode === "onTouched" || mode === "all";

  const smartRegister = useMemo(
    () =>
      createEnhancedRegister({
        rhf: form,
        allFields: fields,
        syncField,
        syncOnBlur,
        syncOnChange,
      }),
    [form, fields, syncField, syncOnBlur, syncOnChange],
  );

  const enhancedControl = useMemo(
    () =>
      createEnhancedControl({
        control: form.control,
        syncField,
        syncOnBlur,
        syncOnChange,
      }),
    [form.control, syncField, syncOnBlur, syncOnChange],
  );

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
    control: enhancedControl as unknown as Control<AllFieldsType<B>>,
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
