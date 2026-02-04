import { useMemo, useCallback, useEffect } from "react";
import {
  useForm,
  type FieldValues,
  type FieldErrors,
  type Control,
  type UseFormReturn,
} from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { createBdoResolver } from "./createBdoResolver";
import { createItemProxy } from "./createItemProxy";
import { getBdoSchema } from "../../../api/metadata";
import type {
  UseBdoFormOptions,
  UseBdoFormReturn,
  HandleSubmitType,
} from "./types";

/**
 * A form hook that integrates BDO with React Hook Form.
 *
 * Features:
 * - Automatic validation via BDO resolver (no need to pass rules to register)
 * - Automatic API calls via handleSubmit (create for new records, update for edit)
 * - Item proxy always in sync with form state
 * - Simple create/edit mode switching via recordId
 * - Full access to all RHF methods and state
 *
 * @example
 * ```tsx
 * const product = new AdminProduct();
 *
 * // Create mode
 * const { register, handleSubmit, item, errors } = useBdoForm({
 *   bdo: product,
 *   defaultValues: { Title: "", Price: 0 },
 * });
 *
 * // Edit mode
 * const { register, handleSubmit, item, isLoading } = useBdoForm({
 *   bdo: product,
 *   recordId: "product_123",
 * });
 *
 * // In JSX - validation AND API call are automatic!
 * <form onSubmit={handleSubmit(
 *   (result) => toast.success("Saved!"),
 *   (error) => toast.error(error.message)
 * )}>
 *   <input {...register("Title")} />
 *   {errors.Title && <span>{errors.Title.message}</span>}
 * </form>
 * ```
 */
export function useBdoForm<TEntity extends FieldValues, TRead = TEntity>(
  options: UseBdoFormOptions<TEntity>,
): UseBdoFormReturn<TEntity, TRead> {
  const {
    bdo,
    recordId,
    operation: explicitOperation,
    defaultValues,
    mode = "onBlur",
    enableDraft: _enableDraft = false,
  } = options;

  // Infer operation from recordId if not explicitly provided
  const operation = explicitOperation ?? (recordId ? "update" : "create");

  // ============================================================
  // BDO RESOLVER (memoized)
  // ============================================================

  const resolver = useMemo(() => createBdoResolver(bdo), [bdo]);

  // ============================================================
  // RECORD FETCHING (Edit Mode)
  // ============================================================

  const {
    data: record,
    isLoading: isLoadingRecord,
    error: recordError,
  } = useQuery({
    queryKey: ["bdo-form-record", bdo.boId, recordId],
    queryFn: async () => {
      // bdo.get returns ItemWithData - extract raw data via toJSON
      const item = await (bdo as any).get(recordId!);
      return item.toJSON() as TRead;
    },
    enabled: operation === "update" && !!recordId,
    staleTime: 0, // Always fetch fresh data for forms
  });

  // ============================================================
  // BDO SCHEMA FETCHING (for expression validation)
  // ============================================================

  const { data: schema } = useQuery({
    queryKey: ["bdo-schema", bdo.boId],
    queryFn: () => getBdoSchema(bdo.boId),
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
  });

  // Load metadata into BDO when schema is fetched
  useEffect(() => {
    if (schema?.BOBlob) {
      bdo.loadMetadata(schema.BOBlob);
    }
  }, [schema, bdo]);

  // ============================================================
  // REACT HOOK FORM
  // ============================================================

  const form = useForm<TEntity>({
    mode,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: resolver as any, // BDO validation integrated here!
    defaultValues: defaultValues as any,
    // `values` prop reactively updates form when record loads
    values: operation === "update" && record ? (record as TEntity) : undefined,
  });

  // ============================================================
  // ITEM PROXY
  // ============================================================

  // Determine instanceId for API calls (fetchOptions)
  // For edit mode: use recordId
  // For create mode: use draftId if available, otherwise "new"
  const instanceId = recordId ?? "new";

  const item = useMemo(
    () => createItemProxy(bdo, form as UseFormReturn<TEntity>, instanceId),
    [bdo, form, instanceId],
  );

  // ============================================================
  // CUSTOM HANDLE SUBMIT (with API call)
  // ============================================================

  const handleSubmit: HandleSubmitType<TRead> = useCallback(
    (onSuccess, onError) => {
      return form.handleSubmit(
        // onValid - validation passed, make API call
        async (data, e) => {
          try {
            let result: TRead;

            if (operation === "create") {
              // Create mode - call create
              result = await (bdo as any).create(data);
            } else {
              // Update mode - call update with recordId
              result = await (bdo as any).update(recordId!, data);
            }

            // Success callback
            onSuccess?.(result, e);
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
    [form, bdo, operation, recordId],
  );

  // ============================================================
  // DRAFT API INTEGRATION (Optional - Future Enhancement)
  // ============================================================

  // TODO: Implement draft API integration when enableDraft is true
  // This would:
  // 1. Create draft on mount (for create mode)
  // 2. Call draftPatch on blur for computed field updates
  // 3. Track draftId state

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

    // Custom handleSubmit (handles API call)
    handleSubmit,

    // RHF methods (spread, but handleSubmit is overridden above)
    register: form.register,
    watch: form.watch,
    setValue: form.setValue,
    getValues: form.getValues,
    reset: form.reset,
    trigger: form.trigger,
    control: form.control as Control<TEntity>,
    formState: form.formState,

    // Flattened state for convenience
    errors: form.formState.errors,
    isDirty: form.formState.isDirty,
    isValid: form.formState.isValid,
    isSubmitting: form.formState.isSubmitting,
    isSubmitSuccessful: form.formState.isSubmitSuccessful,
    dirtyFields: form.formState.dirtyFields as Partial<
      Record<keyof TEntity, boolean>
    >,

    // Loading states
    isLoading: isLoadingRecord,
    isFetching: isLoadingRecord,

    // Error
    loadError: recordError as Error | null,
  };
}
