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
import type { StringFieldType, SystemFields, UserRefType } from "../../types/base-fields";
import { api } from "../../api/client";
import { Item, type ItemWithData } from "./Item";
import { BaseField } from "../fields/BaseField";
import { StringField } from "../fields/StringField";
import { DateTimeField } from "../fields/DateTimeField";
import { ReferenceField } from "../fields/ReferenceField";
import type { ValidationResult } from "./types";
import { ExpressionEngine, type BDOMetadata } from "../expressions";

// Re-export SystemFields type for consumers
export type { SystemFields } from "../../types/base-fields";

// System BDO ID for user references
const USER_BO_ID = "SYS_User";

/**
 * Abstract base class for Business Data Objects
 *
 * All methods are `protected` - consumers must explicitly re-expose
 * methods as `public` to make them available on their BDO class.
 *
 * @template TEntity - The full entity type with all fields
 * @template TCreateType - Type for creating new records (defaults to TEntity without system fields)
 * @template TReadType - Type returned when reading records (defaults to TEntity)
 * @template TUpdateType - Type for updating records (defaults to partial TEntity without system fields)
 *
 * @example
 * ```typescript
 * class AdminProduct extends BaseBdo<ProductType> {
 *   readonly boId = "BDO_Product";
 *
 *   // Re-expose only methods this role can use
 *   public async get(id: StringFieldType) { return super.get(id); }
 *   public async list(options?: ListOptionsType) { return super.list(options); }
 *   // create, update, delete NOT exposed - TypeScript error if called
 * }
 * ```
 */
export abstract class BaseBdo<
  TEntity extends Record<string, unknown>,
  TCreateType extends Record<string, unknown> = Omit<TEntity, SystemFields>,
  TReadType extends Record<string, unknown> = TEntity,
  TUpdateType extends Record<string, unknown> = Partial<
    Omit<TEntity, SystemFields>
  >,
> {
  /**
   * Business Object identifier used for API calls
   */
  abstract readonly boId: string;

  // ============================================================
  // SYSTEM FIELDS (inherited by all BDOs)
  // ============================================================

  readonly _id = new StringField({ id: "_id", label: "ID" });
  readonly _created_at = new DateTimeField({ id: "_created_at", label: "Created At" });
  readonly _modified_at = new DateTimeField({ id: "_modified_at", label: "Modified At" });
  readonly _created_by = new ReferenceField<UserRefType>({
    id: "_created_by",
    label: "Created By",
    referenceBdo: USER_BO_ID,
    referenceFields: ["_id", "username"],
  });
  readonly _modified_by = new ReferenceField<UserRefType>({
    id: "_modified_by",
    label: "Modified By",
    referenceBdo: USER_BO_ID,
    referenceFields: ["_id", "username"],
  });
  readonly _version = new StringField({ id: "_version", label: "Version" });
  readonly _m_version = new StringField({ id: "_m_version", label: "Metadata Version" });

  // ============================================================
  // FIELD DEFINITIONS
  // ============================================================

  /**
   * Override this to return the business field definitions for this BDO.
   * System fields (_id, _created_at, etc.) are automatically included.
   *
   * @example
   * ```typescript
   * protected _getFieldDefinitions() {
   *   return { Title: this.Title, Price: this.Price };
   * }
   * ```
   */
  protected abstract _getFieldDefinitions(): Record<string, BaseField<unknown>>;

  /**
   * Whether fields have been bound to this BDO
   */
  private _fieldsBound = false;

  /**
   * Get all field definitions (system + business) with automatic binding.
   * Ensures fetchOptions works on SelectField and ReferenceField.
   */
  getFields(): Record<string, BaseField<unknown>> {
    // All 7 system fields from BaseBdo
    const systemFields: Record<string, BaseField<unknown>> = {
      _id: this._id,
      _created_at: this._created_at,
      _modified_at: this._modified_at,
      _created_by: this._created_by,
      _modified_by: this._modified_by,
      _version: this._version,
      _m_version: this._m_version,
    };

    // Business fields from subclass
    const businessFields = this._getFieldDefinitions();

    // Merge all fields (system fields first, then business fields)
    const allFields = { ...systemFields, ...businessFields };

    // Bind parent BDO ID to all fields
    if (!this._fieldsBound) {
      for (const field of Object.values(allFields)) {
        if ("setParentBoId" in field && typeof field.setParentBoId === "function") {
          (field as BaseField<unknown>).setParentBoId(this.boId);
        }
      }
      this._fieldsBound = true;
    }

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
   * Called by useBdoForm after fetching schema from the backend.
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
   * This method is used by Item and createBdoResolver to
   * add expression validation on top of type validation.
   *
   * @param fieldId - The field identifier
   * @param value - The current value of the field
   * @param allValues - All form field values (for cross-field validation)
   * @returns ValidationResult from expression evaluation
   */
  validateFieldExpression(
    fieldId: string,
    value: unknown,
    allValues: Record<string, unknown>
  ): ValidationResult {
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
  protected async get(id: StringFieldType): Promise<ItemWithData<TReadType>> {
    const data = await api<TReadType>(this.boId).get(id);
    return new Item<TReadType>(this, data as Partial<TReadType>) as ItemWithData<TReadType>;
  }

  /**
   * List records with optional filtering, sorting, and pagination
   */
  protected async list(options?: ListOptionsType): Promise<ItemWithData<TReadType>[]> {
    const response = await api<TReadType>(this.boId).list(options);
    return response.Data.map(
      (data) => new Item<TReadType>(this, data as Partial<TReadType>) as ItemWithData<TReadType>
    );
  }

  /**
   * Get count of records matching the filter criteria
   */
  protected async count(options?: ListOptionsType): Promise<number> {
    const response = await api<TEntity>(this.boId).count(options);
    return response.Count;
  }

  // ============================================================
  // CREATE OPERATIONS
  // ============================================================

  /**
   * Create a new record in the database
   * Returns the response with the created record's _id
   */
  protected async create(data: Partial<TCreateType>): Promise<CreateUpdateResponseType> {
    return api<TEntity>(this.boId).create(data as Partial<TEntity>);
  }

  // ============================================================
  // UPDATE OPERATIONS
  // ============================================================

  /**
   * Update an existing record
   */
  protected async update(
    id: StringFieldType,
    data: TUpdateType
  ): Promise<CreateUpdateResponseType> {
    return api<TEntity>(this.boId).update(id, data as Partial<TEntity>);
  }

  // ============================================================
  // DELETE OPERATIONS
  // ============================================================

  /**
   * Delete a record by ID
   */
  protected async delete(id: StringFieldType): Promise<DeleteResponseType> {
    return api<TEntity>(this.boId).delete(id);
  }

  // ============================================================
  // DRAFT OPERATIONS (for useForm integration)
  // ============================================================

  /**
   * Create a draft - compute fields without persisting
   */
  protected async draft(data: Partial<TCreateType>): Promise<DraftResponseType> {
    return api<TEntity>(this.boId).draft(data as Partial<TEntity>);
  }

  /**
   * Interactive draft - create/update draft without instance ID
   * Returns computed fields along with a temporary _id
   */
  protected async draftInteraction(
    data: Partial<TCreateType>
  ): Promise<DraftResponseType & { _id: string }> {
    return api<TEntity>(this.boId).draftInteraction(data as Partial<TEntity>);
  }

  /**
   * Create an Item wrapper for manipulating data with field accessors
   * Use this when you need get/set/validate methods on fields
   */
  protected createItem(data?: Partial<TCreateType>): ItemWithData<TCreateType> {
    return new Item<TCreateType>(this, (data ?? {}) as Partial<TCreateType>) as ItemWithData<TCreateType>;
  }

  /**
   * Patch an existing draft - compute fields during editing
   */
  protected async draftPatch(
    id: StringFieldType,
    data: Partial<TUpdateType>
  ): Promise<DraftResponseType> {
    return api<TEntity>(this.boId).draftPatch(id, data as Partial<TEntity>);
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
    return api<TEntity>(this.boId).metric(options);
  }

  /**
   * Get pivot table data
   */
  protected async pivot(
    options: Omit<PivotOptionsType, "Type">
  ): Promise<PivotResponseType> {
    return api<TEntity>(this.boId).pivot(options);
  }
}
