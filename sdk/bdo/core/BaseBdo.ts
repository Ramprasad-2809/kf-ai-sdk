// ============================================================
// BASE BDO CLASS
// All methods are protected - consumers re-expose only what they need
// ============================================================

import type {
  ListOptionsType,
  CreateUpdateResponseType,
  DeleteResponseType,
  MetricOptionsType,
  MetricResponseType,
  PivotOptionsType,
  PivotResponseType,
  DraftResponseType,
} from "../../types/common";
import type { SystemFields } from "../../types/base-fields";
import { api } from "../../api/client";
import { Item, type ItemType } from "./Item";
import { BaseField } from "../fields/BaseField";
import { StringField } from "../fields/StringField";
import { DateTimeField } from "../fields/DateTimeField";
import { UserField } from "../fields/UserField";
import type { ValidationResultType, BdoMetaType } from "./types";
import { ExpressionEngine, type BDOMetadata } from "../expressions";

// Re-export SystemFields type for consumers
export type { SystemFields } from "../../types/base-fields";

/**
 * Abstract base class for Business Data Objects
 *
 * All methods are `protected` - consumers must explicitly re-expose
 * methods as `public` to make them available on their BDO class.
 *
 * @template TEntity - The full entity type with all fields
 * @template TEditable - Fields that this role can create/update (defaults to TEntity without system fields)
 * @template TReadonly - Fields that this role can only read (defaults to empty)
 */
export abstract class BaseBdo<
  TEntity extends Record<string, unknown>,
  TEditable extends Record<string, unknown> = Omit<TEntity, SystemFields>,
  TReadonly extends Record<string, unknown> = {},
> {
  /**
   * BDO metadata — identifies this business object
   */
  abstract readonly meta: BdoMetaType;

  // ============================================================
  // SYSTEM FIELDS (inherited by all BDOs)
  // ============================================================

  readonly _id = new StringField({ _id: "_id", Name: "ID", Type: "String", ReadOnly: true });
  readonly _created_at = new DateTimeField({ _id: "_created_at", Name: "Created At", Type: "DateTime", ReadOnly: true });
  readonly _modified_at = new DateTimeField({ _id: "_modified_at", Name: "Modified At", Type: "DateTime", ReadOnly: true });
  readonly _created_by = new UserField({ _id: "_created_by", Name: "Created By", Type: "User", ReadOnly: true });
  readonly _modified_by = new UserField({ _id: "_modified_by", Name: "Modified By", Type: "User", ReadOnly: true });
  readonly _version = new StringField({ _id: "_version", Name: "Version", Type: "String", ReadOnly: true });
  readonly _m_version = new StringField({ _id: "_m_version", Name: "Metadata Version", Type: "String", ReadOnly: true });

  // ============================================================
  // FIELD DEFINITIONS (auto-discovered)
  // ============================================================

  /**
   * Whether fields have been bound to this BDO
   */
  private _fieldsBound = false;

  /**
   * Cached field map
   */
  private _fieldsCache: Record<string, BaseField<unknown>> | null = null;

  /**
   * Get all field definitions (system + business) with automatic binding.
   * Auto-discovers fields by scanning instance properties for BaseField instances.
   * Binds _parentBoId so SelectField/ReferenceField fetchOptions can work.
   */
  getFields(): Record<string, BaseField<unknown>> {
    if (this._fieldsCache) {
      return this._fieldsCache;
    }

    const allFields: Record<string, BaseField<unknown>> = {};

    // Auto-discover all BaseField instances on this object (system + business)
    for (const key of Object.keys(this)) {
      const value = (this as Record<string, unknown>)[key];
      if (value instanceof BaseField) {
        allFields[key] = value;
      }
    }

    // Bind parent BDO ID to all fields (direct protected property access)
    if (!this._fieldsBound) {
      for (const field of Object.values(allFields)) {
        (field as unknown as { _parentBoId: string })._parentBoId = this.meta._id;
      }
      this._fieldsBound = true;
    }

    this._fieldsCache = allFields;
    return allFields;
  }

  // ============================================================
  // EXPRESSION ENGINE (for backend validation rules)
  // ============================================================

  /**
   * Expression engine instance for evaluating backend validation rules
   */
  private _expressionEngine: ExpressionEngine = new ExpressionEngine();

  /**
   * Load backend metadata for expression-based validation
   *
   * Called by useForm after fetching schema from the backend.
   * This enables expression-based validation rules to be used
   * in addition to type validation.
   *
   * @param metadata - The BDO metadata from the backend
   */
  loadMetadata(metadata: BDOMetadata): void {
    this._expressionEngine.loadMetadata(metadata);
  }

  /**
   * Check if metadata has been loaded
   *
   * @returns true if metadata is loaded, false otherwise
   */
  hasMetadata(): boolean {
    return this._expressionEngine.hasMetadata();
  }

  /**
   * Validate a field using expression rules (internal use)
   *
   * Returns valid if no metadata loaded (graceful fallback).
   * This method is used by Item and createResolver to
   * add expression validation on top of type validation.
   *
   * @param fieldId - The field identifier
   * @param value - The current value of the field
   * @param allValues - All form field values (for cross-field validation)
   * @returns ValidationResultType from expression evaluation
   */
  validateFieldExpression(
    fieldId: string,
    value: unknown,
    allValues: Record<string, unknown>
  ): ValidationResultType {
    if (!this._expressionEngine.hasMetadata()) {
      return { valid: true, errors: [] };
    }
    return this._expressionEngine.validateField(fieldId, value, allValues);
  }

  // ============================================================
  // READ OPERATIONS
  // ============================================================

  /**
   * Get a single record by ID
   */
  protected async get(id: string): Promise<ItemType<TEditable, TReadonly>> {
    const data = await api<TEditable & TReadonly>(this.meta._id).get(id);
    return new Item<TEditable & TReadonly>(this, data as Partial<TEditable & TReadonly>) as ItemType<TEditable, TReadonly>;
  }

  /**
   * List records with optional filtering, sorting, and pagination
   */
  protected async list(options?: ListOptionsType): Promise<ItemType<TEditable, TReadonly>[]> {
    const response = await api<TEditable & TReadonly>(this.meta._id).list(options);
    return response.Data.map(
      (data) => new Item<TEditable & TReadonly>(this, data as Partial<TEditable & TReadonly>) as ItemType<TEditable, TReadonly>
    );
  }

  /**
   * Get count of records matching the filter criteria
   */
  protected async count(options?: ListOptionsType): Promise<number> {
    const response = await api<TEntity>(this.meta._id).count(options);
    return response.Count;
  }

  // ============================================================
  // CREATE OPERATIONS
  // ============================================================

  /**
   * Create a new record in the database
   * Returns an Item with _id from API response + the input data as field accessors
   */
  protected async create(data: Partial<TEditable>): Promise<ItemType<TEditable, TReadonly>> {
    const result = await api<TEntity>(this.meta._id).create(data as Partial<TEntity>);
    return new Item<TEditable & TReadonly>(
      this,
      { ...data, _id: result._id } as Partial<TEditable & TReadonly>,
    ) as ItemType<TEditable, TReadonly>;
  }

  // ============================================================
  // UPDATE OPERATIONS
  // ============================================================

  /**
   * Update an existing record
   */
  protected async update(
    id: string,
    data: Partial<TEditable>
  ): Promise<CreateUpdateResponseType> {
    return api<TEntity>(this.meta._id).update(id, data as Partial<TEntity>);
  }

  // ============================================================
  // DELETE OPERATIONS
  // ============================================================

  /**
   * Delete a record by ID
   */
  protected async delete(id: string): Promise<DeleteResponseType> {
    return api<TEntity>(this.meta._id).delete(id);
  }

  // ============================================================
  // DRAFT OPERATIONS (for useForm integration)
  // ============================================================

  /**
   * Create a draft - compute fields without persisting
   */
  protected async draft(data: Partial<TEditable>): Promise<DraftResponseType> {
    return api<TEntity>(this.meta._id).draft(data as Partial<TEntity>);
  }

  /**
   * Interactive draft - create/update draft without instance ID
   * Returns computed fields along with a temporary _id
   */
  protected async draftInteraction(
    data: Partial<TEditable>
  ): Promise<DraftResponseType & { _id: string }> {
    return api<TEntity>(this.meta._id).draftInteraction(data as Partial<TEntity>);
  }

  /**
   * Create an Item wrapper for manipulating data with field accessors
   * Use this when you need get/set/validate methods on fields
   */
  protected createItem(data?: Partial<TEditable>): ItemType<TEditable, TReadonly> {
    return new Item<TEditable & TReadonly>(this, (data ?? {}) as Partial<TEditable & TReadonly>) as ItemType<TEditable, TReadonly>;
  }

  /**
   * Patch an existing draft - compute fields during editing
   */
  protected async draftPatch(
    id: string,
    data: Partial<TEditable>
  ): Promise<DraftResponseType> {
    return api<TEntity>(this.meta._id).draftPatch(id, data as Partial<TEntity>);
  }

  // ============================================================
  // ANALYTICS OPERATIONS
  // ============================================================

  /**
   * Get aggregated metrics grouped by dimensions
   */
  protected async metric(
    options: Omit<MetricOptionsType, "Type">
  ): Promise<MetricResponseType> {
    return api<TEntity>(this.meta._id).metric(options);
  }

  /**
   * Get pivot table data
   */
  protected async pivot(
    options: Omit<PivotOptionsType, "Type">
  ): Promise<PivotResponseType> {
    return api<TEntity>(this.meta._id).pivot(options);
  }
}
