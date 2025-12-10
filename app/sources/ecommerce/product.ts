// ============================================================
// IMPORTS
// ============================================================
import {
  IdField,
  StringField,
  NumberField,
  DateTimeField,
  SelectField,
  TextAreaField,
  CurrencyField,
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
 * Complete E-Commerce Product type with all fields
 */
export type ProductType = {
  /** Unique product identifier */
  _id: IdField;

  /** Product name */
  name: StringField;

  /** Sale price */
  price: CurrencyField;

  /** Product description */
  description: TextAreaField;

  /** Product category */
  category: SelectField<
    "electronics" | "clothing" | "books" | "home" | "sports"
  >;

  /** Available quantity in stock */
  availableQuantity: NumberField;

  /** Product image URL */
  imageUrl: StringField;

  /** Seller who owns this product */
  sellerId: StringField;

  /** Seller name for display */
  sellerName: StringField;

  /** When the product was created */
  _created_at: DateTimeField;

  /** When the product was last modified */
  _modified_at: DateTimeField;

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
};

// ============================================================
// ROLE-BASED VIEWS
// ============================================================

/**
 * Buyer view - can see public product information
 */
export type BuyerProduct = Pick<
  ProductType,
  | "_id"
  | "name"
  | "price"
  | "description"
  | "category"
  | "availableQuantity"
  | "imageUrl"
  | "sellerName"
  | "_created_at"
  | "_modified_at"
  | "_version"
  | "_m_version"
>;

/**
 * Seller view - can see all fields (filtered to own products on API side)
 */
export type SellerProduct = ProductType;

// ============================================================
// CONDITIONAL TYPE MAPPER
// ============================================================

/**
 * Maps role to appropriate view type
 */
export type ProductForRole<TRole extends Role> =
  TRole extends typeof Roles.Buyer
    ? BuyerProduct
    : TRole extends typeof Roles.Seller
      ? SellerProduct
      : never;

// ============================================================
// CLASS IMPLEMENTATION
// ============================================================

/**
 * E-Commerce Product client with role-based access control
 */
export class Product<TRole extends Role = typeof Roles.Seller> {
  constructor(private role: TRole) {}

  /**
   * List products with optional filtering and pagination
   */
  async list(
    options?: ListOptions
  ): Promise<ListResponse<ProductForRole<TRole>>> {
    return api("product").list(options);
  }

  /**
   * Get single product by ID
   */
  async get(id: IdField): Promise<ProductForRole<TRole>> {
    return api("product").get(id);
  }

  /**
   * Create new product (Seller only)
   */
  async create(
    data: Partial<ProductForRole<TRole>>
  ): Promise<CreateUpdateResponse> {
    if (this.role !== Roles.Seller) {
      throw new Error("Only sellers can create products");
    }
    return api("product").create(data);
  }

  /**
   * Update existing product (Seller only, must own product)
   */
  async update(
    id: IdField,
    data: Partial<ProductForRole<TRole>>
  ): Promise<CreateUpdateResponse> {
    if (this.role !== Roles.Seller) {
      throw new Error("Only sellers can update products");
    }
    return api("product").update(id, data);
  }

  /**
   * Delete product (Seller only, must own product)
   */
  async delete(id: IdField): Promise<DeleteResponse> {
    if (this.role !== Roles.Seller) {
      throw new Error("Only sellers can delete products");
    }
    return api("product").delete(id);
  }
}
