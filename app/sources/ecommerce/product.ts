// ============================================================
// AMAZON PRODUCT MASTER - BDO SDK Wrapper
// ============================================================
// Thin wrapper around BDO_AmazonProductMaster API
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
  api,
} from "../../../sdk";

// ============================================================
// TYPE DEFINITION
// ============================================================

/**
 * Complete Amazon Product Master type based on BDO schema
 * All validation rules are defined in BDO schema and enforced by useForm hook
 * Computed fields (Discount, LowStock) are calculated by backend
 */
export type AmazonProductMasterType = {
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
export type AdminAmazonProduct = AmazonProductMasterType;

/**
 * Seller view - can edit product details, pricing, and inventory
 */
export type SellerAmazonProduct = Pick<
  AmazonProductMasterType,
  | "ProductId"
  | "ASIN"
  | "SKU"
  | "Title"
  | "Description"
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
export type BuyerAmazonProduct = Pick<
  AmazonProductMasterType,
  | "ProductId"
  | "ASIN"
  | "SKU"
  | "Title"
  | "Description"
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
export type InventoryManagerAmazonProduct = Pick<
  AmazonProductMasterType,
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
export type WarehouseStaffAmazonProduct = Pick<
  AmazonProductMasterType,
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
export type AmazonProductForRole<TRole extends Role> =
  TRole extends typeof Roles.Admin
    ? AdminAmazonProduct
    : TRole extends "Seller"
      ? SellerAmazonProduct
      : TRole extends "Buyer"
        ? BuyerAmazonProduct
        : TRole extends "InventoryManager"
          ? InventoryManagerAmazonProduct
          : TRole extends "WarehouseStaff"
            ? WarehouseStaffAmazonProduct
            : never;

// ============================================================
// CLASS IMPLEMENTATION
// ============================================================

/**
 * Amazon Product Master client with role-based access control
 * Simple wrapper around BDO API - no business logic
 * All validation handled by useForm hook with BDO schema
 * All computed fields handled by backend
 */
export class AmazonProductMaster<TRole extends Role = typeof Roles.Admin> {
  /**
   * Create Amazon Product Master client for specific role
   */
  constructor(_role: TRole) {}

  /**
   * List products with optional filtering and pagination
   */
  async list(
    options?: ListOptions
  ): Promise<ListResponse<AmazonProductForRole<TRole>>> {
    return api("BDO_AmazonProductMaster").list(options);
  }

  /**
   * Get single product by ID
   */
  async get(id: IdField): Promise<AmazonProductForRole<TRole>> {
    return api("BDO_AmazonProductMaster").get(id);
  }

  /**
   * Create new product
   * Validation handled by useForm hook
   * Computed fields calculated by backend
   */
  async create(
    data: Partial<AmazonProductForRole<TRole>>
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
    data: Partial<AmazonProductForRole<TRole>>
  ): Promise<CreateUpdateResponse> {
    return api("BDO_AmazonProductMaster").update(id, data);
  }

  /**
   * Delete product
   */
  async delete(id: IdField): Promise<DeleteResponse> {
    return api("BDO_AmazonProductMaster").delete(id);
  }
}
