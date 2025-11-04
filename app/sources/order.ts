// ============================================================
// IMPORTS
// ============================================================
import {
  IdField,
  StringField,
  NumberField,
  DateField,
} from "../types/base-fields";
import { Role, Roles } from "../types/roles";
import { ListResponse, ListOptions } from "../types/common";
import { api } from "../../api";

// ============================================================
// TYPE DEFINITION (using field types for semantic meaning)
// ============================================================

/**
 * Complete Order type with all fields
 * Field types (IdField, StringField, etc.) provide semantic meaning
 * but resolve to their base TypeScript types (string, number, etc.)
 */
export type OrderType = {
  /** Unique order identifier */
  id: IdField;

  /** Customer who placed the order */
  customerId: IdField;

  /** Total order amount in cents */
  totalAmount: NumberField;

  /** Current order status */
  status: StringField<"pending" | "completed" | "cancelled" | "refunded">;

  /** When the order was created */
  createdAt: DateField;

  /** When the order was last updated */
  updatedAt: DateField;

  /** Internal notes (admin only) */
  internalNotes: StringField;

  /** Profit margin percentage (admin only) */
  profitMargin: NumberField;
};

// ============================================================
// ROLE-BASED VIEWS
// ============================================================

/**
 * Admin view - can see all fields including sensitive data
 */
export type AdminOrder = OrderType;

/**
 * User view - can only see basic order information, no financial/internal data
 */
export type UserOrder = Pick<
  OrderType,
  "id" | "customerId" | "status" | "createdAt" | "totalAmount"
>;

// ============================================================
// CONDITIONAL TYPE MAPPER
// ============================================================

/**
 * Maps role to appropriate view type
 * This is how TypeScript knows which fields to allow
 */
export type OrderForRole<TRole extends Role> = TRole extends typeof Roles.Admin
  ? AdminOrder
  : TRole extends typeof Roles.User
  ? UserOrder
  : never;

// ============================================================
// CLASS IMPLEMENTATION
// ============================================================

/**
 * Order client with role-based access control
 * @template TRole - User's role determining field visibility
 */
export class Order<TRole extends Role = typeof Roles.Admin> {
  /**
   * Create order client for specific role
   * @param role - User role (must use Roles constant)
   */
  constructor(private role: TRole) {}

  /**
   * List orders with optional filtering and pagination
   * @param options - Query options (filter, sort, pagination)
   * @returns Paginated list of orders (filtered by role)
   */
  async list(
    options?: ListOptions
  ): Promise<ListResponse<OrderForRole<TRole>>> {
    return api("orders").list(options);
  }

  /**
   * Get single order by ID
   * @param id - Order ID
   * @returns Order data (filtered by role)
   */
  async get(id: IdField): Promise<OrderForRole<TRole>> {
    return api("orders").get(id);
  }

  /**
   * Create new order
   * @param data - Order data (only fields visible to role)
   * @returns Created order (filtered by role)
   */
  async create(
    data: Partial<OrderForRole<TRole>>
  ): Promise<OrderForRole<TRole>> {
    return api("orders").create(data);
  }

  /**
   * Update existing order
   * @param id - Order ID
   * @param data - Updated fields (only fields visible to role)
   * @returns Updated order (filtered by role)
   */
  async update(
    id: IdField,
    data: Partial<OrderForRole<TRole>>
  ): Promise<OrderForRole<TRole>> {
    return api("orders").update(id, data);
  }

  /**
   * Delete order (admin only)
   * @param id - Order ID
   * @throws Error if non-admin attempts deletion
   */
  async delete(id: IdField): Promise<void> {
    // Role-based permission check
    if (this.role !== Roles.Admin) {
      throw new Error("Only admins can delete orders");
    }

    await api("orders").delete(id);
  }
}
