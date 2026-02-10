// ============================================================
// EXPRESSION ENGINE MODULE EXPORTS
// ============================================================

// Main class
export { ExpressionEngine } from "./ExpressionEngine";

// Evaluator utilities
export { evaluateNode, getSystemValues } from "./evaluator";

// Built-in functions
export { FUNCTIONS } from "./functions";

// Types
export type {
  ExpressionTreeType,
  ExpressionContext,
  ValidationRule,
  FieldDefinition,
  BDOMetadata,
} from "./types";
