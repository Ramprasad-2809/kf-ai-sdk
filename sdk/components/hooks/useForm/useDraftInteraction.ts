import { useState, useEffect, useCallback, useRef } from "react";
import type { UseFormReturn, FieldValues } from "react-hook-form";
import type { BaseField } from "../../../bdo/fields/BaseField";
import type { InteractiveCreatableBdo } from "./types";

// ============================================================
// TYPES
// ============================================================

interface UseDraftInteractionOptions {
  /** The BDO instance — must expose interactive draft methods */
  bdo: InteractiveCreatableBdo;
  /** RHF form instance */
  form: UseFormReturn<FieldValues>;
  /** RHF validation mode */
  mode: "onBlur" | "onChange" | "onSubmit" | "onTouched" | "all";
  /** BDO field definitions (for determining dirty fields) */
  fields: Record<string, BaseField<unknown>>;
  /** Whether interactive mode is enabled */
  enabled: boolean;
}

interface UseDraftInteractionReturn {
  draftId: string | undefined;
  isInitializingDraft: boolean;
  isInteracting: boolean;
  interactionError: Error | null;
  triggerInteraction: () => void;
  commitDraft: (dirtyData: Record<string, unknown>) => Promise<unknown>;
}

// ============================================================
// DEBOUNCE DELAY
// ============================================================

const DEBOUNCE_MS = 300;

// ============================================================
// HOOK
// ============================================================

export function useDraftInteraction(
  options: UseDraftInteractionOptions,
): UseDraftInteractionReturn {
  const { bdo, form, mode, fields, enabled } = options;

  // ============================================================
  // STATE
  // ============================================================

  const [draftId, setDraftId] = useState<string | undefined>(undefined);
  const [isInitializingDraft, setIsInitializingDraft] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [interactionError, setInteractionError] = useState<Error | null>(null);

  // ============================================================
  // REFS (for concurrency control & loop prevention)
  // ============================================================

  /** Tracks the latest interaction call — stale responses are discarded */
  const interactionCounterRef = useRef(0);

  /** Prevents re-trigger when applying computed values via setValue */
  const isApplyingComputedRef = useRef(false);

  /** Debounce timer for onChange mode */
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** AbortController for cleanup on unmount */
  const abortControllerRef = useRef<AbortController | null>(null);

  // ============================================================
  // DRAFT INITIALIZATION (Create mode only)
  // ============================================================

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    setIsInitializingDraft(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    bdo
      .draftInteraction({})
      .then((response) => {
        if (cancelled || controller.signal.aborted) return;
        const id = response._id;
        setDraftId(id);
        // Set _id into form without marking dirty
        form.setValue("_id" as any, id, { shouldDirty: false });
        setInteractionError(null);
      })
      .catch((error) => {
        if (cancelled || controller.signal.aborted) return;
        setInteractionError(error instanceof Error ? error : new Error(String(error)));
      })
      .finally(() => {
        if (!cancelled) setIsInitializingDraft(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [enabled, bdo, form]);

  // ============================================================
  // CORE INTERACTION LOGIC
  // ============================================================

  const executeInteraction = useCallback(async () => {
    if (!enabled || !draftId) return;
    if (isApplyingComputedRef.current) return;

    // Build payload from dirty fields
    const dirtyFields = form.formState.dirtyFields;
    const allValues = form.getValues();
    const payload: Record<string, unknown> = {};

    for (const [key, isDirty] of Object.entries(dirtyFields)) {
      if (isDirty && fields[key] && !fields[key].readOnly) {
        payload[key] = allValues[key];
      }
    }

    // Skip if nothing changed
    if (Object.keys(payload).length === 0) return;

    // Increment counter for concurrency control
    const currentCounter = ++interactionCounterRef.current;

    setIsInteracting(true);

    try {
      const response = await bdo.draftInteraction({
        _id: draftId,
        ...payload,
      } as any);

      // Only apply if this is still the latest interaction
      if (currentCounter !== interactionCounterRef.current) return;

      // Apply computed values back to form
      isApplyingComputedRef.current = true;
      try {
        for (const [key, value] of Object.entries(response)) {
          // Skip _id and fields the user has dirty (don't overwrite user input)
          if (key === "_id") continue;
          if (dirtyFields[key]) continue;

          form.setValue(key as any, value, {
            shouldDirty: false,
            shouldValidate: false,
          });
        }
      } finally {
        // Reset flag after React settles
        // Using setTimeout(0) ensures setValue batch is complete
        setTimeout(() => {
          isApplyingComputedRef.current = false;
        }, 0);
      }

      setInteractionError(null);
    } catch (error) {
      // Only set error if this is still the latest interaction
      if (currentCounter !== interactionCounterRef.current) return;
      setInteractionError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      if (currentCounter === interactionCounterRef.current) {
        setIsInteracting(false);
      }
    }
  }, [enabled, draftId, form, fields, bdo]);

  // ============================================================
  // TRIGGER INTERACTION (with optional debounce)
  // ============================================================

  const triggerInteraction = useCallback(() => {
    if (!enabled) return;

    // For onChange/all modes, debounce the interaction
    if (mode === "onChange" || mode === "all") {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        executeInteraction();
      }, DEBOUNCE_MS);
    } else {
      // For onBlur/onTouched/onSubmit, trigger immediately
      executeInteraction();
    }
  }, [enabled, mode, executeInteraction]);

  // ============================================================
  // COMMIT DRAFT (for handleSubmit)
  // ============================================================

  const commitDraft = useCallback(
    async (dirtyData: Record<string, unknown>): Promise<unknown> => {
      return bdo.draft({
        _id: draftId,
        ...dirtyData,
      } as any);
    },
    [bdo, draftId],
  );

  // ============================================================
  // CLEANUP
  // ============================================================

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      abortControllerRef.current?.abort();
    };
  }, []);

  // ============================================================
  // DISABLED MODE (return no-ops)
  // ============================================================

  if (!enabled) {
    return {
      draftId: undefined,
      isInitializingDraft: false,
      isInteracting: false,
      interactionError: null,
      triggerInteraction: () => {},
      commitDraft: async () => {
        throw new Error("Draft interaction is not enabled");
      },
    };
  }

  return {
    draftId,
    isInitializingDraft,
    isInteracting,
    interactionError,
    triggerInteraction,
    commitDraft,
  };
}
