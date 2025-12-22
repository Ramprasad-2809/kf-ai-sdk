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

import { processSchema, extractReferenceFields } from "./schemaParser";

import {
  fetchFormSchemaWithCache,
  fetchRecord,
  submitFormData,
  fetchAllReferenceData,
  cleanFormData,
} from "./apiClient";

import { getApiBaseUrl, getDefaultHeaders } from "../../../api";

import {
  validateCrossField,
  calculateComputedValue,
} from "./expressionValidator";
import {
  validateFieldOptimized,
  calculateComputedValueOptimized,
  getFieldDependencies,
} from "./optimizedExpressionValidator";

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
    userRole,
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
  const [lastFormValues] = useState<Partial<T>>({});

  // Prevent infinite loop in API calls
  const isComputingRef = useRef(false);
  const computeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedRef = useRef(false);

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

  // Compute initial values when form loads or recordData changes
  useEffect(() => {
    // Only run once - skip if already initialized
    if (hasInitializedRef.current) {
      return;
    }

    if (!processedSchema) return;

    // Wait for form to be initialized with values
    const values = rhfForm.getValues();
    if (Object.keys(values).length === 0) return;

    // Prevent concurrent calls
    if (isComputingRef.current) {
      return;
    }

    // Call draft API to compute initial fields
    const computeInitialFields = async () => {
      isComputingRef.current = true;

      try {
        const baseUrl = getApiBaseUrl();
        const headers = getDefaultHeaders();

        const draftUrl =
          operation === "update" && recordId
            ? `${source}/${recordId}/draft`
            : `${source}/draft`;

        const response = await fetch(`${baseUrl}/${draftUrl}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          throw new Error(`Draft API call failed: ${response.statusText}`);
        }

        const computedFields = await response.json();

        // Apply computed fields
        if (computedFields && typeof computedFields === "object") {
          Object.entries(computedFields).forEach(([fieldName, value]) => {
            rhfForm.setValue(fieldName as Path<T>, value as any, {
              shouldDirty: false,
              shouldValidate: false,
            });
          });
        }
      } catch (error) {
        console.warn("Failed to compute initial fields via API:", error);
        // Fallback to client-side computation
        const updates: Array<{ field: Path<T>; value: any }> = [];

        Object.entries(processedSchema.fieldRules).forEach(
          ([fieldName, rules]) => {
            if (rules.computation.length === 0) return;

            rules.computation.forEach((ruleId) => {
              const rule = processedSchema.rules.computation[ruleId];
              if (!rule?.ExpressionTree) return;

              try {
                const computedValue = calculateComputedValue(
                  rule.ExpressionTree,
                  values
                );

                if (computedValue !== null && computedValue !== undefined) {
                  updates.push({
                    field: fieldName as Path<T>,
                    value: computedValue,
                  });
                }
              } catch (error) {
                console.warn(
                  `Failed to compute initial value for ${fieldName}:`,
                  error
                );
              }
            });
          }
        );

        // Apply initial computed values
        if (updates.length > 0) {
          updates.forEach(({ field, value }) => {
            rhfForm.setValue(field, value, {
              shouldDirty: false,
              shouldValidate: false,
            });
          });
        }
      } finally {
        isComputingRef.current = false;
        hasInitializedRef.current = true; // Mark initial computation as complete
      }
    };

    computeInitialFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processedSchema]); // Only depend on processedSchema - run once when schema is ready

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
      if (!computedFieldDependencies.includes(fieldName as Path<T>)) {
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
            const baseUrl = getApiBaseUrl();
            const headers = getDefaultHeaders();

            // Build draft URL based on operation mode
            const draftUrl =
              operation === "update" && recordId
                ? `${source}/${recordId}/draft`
                : `${source}/draft`;

            // Call draft endpoint with current form values
            const response = await fetch(`${baseUrl}/${draftUrl}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                ...headers,
              },
              body: JSON.stringify(currentValues),
            });

            if (!response.ok) {
              throw new Error(`Draft API call failed: ${response.statusText}`);
            }

            const computedFields = await response.json();

            // Apply computed fields returned from API
            if (computedFields && typeof computedFields === "object") {
              Object.entries(computedFields).forEach(([fieldName, value]) => {
                const currentValue = currentValues[fieldName as keyof T];
                if (currentValue !== value) {
                  rhfForm.setValue(fieldName as Path<T>, value as any, {
                    shouldDirty: false,
                    shouldValidate: false,
                  });
                }
              });
            }
          } catch (error) {
            console.warn("Failed to compute fields via API:", error);
            // Fallback to client-side computation if API fails
            computeFieldsClientSide();
          } finally {
            isComputingRef.current = false;
          }
        };

        // Client-side computation fallback for offline/error scenarios
        const computeFieldsClientSide = () => {
          const updates: Array<{ field: Path<T>; value: any }> = [];

          Object.entries(processedSchema.fieldRules).forEach(
            ([fieldName, rules]) => {
              if (rules.computation.length === 0) return;

              // Execute all computation rules for this field
              rules.computation.forEach((ruleId) => {
                const rule = processedSchema.rules.computation[ruleId];
                if (!rule?.ExpressionTree) return;

                try {
                  // Evaluate the expression tree
                  const computedValue = calculateComputedValueOptimized(
                    rule.ExpressionTree,
                    currentValues,
                    lastFormValues
                  );

                  const currentValue = currentValues[fieldName as keyof T];

                  const isValidValue =
                    computedValue !== null &&
                    computedValue !== undefined &&
                    !(
                      typeof computedValue === "number" && isNaN(computedValue)
                    );

                  if (isValidValue && currentValue !== computedValue) {
                    updates.push({
                      field: fieldName as Path<T>,
                      value: computedValue,
                    });
                  }
                } catch (error) {
                  console.warn(
                    `Failed to compute ${fieldName} using rule ${ruleId}:`,
                    error
                  );
                }
              });
            }
          );

          // Also handle legacy Formula-based computed fields
          processedSchema.computedFields.forEach((fieldName) => {
            const field = processedSchema.fields[fieldName];
            if (
              field.backendField.Formula &&
              field.rules.computation.length === 0
            ) {
              try {
                const computedValue = calculateComputedValueOptimized(
                  field.backendField.Formula.ExpressionTree,
                  currentValues,
                  lastFormValues
                );

                const currentValue = currentValues[fieldName as keyof T];
                const isValidValue =
                  computedValue !== null &&
                  computedValue !== undefined &&
                  !(typeof computedValue === "number" && isNaN(computedValue));

                if (isValidValue && currentValue !== computedValue) {
                  updates.push({
                    field: fieldName as Path<T>,
                    value: computedValue,
                  });
                }
              } catch (error) {
                console.warn(
                  `Failed to compute value for ${fieldName}:`,
                  error
                );
              }
            }
          });

          // Batch update computed fields
          if (updates.length > 0) {
            updates.forEach(({ field, value }) => {
              rhfForm.setValue(field, value, {
                shouldDirty: false,
                shouldValidate: false,
              });
            });
          }
        };

        // Call API for computation
        computeFieldsViaAPI();
      }, 300); // 300ms debounce
    },
    [
      processedSchema,
      operation,
      recordId,
      source,
      rhfForm,
      computedFieldDependencies,
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
    const transformedRules = processedSchema.crossFieldValidation.map(rule => ({
      Id: rule.Id,
      Condition: { ExpressionTree: rule.ExpressionTree },
      Message: rule.Message || `Validation failed for ${rule.Name}`
    }));

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

  // Enhanced register function with validation-first computation
  const register = useCallback(
    <K extends Path<T>>(name: K, options?: any) => {
      const fieldValidation = validationRules[name as string];

      // Create custom onBlur handler
      const originalOnBlur = options?.onBlur;
      const enhancedOnBlur = async (e: any) => {
        // Call original onBlur if provided
        if (originalOnBlur) {
          await originalOnBlur(e);
        }

        // Trigger validation first
        const isValid = await rhfForm.trigger(name);

        // Only trigger computation if validation passes
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
    [rhfForm, validationRules, triggerComputationAfterValidation]
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
