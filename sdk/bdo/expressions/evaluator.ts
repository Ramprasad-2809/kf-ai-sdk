// ============================================================
// EXPRESSION EVALUATOR
// Core expression tree evaluation logic
// ============================================================

import { FUNCTIONS } from "./functions";
import type { ExpressionTreeType, ExpressionContext } from "./types";

/**
 * Get system values for expression evaluation context
 *
 * System identifiers are special variables provided by the runtime:
 * - NOW: Current date and time
 * - TODAY: Current date (midnight)
 * - CURRENT_USER: Current authenticated user object
 *
 * @returns System values object for use in ExpressionContext
 */
export function getSystemValues(): ExpressionContext["systemValues"] {
  const now = new Date();
  return {
    NOW: now,
    TODAY: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    CURRENT_USER: {
      // These would come from auth context in real usage
      // For now, provide empty defaults
      Id: "",
      Email: "",
      FirstName: "",
      LastName: "",
    },
  };
}

/**
 * Evaluate an expression tree node and return the result
 *
 * This function recursively evaluates expression tree nodes,
 * supporting all node types defined in the backend schema.
 *
 * @param node - The expression tree node to evaluate
 * @param context - The evaluation context with form values and system values
 * @returns The result of evaluating the expression
 * @throws Error if an unsupported expression type or operator is encountered
 */
export function evaluateNode(
  node: ExpressionTreeType,
  context: ExpressionContext
): unknown {
  switch (node.Type) {
    case "Literal":
      return node.Value;

    case "Identifier":
      return context.formValues[node.Name!];

    case "SystemIdentifier":
      return evaluateSystemIdentifier(node, context);

    case "BinaryExpression":
      return evaluateBinaryExpression(node, context);

    case "LogicalExpression":
      return evaluateLogicalExpression(node, context);

    case "CallExpression":
      return evaluateCallExpression(node, context);

    case "MemberExpression":
      return evaluateMemberExpression(node, context);

    case "AssignmentExpression":
      // Assignment expressions evaluate their right-hand side
      if (node.Arguments?.length === 1) {
        return evaluateNode(node.Arguments[0], context);
      }
      return undefined;

    default:
      throw new Error(`Unsupported expression type: ${node.Type}`);
  }
}

/**
 * Evaluate a SystemIdentifier node
 *
 * System identifiers can have property access (e.g., CURRENT_USER.Email)
 */
function evaluateSystemIdentifier(
  node: ExpressionTreeType,
  context: ExpressionContext
): unknown {
  const systemKey = node.Name as keyof typeof context.systemValues;
  const systemValue = context.systemValues[systemKey];

  // Handle property access on system identifiers
  if (node.Property) {
    if (systemValue && typeof systemValue === "object") {
      const obj = systemValue as Record<string, unknown>;
      return obj[node.Property.Name];
    }
    return undefined;
  }

  return systemValue;
}

/**
 * ISO date regex: matches YYYY-MM-DD with optional time component
 */
const _DATE_RE = /^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}(:\d{2})?)?$/;

/**
 * Convert a date-like value to a comparable timestamp (ms since epoch).
 * Returns NaN if the value is not a valid date.
 */
function _toTimestamp(value: unknown): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string" && _DATE_RE.test(value)) {
    // Append "T00:00:00" for date-only strings to ensure consistent parsing
    const normalized =
      value.includes("T") || value.includes(" ")
        ? value.replace(" ", "T")
        : value + "T00:00:00";
    return new Date(normalized).getTime();
  }
  return NaN;
}

/**
 * Compare two values for ordering operators (<, <=, >, >=).
 * Uses date comparison for date-like values, numeric comparison otherwise.
 */
function _compareValues(
  left: unknown,
  right: unknown
): { l: number; r: number } {
  const lt = _toTimestamp(left);
  const rt = _toTimestamp(right);
  // If both are valid dates, compare as timestamps
  if (!isNaN(lt) && !isNaN(rt)) return { l: lt, r: rt };
  // Otherwise fall back to numeric comparison
  return { l: Number(left), r: Number(right) };
}

/**
 * Evaluate a BinaryExpression node
 *
 * Supports:
 * - Comparison: ==, !=, <, <=, >, >=
 * - Arithmetic: +, -, *, /, %
 */
function evaluateBinaryExpression(
  node: ExpressionTreeType,
  context: ExpressionContext
): unknown {
  if (!node.Arguments || node.Arguments.length < 2) {
    throw new Error("BinaryExpression requires 2 arguments");
  }

  const [leftNode, rightNode] = node.Arguments;
  const left = evaluateNode(leftNode, context);
  const right = evaluateNode(rightNode, context);

  switch (node.Operator) {
    // Comparison operators (loose equality for null checks)
    case "==":
      return left == right;
    case "!=":
      return left != right;

    // Ordering comparison — date-aware
    case "<": {
      const { l, r } = _compareValues(left, right);
      return l < r;
    }
    case "<=": {
      const { l, r } = _compareValues(left, right);
      return l <= r;
    }
    case ">": {
      const { l, r } = _compareValues(left, right);
      return l > r;
    }
    case ">=": {
      const { l, r } = _compareValues(left, right);
      return l >= r;
    }

    // Arithmetic operators
    case "+":
      return Number(left) + Number(right);
    case "-":
      return Number(left) - Number(right);
    case "*":
      return Number(left) * Number(right);
    case "/":
      // Protect against division by zero
      return Number(right) !== 0 ? Number(left) / Number(right) : 0;
    case "%":
      return Number(left) % Number(right);

    default:
      throw new Error(`Unsupported binary operator: ${node.Operator}`);
  }
}

/**
 * Evaluate a LogicalExpression node
 *
 * Supports:
 * - AND: All arguments must be truthy
 * - OR: At least one argument must be truthy
 * - !: Negation (single argument)
 */
function evaluateLogicalExpression(
  node: ExpressionTreeType,
  context: ExpressionContext
): boolean {
  if (!node.Arguments || node.Arguments.length === 0) {
    throw new Error("LogicalExpression requires at least 1 argument");
  }

  const args = node.Arguments;

  switch (node.Operator) {
    case "AND":
      return args.every((arg) => Boolean(evaluateNode(arg, context)));

    case "OR":
      return args.some((arg) => Boolean(evaluateNode(arg, context)));

    case "!":
      return !Boolean(evaluateNode(args[0], context));

    default:
      throw new Error(`Unsupported logical operator: ${node.Operator}`);
  }
}

/**
 * Evaluate a CallExpression node
 *
 * Looks up the function by name and calls it with evaluated arguments
 */
function evaluateCallExpression(
  node: ExpressionTreeType,
  context: ExpressionContext
): unknown {
  if (!node.Callee) {
    throw new Error("CallExpression requires a Callee");
  }

  const fn = FUNCTIONS[node.Callee];
  if (!fn) {
    throw new Error(`Unknown function: ${node.Callee}`);
  }

  // Evaluate all arguments
  const args = (node.Arguments ?? []).map((arg) => evaluateNode(arg, context));

  return fn(...args);
}

/**
 * Evaluate a MemberExpression node
 *
 * Handles property access on objects (e.g., user.Email)
 */
function evaluateMemberExpression(
  node: ExpressionTreeType,
  context: ExpressionContext
): unknown {
  if (!node.Arguments?.length) {
    return undefined;
  }

  // Evaluate the base object
  const object = evaluateNode(node.Arguments[0], context);
  const propertyName = node.Arguments[0].Property?.Name;

  // Access the property on the object
  if (propertyName && object && typeof object === "object") {
    return (object as Record<string, unknown>)[propertyName];
  }

  return object;
}
