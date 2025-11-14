// ============================================================
// USE FORM HOOK
// ============================================================
// Main hook that integrates react-hook-form with backend schemas

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useForm as useReactHookForm, useWatch } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";

import type {
  UseFormOptions,
  UseFormReturn,
  BackendSchema,
  ProcessedSchema,
  ProcessedField,
} from "./types";

import {
  processSchema,
  updateComputedFields,
  extractReferenceFields,
} from "./schemaParser";

import {
  fetchFormSchemaWithCache,
  fetchRecord,
  submitFormData,
  fetchAllReferenceData,
  cleanFormData,
} from "./apiClient";

import { validateCrossField } from "./expressionValidator";

// ============================================================
// MAIN HOOK IMPLEMENTATION
// ============================================================

export function useForm<T extends Record<string, any> = Record<string, any>>(
  options: UseFormOptions<T>
): UseFormReturn<T> {
  const {
    source,
    operation,
    recordId,
    defaultValues = {},
    mode = "onBlur",
    enabled = true,
    onSuccess,
    onError,
    onSchemaError,
    onSubmitError,
    customValidation = {},
    skipSchemaFetch = false,
    schema: manualSchema,
  } = options;

  // ============================================================
  // STATE MANAGEMENT
  // ============================================================

  const [processedSchema, setProcessedSchema] =
    useState<ProcessedSchema | null>(null);
  const [referenceData, setReferenceData] = useState<Record<string, any[]>>({});
  const [submitError, setSubmitError] = useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stable callback refs to prevent dependency loops
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const onSubmitErrorRef = useRef(onSubmitError);

  // Update refs when callbacks change
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onSubmitErrorRef.current = onSubmitError;
  }, [onSubmitError]);

  // ============================================================
  // SCHEMA FETCHING
  // ============================================================

  const {
    data: schema,
    isLoading: isLoadingSchema,
    error: schemaError,
    refetch: refetchSchema,
  } = useQuery({
    queryKey: ["form-schema", source],
    queryFn: () =>
      skipSchemaFetch
        ? Promise.resolve(manualSchema || {})
        : fetchFormSchemaWithCache(source),
    enabled: enabled && (!skipSchemaFetch || !!manualSchema),
    retry: 3,
    staleTime: 30 * 60 * 1000, // 30 minutes
    throwOnError: false,
  });

  // ============================================================
  // RECORD FETCHING (for update operations)
  // ============================================================

  const {
    data: recordData,
    isLoading: isLoadingRecord,
    error: recordError,
  } = useQuery({
    queryKey: ["form-record", source, recordId],
    queryFn: () => fetchRecord<T>(source, recordId!),
    enabled: enabled && operation === "update" && !!recordId,
    retry: 3,
    throwOnError: false,
  });

  // ============================================================
  // REACT HOOK FORM SETUP
  // ============================================================

  const defaultFormValues = useMemo(() => {
    const values = { ...defaultValues };

    // Merge record data for update operations
    if (operation === "update" && recordData) {
      Object.assign(values, recordData);
    }

    // Apply default values from schema
    if (processedSchema) {
      for (const [fieldName, field] of Object.entries(processedSchema.fields)) {
        if (field.defaultValue !== undefined && !(fieldName in values)) {
          (values as any)[fieldName] = field.defaultValue;
        }
      }
    }

    return values;
  }, [defaultValues, recordData, operation, processedSchema]);

  const form = useReactHookForm<T>({
    mode,
    defaultValues: defaultValues as any,
    values:
      operation === "update" && recordData
        ? (defaultFormValues as any)
        : undefined,
    resolver: customValidation ? undefined : undefined, // TODO: implement custom resolver
  });

  const watchedValues = useWatch({ control: form.control });

  // ============================================================
  // SCHEMA PROCESSING
  // ============================================================

  useEffect(() => {
    if (schema) {
      try {
        const processed = processSchema(
          schema as BackendSchema,
          watchedValues as any
        );
        setProcessedSchema(processed);

        // Fetch reference data for reference fields
        const refFields = extractReferenceFields(processed);
        if (Object.keys(refFields).length > 0) {
          fetchAllReferenceData(refFields)
            .then(setReferenceData)
            .catch(console.warn);
        }
      } catch (error) {
        console.error("Schema processing failed:", error);
        onSchemaError?.(error as Error);
      }
    }
  }, [schema, watchedValues, onSchemaError]);

  // Handle schema and record errors
  useEffect(() => {
    if (schemaError) {
      onSchemaError?.(schemaError);
    }
  }, [schemaError, onSchemaError]);

  useEffect(() => {
    if (recordError) {
      onError?.(recordError);
    }
  }, [recordError, onError]);

  // ============================================================
  // COMPUTED FIELD UPDATES
  // ============================================================

  useEffect(() => {
    if (processedSchema && watchedValues) {
      const computedValues = updateComputedFields(
        processedSchema,
        watchedValues as any
      );

      // Update form with computed values
      for (const [fieldName, value] of Object.entries(computedValues)) {
        const currentValue = form.getValues(fieldName as keyof T);
        if (currentValue !== value) {
          form.setValue(fieldName as keyof T, value, { shouldDirty: false });
        }
      }
    }
  }, [processedSchema, watchedValues, form]);

  // ============================================================
  // VALIDATION
  // ============================================================

  const validateForm = useCallback(async (): Promise<boolean> => {
    if (!processedSchema) {
      return false;
    }

    const values = form.getValues();

    // Basic form validation
    const isValid = await form.trigger();
    if (!isValid) {
      return false;
    }

    // Cross-field validation
    const crossFieldErrors = validateCrossField(
      processedSchema.crossFieldValidation,
      values as any,
      referenceData
    );

    if (crossFieldErrors.length > 0) {
      // Set cross-field errors
      crossFieldErrors.forEach((error) => {
        form.setError("root" as any, {
          type: "validate",
          message: error.message,
        });
      });
      return false;
    }

    return true;
  }, [
    processedSchema,
    form.getValues,
    form.trigger,
    form.setError,
    referenceData,
  ]);

  // ============================================================
  // FORM SUBMISSION
  // ============================================================

  const submit = useCallback(async (): Promise<void> => {
    if (!processedSchema) {
      throw new Error("Schema not loaded");
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Inline form validation to avoid dependency issues
      const isValid = await form.trigger();
      if (!isValid) {
        throw new Error("Form validation failed");
      }

      const formValues = form.getValues();

      // Clean data for submission
      const cleanedData = cleanFormData(
        formValues as any,
        processedSchema.computedFields
      );

      // Submit data
      const result = await submitFormData<T>(
        source,
        operation,
        cleanedData,
        recordId
      );

      if (!result.success) {
        throw result.error || new Error("Submission failed");
      }

      // Success callback
      onSuccessRef.current?.(result.data || formValues);

      // Reset form for create operations
      if (operation === "create") {
        form.reset();
      }
    } catch (error) {
      const submitError = error as Error;
      setSubmitError(submitError);
      onSubmitErrorRef.current?.(submitError);
      onErrorRef.current?.(submitError);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    processedSchema,
    form.getValues,
    form.trigger,
    source,
    operation,
    recordId,
  ]);

  // ============================================================
  // HANDLE SUBMIT - React Hook Form compatible
  // ============================================================

  // Standard RHF pattern: handleSubmit takes callbacks and returns event handler
  // For convenience, if no onValid callback provided, use the SDK's submit function
  const handleSubmit = useCallback(
    (onValid?: any, onInvalid?: any) => {
      return form.handleSubmit(async (data, event) => {
        if (onValid) {
          await onValid(data, event);
        } else {
          // If no callback provided, use SDK's submit
          await submit();
        }
      }, onInvalid);
    },
    [form, submit]
  ) as any;

  // ============================================================
  // FIELD HELPERS
  // ============================================================

  const getField = useCallback(
    (fieldName: keyof T): ProcessedField | null => {
      return processedSchema?.fields[fieldName as string] || null;
    },
    [processedSchema]
  );

  const getFields = useCallback(() => {
    return processedSchema?.fields || {};
  }, [processedSchema]);

  const hasField = useCallback(
    (fieldName: keyof T): boolean => {
      return !!processedSchema?.fields[fieldName as string];
    },
    [processedSchema]
  );

  const isFieldRequired = useCallback(
    (fieldName: keyof T): boolean => {
      return (
        processedSchema?.requiredFields.includes(fieldName as string) || false
      );
    },
    [processedSchema]
  );

  const isFieldComputed = useCallback(
    (fieldName: keyof T): boolean => {
      return (
        processedSchema?.computedFields.includes(fieldName as string) || false
      );
    },
    [processedSchema]
  );

  // ============================================================
  // OTHER OPERATIONS
  // ============================================================

  const refreshSchema = useCallback(async (): Promise<void> => {
    await refetchSchema();
  }, [refetchSchema]);

  const clearErrors = useCallback((): void => {
    form.clearErrors();
    setSubmitError(null);
  }, [form]);

  // ============================================================
  // COMPUTED PROPERTIES
  // ============================================================

  const isLoadingInitialData =
    isLoadingSchema || (operation === "update" && isLoadingRecord);
  const isLoading = isLoadingInitialData || isSubmitting;
  const loadError = schemaError || recordError;
  const hasError = !!(loadError || submitError);

  const computedFields = processedSchema?.computedFields || [];
  const requiredFields = processedSchema?.requiredFields || [];

  // ============================================================
  // RETURN OBJECT
  // ============================================================

  return {
    // React Hook Form integration
    register: form.register,
    handleSubmit,
    formState: form.formState,
    watch: form.watch,
    setValue: form.setValue,
    reset: form.reset,

    // Loading states
    isLoadingInitialData,
    isLoadingRecord,
    isSubmitting,
    isLoading,

    // Error handling
    loadError: loadError as Error | null,
    submitError,
    hasError,

    // Schema information
    schema: schema as BackendSchema | null,
    processedSchema,
    computedFields,
    requiredFields,

    // Field helpers
    getField,
    getFields,
    hasField,
    isFieldRequired,
    isFieldComputed,

    // Operations
    submit,
    refreshSchema,
    validateForm,
    clearErrors,
  };
}
