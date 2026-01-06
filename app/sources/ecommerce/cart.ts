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
  DraftResponse,
  MetricOptions,
  MetricResponse,
  PivotOptions,
  PivotResponse,
  FieldsResponse,
  api,
  getBdoFields,
  FieldMetadata,
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

/**
 * Maps role to appropriate cart view type
 * Currently only Buyers can access cart
 */
export type CartForRole<TRole extends Role> = TRole extends typeof Roles.Buyer
  ? BuyerCartItem
  : never;

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
  async list(options?: ListOptions): Promise<ListResponse<CartForRole<TRole>>> {
    if (this.role !== Roles.Buyer) {
      throw new Error("Only buyers can access cart");
    }
    return api("BDO_Cart").list(options);
  }

  /**
   * Get single cart item
   */
  async get(id: IdField): Promise<CartForRole<TRole>> {
    if (this.role !== Roles.Buyer) {
      throw new Error("Only buyers can access cart");
    }
    return api("BDO_Cart").get(id);
  }

  /**
   * Add item to cart
   */
  async create(
    data: Partial<CartForRole<TRole>>
  ): Promise<CreateUpdateResponse> {
    if (this.role !== Roles.Buyer) {
      throw new Error("Only buyers can add to cart");
    }
    return api("BDO_Cart").create(data);
  }

  /**
   * Update cart item quantity
   */
  async update(
    id: IdField,
    data: Partial<CartForRole<TRole>>
  ): Promise<CreateUpdateResponse> {
    if (this.role !== Roles.Buyer) {
      throw new Error("Only buyers can update cart");
    }
    return api("BDO_Cart").update(id, data);
  }

  /**
   * Remove item from cart
   */
  async delete(id: IdField): Promise<DeleteResponse> {
    if (this.role !== Roles.Buyer) {
      throw new Error("Only buyers can remove from cart");
    }
    return api("BDO_Cart").delete(id);
  }

  // ============================================================
  // DRAFT/INTERACTIVE OPERATIONS
  // ============================================================

  /**
   * Create draft - compute fields without persisting
   */
  async draft(data: Partial<CartForRole<TRole>>): Promise<DraftResponse> {
    if (this.role !== Roles.Buyer) {
      throw new Error("Only buyers can access cart");
    }
    return api("BDO_Cart").draft(data);
  }

  /**
   * Update draft (patch) - compute fields during editing
   */
  async draftPatch(
    id: IdField,
    data: Partial<CartForRole<TRole>>
  ): Promise<DraftResponse> {
    if (this.role !== Roles.Buyer) {
      throw new Error("Only buyers can access cart");
    }
    return api("BDO_Cart").draftPatch(id, data);
  }

  // ============================================================
  // QUERY OPERATIONS
  // ============================================================

  /**
   * Get aggregated metrics grouped by dimensions
   */
  async metric(options: Omit<MetricOptions, "Type">): Promise<MetricResponse> {
    if (this.role !== Roles.Buyer) {
      throw new Error("Only buyers can access cart");
    }
    return api("BDO_Cart").metric(options);
  }

  /**
   * Get pivot table data
   */
  async pivot(options: Omit<PivotOptions, "Type">): Promise<PivotResponse> {
    if (this.role !== Roles.Buyer) {
      throw new Error("Only buyers can access cart");
    }
    return api("BDO_Cart").pivot(options);
  }

  // ============================================================
  // METADATA OPERATIONS
  // ============================================================

  /**
   * Get field definitions for this Business Object
   */
  async fields(): Promise<FieldsResponse> {
    return api("BDO_Cart").fields();
  }

  /**
   * Get field options for a specific field (e.g., dropdown values)
   *
   * @param fieldId - The field ID to get options for
   * @returns Array of field option items with Value and Label
   *
   * @example
   * ```typescript
   * const cart = new Cart(Roles.Buyer);
   * const statuses = await cart.getField("Status");
   * ```
   */
  async getField(
    fieldId: string
  ): Promise<Array<{ Value: string; Label: string }>> {
    const response = await getBdoFields("BDO_Cart");
    const field = response.find((f: FieldMetadata) => f.Id === fieldId);

    if (!field) {
      throw new Error(`Field "${fieldId}" not found`);
    }

    if (!field.Values?.Items) {
      throw new Error(`Field "${fieldId}" does not have options`);
    }

    return field.Values.Items;
  }

  /**
   * Get cart item count (convenience method)
   */
  async count(): Promise<number> {
    if (this.role !== Roles.Buyer) {
      throw new Error("Only buyers can access cart count");
    }
    const response = await api("BDO_Cart").count();
    return response.Count;
  }
}
