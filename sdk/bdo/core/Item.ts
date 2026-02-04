// ============================================================
// ITEM CLASS
// Wraps a record with field accessors for type-safe manipulation
// ============================================================

import type { ValidationResult, FieldMeta } from "./types";
import type { BaseField } from "../fields/BaseField";

/**
 * Interface for BDO that Item needs
 */
interface BdoLike {
  getFields(): Record<string, BaseField<unknown>>;
  hasMetadata(): boolean;
  validateFieldExpression(
    fieldId: string,
    value: unknown,
    allValues: Record<string, unknown>
  ): ValidationResult;
}

/**
 * Field accessor with get/set/validate methods + meta object
 */
export interface FieldAccessorLike<T> {
  readonly meta: FieldMeta;
  get(): T | undefined;
  set(value: T): void;
  validate(): ValidationResult;
}

// Re-export FieldMeta for convenience
export type { FieldMeta };

/**
 * Create accessor type for each field in T, except _id which is direct
 */
type FieldAccessors<T> = {
  [K in keyof T as K extends "_id" ? never : K]: FieldAccessorLike<T[K]>;
};

/**
 * Item type with field accessors and direct _id access
 */
export type ItemWithData<T extends Record<string, unknown>> = Item<T> &
  FieldAccessors<T> &
  (T extends { _id: infer ID } ? { readonly _id: ID } : object);

/**
 * Item class that wraps a record with field accessors
 *
 * Each field is accessible as a property returning an accessor with:
 * - id: field identifier
 * - label: display label
 * - get(): get current value
 * - set(value): set value
 * - validate(): validate current value
 *
 * @template T - The type of the underlying data
 *
 * @example
 * ```typescript
 * const product = new AdminProduct();
 * const item = await product.get("product_123");
 *
 * // Field accessor access
 * item.Title.get()  // get value
 * item.Title.set("New Title")  // set value
 * item.Title.id  // "Title"
 * item.Title.label  // "Product Title"
 * item.Title.validate()  // validate
 *
 * // Methods
 * const result = item.validate();  // validate all fields
 * const raw = item.toJSON();  // get raw data
 * ```
 */
export class Item<T extends Record<string, unknown>> {
  private _data: Partial<T>;
  private readonly _bdo: BdoLike;
  private readonly _accessorCache: Map<string, FieldAccessorLike<unknown>> = new Map();

  constructor(bdo: BdoLike, data: Partial<T>) {
    this._bdo = bdo;
    this._data = { ...data };

    // Return a Proxy for field accessor access
    return new Proxy(this, {
      get(target, prop, receiver) {
        // Handle Item's own methods and properties first
        if (
          prop === "validate" ||
          prop === "toJSON" ||
          prop === "_bdo" ||
          prop === "_data" ||
          prop === "_accessorCache" ||
          prop === "_getAccessor"
        ) {
          return Reflect.get(target, prop, receiver);
        }
        // Handle symbol properties (needed for internal JS operations)
        if (typeof prop === "symbol") {
          return Reflect.get(target, prop, receiver);
        }
        // _id is always returned directly (not as accessor)
        if (prop === "_id") {
          return target._data._id;
        }
        // Return field accessor for other properties
        return target._getAccessor(prop as string);
      },
      set(target, prop, value) {
        // Prevent setting Item's own properties
        if (
          prop === "_bdo" ||
          prop === "_data" ||
          prop === "_accessorCache" ||
          prop === "validate" ||
          prop === "toJSON"
        ) {
          return false;
        }
        // Handle symbol properties
        if (typeof prop === "symbol") {
          return Reflect.set(target, prop, value);
        }
        // Set value directly on data (shorthand for item.Field.set(value))
        target._data[prop as keyof T] = value;
        return true;
      },
      has(target, prop) {
        if (prop === "validate" || prop === "toJSON") {
          return true;
        }
        return prop in target._data || prop in target._bdo.getFields();
      },
      ownKeys(target) {
        const fields = Object.keys(target._bdo.getFields());
        return [...fields, "validate", "toJSON"];
      },
      getOwnPropertyDescriptor(target, prop) {
        if (prop === "validate" || prop === "toJSON") {
          return {
            configurable: true,
            enumerable: false,
            value: target[prop as keyof Item<T>],
          };
        }
        const fields = target._bdo.getFields();
        if (prop in fields || prop in target._data) {
          return {
            configurable: true,
            enumerable: true,
            get: () => target._getAccessor(prop as string),
          };
        }
        return undefined;
      },
    }) as Item<T>;
  }

  /**
   * Get or create a field accessor for the given field
   */
  private _getAccessor(fieldId: string): FieldAccessorLike<unknown> {
    // Check cache first
    if (this._accessorCache.has(fieldId)) {
      return this._accessorCache.get(fieldId)!;
    }

    const fields = this._bdo.getFields();
    const fieldDef = fields[fieldId];

    // Build meta object
    const meta: FieldMeta = {
      id: fieldDef?.id ?? fieldId,
      label: fieldDef?.label ?? fieldId,
    };

    // Add options for select fields
    if (fieldDef && "getOptions" in fieldDef && typeof fieldDef.getOptions === "function") {
      (meta as { options?: unknown }).options = fieldDef.getOptions();
    }

    // Add reference for reference fields
    if (fieldDef && "getReference" in fieldDef && typeof fieldDef.getReference === "function") {
      (meta as { reference?: unknown }).reference = fieldDef.getReference();
    }

    // Create accessor
    const accessor: FieldAccessorLike<unknown> = {
      meta,
      get: () => this._data[fieldId as keyof T],
      set: (value: unknown) => {
        this._data[fieldId as keyof T] = value as T[keyof T];
      },
      validate: () => {
        // 1. Type validation (existing)
        if (fieldDef) {
          const typeResult = fieldDef.validate(this._data[fieldId as keyof T]);
          if (!typeResult.valid) {
            return typeResult;
          }
        }

        // 2. Expression validation (if metadata loaded)
        if (this._bdo.hasMetadata()) {
          return this._bdo.validateFieldExpression(
            fieldId,
            this._data[fieldId as keyof T],
            this.toJSON() as Record<string, unknown>
          );
        }

        return { valid: true, errors: [] };
      },
    };

    // Cache and return
    this._accessorCache.set(fieldId, accessor);
    return accessor;
  }

  /**
   * Validate all fields and return combined results
   */
  validate(): ValidationResult {
    const fields = this._bdo.getFields();
    const allErrors: string[] = [];
    const allValues = this.toJSON() as Record<string, unknown>;

    for (const [fieldId, fieldDef] of Object.entries(fields)) {
      const value = this._data[fieldId as keyof T];

      // 1. Type validation
      const typeResult = fieldDef.validate(value);
      if (!typeResult.valid) {
        allErrors.push(...typeResult.errors);
        continue; // Skip expression validation if type validation fails
      }

      // 2. Expression validation (if metadata loaded)
      if (this._bdo.hasMetadata()) {
        const exprResult = this._bdo.validateFieldExpression(
          fieldId,
          value,
          allValues
        );
        if (!exprResult.valid) {
          allErrors.push(...exprResult.errors);
        }
      }
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
    };
  }

  /**
   * Convert the item to a plain object
   */
  toJSON(): Partial<T> {
    return { ...this._data };
  }
}
