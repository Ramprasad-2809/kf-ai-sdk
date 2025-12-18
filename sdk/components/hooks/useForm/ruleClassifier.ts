// ============================================================
// RULE CLASSIFIER
// ============================================================
// Classifies rules by type and determines execution strategy

import type {
  BDOSchema,
  BackendSchema,
  ProcessedSchema,
  ProcessedField,
  ValidationRule,
  RuleType,
  FieldPermission,
  RolePermission,
} from "./types";

// ============================================================
// RULE CLASSIFICATION
// ============================================================

/**
 * Classify rules by type from BDO schema
 */
export function classifyRules(schema: BDOSchema): ProcessedSchema["rules"] {
  const rules = {
    validation: {} as Record<string, ValidationRule>,
    computation: {} as Record<string, ValidationRule>,
    businessLogic: {} as Record<string, ValidationRule>,
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
  classifiedRules: ProcessedSchema["rules"]
): ProcessedSchema["fieldRules"] {
  const fieldRules: ProcessedSchema["fieldRules"] = {};

  // Initialize all fields
  Object.keys(schema.Fields).forEach((fieldName) => {
    fieldRules[fieldName] = {
      validation: [],
      computation: [],
      businessLogic: [],
    };
  });

  // Map validation rules (from field.Validation array)
  Object.entries(schema.Fields).forEach(([fieldName, field]) => {
    if (field.Validation) {
      field.Validation.forEach((ruleId) => {
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
  fieldRules: ProcessedSchema["fieldRules"],
  classifiedRules: ProcessedSchema["rules"],
  executionType: "client" | "server"
): ValidationRule[] {
  const rules: ValidationRule[] = [];
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
 * Convert legacy BackendSchema to BDO format
 */
export function convertLegacySchema(legacySchema: BackendSchema): BDOSchema {
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
          Id: fieldName,
          Name: field.Description || fieldName,
          ...field,
          Validation: [], // Legacy format needs to be processed separately
        },
      ])
    ),
    RolePermission: {},
    Roles: {},
  };
}
