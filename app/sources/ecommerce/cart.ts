// ============================================================
// IMPORTS
// ============================================================
import {
  IdField,
  StringField,
  NumberField,
  DateTimeField,
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
 * Cart Item type for e-commerce
 */
export type CartItemType = {
  /** Unique cart item identifier */
  _id: IdField;

  /** Reference to the product */
  productId: IdField;

  /** Product name (denormalized for display) */
  productName: StringField;

  /** Product price snapshot at add time */
  productPrice: CurrencyField;

  /** Product image URL (denormalized) */
  productImage: StringField;

  /** Quantity of this item in cart */
  quantity: NumberField;

  /** Subtotal: quantity * productPrice (computed) */
  subtotal: CurrencyField;

  /** Buyer who owns this cart item */
  buyerId: StringField;

  /** When the item was added to cart */
  _created_at: DateTimeField;

  /** When the item was last modified */
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

  /** Record version */
  _version: StringField;

  /** Metadata version */
  _m_version: StringField;
};

// ============================================================
// ROLE-BASED VIEWS
// ============================================================

/**
 * Buyer cart view - all fields (filtered by buyerId on API side)
 */
export type BuyerCartItem = CartItemType;

// ============================================================
// CLASS IMPLEMENTATION
// ============================================================

/**
 * Cart client - only Buyers can access cart
 */
export class Cart<TRole extends Role = typeof Roles.Buyer> {
  constructor(private role: TRole) {}

  /**
   * List cart items for current user
   */
  async list(options?: ListOptions): Promise<ListResponse<BuyerCartItem>> {
    if (this.role !== Roles.Buyer) {
      throw new Error("Only buyers can access cart");
    }
    return api("cart").list(options);
  }

  /**
   * Get single cart item
   */
  async get(id: IdField): Promise<BuyerCartItem> {
    if (this.role !== Roles.Buyer) {
      throw new Error("Only buyers can access cart");
    }
    return api("cart").get(id);
  }

  /**
   * Add item to cart
   */
  async create(data: Partial<BuyerCartItem>): Promise<CreateUpdateResponse> {
    if (this.role !== Roles.Buyer) {
      throw new Error("Only buyers can add to cart");
    }
    return api("cart").create(data);
  }

  /**
   * Update cart item quantity
   */
  async update(
    id: IdField,
    data: Partial<BuyerCartItem>
  ): Promise<CreateUpdateResponse> {
    if (this.role !== Roles.Buyer) {
      throw new Error("Only buyers can update cart");
    }
    return api("cart").update(id, data);
  }

  /**
   * Remove item from cart
   */
  async delete(id: IdField): Promise<DeleteResponse> {
    if (this.role !== Roles.Buyer) {
      throw new Error("Only buyers can remove from cart");
    }
    return api("cart").delete(id);
  }
}
