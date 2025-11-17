// ============================================================
// USE FORM HOOK
// ============================================================
// Main hook that integrates react-hook-form with backend schemas

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useForm as useReactHookForm, useWatch } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import type { Path, PathValue, SetValueConfig, FieldError } from "react-hook-form";

import type {
  UseFormOptions,
  UseFormReturn,
  BackendSchema,
  ProcessedSchema,
  ProcessedField,
} from "./types";

import {
  processSchema,
  extractReferenceFields,
} from "./schemaParser";

import {
  fetchFormSchemaWithCache,
  fetchRecord,
  submitFormData,
  fetchAllReferenceData,
  cleanFormData,
} from "./apiClient";

import { validateCrossField, validateField, calculateComputedValue } from "./expressionValidator";

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
    staleTime: 30 * 60 * 1000, // 30 minutes - schemas don't change frequently
    gcTime: 60 * 60 * 1000,     // 1 hour - keep schemas in cache longer
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
    staleTime: 5 * 60 * 1000,   // 5 minutes - records can change more frequently
    gcTime: 15 * 60 * 1000,     // 15 minutes - keep records for a reasonable time
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

  const rhfForm = useReactHookForm<T>({
    mode,
    defaultValues: defaultValues as any,
    values:
      operation === "update" && recordData
        ? (defaultFormValues as any)
        : undefined,
  });

  const watchedValues = useWatch({ control: rhfForm.control });

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
  // COMPUTED FIELD DEPENDENCY TRACKING AND OPTIMIZATION
  // ============================================================

  // Extract computed field dependencies to optimize watching
  const computedFieldDependencies = useMemo(() => {
    if (!processedSchema) return [];
    
    const dependencies = new Set<string>();
    processedSchema.computedFields.forEach((fieldName: string) => {
      const field = processedSchema.fields[fieldName];
      if (field.backendField.Formula) {
        // Simple extraction - look for field references in the expression tree
        // This is a simplified version that extracts common field dependencies
        const expressionStr = field.backendField.Formula.Expression || '';
        
        // Extract field names from the expression (basic approach)
        const fieldMatches = expressionStr.match(/\b[A-Za-z][A-Za-z0-9_]*\b/g) || [];
        fieldMatches.forEach((match: string) => {
          if (processedSchema.fields[match] && match !== fieldName) {
            dependencies.add(match);
          }
        });
      }
    });
    
    return Array.from(dependencies) as Array<Path<T>>;
  }, [processedSchema]);

  // Only watch dependency fields for computed field updates
  const watchedDependencies = rhfForm.watch(computedFieldDependencies);

  // Optimized computed field updates - only when dependencies change
  useEffect(() => {
    if (!processedSchema || !watchedDependencies || computedFieldDependencies.length === 0) {
      return;
    }
    
    const currentValues = rhfForm.getValues();
    const updates: Array<{ field: Path<T>; value: any }> = [];
    
    processedSchema.computedFields.forEach(fieldName => {
      const field = processedSchema.fields[fieldName];
      if (field.backendField.Formula) {
        try {
          const computedValue = calculateComputedValue(
            field.backendField.Formula.ExpressionTree,
            currentValues,
            referenceData
          );
          
          const currentValue = currentValues[fieldName as keyof T];
          if (currentValue !== computedValue) {
            updates.push({ 
              field: fieldName as Path<T>, 
              value: computedValue 
            });
          }
        } catch (error) {
          console.warn(`Failed to compute value for ${fieldName}:`, error);
        }
      }
    });
    
    // Batch update computed fields to avoid multiple re-renders
    if (updates.length > 0) {
      updates.forEach(({ field, value }) => {
        rhfForm.setValue(field, value, { 
          shouldDirty: false,
          shouldValidate: false 
        });
      });
    }
  }, [processedSchema, watchedDependencies, rhfForm, referenceData, computedFieldDependencies]);

  // ============================================================
  // VALIDATION
  // ============================================================

  const validateForm = useCallback(async (): Promise<boolean> => {
    if (!processedSchema) {
      return false;
    }

    const values = rhfForm.getValues();

    // Basic form validation
    const isValid = await rhfForm.trigger();
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
      crossFieldErrors.forEach((error, index) => {
        rhfForm.setError(`root.crossField${index}` as any, {
          type: "validate",
          message: error.message,
        });
      });
      return false;
    }

    return true;
  }, [
    processedSchema,
    rhfForm.getValues,
    rhfForm.trigger,
    rhfForm.setError,
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
      // Validate form including cross-field validation
      const isValid = await validateForm();
      if (!isValid) {
        throw new Error("Form validation failed");
      }

      const formValues = rhfForm.getValues();

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
        rhfForm.reset();
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
    validateForm,
    rhfForm,
    source,
    operation,
    recordId,
  ]);

  // ============================================================
  // HANDLE SUBMIT - Simplified API
  // ============================================================

  // Simplified handleSubmit that always uses SDK's submit function
  const handleSubmit = useCallback(
    () => {
      return rhfForm.handleSubmit(async () => {
        await submit();
      });
    },
    [rhfForm, submit]
  );

  // ============================================================
  // FIELD HELPERS
  // ============================================================

  const getField = useCallback(<K extends keyof T>(
    fieldName: K
  ): ProcessedField | null => {
    return processedSchema?.fields[fieldName as string] || null;
  }, [processedSchema]);

  const getFields = useCallback((): Record<keyof T, ProcessedField> => {
    if (!processedSchema) return {} as Record<keyof T, ProcessedField>;
    
    const typedFields: Record<keyof T, ProcessedField> = {} as any;
    Object.entries(processedSchema.fields).forEach(([key, field]) => {
      (typedFields as any)[key] = field;
    });
    
    return typedFields;
  }, [processedSchema]);

  const hasField = useCallback(<K extends keyof T>(
    fieldName: K
  ): boolean => {
    return !!processedSchema?.fields[fieldName as string];
  }, [processedSchema]);

  const isFieldRequired = useCallback(<K extends keyof T>(
    fieldName: K
  ): boolean => {
    return (
      processedSchema?.requiredFields.includes(fieldName as string) || false
    );
  }, [processedSchema]);

  const isFieldComputed = useCallback(<K extends keyof T>(
    fieldName: K
  ): boolean => {
    return (
      processedSchema?.computedFields.includes(fieldName as string) || false
    );
  }, [processedSchema]);

  // ============================================================
  // OTHER OPERATIONS
  // ============================================================

  const refreshSchema = useCallback(async (): Promise<void> => {
    await refetchSchema();
  }, [refetchSchema]);

  const clearErrors = useCallback((): void => {
    rhfForm.clearErrors();
    setSubmitError(null);
  }, [rhfForm]);


  // ============================================================
  // COMPUTED PROPERTIES
  // ============================================================

  const isLoadingInitialData =
    isLoadingSchema || (operation === "update" && isLoadingRecord);
  const isLoading = isLoadingInitialData || isSubmitting;
  const loadError = schemaError || recordError;
  const hasError = !!(loadError || submitError);

  const computedFields = useMemo<Array<keyof T>>(() => 
    processedSchema?.computedFields as Array<keyof T> || [], 
    [processedSchema]
  );
  
  const requiredFields = useMemo<Array<keyof T>>(() => 
    processedSchema?.requiredFields as Array<keyof T> || [], 
    [processedSchema]
  );

  // ============================================================
  // RETURN OBJECT
  // ============================================================

  // Create validation rules from processed schema
  const validationRules = useMemo(() => {
    if (!processedSchema) return {};
    
    const rules: Record<string, any> = {};
    
    Object.entries(processedSchema.fields).forEach(([fieldName, field]) => {
      const fieldRules: any = {};
      
      // Required validation
      if (field.required) {
        fieldRules.required = `${field.label} is required`;
      }
      
      // Type-specific validation
      switch (field.type) {
        case 'number':
          fieldRules.valueAsNumber = true;
          break;
        case 'date':
        case 'datetime-local':
          fieldRules.valueAsDate = true;
          break;
      }
      
      // Expression tree validation
      if (field.backendField.Validation && field.backendField.Validation.length > 0) {
        fieldRules.validate = {
          expressionValidation: (value: any) => {
            const currentValues = rhfForm.getValues();
            const result = validateField<T>(
              fieldName,
              value,
              field.backendField.Validation!,
              currentValues,
              referenceData
            );
            return result.isValid || result.message || 'Invalid value';
          }
        };
      }
      
      rules[fieldName] = fieldRules;
    });
    
    return rules;
  }, [processedSchema, rhfForm, referenceData]);

  // Enhanced register function with automatic validation
  const register = useCallback(<K extends Path<T>>(
    name: K,
    options?: any
  ) => {
    const fieldValidation = validationRules[name as string];
    return rhfForm.register(name, {
      ...fieldValidation,
      ...options
    });
  }, [rhfForm, validationRules]);

  return {
    // Form methods with strict typing
    register,
    handleSubmit,
    watch: rhfForm.watch as any, // Type assertion for complex generic constraints
    setValue: rhfForm.setValue,
    reset: rhfForm.reset,

    // Flattened form state (NEW - direct access, no nested formState)
    errors: rhfForm.formState.errors,
    isValid: rhfForm.formState.isValid,
    isDirty: rhfForm.formState.isDirty,
    isSubmitting: rhfForm.formState.isSubmitting || isSubmitting,
    isSubmitSuccessful: rhfForm.formState.isSubmitSuccessful,

    // BACKWARD COMPATIBILITY - Keep formState for existing components
    formState: rhfForm.formState,

    // Loading states
    isLoadingInitialData,
    isLoadingRecord,
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
