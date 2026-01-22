// ============================================================
// USE FORM HOOK
// ============================================================
// Main hook that integrates react-hook-form with backend schemas

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useForm as useReactHookForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import type { Path } from "react-hook-form";

import type {
  UseFormOptionsType,
  UseFormReturnType,
  BDOSchemaType,
  FormSchemaConfigType,
  FormFieldConfigType,
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
import { toError } from "../../../utils/error-handling";
import {
  validateFieldOptimized,
  getFieldDependencies,
} from "./optimizedExpressionValidator.utils";

// ============================================================
// MAIN HOOK IMPLEMENTATION
// ============================================================

export function useForm<T extends Record<string, any> = Record<string, any>>(
  options: UseFormOptionsType<T>
): UseFormReturnType<T> {
  const {
    source,
    operation,
    recordId,
    defaultValues = {},
    mode = "onBlur", // Validation mode - controls when errors are shown (see types.ts for details)
    enabled = true,
    userRole,
    onSchemaError,
    skipSchemaFetch = false,
    schema: manualSchema,
    interactionMode = "interactive",
  } = options;

  // Derived interaction mode flags
  const isInteractiveMode = interactionMode === "interactive";

  // ============================================================
  // STATE MANAGEMENT
  // ============================================================

  const [schemaConfig, setSchemaConfig] =
    useState<FormSchemaConfigType | null>(null);
  const [referenceData, setReferenceData] = useState<Record<string, any[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastFormValues] = useState<Partial<T>>({});

  // Interactive mode state
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [draftError, setDraftError] = useState<Error | null>(null);

  // Prevent infinite loop in API calls
  const isComputingRef = useRef(false);
  const computeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track values that have been synced with server (sent in draft calls)
  // This allows us to detect changes since the last draft, not since form init
  const lastSyncedValuesRef = useRef<Partial<T> | null>(null);

  // Track if draft creation has started (prevents duplicate calls in React strict mode)
  const draftCreationStartedRef = useRef(false);

  // Stable callback ref to prevent dependency loops
  const onSchemaErrorRef = useRef(onSchemaError);

  // Update ref when callback changes
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
    if (schemaConfig) {
      for (const [fieldName, field] of Object.entries(schemaConfig.fields)) {
        if (field.defaultValue !== undefined && !(fieldName in values)) {
          (values as any)[fieldName] = field.defaultValue;
        }
      }
    }

    return values;
  }, [defaultValues, recordData, operation, schemaConfig]);

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
        setSchemaConfig(processed);

        // Fetch reference data for reference fields
        const refFields = extractReferenceFields(processed);
        if (Object.keys(refFields).length > 0) {
          fetchAllReferenceData(refFields)
            .then(setReferenceData)
            .catch((err) => {
              const error = toError(err);
              console.warn("Failed to fetch reference data:", error);
              // Notify via callback but don't block form - reference data is non-critical
              onSchemaErrorRef.current?.(error);
            });
        }
      } catch (error) {
        console.error("Schema processing failed:", error);
        onSchemaErrorRef.current?.(toError(error));
      }
    }
  }, [schema, userRole]); // Removed onSchemaError - using ref instead

  // Handle schema error
  useEffect(() => {
    if (schemaError) {
      onSchemaErrorRef.current?.(schemaError);
    }
  }, [schemaError]);

  // ============================================================
  // INTERACTIVE MODE - INITIAL DRAFT CREATION
  // ============================================================

  // Create initial draft for interactive create mode
  useEffect(() => {
    // Only run for interactive mode + create operation + schema loaded + no draft yet
    if (
      !isInteractiveMode ||
      operation !== "create" ||
      !schemaConfig ||
      !enabled ||
      draftId ||
      draftCreationStartedRef.current  // Prevent duplicate calls in React strict mode
    ) {
      return;
    }

    // Mark as started immediately to prevent duplicate calls
    draftCreationStartedRef.current = true;

    // Track if effect is still active (for cleanup/race condition handling)
    let isActive = true;

    const createInitialDraft = async () => {
      setIsCreatingDraft(true);
      setDraftError(null);

      try {
        const client = api<T>(source);
        // Call PATCH /{bdo_id}/draft with empty payload to get draft ID
        const response = await client.draftInteraction({});

        // Check if effect is still active before setting state
        if (!isActive) return;

        // Store the draft ID
        setDraftId(response._id);

        // Apply any computed fields returned from API
        if (response && typeof response === "object") {
          Object.entries(response).forEach(([fieldName, value]) => {
            // Skip _id as it's the draft ID, not a form field
            if (fieldName === "_id") return;

            const currentValue = rhfForm.getValues(fieldName as any);
            if (currentValue !== value) {
              rhfForm.setValue(fieldName as any, value as any, {
                shouldDirty: false,
                shouldValidate: false,
              });
            }
          });
        }
      } catch (error) {
        // Check if effect is still active before setting state
        if (!isActive) return;

        console.error("Failed to create initial draft:", error);
        setDraftError(toError(error));
        // Reset the ref on error so it can be retried
        draftCreationStartedRef.current = false;
      } finally {
        // Check if effect is still active before setting state
        if (isActive) {
          setIsCreatingDraft(false);
        }
      }
    };

    createInitialDraft();

    // Cleanup function to handle unmount during async operation
    return () => {
      isActive = false;
    };
  }, [isInteractiveMode, operation, schemaConfig, enabled, draftId, source]);
  // Note: rhfForm removed from deps - we use ref pattern to avoid dependency loops

  // ============================================================
  // COMPUTED FIELD DEPENDENCY TRACKING AND OPTIMIZATION
  // ============================================================

  // Extract computed field dependencies using optimized analyzer
  const computedFieldDependencies = useMemo(() => {
    if (!schemaConfig) return [];

    const dependencies = new Set<string>();
    const computedFieldNames = new Set(schemaConfig.computedFields);

    // Analyze dependencies from computation rules
    Object.entries(schemaConfig.fieldRules).forEach(([fieldName, rules]) => {
      rules.computation.forEach((ruleId) => {
        const rule = schemaConfig.rules.computation[ruleId];
        if (rule?.ExpressionTree) {
          const ruleDeps = getFieldDependencies(rule.ExpressionTree);
          ruleDeps.forEach((dep) => {
            // Only add non-computed fields as dependencies
            if (
              schemaConfig.fields[dep] &&
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
    schemaConfig.computedFields.forEach((fieldName: string) => {
      const field = schemaConfig.fields[fieldName];
      if (field._bdoField.Formula) {
        const fieldDeps = getFieldDependencies(
          field._bdoField.Formula.ExpressionTree
        );
        fieldDeps.forEach((dep) => {
          // Only add non-computed fields as dependencies
          if (
            schemaConfig.fields[dep] &&
            dep !== fieldName &&
            !computedFieldNames.has(dep)
          ) {
            dependencies.add(dep);
          }
        });
      }
    });

    return Array.from(dependencies) as Array<Path<T>>;
  }, [schemaConfig]);

  // Watch dependencies are tracked but not used for automatic computation
  // Computation is triggered manually on blur after validation passes

  // ============================================================
  // COMPUTATION RULE HANDLING
  // ============================================================

  // Manual computation trigger - called on blur after validation passes
  const triggerComputationAfterValidation = useCallback(
    async (fieldName: string) => {
      if (!schemaConfig) {
        return;
      }

      // Determine if draft should be triggered based on interaction mode
      // For update mode, always behave as non-interactive (only trigger for computed deps)
      // Interactive mode (create only): Always trigger draft API on blur
      // Non-interactive mode: Only trigger for computed field dependencies
      const shouldTrigger = (isInteractiveMode && operation !== "update")
        ? true // Interactive mode (create only): always trigger
        : (computedFieldDependencies.length > 0 &&
              computedFieldDependencies.includes(fieldName as Path<T>));

      if (!shouldTrigger) {
        return;
      }

      // For interactive create, check that we have a draftId (except for initial draft creation)
      if (isInteractiveMode && operation === "create" && !draftId) {
        console.warn("Interactive create mode: waiting for draft ID");
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
        if (!schemaConfig) return;

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

            // For interactive create mode, include draft _id
            if (isInteractiveMode && operation === "create" && draftId) {
              (changedFields as any)._id = draftId;
            }

            // Use lastSyncedValues if available, otherwise use recordData (for update) or empty object (for create)
            const baseline =
              lastSyncedValuesRef.current ??
              (operation === "update" ? recordData : null) ??
              {};

            // Get computed field names to exclude from payload
            const computedFieldNames = new Set(
              schemaConfig.computedFields || []
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

            // Choose API method based on operation and interaction mode
            let computedFieldsResponse;
            if (operation === "update" && recordId) {
              // Update mode: use draftPatch (both interactive and non-interactive)
              computedFieldsResponse = await client.draftPatch(recordId, payload);
            } else if (isInteractiveMode && draftId) {
              // Interactive create: use draftInteraction with _id
              computedFieldsResponse = await client.draftInteraction(payload);
            } else {
              // Non-interactive create: use draft (POST)
              computedFieldsResponse = await client.draft(payload);
            }

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
      schemaConfig,
      operation,
      recordId,
      recordData,
      source,
      rhfForm,
      computedFieldDependencies,
      isInteractiveMode,
      draftId,
    ]
  );

  // ============================================================
  // VALIDATION
  // ============================================================

  const validateForm = useCallback(async (): Promise<boolean> => {
    if (!schemaConfig) {
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
    const transformedRules = schemaConfig.crossFieldValidation.map(
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
    schemaConfig,
    rhfForm.getValues,
    rhfForm.trigger,
    rhfForm.setError,
    referenceData,
  ]);

  // ============================================================
  // HANDLE SUBMIT - RHF-style API with internal submission
  // ============================================================

  /**
   * handleSubmit follows React Hook Form's signature pattern:
   *
   * handleSubmit(onSuccess?, onError?) => (e?) => Promise<void>
   *
   * Internal flow:
   * 1. RHF validation + Cross-field validation → FAILS → onError(fieldErrors)
   * 2. Clean data & call API → FAILS → onError(apiError)
   * 3. SUCCESS → onSuccess(responseData)
   */
  const handleSubmit = useCallback(
    (
      onSuccess?: (data: T, e?: React.BaseSyntheticEvent) => void | Promise<void>,
      onError?: (
        error: import("react-hook-form").FieldErrors<T> | Error,
        e?: React.BaseSyntheticEvent
      ) => void | Promise<void>
    ) => {
      return rhfForm.handleSubmit(
        // RHF onValid handler - validation passed, now do cross-field + API
        async (data, event) => {
          if (!schemaConfig) {
            const error = new Error("Schema not loaded");
            onError?.(error, event);
            return;
          }

          setIsSubmitting(true);

          try {
            // Cross-field validation
            const transformedRules = schemaConfig.crossFieldValidation.map(
              (rule) => ({
                Id: rule.Id,
                Condition: { ExpressionTree: rule.ExpressionTree },
                Message: rule.Message || `Validation failed for ${rule.Name}`,
              })
            );

            const crossFieldErrors = validateCrossField(
              transformedRules,
              data as any,
              referenceData
            );

            if (crossFieldErrors.length > 0) {
              // Set cross-field errors in form state
              crossFieldErrors.forEach((error, index) => {
                rhfForm.setError(`root.crossField${index}` as any, {
                  type: "validate",
                  message: error.message,
                });
              });
              // Call onError with current form errors
              onError?.(rhfForm.formState.errors, event);
              return;
            }

            // Clean data for submission
            const cleanedData = cleanFormData(
              data as any,
              schemaConfig.computedFields,
              operation,
              recordData as Partial<T> | undefined
            );

            let result;

            if (isInteractiveMode) {
              // Interactive mode submission
              const client = api<T>(source);

              if (operation === "create") {
                // Interactive create: must have draftId
                if (!draftId) {
                  throw new Error(
                    "Interactive create mode requires a draft ID. Draft creation may have failed."
                  );
                }
                // POST /{bdo_id}/draft with _id in payload
                const response = await client.draft({
                  ...cleanedData,
                  _id: draftId,
                } as any);
                result = { success: true, data: response };
              } else {
                // Update operation - always use direct update API (non-interactive)
                const response = await client.update(recordId!, cleanedData);
                result = { success: true, data: response };
              }
            } else {
              // Non-interactive mode: use existing submitFormData
              result = await submitFormData<T>(
                source,
                operation,
                cleanedData,
                recordId
              );

              if (!result.success) {
                throw result.error || new Error("Submission failed");
              }
            }

            // Reset form for create operations
            if (operation === "create") {
              rhfForm.reset();
              // Clear draft state for interactive mode
              if (isInteractiveMode) {
                setDraftId(null);
              }
            }

            // Success callback with response data
            await onSuccess?.(result.data || data, event);
          } catch (error) {
            // API error - call onError with Error object
            onError?.(toError(error), event);
          } finally {
            setIsSubmitting(false);
          }
        },
        // RHF onInvalid handler - validation failed
        (errors, event) => {
          onError?.(errors, event);
        }
      );
    },
    [
      rhfForm,
      schemaConfig,
      referenceData,
      source,
      operation,
      recordId,
      recordData,
      isInteractiveMode,
      draftId,
    ]
  );

  // ============================================================
  // FIELD HELPERS
  // ============================================================

  const getField = useCallback(
    <K extends keyof T>(fieldName: K): FormFieldConfigType | null => {
      return schemaConfig?.fields[fieldName as string] || null;
    },
    [schemaConfig]
  );

  const getFields = useCallback((): Record<keyof T, FormFieldConfigType> => {
    if (!schemaConfig) return {} as Record<keyof T, FormFieldConfigType>;

    const typedFields: Record<keyof T, FormFieldConfigType> = {} as any;
    Object.entries(schemaConfig.fields).forEach(([key, field]) => {
      (typedFields as any)[key] = field;
    });

    return typedFields;
  }, [schemaConfig]);

  const hasField = useCallback(
    <K extends keyof T>(fieldName: K): boolean => {
      return !!schemaConfig?.fields[fieldName as string];
    },
    [schemaConfig]
  );

  const isFieldRequired = useCallback(
    <K extends keyof T>(fieldName: K): boolean => {
      return (
        schemaConfig?.requiredFields.includes(fieldName as string) || false
      );
    },
    [schemaConfig]
  );

  const isFieldComputed = useCallback(
    <K extends keyof T>(fieldName: K): boolean => {
      return (
        schemaConfig?.computedFields.includes(fieldName as string) || false
      );
    },
    [schemaConfig]
  );

  // ============================================================
  // OTHER OPERATIONS
  // ============================================================

  const refreshSchema = useCallback(async (): Promise<void> => {
    await refetchSchema();
  }, [refetchSchema]);

  const clearErrors = useCallback((): void => {
    rhfForm.clearErrors();
  }, [rhfForm]);

  // ============================================================
  // COMPUTED PROPERTIES
  // ============================================================

  // Loading state includes interactive mode draft creation
  const isLoadingInitialData =
    isLoadingSchema ||
    (operation === "update" && isLoadingRecord) ||
    (isInteractiveMode && operation === "create" && isCreatingDraft);
  const isLoading = isLoadingInitialData || isSubmitting;
  const loadError = schemaError || recordError || draftError;
  const hasError = !!loadError;

  const computedFields = useMemo<Array<keyof T>>(
    () => (schemaConfig?.computedFields as Array<keyof T>) || [],
    [schemaConfig]
  );

  const requiredFields = useMemo<Array<keyof T>>(
    () => (schemaConfig?.requiredFields as Array<keyof T>) || [],
    [schemaConfig]
  );

  // ============================================================
  // RETURN OBJECT
  // ============================================================

  // Create validation rules from processed schema (client-side only)
  const validationRules = useMemo(() => {
    if (!schemaConfig) return {};

    const rules: Record<string, any> = {};

    Object.entries(schemaConfig.fields).forEach(([fieldName, field]) => {
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
              const rule = schemaConfig.rules.validation[ruleId];
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
  }, [schemaConfig, rhfForm, referenceData]);

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

    // Loading states
    isLoadingInitialData,
    isLoadingRecord,
    isLoading,

    // Interactive mode state
    draftId,
    isCreatingDraft,

    // Error handling
    loadError: loadError ? toError(loadError) : null,
    hasError,

    // Schema information
    schema: schema as BDOSchemaType | null,
    schemaConfig,
    computedFields,
    requiredFields,

    // Field helpers
    getField,
    getFields,
    hasField,
    isFieldRequired,
    isFieldComputed,

    // Operations
    refreshSchema,
    validateForm,
    clearErrors,
  };
}
