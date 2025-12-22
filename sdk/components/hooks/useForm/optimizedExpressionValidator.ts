// ============================================================
// OPTIMIZED EXPRESSION VALIDATOR
// ============================================================
// Enhanced expression evaluator with caching, dependency tracking, and performance optimizations

import type {
  ExpressionTree,
  ValidationResult,
  ValidationRule,
} from "./types";

// ============================================================
// CACHING SYSTEM
// ============================================================

/**
 * LRU Cache for expression results
 */
class LRUCache<T> {
  private cache = new Map<string, T>();
  private maxSize: number;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  get(key: string): T | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: string, value: T): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first entry)
      const firstKey = this.cache.keys().next().value as string;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}

// ============================================================
// EXPRESSION DEPENDENCY ANALYZER
// ============================================================

/**
 * Analyze expression dependencies for optimized watching
 */
export function analyzeExpressionDependencies(
  expression: ExpressionTree
): Set<string> {
  const dependencies = new Set<string>();

  function traverse(node: ExpressionTree): void {
    switch (node.Type) {
      case "Identifier":
        if (node.Name && !node.Name.startsWith("$")) {
          dependencies.add(node.Name);
        }
        break;
      
      case "MemberExpression":
        if (node.Arguments) {
          node.Arguments.forEach(traverse);
        }
        break;
      
      case "CallExpression":
      case "BinaryExpression":
      case "LogicalExpression":
        if (node.Arguments) {
          node.Arguments.forEach(traverse);
        }
        break;
    }
  }

  traverse(expression);
  return dependencies;
}

/**
 * Build dependency graph for multiple expressions
 */
export function buildDependencyGraph(
  rules: Record<string, ValidationRule>
): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();

  Object.entries(rules).forEach(([ruleId, rule]) => {
    const dependencies = analyzeExpressionDependencies(rule.ExpressionTree);
    graph.set(ruleId, dependencies);
  });

  return graph;
}

// ============================================================
// OPTIMIZED EXPRESSION EVALUATOR
// ============================================================

/**
 * Optimized expression evaluator with caching and memoization
 */
export class OptimizedExpressionEvaluator {
  private resultCache = new LRUCache<any>(500);
  private dependencyCache = new LRUCache<Set<string>>(200);
  private compiledExpressions = new Map<string, Function>();

  /**
   * Create cache key from expression and context
   */
  private createCacheKey(
    expression: ExpressionTree,
    context: Record<string, any>
  ): string {
    const expressionHash = JSON.stringify(expression);
    const contextHash = JSON.stringify(context);
    return `${expressionHash}:${contextHash}`;
  }

  /**
   * Get expression dependencies (cached)
   */
  getDependencies(expression: ExpressionTree): Set<string> {
    const expressionKey = JSON.stringify(expression);
    
    let dependencies = this.dependencyCache.get(expressionKey);
    if (!dependencies) {
      dependencies = analyzeExpressionDependencies(expression);
      this.dependencyCache.set(expressionKey, dependencies);
    }
    
    return dependencies;
  }

  /**
   * Check if expression result is cached and context hasn't changed
   */
  private getCachedResult(
    expression: ExpressionTree,
    context: Record<string, any>,
    lastContext?: Record<string, any>
  ): any | undefined {
    if (!lastContext) return undefined;

    const dependencies = this.getDependencies(expression);
    
    // Check if any dependency has changed
    for (const dep of dependencies) {
      if (context[dep] !== lastContext[dep]) {
        return undefined; // Dependencies changed, cache invalid
      }
    }

    // Dependencies unchanged, try cache
    const cacheKey = this.createCacheKey(expression, context);
    return this.resultCache.get(cacheKey);
  }

  /**
   * Evaluate expression with caching
   */
  evaluate(
    expression: ExpressionTree,
    context: Record<string, any>,
    lastContext?: Record<string, any>
  ): any {
    // Try cached result
    const cached = this.getCachedResult(expression, context, lastContext);
    if (cached !== undefined) {
      return cached;
    }

    // Evaluate and cache result
    const result = this.evaluateNode(expression, context);
    const cacheKey = this.createCacheKey(expression, context);
    this.resultCache.set(cacheKey, result);

    return result;
  }

  /**
   * Core expression evaluation logic
   */
  private evaluateNode(node: ExpressionTree, context: Record<string, any>): any {
    switch (node.Type) {
      case "Literal":
        return node.Value;

      case "Identifier":
        return this.getIdentifierValue(node, context);

      case "BinaryExpression":
        return this.evaluateBinaryExpression(node, context);

      case "LogicalExpression":
        return this.evaluateLogicalExpression(node, context);

      case "CallExpression":
        return this.evaluateCallExpression(node, context);

      case "MemberExpression":
        return this.evaluateMemberExpression(node, context);

      default:
        throw new Error(`Unsupported expression type: ${node.Type}`);
    }
  }

  /**
   * Get identifier value with system context support
   */
  private getIdentifierValue(node: ExpressionTree, context: Record<string, any>): any {
    if (!node.Name) return undefined;

    // System identifiers
    if (node.Name === "NOW") return new Date();
    if (node.Name === "TODAY") {
      const today = new Date();
      return new Date(today.getFullYear(), today.getMonth(), today.getDate());
    }
    if (node.Name === "CURRENT_USER_ID") return 1; // Would come from auth context
    if (node.Name === "CURRENT_USER") {
      return {
        EmpId: 1,
        Email: "user@example.com",
        FirstName: "John",
        LastName: "Doe",
        Role: "User",
      };
    }

    // Form field values
    return context[node.Name];
  }

  /**
   * Evaluate binary expressions with type coercion
   */
  private evaluateBinaryExpression(node: ExpressionTree, context: Record<string, any>): any {
    if (!node.Arguments || node.Arguments.length !== 2) {
      throw new Error("Binary expression requires exactly 2 arguments");
    }

    const left = this.evaluateNode(node.Arguments[0], context);
    const right = this.evaluateNode(node.Arguments[1], context);

    switch (node.Operator) {
      case "==": return left == right;
      case "!=": return left != right;
      case "===": return left === right;
      case "!==": return left !== right;
      case "<": return Number(left) < Number(right);
      case "<=": return Number(left) <= Number(right);
      case ">": return Number(left) > Number(right);
      case ">=": return Number(left) >= Number(right);
      case "+": return Number(left) + Number(right);
      case "-": return Number(left) - Number(right);
      case "*": return Number(left) * Number(right);
      case "/": return Number(left) / Number(right);
      case "%": return Number(left) % Number(right);
      default:
        throw new Error(`Unsupported binary operator: ${node.Operator}`);
    }
  }

  /**
   * Evaluate logical expressions with short-circuiting
   */
  private evaluateLogicalExpression(node: ExpressionTree, context: Record<string, any>): any {
    if (!node.Arguments || node.Arguments.length < 2) {
      throw new Error("Logical expression requires at least 2 arguments");
    }

    switch (node.Operator) {
      case "AND":
        // Short-circuit: return false on first falsy value
        for (const arg of node.Arguments) {
          const result = this.evaluateNode(arg, context);
          if (!result) return false;
        }
        return true;

      case "OR":
        // Short-circuit: return true on first truthy value
        for (const arg of node.Arguments) {
          const result = this.evaluateNode(arg, context);
          if (result) return true;
        }
        return false;

      default:
        throw new Error(`Unsupported logical operator: ${node.Operator}`);
    }
  }

  /**
   * Evaluate function calls with built-in functions
   */
  private evaluateCallExpression(node: ExpressionTree, context: Record<string, any>): any {
    if (!node.Callee) {
      throw new Error("Call expression requires a function name");
    }

    const args = node.Arguments?.map(arg => this.evaluateNode(arg, context)) || [];

    switch (node.Callee) {
      // String functions
      case "CONCAT": return args.map(a => String(a || "")).join("");
      case "TRIM": return String(args[0] || "").trim();
      case "LENGTH": return String(args[0] || "").length;
      case "UPPER": return String(args[0] || "").toUpperCase();
      case "LOWER": return String(args[0] || "").toLowerCase();
      case "CONTAINS": return String(args[0] || "").includes(String(args[1] || ""));
      case "MATCHES": return new RegExp(String(args[1])).test(String(args[0] || ""));

      // Math functions
      case "SUM": return args.reduce((sum, val) => sum + (Number(val) || 0), 0);
      case "AVG": 
        const nums = args.filter(val => !isNaN(Number(val)));
        return nums.length > 0 ? nums.reduce((sum, val) => sum + Number(val), 0) / nums.length : 0;
      case "MIN": return Math.min(...args.map(val => Number(val) || 0));
      case "MAX": return Math.max(...args.map(val => Number(val) || 0));
      case "ROUND": return Math.round(Number(args[0]) || 0);
      case "FLOOR": return Math.floor(Number(args[0]) || 0);
      case "CEIL": return Math.ceil(Number(args[0]) || 0);
      case "ABS": return Math.abs(Number(args[0]) || 0);

      // Date functions
      case "YEAR": return new Date(args[0]).getFullYear();
      case "MONTH": return new Date(args[0]).getMonth() + 1;
      case "DAY": return new Date(args[0]).getDate();
      case "DATE_DIFF":
        const d1 = new Date(args[0]);
        const d2 = new Date(args[1]);
        const diffTime = Math.abs(d1.getTime() - d2.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Conditional functions
      case "IF": return args[0] ? args[1] : args[2];
      case "AUTO_NUMBER": return Math.floor(Math.random() * 10000);

      default:
        throw new Error(`Unknown function: ${node.Callee}`);
    }
  }

  /**
   * Evaluate member expressions
   */
  private evaluateMemberExpression(node: ExpressionTree, context: Record<string, any>): any {
    if (!node.Arguments || node.Arguments.length === 0) {
      throw new Error("Member expression requires arguments");
    }

    const object = this.evaluateNode(node.Arguments[0], context);
    const propertyName = node.Arguments[0].Property?.Name;

    if (propertyName && object && typeof object === 'object') {
      return object[propertyName];
    }

    return object;
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.resultCache.clear();
    this.dependencyCache.clear();
    this.compiledExpressions.clear();
  }
}

// ============================================================
// OPTIMIZED VALIDATION FUNCTIONS
// ============================================================

// Global evaluator instance
const globalEvaluator = new OptimizedExpressionEvaluator();

/**
 * Optimized field validation with caching
 */
export function validateFieldOptimized<T = Record<string, any>>(
  fieldName: string,
  fieldValue: any,
  validationRules: ValidationRule[],
  formValues: T,
  lastFormValues?: T
): ValidationResult<T> {
  if (!validationRules || validationRules.length === 0) {
    return { isValid: true };
  }

  const currentFormValues = { ...formValues, [fieldName]: fieldValue };

  for (const rule of validationRules) {
    try {
      const isValid = globalEvaluator.evaluate(
        rule.ExpressionTree,
        currentFormValues,
        lastFormValues as any
      );

      if (!isValid) {
        return {
          isValid: false,
          message: rule.Message || `Validation failed for ${rule.Name}`,
          fieldName: fieldName as keyof T,
        };
      }
    } catch (error) {
      console.warn(`Validation rule ${rule.Id} failed to evaluate:`, error);
    }
  }

  return { isValid: true };
}

/**
 * Optimized computed value calculation
 */
export function calculateComputedValueOptimized(
  expression: ExpressionTree,
  formValues: Record<string, any>,
  lastFormValues?: Record<string, any>
): any {
  try {
    return globalEvaluator.evaluate(expression, formValues, lastFormValues);
  } catch (error) {
    console.warn("Failed to calculate computed value:", error);
    return undefined;
  }
}

/**
 * Get field dependencies for optimized watching
 */
export function getFieldDependencies(expression: ExpressionTree): string[] {
  return Array.from(globalEvaluator.getDependencies(expression));
}

/**
 * Batch validate multiple fields efficiently
 */
export function batchValidateFields<T = Record<string, any>>(
  validations: Array<{
    fieldName: string;
    fieldValue: any;
    rules: ValidationRule[];
  }>,
  formValues: T,
  lastFormValues?: T
): Array<ValidationResult<T>> {
  return validations.map(({ fieldName, fieldValue, rules }) =>
    validateFieldOptimized(fieldName, fieldValue, rules, formValues, lastFormValues)
  );
}

/**
 * Clear global expression cache
 */
export function clearExpressionCache(): void {
  globalEvaluator.clearCache();
}

// Export the evaluator for advanced usage
export { globalEvaluator as expressionEvaluator };