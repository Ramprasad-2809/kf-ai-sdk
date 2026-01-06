// ============================================================
// PRODUCT MASTER - BDO SDK Wrapper
// ============================================================
// Thin wrapper around BDO_ProductMaster API
// All validation and business logic handled by BDO schema and useForm hook

import {
  IdField,
  StringField,
  NumberField,
  DateTimeField,
  BooleanField,
  SelectField,
  TextAreaField,
  ArrayField,
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

/**
 * Complete Product Master type based on BDO schema
 * All validation rules are defined in BDO schema and enforced by useForm hook
 * Computed fields (Discount, LowStock) are calculated by backend
 */
export type ProductMasterType = {
  /** MongoDB document ID */
  _id: IdField;

  /** Unique product identifier (auto-generated) */
  ProductId: IdField;

  /** Amazon Standard Identification Number (10 alphanumeric chars) */
  ASIN: StringField;

  /** Stock Keeping Unit */
  SKU: StringField;

  /** Product Title (10-200 characters) */
  Title: StringField;

  /** Product Description (max 2000 characters) */
  Description: TextAreaField;

  /** Product Image URL */
  ImageUrl: StringField;

  /** Selling Price (required, must be > 0) */
  Price: NumberField;

  /** Maximum Retail Price (required, >= Price) */
  MRP: NumberField;

  /** Product Cost (non-negative) */
  Cost: NumberField;

  /** Discount Percentage (0-100, computed from MRP and Price) */
  Discount: NumberField;

  /** Product Category */
  Category: SelectField<
    "Electronics" | "Books" | "Clothing" | "Home" | "Sports" | "Toys"
  >;

  /** Brand Name */
  Brand: StringField;

  /** Product Tags for search */
  Tags: ArrayField<StringField>;

  /** Stock Quantity (non-negative) */
  Stock: NumberField;

  /** Warehouse Location */
  Warehouse: SelectField<"Warehouse_A" | "Warehouse_B" | "Warehouse_C">;

  /** Reorder Level */
  ReorderLevel: NumberField;

  /** Low Stock Indicator (computed: Stock <= ReorderLevel) */
  LowStock: BooleanField;

  /** Is Active */
  IsActive: BooleanField;

  /** Created timestamp */
  _created_at: DateTimeField;

  /** Modified timestamp */
  _modified_at: DateTimeField;

  /** Created by user */
  _created_by: {
    _id: IdField;
    username: StringField;
  };

  /** Modified by user */
  _modified_by: {
    _id: IdField;
    username: StringField;
  };

  /** Record version */
  _version: StringField;

  /** Metadata version */
  _m_version: StringField;
};

// ============================================================
// ROLE-BASED VIEWS
// ============================================================

/**
 * Admin view - full access to all fields
 */
export type AdminProduct = ProductMasterType;

/**
 * Seller view - can edit product details, pricing, and inventory
 */
export type SellerProduct = Pick<
  ProductMasterType,
  | "_id"
  | "ProductId"
  | "ASIN"
  | "SKU"
  | "Title"
  | "Description"
  | "ImageUrl"
  | "Price"
  | "MRP"
  | "Category"
  | "Brand"
  | "Tags"
  | "Stock"
  | "Warehouse"
  | "ReorderLevel"
  | "Discount"
  | "LowStock"
  | "IsActive"
  | "_created_at"
  | "_modified_at"
  | "_version"
  | "_m_version"
>;

/**
 * Buyer view - read-only access to public product information
 */
export type BuyerProduct = Pick<
  ProductMasterType,
  | "_id"
  | "ProductId"
  | "ASIN"
  | "SKU"
  | "Title"
  | "Description"
  | "ImageUrl"
  | "Price"
  | "MRP"
  | "Discount"
  | "Category"
  | "Brand"
  | "Tags"
  | "Stock"
  | "IsActive"
>;

/**
 * Inventory Manager view - focus on inventory and warehouse management
 */
export type InventoryManagerProduct = Pick<
  ProductMasterType,
  | "_id"
  | "ProductId"
  | "ASIN"
  | "SKU"
  | "Title"
  | "Stock"
  | "Warehouse"
  | "ReorderLevel"
  | "LowStock"
  | "_created_at"
  | "_modified_at"
>;

/**
 * Warehouse Staff view - limited to assigned warehouse stock updates
 */
export type WarehouseStaffProduct = Pick<
  ProductMasterType,
  | "_id"
  | "ProductId"
  | "SKU"
  | "Title"
  | "Stock"
  | "Warehouse"
  | "ReorderLevel"
  | "LowStock"
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
    : TRole extends "Seller"
      ? SellerProduct
      : TRole extends "Buyer"
        ? BuyerProduct
        : TRole extends "InventoryManager"
          ? InventoryManagerProduct
          : TRole extends "WarehouseStaff"
            ? WarehouseStaffProduct
            : never;

// ============================================================
// CLASS IMPLEMENTATION
// ============================================================

/**
 * Product client with role-based access control
 * Simple wrapper around BDO API - no business logic
 * All validation handled by useForm hook with BDO schema
 * All computed fields handled by backend
 */
export class Product<TRole extends Role = typeof Roles.Admin> {
  /**
   * Create Product Master client for specific role
   */
  constructor(_role: TRole) {}

  /**
   * List products with optional filtering and pagination
   */
  async list(
    options?: ListOptions
  ): Promise<ListResponse<ProductForRole<TRole>>> {
    return api("BDO_AmazonProductMaster").list(options);
  }

  /**
   * Get single product by ID
   */
  async get(id: IdField): Promise<ProductForRole<TRole>> {
    return api("BDO_AmazonProductMaster").get(id);
  }

  /**
   * Create new product
   * Validation handled by useForm hook
   * Computed fields calculated by backend
   */
  async create(
    data: Partial<ProductForRole<TRole>>
  ): Promise<CreateUpdateResponse> {
    return api("BDO_AmazonProductMaster").create(data);
  }

  /**
   * Update existing product
   * Validation handled by useForm hook
   * Computed fields calculated by backend
   */
  async update(
    id: IdField,
    data: Partial<ProductForRole<TRole>>
  ): Promise<CreateUpdateResponse> {
    return api("BDO_AmazonProductMaster").update(id, data);
  }

  /**
   * Delete product
   */
  async delete(id: IdField): Promise<DeleteResponse> {
    return api("BDO_AmazonProductMaster").delete(id);
  }

  // ============================================================
  // DRAFT/INTERACTIVE OPERATIONS
  // ============================================================

  /**
   * Create draft - compute fields without persisting
   */
  async draft(data: Partial<ProductForRole<TRole>>): Promise<DraftResponse> {
    return api("BDO_AmazonProductMaster").draft(data);
  }

  /**
   * Update draft (patch) - compute fields during editing
   */
  async draftPatch(
    id: IdField,
    data: Partial<ProductForRole<TRole>>
  ): Promise<DraftResponse> {
    return api("BDO_AmazonProductMaster").draftPatch(id, data);
  }

  // ============================================================
  // QUERY OPERATIONS
  // ============================================================

  /**
   * Get aggregated metrics grouped by dimensions
   */
  async metric(options: Omit<MetricOptions, "Type">): Promise<MetricResponse> {
    return api("BDO_AmazonProductMaster").metric(options);
  }

  /**
   * Get pivot table data
   */
  async pivot(options: Omit<PivotOptions, "Type">): Promise<PivotResponse> {
    return api("BDO_AmazonProductMaster").pivot(options);
  }

  // ============================================================
  // METADATA OPERATIONS
  // ============================================================

  /**
   * Get field definitions for this Business Object
   */
  async fields(): Promise<FieldsResponse> {
    return api("BDO_AmazonProductMaster").fields();
  }

  /**
   * Fetch reference data for a specific field (for lookup and dropdown fields)
   * GET /{bo_id}/field/{field_id}/fetch
   *
   * @param fieldId - The field ID to fetch data for
   * @returns Field data (e.g., dropdown options)
   *
   * @example
   * ```typescript
   * const product = new Product(Roles.Buyer);
   * const categories = await product.fetchField("Category");
   * const warehouses = await product.fetchField("Warehouse");
   * // Returns: [{ Value: "Electronics", Label: "Electronics" }, ...]
   * ```
   */
  async fetchField(fieldId: string): Promise<any> {
    return api("BDO_AmazonProductMaster").fetchField(fieldId);
  }
}
