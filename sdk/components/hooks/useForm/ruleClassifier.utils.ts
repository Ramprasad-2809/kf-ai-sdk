// ============================================================
// RULE CLASSIFIER
// ============================================================
// Classifies rules by type and determines execution strategy

import type {
  BDOSchema,
  BDOFieldDefinition,
  FormSchemaConfig,
  SchemaValidationRule,
  RuleType,
  FieldPermission,
} from "./types";

// ============================================================
// SCHEMA NORMALIZATION
// ============================================================

/**
 * Check if a validation rule represents a "required" validation
 * Detects patterns like: field != null, TRIM(field) != '', etc.
 */
function isRequiredSchemaValidationRule(rule: SchemaValidationRule, fieldName: string): boolean {
  const expression = rule.Expression?.toLowerCase() || '';
  const ruleName = rule.Name?.toLowerCase() || '';
  const ruleId = rule.Id?.toLowerCase() || '';
  const fieldLower = fieldName.toLowerCase();

  // Check if rule name/ID indicates it's a required rule
  if (ruleName.includes('required') || ruleId.includes('required')) {
    return true;
  }

  // Check expression patterns for required validation
  // Patterns: "field != null", "field != ''" , "TRIM(field) != ''"
  const requiredPatterns = [
    `${fieldLower} != null`,
    `${fieldLower} != ''`,
    `trim(${fieldLower}) != ''`,
    `${fieldLower}!=null`,
    `${fieldLower}!=''`,
  ];

  return requiredPatterns.some(pattern => expression.includes(pattern));
}

/**
 * Normalize BDO schema to ensure validation rules are in centralized format
 * Extracts inline validation rules from fields and adds them to Rules.Validation
 */
export function normalizeBDOSchema(schema: BDOSchema): BDOSchema {
  const normalizedSchema = { ...schema };

  // Initialize Rules section if it doesn't exist
  if (!normalizedSchema.Rules) {
    normalizedSchema.Rules = {
      Validation: {},
      Computation: {},
      BusinessLogic: {},
    };
  }

  if (!normalizedSchema.Rules.Validation) {
    normalizedSchema.Rules.Validation = {};
  }

  if (!normalizedSchema.Rules.Computation) {
    normalizedSchema.Rules.Computation = {};
  }

  if (!normalizedSchema.Rules.BusinessLogic) {
    normalizedSchema.Rules.BusinessLogic = {};
  }

  // Normalize fields
  const normalizedFields = { ...normalizedSchema.Fields };

  Object.entries(normalizedFields).forEach(([fieldName, field]) => {
    let isRequired = field.Required || false;

    if (field.Validation && Array.isArray(field.Validation)) {
      // Check if validation contains inline rule objects
      if (field.Validation.length > 0 && typeof field.Validation[0] === 'object') {
        // Extract inline validation rules
        const ruleIds: string[] = [];

        (field.Validation as SchemaValidationRule[]).forEach((rule) => {
          // Add rule to centralized Rules.Validation
          normalizedSchema.Rules.Validation![rule.Id] = rule;
          ruleIds.push(rule.Id);

          // Check if this is a required validation rule
          if (isRequiredSchemaValidationRule(rule, fieldName)) {
            isRequired = true;
          }
        });

        // Replace inline rules with rule IDs and set Required flag
        normalizedFields[fieldName] = {
          ...field,
          Validation: ruleIds,
          Required: isRequired,
        };
      } else {
        // If validation contains strings (rule IDs), check if any are required rules
        const validationRuleIds = field.Validation as string[];
        validationRuleIds.forEach((ruleId) => {
          const rule = normalizedSchema.Rules.Validation?.[ruleId];
          if (rule && isRequiredSchemaValidationRule(rule, fieldName)) {
            isRequired = true;
          }
        });

        if (isRequired && !field.Required) {
          normalizedFields[fieldName] = {
            ...field,
            Required: true,
          };
        }
      }
    }

    // Also extract Formula as a Computation rule if it exists
    if (field.Formula) {
      const computationRuleId = `RULE_COMPUTE_${fieldName.toUpperCase()}`;
      normalizedSchema.Rules.Computation![computationRuleId] = {
        Id: computationRuleId,
        Name: field.Formula.Id || `Compute ${fieldName}`,
        Description: field.Formula.Description || `Computes value for ${fieldName}`,
        Expression: field.Formula.Expression,
        ExpressionTree: field.Formula.ExpressionTree,
        ResultType: field.Type,
      };
    }
  });

  normalizedSchema.Fields = normalizedFields;

  return normalizedSchema;
}

// ============================================================
// RULE CLASSIFICATION
// ============================================================

/**
 * Classify rules by type from BDO schema
 */
export function classifyRules(schema: BDOSchema): FormSchemaConfig["rules"] {
  const rules = {
    validation: {} as Record<string, SchemaValidationRule>,
    computation: {} as Record<string, SchemaValidationRule>,
    businessLogic: {} as Record<string, SchemaValidationRule>,
  };

  // Extract rules from BDO Rules section
  if (schema.Rules?.Validation) {
    rules.validation = { ...schema.Rules.Validation };
  }

  if (schema.Rules?.Computation) {
    rules.computation = { ...schema.Rules.Computation };
  }

  if (schema.Rules?.BusinessLogic) {
    rules.businessLogic = { ...schema.Rules.BusinessLogic };
  }

  return rules;
}

/**
 * Create field-to-rule mapping
 */
/**
 * Infer which field each computation rule targets
 * Strategy: Match rule to fields marked as Computed: true
 * by analyzing the rule's target field from its name/description
 */
function inferComputationRuleTargets(
  schema: BDOSchema
): Record<string, string> {
  const ruleToField: Record<string, string> = {};

  if (!schema.Rules?.Computation) return ruleToField;

  // Find all computed fields (fields with Computed: true)
  const computedFieldNames = Object.entries(schema.Fields)
    .filter(([_, field]) => field.Computed)
    .map(([fieldName]) => fieldName);

  // Sort by length descending to match longer names first (e.g., LowStock before Stock)
  computedFieldNames.sort((a, b) => b.length - a.length);

  Object.entries(schema.Rules.Computation).forEach(([ruleId, rule]) => {
    // Strategy 1: Match rule ID to computed field names
    // Normalize both to handle camelCase vs SNAKE_CASE
    const normalizedRuleId = ruleId.toUpperCase().replace(/[_-]/g, "");

    for (const fieldName of computedFieldNames) {
      const normalizedFieldName = fieldName.toUpperCase().replace(/[_-]/g, "");

      if (normalizedRuleId.includes(normalizedFieldName)) {
        ruleToField[ruleId] = fieldName;
        return;
      }
    }

    // Strategy 2: Check rule name/description
    const searchText =
      `${rule.Name || ""} ${rule.Description || ""}`.toLowerCase();

    for (const fieldName of computedFieldNames) {
      if (searchText.includes(fieldName.toLowerCase())) {
        ruleToField[ruleId] = fieldName;
        return;
      }
    }
  });

  return ruleToField;
}

export function createFieldRuleMapping(
  schema: BDOSchema,
  classifiedRules: FormSchemaConfig["rules"]
): FormSchemaConfig["fieldRules"] {
  const fieldRules: FormSchemaConfig["fieldRules"] = {};

  // Initialize all fields
  Object.keys(schema.Fields).forEach((fieldName) => {
    fieldRules[fieldName] = {
      validation: [],
      computation: [],
      businessLogic: [],
    };
  });

  // Map validation rules (from field.Validation array)
  // After normalization, field.Validation is always string[]
  Object.entries(schema.Fields).forEach(([fieldName, field]) => {
    if (field.Validation && Array.isArray(field.Validation)) {
      // Type assertion: after normalization, Validation is always string[]
      const validationRuleIds = field.Validation as string[];
      validationRuleIds.forEach((ruleId) => {
        if (classifiedRules.validation[ruleId]) {
          fieldRules[fieldName].validation.push(ruleId);
        } else if (classifiedRules.computation[ruleId]) {
          // Some computation rules might be in Validation array
          fieldRules[fieldName].computation.push(ruleId);
        } else if (classifiedRules.businessLogic[ruleId]) {
          fieldRules[fieldName].businessLogic.push(ruleId);
        }
      });
    }

    // Add computation rule if field has formula (legacy support)
    if (field.Formula) {
      Object.entries(classifiedRules.computation).forEach(([ruleId, rule]) => {
        if (rule.Expression === field.Formula?.Expression) {
          if (!fieldRules[fieldName].computation.includes(ruleId)) {
            fieldRules[fieldName].computation.push(ruleId);
          }
        }
      });
    }
  });

  // Map computation rules (infer from rule ID or expression)
  const ruleTargets = inferComputationRuleTargets(schema);
  Object.entries(ruleTargets).forEach(([ruleId, fieldName]) => {
    if (
      fieldRules[fieldName] &&
      !fieldRules[fieldName].computation.includes(ruleId)
    ) {
      fieldRules[fieldName].computation.push(ruleId);
    }
  });

  return fieldRules;
}

// ============================================================
// PERMISSION CALCULATION
// ============================================================

/**
 * Calculate field permissions based on user role
 */
export function calculateFieldPermissions(
  schema: BDOSchema,
  userRole?: string
): Record<string, FieldPermission> {
  const fieldPermissions: Record<string, FieldPermission> = {};

  // Default permissions (no role specified)
  const defaultPermission: FieldPermission = {
    editable: true,
    readable: true,
    hidden: false,
  };

  Object.keys(schema.Fields).forEach((fieldName) => {
    if (!userRole || !schema.RolePermission?.[userRole]) {
      fieldPermissions[fieldName] = defaultPermission;
      return;
    }

    const rolePermission = schema.RolePermission[userRole];

    // Check if field is in editable list
    const isEditable =
      rolePermission.Editable?.includes(fieldName) ||
      rolePermission.Editable?.includes("*") ||
      false;

    // Check if field is in readonly list
    const isReadable =
      rolePermission.ReadOnly?.includes(fieldName) ||
      rolePermission.ReadOnly?.includes("*") ||
      isEditable; // Editable fields are also readable

    fieldPermissions[fieldName] = {
      editable: isEditable && !rolePermission.ReadOnly?.includes(fieldName),
      readable: isReadable,
      hidden: !isReadable,
    };
  });

  return fieldPermissions;
}

// ============================================================
// RULE EXECUTION STRATEGY
// ============================================================

/**
 * Determine if rule should execute client-side or server-side
 */
export function getRuleExecutionStrategy(
  ruleType: RuleType
): "client" | "server" {
  switch (ruleType) {
    case "Validation":
      return "client"; // Always execute validation on client
    case "Computation":
    case "BusinessLogic":
      return "server"; // Execute computation and business logic on server
    default:
      return "client";
  }
}

/**
 * Get rules that should execute for a specific trigger
 */
export function getRulesForField(
  fieldName: string,
  fieldRules: FormSchemaConfig["fieldRules"],
  classifiedRules: FormSchemaConfig["rules"],
  executionType: "client" | "server"
): SchemaValidationRule[] {
  const rules: SchemaValidationRule[] = [];
  const fieldRuleMap = fieldRules[fieldName];

  if (!fieldRuleMap) return rules;

  // Add validation rules (client-side only)
  if (executionType === "client") {
    fieldRuleMap.validation.forEach((ruleId) => {
      const rule = classifiedRules.validation[ruleId];
      if (rule) rules.push(rule);
    });
  }

  // Add computation and business logic rules (server-side only)
  if (executionType === "server") {
    fieldRuleMap.computation.forEach((ruleId) => {
      const rule = classifiedRules.computation[ruleId];
      if (rule) rules.push(rule);
    });

    fieldRuleMap.businessLogic.forEach((ruleId) => {
      const rule = classifiedRules.businessLogic[ruleId];
      if (rule) rules.push(rule);
    });
  }

  return rules;
}

// ============================================================
// LEGACY SCHEMA SUPPORT
// ============================================================

/**
 * Convert legacy schema format to BDO format
 * @deprecated Legacy schema format is no longer supported
 */
export function convertLegacySchema(legacySchema: Record<string, BDOFieldDefinition>): BDOSchema {
  return {
    Id: "legacy_schema",
    Name: "Legacy Schema",
    Kind: "BusinessObject",
    Description: "Converted from legacy schema format",
    Rules: {
      Validation: {},
      Computation: {},
      BusinessLogic: {},
    },
    Fields: Object.fromEntries(
      Object.entries(legacySchema).map(([fieldName, field]) => [
        fieldName,
        {
          ...field,
          Id: fieldName,
          Name: field.Description || fieldName,
          Validation: [], // Legacy format needs to be processed separately
        },
      ])
    ),
    RolePermission: {},
    Roles: {},
  };
}
