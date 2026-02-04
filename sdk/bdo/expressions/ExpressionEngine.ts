// ============================================================
// EXPRESSION ENGINE
// Main class for expression-based validation
// ============================================================

import type { ValidationResult } from "../core/types";
import type {
  BDOMetadata,
  ValidationRule,
  ExpressionContext,
} from "./types";
import { evaluateNode, getSystemValues } from "./evaluator";

/**
 * Expression engine for evaluating backend validation rules
 *
 * This class loads BDO metadata from the backend and uses it to validate
 * field values against expression tree rules. It supports:
 *
 * - Inline validation rules on field definitions
 * - Rule ID references to centralized rules
 * - Cross-field validation (rules can reference other fields)
 * - System identifiers (NOW, TODAY, CURRENT_USER)
 *
 * @example
 * ```typescript
 * const engine = new ExpressionEngine();
 *
 * // Load metadata from backend
 * engine.loadMetadata(bdoMetadata);
 *
 * // Validate a single field
 * const result = engine.validateField("Price", 50, { Price: 50, MRP: 100 });
 *
 * // Validate all fields
 * const allResults = engine.validateAll({ Price: 50, MRP: 100 });
 * ```
 */
export class ExpressionEngine {
  /**
   * Map of field ID to its validation rules
   */
  private fieldRules: Map<string, ValidationRule[]> = new Map();

  /**
   * The loaded BDO metadata
   */
  private metadata: BDOMetadata | null = null;

  /**
   * Load metadata and extract field validation rules
   *
   * This method processes the BDO metadata to extract validation rules
   * for each field. Rules can be:
   * - Inline objects with ExpressionTree
   * - String references to centralized rules
   *
   * @param metadata - The BDO metadata from the backend
   */
  loadMetadata(metadata: BDOMetadata): void {
    this.metadata = metadata;
    this.fieldRules.clear();

    // Extract validation rules from each field
    for (const [fieldId, fieldDef] of Object.entries(metadata.Fields)) {
      const rules: ValidationRule[] = [];

      // Process inline validation rules on the field
      if (fieldDef.Validation && Array.isArray(fieldDef.Validation)) {
        for (const rule of fieldDef.Validation) {
          if (typeof rule === "object" && rule.ExpressionTree) {
            // Inline rule object
            rules.push(rule);
          } else if (typeof rule === "string") {
            // Rule ID reference - look up in centralized rules
            const referencedRule = metadata.Rules?.Validation?.[rule];
            if (referencedRule) {
              rules.push(referencedRule);
            }
          }
        }
      }

      // Store rules if any were found
      if (rules.length > 0) {
        this.fieldRules.set(fieldId, rules);
      }
    }
  }

  /**
   * Check if metadata has been loaded
   *
   * @returns true if metadata is loaded, false otherwise
   */
  hasMetadata(): boolean {
    return this.metadata !== null;
  }

  /**
   * Get validation rules for a specific field
   *
   * @param fieldId - The field identifier
   * @returns Array of validation rules for the field
   */
  getFieldRules(fieldId: string): ValidationRule[] {
    return this.fieldRules.get(fieldId) ?? [];
  }

  /**
   * Validate a single field against its expression rules
   *
   * This method evaluates each validation rule for a field in order.
   * If any rule fails (returns falsy), validation stops and returns
   * the error message from that rule.
   *
   * @param fieldId - The field identifier
   * @param value - The current value of the field
   * @param allValues - All form field values (for cross-field validation)
   * @returns ValidationResult with valid=true if all rules pass
   */
  validateField(
    fieldId: string,
    value: unknown,
    allValues: Record<string, unknown>
  ): ValidationResult {
    const rules = this.fieldRules.get(fieldId);

    // No rules = valid
    if (!rules || rules.length === 0) {
      return { valid: true, errors: [] };
    }

    // Build evaluation context with current field value
    const context: ExpressionContext = {
      formValues: { ...allValues, [fieldId]: value },
      systemValues: getSystemValues(),
    };

    // Evaluate each rule in order
    for (const rule of rules) {
      try {
        const result = evaluateNode(rule.ExpressionTree, context);

        // Rule failed if result is falsy
        if (!result) {
          return {
            valid: false,
            errors: [rule.Message || `Validation failed: ${rule.Name || rule.Id}`],
          };
        }
      } catch (error) {
        // Log the error but continue with other rules
        // This prevents one bad rule from blocking all validation
        console.warn(
          `Expression evaluation failed for rule ${rule.Id}:`,
          error
        );
      }
    }

    // All rules passed
    return { valid: true, errors: [] };
  }

  /**
   * Validate all fields against their expression rules
   *
   * This method validates every field that has expression rules
   * and collects all errors.
   *
   * @param values - All form field values
   * @returns ValidationResult with all collected errors
   */
  validateAll(values: Record<string, unknown>): ValidationResult {
    const allErrors: string[] = [];

    // Validate each field that has rules
    for (const fieldId of this.fieldRules.keys()) {
      const result = this.validateField(fieldId, values[fieldId], values);
      if (!result.valid) {
        allErrors.push(...result.errors);
      }
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
    };
  }
}
