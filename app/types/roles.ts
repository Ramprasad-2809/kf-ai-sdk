/**
 * Application roles as a const object
 * Using 'as const' makes these literal types
 */
export const Roles = {
  /** Full system access - can see and modify all data */
  Admin: "admin",

  /** Standard user access - can only see public data */
  User: "user",

  /** Manager role - can approve leave requests for their team */
  Manager: "manager",

  /** Employee role - can create and manage their own leave requests */
  Employee: "employee",

  /** Buyer role - can browse products and manage their cart */
  Buyer: "buyer",

  /** Seller role - can manage their own products */
  Seller: "seller",
} as const;

/**
 * Role type derived from Roles constant
 * Results in: 'admin' | 'user' | 'manager' | 'employee'
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