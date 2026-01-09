// ============================================================
// USE FORM HOOK
// ============================================================
// Main hook that integrates react-hook-form with backend schemas

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useForm as useReactHookForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import type { Path } from "react-hook-form";

import type {
  UseFormOptions,
  UseFormReturn,
  BackendSchema,
  ProcessedSchema,
  ProcessedField,
} from "./types";

import { processSchema, extractReferenceFields } from "./schemaParser.utils";

import {
  fetchFormSchemaWithCache,
  fetchRecord,
  submitFormData,
  fetchAllReferenceData,
  cleanFormData,
} from "./apiClient";

import { api } from "../../../api";

import { validateCrossField } from "./expressionValidator.utils";
import {
  validateFieldOptimized,
  getFieldDependencies,
} from "./optimizedExpressionValidator.utils";

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
    mode = "onBlur", // Validation mode - controls when errors are shown (see types.ts for details)
    enabled = true,
    userRole,
    onSuccess,
    onError,
    onSchemaError,
    onSubmitError,
    skipSchemaFetch = false,
    schema: manualSchema,
    draftOnEveryChange = false,
  } = options;

  // ============================================================
  // STATE MANAGEMENT
  // ============================================================

  const [processedSchema, setProcessedSchema] =
    useState<ProcessedSchema | null>(null);
  const [referenceData, setReferenceData] = useState<Record<string, any[]>>({});
  const [submitError, setSubmitError] = useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastFormValues] = useState<Partial<T>>({});

  // Prevent infinite loop in API calls
  const isComputingRef = useRef(false);
  const computeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track values that have been synced with server (sent in draft calls)
  // This allows us to detect changes since the last draft, not since form init
  const lastSyncedValuesRef = useRef<Partial<T> | null>(null);

  // Stable callback refs to prevent dependency loops
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const onSubmitErrorRef = useRef(onSubmitError);
  const onSchemaErrorRef = useRef(onSchemaError);

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

  useEffect(() => {
    onSchemaErrorRef.current = onSchemaError;
  }, [onSchemaError]);

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
    gcTime: 60 * 60 * 1000, // 1 hour - keep schemas in cache longer
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
    staleTime: 5 * 60 * 1000, // 5 minutes - records can change more frequently
    gcTime: 15 * 60 * 1000, // 15 minutes - keep records for a reasonable time
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

  // ============================================================
  // SCHEMA PROCESSING
  // ============================================================

  useEffect(() => {
    if (schema) {
      try {
        const processed = processSchema(
          schema as any,
          {}, // Pass empty object - validation functions get live values from react-hook-form
          userRole
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
        onSchemaErrorRef.current?.(error as Error);
      }
    }
  }, [schema, userRole]); // Removed onSchemaError - using ref instead

  // Handle schema and record errors
  useEffect(() => {
    if (schemaError) {
      onSchemaErrorRef.current?.(schemaError);
    }
  }, [schemaError]);

  useEffect(() => {
    if (recordError) {
      onErrorRef.current?.(recordError);
    }
  }, [recordError]);

  // ============================================================
  // COMPUTED FIELD DEPENDENCY TRACKING AND OPTIMIZATION
  // ============================================================

  // Extract computed field dependencies using optimized analyzer
  const computedFieldDependencies = useMemo(() => {
    if (!processedSchema) return [];

    const dependencies = new Set<string>();
    const computedFieldNames = new Set(processedSchema.computedFields);

    // Analyze dependencies from computation rules
    Object.entries(processedSchema.fieldRules).forEach(([fieldName, rules]) => {
      rules.computation.forEach((ruleId) => {
        const rule = processedSchema.rules.computation[ruleId];
        if (rule?.ExpressionTree) {
          const ruleDeps = getFieldDependencies(rule.ExpressionTree);
          ruleDeps.forEach((dep) => {
            // Only add non-computed fields as dependencies
            if (
              processedSchema.fields[dep] &&
              dep !== fieldName &&
              !computedFieldNames.has(dep)
            ) {
              dependencies.add(dep);
            }
          });
        }
      });
    });

    // Also check formulas (legacy support)
    processedSchema.computedFields.forEach((fieldName: string) => {
      const field = processedSchema.fields[fieldName];
      if (field.backendField.Formula) {
        const fieldDeps = getFieldDependencies(
          field.backendField.Formula.ExpressionTree
        );
        fieldDeps.forEach((dep) => {
          // Only add non-computed fields as dependencies
          if (
            processedSchema.fields[dep] &&
            dep !== fieldName &&
            !computedFieldNames.has(dep)
          ) {
            dependencies.add(dep);
          }
        });
      }
    });

    return Array.from(dependencies) as Array<Path<T>>;
  }, [processedSchema]);

  // Watch dependencies are tracked but not used for automatic computation
  // Computation is triggered manually on blur after validation passes

  // ============================================================
  // COMPUTATION RULE HANDLING
  // ============================================================

  // Manual computation trigger - called on blur after validation passes
  const triggerComputationAfterValidation = useCallback(
    async (fieldName: string) => {
      if (!processedSchema || computedFieldDependencies.length === 0) {
        return;
      }

      // Check if this field is a dependency for any computed fields
      // If draftOnEveryChange is true, trigger for all fields
      // If false (default), only trigger for computed field dependencies
      const shouldTrigger =
        draftOnEveryChange ||
        computedFieldDependencies.includes(fieldName as Path<T>);

      if (!shouldTrigger) {
        return;
      }

      // Prevent concurrent API calls
      if (isComputingRef.current) {
        return;
      }

      // Debounce API calls
      if (computeTimeoutRef.current) {
        clearTimeout(computeTimeoutRef.current);
      }

      computeTimeoutRef.current = setTimeout(() => {
        // Additional safety check
        if (!processedSchema) return;

        // Prevent concurrent API calls
        if (isComputingRef.current) {
          return;
        }

        const currentValues = rhfForm.getValues();

        // Call draft API to compute fields on server
        const computeFieldsViaAPI = async () => {
          isComputingRef.current = true;

          try {
            // Use API client draft methods
            const client = api<T>(source);

            // Build payload with only fields that changed since last sync
            const changedFields: Partial<T> = {};

            // For update mode, always include _id
            if (operation === "update" && recordId && "_id" in currentValues) {
              (changedFields as any)._id = (currentValues as any)._id;
            }

            // Use lastSyncedValues if available, otherwise use recordData (for update) or empty object (for create)
            const baseline =
              lastSyncedValuesRef.current ??
              (operation === "update" ? recordData : null) ??
              {};

            // Get computed field names to exclude from payload
            const computedFieldNames = new Set(
              processedSchema.computedFields || []
            );

            // Find fields that changed from baseline (excluding computed fields)
            Object.keys(currentValues).forEach((key) => {
              // Skip _id and computed fields
              if (key === "_id" || computedFieldNames.has(key)) return;

              const currentValue = (currentValues as any)[key];
              const baselineValue = (baseline as any)[key];

              // Include if value has changed (using JSON.stringify for deep comparison)
              // For create mode with no baseline, only include non-empty values
              const hasChanged =
                JSON.stringify(currentValue) !== JSON.stringify(baselineValue);
              const isNonEmpty =
                currentValue !== "" &&
                currentValue !== null &&
                currentValue !== undefined;

              if (hasChanged && isNonEmpty) {
                (changedFields as any)[key] = currentValue;
              }
            });

            const payload = changedFields;

            // Update lastSyncedValuesRef BEFORE API call with what we're about to send
            // This ensures that even if the API fails, the next draft only sends NEW changes
            const baselineBeforeApiCall = {
              ...lastSyncedValuesRef.current,
            } as Partial<T>;

            // Update baseline with non-computed fields from current form state
            Object.keys(currentValues).forEach((key) => {
              if (!computedFieldNames.has(key)) {
                (baselineBeforeApiCall as any)[key] = (currentValues as any)[
                  key
                ];
              }
            });

            lastSyncedValuesRef.current = baselineBeforeApiCall;

            const computedFieldsResponse =
              operation === "update" && recordId
                ? await client.draftPatch(recordId, payload)
                : await client.draft(payload);

            // Apply computed fields returned from API
            if (
              computedFieldsResponse &&
              typeof computedFieldsResponse === "object"
            ) {
              Object.entries(computedFieldsResponse).forEach(
                ([fieldName, value]) => {
                  const currentValue = currentValues[fieldName as keyof T];
                  if (currentValue !== value) {
                    rhfForm.setValue(fieldName as Path<T>, value as any, {
                      shouldDirty: false,
                      shouldValidate: false,
                    });
                  }
                }
              );

              // Update baseline with computed fields from successful API response
              Object.entries(computedFieldsResponse).forEach(
                ([fieldName, value]) => {
                  if (computedFieldNames.has(fieldName)) {
                    (lastSyncedValuesRef.current as any)[fieldName] = value;
                  }
                }
              );
            }
          } catch (error) {
            console.warn("Failed to compute fields via API:", error);
            // Note: lastSyncedValuesRef was already updated before the API call
            // This is correct - we want to track what we ATTEMPTED to send,
            // so the next draft only includes NEW changes, not failed changes again
            // Client-side formula computation fallback has been removed
            // Formula fields remain as-is when API fails
          } finally {
            isComputingRef.current = false;
          }
        };

        // Call API for computation (no client-side fallback)
        computeFieldsViaAPI();
      }, 300); // 300ms debounce
    },
    [
      processedSchema,
      operation,
      recordId,
      recordData,
      source,
      rhfForm,
      computedFieldDependencies,
      draftOnEveryChange,
    ]
  );

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
    // Transform ValidationRule[] to the format expected by validateCrossField
    const transformedRules = processedSchema.crossFieldValidation.map(
      (rule) => ({
        Id: rule.Id,
        Condition: { ExpressionTree: rule.ExpressionTree },
        Message: rule.Message || `Validation failed for ${rule.Name}`,
      })
    );

    const crossFieldErrors = validateCrossField(
      transformedRules,
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
  }, [processedSchema, validateForm, rhfForm, source, operation, recordId]);

  // ============================================================
  // HANDLE SUBMIT - Simplified API
  // ============================================================

  // Simplified handleSubmit that always uses SDK's submit function
  const handleSubmit = useCallback(() => {
    return rhfForm.handleSubmit(async () => {
      await submit();
    });
  }, [rhfForm, submit]);

  // ============================================================
  // FIELD HELPERS
  // ============================================================

  const getField = useCallback(
    <K extends keyof T>(fieldName: K): ProcessedField | null => {
      return processedSchema?.fields[fieldName as string] || null;
    },
    [processedSchema]
  );

  const getFields = useCallback((): Record<keyof T, ProcessedField> => {
    if (!processedSchema) return {} as Record<keyof T, ProcessedField>;

    const typedFields: Record<keyof T, ProcessedField> = {} as any;
    Object.entries(processedSchema.fields).forEach(([key, field]) => {
      (typedFields as any)[key] = field;
    });

    return typedFields;
  }, [processedSchema]);

  const hasField = useCallback(
    <K extends keyof T>(fieldName: K): boolean => {
      return !!processedSchema?.fields[fieldName as string];
    },
    [processedSchema]
  );

  const isFieldRequired = useCallback(
    <K extends keyof T>(fieldName: K): boolean => {
      return (
        processedSchema?.requiredFields.includes(fieldName as string) || false
      );
    },
    [processedSchema]
  );

  const isFieldComputed = useCallback(
    <K extends keyof T>(fieldName: K): boolean => {
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

  const computedFields = useMemo<Array<keyof T>>(
    () => (processedSchema?.computedFields as Array<keyof T>) || [],
    [processedSchema]
  );

  const requiredFields = useMemo<Array<keyof T>>(
    () => (processedSchema?.requiredFields as Array<keyof T>) || [],
    [processedSchema]
  );

  // ============================================================
  // RETURN OBJECT
  // ============================================================

  // Create validation rules from processed schema (client-side only)
  const validationRules = useMemo(() => {
    if (!processedSchema) return {};

    const rules: Record<string, any> = {};

    Object.entries(processedSchema.fields).forEach(([fieldName, field]) => {
      const fieldRules: any = {};

      // Required validation
      if (field.required) {
        fieldRules.required = `${field.label} is required`;
      }

      // Permission-based validation (read-only fields)
      if (!field.permission.editable) {
        fieldRules.disabled = true;
      }

      // Type-specific validation
      switch (field.type) {
        case "number":
          fieldRules.valueAsNumber = true;
          break;
        case "date":
        case "datetime-local":
          fieldRules.valueAsDate = true;
          break;
      }

      // Client-side validation rules only
      const validationRuleIds = field.rules.validation;
      if (validationRuleIds.length > 0) {
        fieldRules.validate = {
          expressionValidation: (value: any) => {
            const currentValues = rhfForm.getValues();

            // Execute client-side validation rules with optimization
            for (const ruleId of validationRuleIds) {
              const rule = processedSchema.rules.validation[ruleId];
              if (rule) {
                const result = validateFieldOptimized<T>(
                  fieldName,
                  value,
                  [rule],
                  currentValues,
                  lastFormValues as T | undefined
                );
                if (!result.isValid) {
                  return result.message || rule.Message || "Invalid value";
                }
              }
            }
            return true;
          },
        };
      }

      rules[fieldName] = fieldRules;
    });

    return rules;
  }, [processedSchema, rhfForm, referenceData]);

  /**
   * Enhanced register function that wraps react-hook-form's register
   *
   * Custom onBlur behavior:
   * 1. Respects validation mode - only triggers validation on blur when mode allows
   * 2. Always fires computation (draft API calls) on blur for fields affecting computed fields
   * 3. Ensures computation only happens when field is valid
   *
   * Mode-specific behavior:
   * - "onBlur", "onTouched", "all": Validates on blur (shows errors)
   * - "onSubmit": Doesn't validate on blur (checks existing errors only)
   * - "onChange": Doesn't validate on blur (validation already happened on change)
   */
  const register = useCallback(
    <K extends Path<T>>(name: K, options?: any) => {
      const fieldValidation = validationRules[name as string];

      // Create custom onBlur handler
      const originalOnBlur = options?.onBlur;
      const enhancedOnBlur = async (e: any) => {
        // 1. Call original onBlur if provided
        if (originalOnBlur) {
          await originalOnBlur(e);
        }

        // 2. Mode-aware validation check
        let isValid = true;

        // Modes that should trigger validation on blur
        const shouldTriggerOnBlur =
          mode === "onBlur" || mode === "onTouched" || mode === "all";

        if (shouldTriggerOnBlur) {
          // Trigger validation (shows errors in UI)
          isValid = await rhfForm.trigger(name);
        } else {
          // For "onSubmit" and "onChange" modes, check existing errors without triggering new validation
          const fieldState = rhfForm.getFieldState(name, rhfForm.formState);
          isValid = !fieldState.error;
        }

        // 3. Always fire computation on blur if valid
        // This ensures computed fields update even in "onSubmit" mode
        if (isValid) {
          await triggerComputationAfterValidation(name as string);
        }
      };

      return rhfForm.register(name, {
        ...fieldValidation,
        ...options,
        onBlur: enhancedOnBlur,
      });
    },
    [rhfForm, validationRules, triggerComputationAfterValidation, mode]
  );

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
