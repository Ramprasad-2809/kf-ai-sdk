// ============================================================
// IMPORTS
// ============================================================
import {
  IdField,
  StringField,
  NumberField,
  DateTimeField,
  CurrencyField,
  TextAreaField,
  SelectField,
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
 * Product Restocking type for inventory management workflow
 */
export type ProductRestockingType = {
  /** Unique restocking task identifier */
  _id: IdField;

  /** Card title (auto-generated: "{Product.Title} - Restock") */
  title: StringField;

  /** Kanban column ID (workflow stage) */
  columnId: StringField;

  /** Position within column for ordering */
  position: NumberField;

  // ============================================================
  // Product Reference (denormalized for display)
  // ============================================================

  /** Reference to the product being restocked */
  productId: IdField;

  /** Product title (denormalized for quick display) */
  productTitle: StringField;

  /** Product SKU (denormalized) */
  productSKU: StringField;

  /** Product ASIN (denormalized) */
  productASIN: StringField;

  // ============================================================
  // Inventory Snapshot (at time of restocking creation)
  // ============================================================

  /** Current stock level when restocking was initiated */
  currentStock: NumberField;

  /** Reorder threshold level */
  reorderLevel: NumberField;

  /** Warehouse location */
  warehouse: SelectField<"Warehouse_A" | "Warehouse_B" | "Warehouse_C">;

  // ============================================================
  // Restocking Details
  // ============================================================

  /** Quantity ordered from supplier */
  quantityOrdered: NumberField;

  /** Estimated cost of restocking (optional) */
  estimatedCost: CurrencyField;

  /** Supplier name (optional) */
  supplier: StringField;

  /** Date when order was placed */
  orderDate: DateTimeField;

  /** Expected delivery date */
  expectedDeliveryDate: DateTimeField;

  // ============================================================
  // Status Tracking
  // ============================================================

  /** Current workflow status (matches columnId) */
  status: SelectField<"LowStockAlert" | "OrderPlaced" | "InTransit" | "Received">;

  /** Priority level (auto-calculated or manual) */
  priority: SelectField<"Low" | "Medium" | "High" | "Critical">;

  /** Internal notes about this restocking task */
  notes: TextAreaField;

  // ============================================================
  // System Fields
  // ============================================================

  /** When the restocking task was created */
  _created_at: DateTimeField;

  /** When the restocking task was last modified */
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
 * InventoryManager restocking view - full access to restocking workflow
 */
export type InventoryManagerRestocking = Pick<
  ProductRestockingType,
  | "_id"
  | "title"
  | "columnId"
  | "position"
  | "productId"
  | "productTitle"
  | "productSKU"
  | "productASIN"
  | "currentStock"
  | "reorderLevel"
  | "warehouse"
  | "quantityOrdered"
  | "estimatedCost"
  | "supplier"
  | "orderDate"
  | "expectedDeliveryDate"
  | "status"
  | "priority"
  | "notes"
  | "_created_at"
  | "_modified_at"
>;

// ============================================================
// CLASS IMPLEMENTATION
// ============================================================

/**
 * ProductRestocking client - only InventoryManager can access
 */
export class ProductRestocking<TRole extends Role = typeof Roles.InventoryManager> {
  constructor(private role: TRole) {}

  /**
   * List restocking tasks
   */
  async list(options?: ListOptions): Promise<ListResponse<InventoryManagerRestocking>> {
    if (this.role !== Roles.InventoryManager) {
      throw new Error("Only inventory managers can access restocking tasks");
    }
    return api("BDO_ProductRestocking").list(options);
  }

  /**
   * Get single restocking task
   */
  async get(id: IdField): Promise<InventoryManagerRestocking> {
    if (this.role !== Roles.InventoryManager) {
      throw new Error("Only inventory managers can access restocking tasks");
    }
    return api("BDO_ProductRestocking").get(id);
  }

  /**
   * Create new restocking task
   */
  async create(data: Partial<InventoryManagerRestocking>): Promise<CreateUpdateResponse> {
    if (this.role !== Roles.InventoryManager) {
      throw new Error("Only inventory managers can create restocking tasks");
    }
    return api("BDO_ProductRestocking").create(data);
  }

  /**
   * Update restocking task
   */
  async update(
    id: IdField,
    data: Partial<InventoryManagerRestocking>
  ): Promise<CreateUpdateResponse> {
    if (this.role !== Roles.InventoryManager) {
      throw new Error("Only inventory managers can update restocking tasks");
    }
    return api("BDO_ProductRestocking").update(id, data);
  }

  /**
   * Delete restocking task
   */
  async delete(id: IdField): Promise<DeleteResponse> {
    if (this.role !== Roles.InventoryManager) {
      throw new Error("Only inventory managers can delete restocking tasks");
    }
    return api("BDO_ProductRestocking").delete(id);
  }
}
