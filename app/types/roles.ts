/**
 * Application roles as a const object
 * Using 'as const' makes these literal types
 */
export const Roles = {
  /** Full system access - can see and modify all data */
  Admin: "Admin",

  /** Standard user access - can only see public data */
  User: "User",

  /** Manager role - can approve leave requests for their team */
  Manager: "Manager",

  /** Employee role - can create and manage their own leave requests */
  Employee: "Employee",

  /** Buyer role - can browse products and manage their cart */
  Buyer: "Buyer",

  /** Seller role - can manage their own products */
  Seller: "Seller",

  /** Inventory Manager role - can manage inventory levels */
  InventoryManager: "InventoryManager",

  /** Warehouse Staff role - can update stock for assigned warehouse */
  WarehouseStaff: "WarehouseStaff",
} as const;

/**
 * Role type derived from Roles constant
 * Results in: 'Admin' | 'User' | 'Manager' | 'Employee' | 'Buyer' | 'Seller' | 'InventoryManager' | 'WarehouseStaff'
 */
export type Role = (typeof Roles)[keyof typeof Roles];

/**
 * Type-safe role checking utility
 */
export function isRole(value: unknown): value is Role {
  return (
    typeof value === "string" && Object.values(Roles).includes(value as Role)
  );
}