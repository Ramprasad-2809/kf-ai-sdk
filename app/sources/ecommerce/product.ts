// ============================================================
// PRODUCT - BDO SDK Wrapper
// ============================================================

import {
  ArrayField,
  BooleanField,
  DateTimeField,
  IdField,
  NumberField,
  StringField,
} from "../../../sdk/types/base-fields";
import { Role, Roles } from "../../types/roles";
import {
  ListResponse,
  ListOptions,
  CreateUpdateResponse,
  DeleteResponse,
  MetricOptions,
  MetricResponse,
  PivotOptions,
  PivotResponse,
  DraftResponse,
  FieldsResponse,
  api,
} from "../../../sdk";

// ============================================================
// TYPE DEFINITION
// ============================================================

const BO_ID = `BDO_AmazonProductMaster`;

export type ProductType = {
  /** Product ID */
  ProductId: StringField;

  /** Amazon Standard Identification Number */
  ASIN: StringField;

  /** Stock Keeping Unit */
  SKU: StringField;

  /** Product Title */
  Title: StringField;

  /** Product Description */
  Description: StringField;

  /** Selling Price */
  Price: NumberField;

  /** Maximum Retail Price */
  MRP: NumberField;

  /** Product Cost */
  Cost: NumberField;

  /** Discount Percentage */
  Discount: NumberField;

  /** Product Category */
  Category: StringField;

  /** Brand Name */
  Brand: StringField;

  /** Product Tags */
  Tags: ArrayField<StringField>;

  /** Stock Quantity */
  Stock: NumberField;

  /** Warehouse Location */
  Warehouse: StringField;

  /** Reorder Level */
  ReorderLevel: NumberField;

  /** Low Stock Indicator */
  LowStock: BooleanField;

  /** Is Active */
  IsActive: BooleanField;

  /** Image Source */
  ImageSrc: StringField;

  /** MongoDB document ID (required) (read-only) */
  _id: IdField;

  /** Created timestamp (required) (read-only) */
  _created_at: DateTimeField;

  /** Modified timestamp (required) (read-only) */
  _modified_at: DateTimeField;

  /** Created by user (read-only) */
  _created_by: { _id: IdField; username: StringField };

  /** Modified by user (read-only) */
  _modified_by: { _id: IdField; username: StringField };

  /** Record version (read-only) */
  _version: StringField;

  /** Metadata version (read-only) */
  _m_version: StringField;
};

// ============================================================
// ROLE-BASED VIEWS
// ============================================================

/**
 * Admin view - System Administrator with full access
 */
export type AdminProduct = ProductType;

/**
 * Seller view - Product seller with create and Update permissions
 */
export type SellerProduct = Pick<
  ProductType,
  | "ASIN"
  | "Brand"
  | "Category"
  | "Cost"
  | "Description"
  | "Discount"
  | "ImageSrc"
  | "LowStock"
  | "MRP"
  | "Price"
  | "ProductId"
  | "SKU"
  | "Stock"
  | "Tags"
  | "Title"
  | "Warehouse"
  | "_created_at"
  | "_created_by"
  | "_id"
  | "_m_version"
  | "_modified_at"
  | "_modified_by"
  | "_version"
>;

/**
 * Buyer view - Product buyer with Read-only access
 */
export type BuyerProduct = Pick<
  ProductType,
  | "ASIN"
  | "Brand"
  | "Category"
  | "Description"
  | "Discount"
  | "ImageSrc"
  | "IsActive"
  | "MRP"
  | "Price"
  | "ProductId"
  | "SKU"
  | "Stock"
  | "Tags"
  | "Title"
  | "_created_at"
  | "_created_by"
  | "_id"
  | "_m_version"
  | "_modified_at"
  | "_modified_by"
  | "_version"
>;

/**
 * InventoryManager view - Manages inventory levels and warehouse assignments
 */
export type InventoryManagerProduct = ProductType;

/**
 * WarehouseStaff view - Updates stock for assigned warehouse
 */
export type WarehouseStaffProduct = Pick<
  ProductType,
  | "LowStock"
  | "ProductId"
  | "ReorderLevel"
  | "SKU"
  | "Stock"
  | "Title"
  | "Warehouse"
  | "_created_at"
  | "_created_by"
  | "_id"
  | "_m_version"
  | "_modified_at"
  | "_modified_by"
  | "_version"
>;

// ============================================================
// CONDITIONAL TYPE MAPPER
// ============================================================

/**
 * Maps role to appropriate view type
 */
export type ProductForRole<TRole extends Role> =
  TRole extends typeof Roles.Admin
    ? AdminProduct
    : TRole extends typeof Roles.Seller
      ? SellerProduct
      : TRole extends typeof Roles.Buyer
        ? BuyerProduct
        : TRole extends typeof Roles.InventoryManager
          ? InventoryManagerProduct
          : TRole extends typeof Roles.WarehouseStaff
            ? WarehouseStaffProduct
            : never;

// ============================================================
// CLASS IMPLEMENTATION
// ============================================================

/**
 * Product client with role-based access control
 * Simple wrapper around BDO API - no business logic
 */
export class Product<TRole extends Role = typeof Roles.Admin> {
  /**
   * Create Product client for specific role
   */
  constructor(_role: TRole) {}

  /**
   * List Product with optional filtering and pagination
   */
  async list(
    options?: ListOptions
  ): Promise<ListResponse<ProductForRole<TRole>>> {
    return api(BO_ID).list(options);
  }

  /**
   * Get single Product by ID
   */
  async get(id: IdField): Promise<ProductForRole<TRole>> {
    return api(BO_ID).get(id);
  }

  /**
   * Create new Product
   */
  async create(
    data: Partial<ProductForRole<TRole>>
  ): Promise<CreateUpdateResponse> {
    return api(BO_ID).create(data);
  }

  /**
   * Update existing Product
   */
  async update(
    id: IdField,
    data: Partial<ProductForRole<TRole>>
  ): Promise<CreateUpdateResponse> {
    return api(BO_ID).update(id, data);
  }

  /**
   * Delete Product
   */
  async delete(id: IdField): Promise<DeleteResponse> {
    return api(BO_ID).delete(id);
  }

  // ============================================================
  // DRAFT/INTERACTIVE OPERATIONS
  // ============================================================

  /**
   * Create draft - compute fields without persisting
   */
  async draft(data: Partial<ProductForRole<TRole>>): Promise<DraftResponse> {
    return api(BO_ID).draft(data);
  }

  /**
   * Update draft (patch) - compute fields during editing
   */
  async draftPatch(
    id: IdField,
    data: Partial<ProductForRole<TRole>>
  ): Promise<DraftResponse> {
    return api(BO_ID).draftPatch(id, data);
  }

  // ============================================================
  // QUERY OPERATIONS
  // ============================================================

  /**
   * Get aggregated metrics grouped by dimensions
   */
  async metric(options: Omit<MetricOptions, "Type">): Promise<MetricResponse> {
    return api(BO_ID).metric(options);
  }

  /**
   * Get pivot table data
   */
  async pivot(options: Omit<PivotOptions, "Type">): Promise<PivotResponse> {
    return api(BO_ID).pivot(options);
  }

  // ============================================================
  // METADATA OPERATIONS
  // ============================================================

  /**
   * Get field definitions of Product
   */
  async fields(): Promise<FieldsResponse> {
    return api(BO_ID).fields();
  }

  /**
   * Fetch reference data for a specific field
   */
  async fetchField(
    instanceId: string,
    fieldId: string
  ): Promise<Array<{ Value: string; Label: string }>> {
    return api(BO_ID).fetchField(instanceId, fieldId);
  }
}
