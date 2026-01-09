export type AppRole =
  | "Admin"
  | "Seller"
  | "Buyer"
  | "InventoryManager"
  | "WarehouseStaff";

export interface UserDetails {
  _id: string;
  _name: string;
  Role: AppRole;
}

export interface IdentityResponse {
  userDetails: UserDetails;
  staticBaseUrl: string;
  buildId: string;
}
