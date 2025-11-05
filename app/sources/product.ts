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
import { ListResponse, ListOptions } from "../types/common";
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
  id: IdField;

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
  createdAt: DateField;

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
  "id" | "name" | "price" | "description" | "category" | "inStock" | "createdAt"
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
// FILTER TYPES (optional but recommended)
// ============================================================

/**
 * Available filter options for product queries
 */
export interface ProductFilters {
  category?: ProductType["category"] | ProductType["category"][];
  inStock?: BooleanField;
  minPrice?: NumberField;
  maxPrice?: NumberField;
  supplier?: StringField; // Admin only
}

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
    options?: ListOptions & { filter?: ProductFilters }
  ): Promise<ListResponse<ProductForRole<TRole>>> {
    return api("products").list(options);
  }

  /**
   * Get single product by ID
   * @param id - Product ID
   * @returns Product data (filtered by role)
   */
  async get(id: IdField): Promise<ProductForRole<TRole>> {
    return api("products").get(id);
  }

  /**
   * Create new product
   * @param data - Product data (only fields visible to role)
   * @returns Created product (filtered by role)
   */
  async create(
    data: Partial<ProductForRole<TRole>>
  ): Promise<ProductForRole<TRole>> {
    return api("products").create(data);
  }

  /**
   * Update existing product
   * @param id - Product ID
   * @param data - Updated fields (only fields visible to role)
   * @returns Updated product (filtered by role)
   */
  async update(
    id: IdField,
    data: Partial<ProductForRole<TRole>>
  ): Promise<ProductForRole<TRole>> {
    return api("products").update(id, data);
  }

  /**
   * Delete product (admin only)
   * @param id - Product ID
   * @throws Error if non-admin attempts deletion
   */
  async delete(id: IdField): Promise<void> {
    // Role-based permission check
    if (this.role !== Roles.Admin) {
      throw new Error("Only admins can delete products");
    }

    await api("products").delete(id);
  }

  /**
   * Update stock status (admin only)
   * @param id - Product ID
   * @param inStock - New stock status
   * @returns Updated product
   */
  async updateStock(
    id: IdField,
    inStock: BooleanField
  ): Promise<ProductForRole<TRole>> {
    if (this.role !== Roles.Admin) {
      throw new Error("Only admins can update stock status");
    }

    return this.update(id, { inStock } as Partial<ProductForRole<TRole>>);
  }

  /**
   * Get products by category
   * @param category - Product category
   * @returns Filtered list of products
   */
  async getByCategory(
    category: ProductType["category"]
  ): Promise<ListResponse<ProductForRole<TRole>>> {
    return this.list({
      Filter: { category },
    });
  }

  /**
   * Filter product data based on user role
   * @private
   */
}
