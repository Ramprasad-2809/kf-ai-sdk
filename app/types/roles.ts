/**
 * Application roles as a const object
 * Using 'as const' makes these literal types
 */
export const Roles = {
  /** Full system access - can see and modify all data */
  Admin: "admin",

  /** Standard user access - can only see public data */
  User: "user",
} as const;

/**
 * Role type derived from Roles constant
 * Results in: 'admin' | 'user'
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