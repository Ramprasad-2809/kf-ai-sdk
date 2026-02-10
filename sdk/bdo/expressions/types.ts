// ============================================================
// EXPRESSION ENGINE TYPES
// Type definitions for expression tree validation
// ============================================================

/**
 * Expression tree node structure (matches backend schema)
 *
 * Represents an abstract syntax tree (AST) node for validation expressions.
 * These are parsed from backend validation rules and evaluated at runtime.
 */
export interface ExpressionTreeType {
  /**
   * The type of expression node
   */
  Type:
    | "BinaryExpression"
    | "LogicalExpression"
    | "CallExpression"
    | "MemberExpression"
    | "AssignmentExpression"
    | "Identifier"
    | "Literal"
    | "SystemIdentifier";

  /**
   * Operator for binary/logical expressions
   * Binary: ==, !=, <, <=, >, >=, +, -, *, /, %
   * Logical: AND, OR, !
   */
  Operator?: string;

  /**
   * Function name for CallExpression
   */
  Callee?: string;

  /**
   * Child expression nodes (operands, function arguments)
   */
  Arguments?: ExpressionTreeType[];

  /**
   * Identifier name (field name or system identifier)
   */
  Name?: string;

  /**
   * Source BDO for identifiers (e.g., "BDO_Product")
   */
  Source?: string;

  /**
   * Property access for MemberExpression or SystemIdentifier
   */
  Property?: { Name: string; Property?: { Name: string } };

  /**
   * Literal value (string, number, boolean, null)
   */
  Value?: unknown;
}

/**
 * Validation rule from backend schema
 *
 * Each rule contains a human-readable expression string,
 * the parsed expression tree, and an error message.
 */
export interface ValidationRule {
  /**
   * Unique identifier for this rule (e.g., "RULE_PRICE_REQUIRED")
   */
  Id: string;

  /**
   * Optional human-readable name
   */
  Name?: string;

  /**
   * Optional description of what the rule validates
   */
  Description?: string;

  /**
   * Human-readable expression string (e.g., "Price > 0")
   */
  Expression: string;

  /**
   * Parsed expression tree for evaluation
   */
  ExpressionTree: ExpressionTreeType;

  /**
   * Error message shown when validation fails
   */
  Message: string;
}

/**
 * Field definition from backend schema
 *
 * Contains field metadata and optional inline validation rules.
 */
export interface FieldDefinition {
  /**
   * Field identifier (e.g., "Price")
   */
  Id: string;

  /**
   * Display name for the field
   */
  Name: string;

  /**
   * Field type (e.g., "String", "Number", "Date")
   */
  Type: string;

  /**
   * Whether the field is required
   */
  Required?: boolean;

  /**
   * Validation rules - can be inline objects or rule ID references
   */
  Validation?: (ValidationRule | string)[];
}

/**
 * Complete BDO schema from backend
 *
 * Contains all field definitions and centralized validation rules.
 */
export interface BDOMetadata {
  /**
   * BDO identifier (e.g., "BDO_Product")
   */
  Id: string;

  /**
   * Display name for the BDO
   */
  Name: string;

  /**
   * Field definitions keyed by field ID
   */
  Fields: Record<string, FieldDefinition>;

  /**
   * Centralized rules that can be referenced by ID from fields
   */
  Rules?: {
    /**
     * Validation rules (evaluated on field change/blur)
     */
    Validation?: Record<string, ValidationRule>;

    /**
     * Computation rules (for calculated fields)
     */
    Computation?: Record<string, ValidationRule>;

    /**
     * Business logic rules (cross-field validation)
     */
    BusinessLogic?: Record<string, ValidationRule>;
  };
}

/**
 * Context for expression evaluation
 *
 * Contains all values needed to evaluate expression trees.
 */
export interface ExpressionContext {
  /**
   * Current form field values
   */
  formValues: Record<string, unknown>;

  /**
   * System-provided values (NOW, TODAY, CURRENT_USER)
   */
  systemValues: {
    NOW: Date;
    TODAY: Date;
    CURRENT_USER: Record<string, unknown>;
  };
}
