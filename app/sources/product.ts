// ============================================================
// IMPORTS
// ============================================================
import {
  IdField,
  StringField,
  NumberField,
  DateField,
  BooleanField,
} from "../types/base-fields";
import { Role, Roles } from "../types/roles";
import { ListResponse, ListOptions, CreateUpdateResponse, DeleteResponse } from "../types/common";
import { api } from "../../api";

// ============================================================
// TYPE DEFINITION (using field types for semantic meaning)
// ============================================================

/**
 * Complete Product type with all fields
 * Field types (IdField, StringField, etc.) provide semantic meaning
 * but resolve to their base TypeScript types (string, number, etc.)
 */
export type ProductType = {
  /** Unique product identifier */
  _id: IdField;

  /** Product name */
  name: StringField;

  /** Sale price */
  price: NumberField;

  /** Product description */
  description: StringField;

  /** Product category */
  category: StringField<
    "electronics" | "clothing" | "books" | "home" | "sports"
  >;

  /** Whether product is in stock */
  inStock: BooleanField;

  /** When the product was created */
  _created_at: DateField;

  /** When the product was last modified */
  _modified_at: DateField;

  /** User who created the record */
  _created_by: {
    _id: IdField;
    username: StringField;
  };

  /** User who last modified the record */
  _modified_by: {
    _id: IdField;
    username: StringField;
  };

  /** Record version (for concurrency control) */
  _version: StringField;

  /** Metadata version */
  _m_version: StringField;

  /** Cost price (admin only) */
  cost: NumberField;

  /** Supplier name (admin only) */
  supplier: StringField;

  /** Profit margin percentage (admin only) */
  margin: NumberField;

  /** Last restocked date (admin only) */
  lastRestocked: DateField;
};

// ============================================================
// ROLE-BASED VIEWS
// ============================================================

/**
 * Admin view - can see all fields including cost and supplier data
 */
export type AdminProduct = ProductType;

/**
 * User view - can only see public product information, no cost/supplier data
 */
export type UserProduct = Pick<
  ProductType,
  "_id" | "name" | "price" | "description" | "category" | "inStock" | "_created_at" | "_modified_at" | "_created_by" | "_modified_by" | "_version" | "_m_version"
>;

// ============================================================
// CONDITIONAL TYPE MAPPER
// ============================================================

/**
 * Maps role to appropriate view type
 * This is how TypeScript knows which fields to allow
 */
export type ProductForRole<TRole extends Role> =
  TRole extends typeof Roles.Admin
    ? AdminProduct
    : TRole extends typeof Roles.User
    ? UserProduct
    : never;


// ============================================================
// CLASS IMPLEMENTATION
// ============================================================

/**
 * Product client with role-based access control
 * @template TRole - User's role determining field visibility
 */
export class Product<TRole extends Role = typeof Roles.Admin> {
  /**
   * Create product client for specific role
   * @param role - User role (must use Roles constant)
   */
  constructor(private role: TRole) {}

  /**
   * List products with optional filtering and pagination
   * @param options - Query options (filter, sort, pagination)
   * @returns Paginated list of products (filtered by role)
   */
  async list(
    options?: ListOptions
  ): Promise<ListResponse<ProductForRole<TRole>>> {
    return api("product").list(options);
  }

  /**
   * Get single product by ID
   * @param id - Product ID
   * @returns Product data (filtered by role)
   */
  async get(id: IdField): Promise<ProductForRole<TRole>> {
    return api("product").get(id);
  }

  /**
   * Create new product
   * @param data - Product data (only fields visible to role)
   * @returns Create response with product ID
   */
  async create(
    data: Partial<ProductForRole<TRole>>
  ): Promise<CreateUpdateResponse> {
    return api("product").create(data);
  }

  /**
   * Update existing product
   * @param id - Product ID
   * @param data - Updated fields (only fields visible to role)
   * @returns Update response with product ID
   */
  async update(
    id: IdField,
    data: Partial<ProductForRole<TRole>>
  ): Promise<CreateUpdateResponse> {
    return api("product").update(id, data);
  }

  /**
   * Delete product (admin only)
   * @param id - Product ID
   * @returns Delete response with status
   * @throws Error if non-admin attempts deletion
   */
  async delete(id: IdField): Promise<DeleteResponse> {
    // Role-based permission check
    if (this.role !== Roles.Admin) {
      throw new Error("Only admins can delete products");
    }

    return api("product").delete(id);
  }

}
