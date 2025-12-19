// ============================================================
// IMPORTS
// ============================================================
import {
  IdField,
  StringField,
  NumberField,
  DateTimeField,
  SelectField,
} from "../../sdk/types/base-fields";
import { Role, Roles } from "../types/roles";
import {
  ListResponse,
  ListOptions,
  CreateUpdateResponse,
  DeleteResponse,
  api,
} from "../../sdk";

// ============================================================
// TYPE DEFINITION
// ============================================================

/**
 * Complete Leave Balance type with all fields
 * Field types provide semantic meaning but resolve to their base TypeScript types
 */
export type LeaveBalanceType = {
  /** Unique leave balance identifier */
  _id: IdField;

  /** Employee ID */
  EmpId: NumberField;

  /** Employee name */
  EmployeeName: StringField;

  /** Type of leave */
  LeaveType: SelectField<"PTO" | "Sick" | "Parental">;

  /** Total allocated days for the year */
  AllocatedDays: NumberField;

  /** Days used so far (computed) */
  UsedDays: NumberField;

  /** Remaining days (computed) */
  RemainingDays: NumberField;

  /** Days carried forward from previous year */
  CarryForwardDays: NumberField;

  /** Year this balance applies to */
  Year: NumberField;

  /** When the record was created */
  _created_at: DateTimeField;

  /** When the record was last modified */
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
 * Admin view - can see all fields
 */
export type AdminLeaveBalance = LeaveBalanceType;

/**
 * Manager view - can see team member balances
 */
export type ManagerLeaveBalance = LeaveBalanceType;

/**
 * Employee view - can see own balance
 */
export type EmployeeLeaveBalance = LeaveBalanceType;

// ============================================================
// CONDITIONAL TYPE MAPPER
// ============================================================

/**
 * Maps role to appropriate view type
 */
export type LeaveBalanceForRole<TRole extends Role> = TRole extends typeof Roles.Admin
  ? AdminLeaveBalance
  : TRole extends typeof Roles.Manager
    ? ManagerLeaveBalance
    : TRole extends typeof Roles.Employee
    ? EmployeeLeaveBalance
    : never;

// ============================================================
// CLASS IMPLEMENTATION
// ============================================================

/**
 * Leave Balance client with role-based access control
 * @template TRole - User's role determining field visibility
 */
export class LeaveBalance<TRole extends Role = typeof Roles.Employee> {
  /**
   * Create leave balance client for specific role
   * @param role - User role (must use Roles constant)
   */
  constructor(private role: TRole) {}

  /**
   * List leave balances with optional filtering and pagination
   * @param options - Query options (filter, sort, pagination)
   * @returns Paginated list of leave balances (filtered by role)
   */
  async list(
    options?: ListOptions
  ): Promise<ListResponse<LeaveBalanceForRole<TRole>>> {
    return api("leave-balance").list(options);
  }

  /**
   * Get single leave balance by ID
   * @param id - Leave Balance ID
   * @returns Leave balance data (filtered by role)
   */
  async get(id: IdField): Promise<LeaveBalanceForRole<TRole>> {
    return api("leave-balance").get(id);
  }

  /**
   * Create new leave balance
   * @param data - Leave balance data (only fields visible to role)
   * @returns Create response with leave balance ID
   */
  async create(
    data: Partial<LeaveBalanceForRole<TRole>>
  ): Promise<CreateUpdateResponse> {
    // Role-based permission check
    if (this.role !== Roles.Admin) {
      throw new Error("Only admins can create leave balances");
    }
    
    return api("leave-balance").create(data);
  }

  /**
   * Update existing leave balance
   * @param id - Leave Balance ID
   * @param data - Updated fields (only fields visible to role)
   * @returns Update response with leave balance ID
   */
  async update(
    id: IdField,
    data: Partial<LeaveBalanceForRole<TRole>>
  ): Promise<CreateUpdateResponse> {
    // Role-based permission check
    if (this.role !== Roles.Admin) {
      throw new Error("Only admins can update leave balances");
    }

    return api("leave-balance").update(id, data);
  }

  /**
   * Delete leave balance (admin only)
   * @param id - Leave Balance ID
   * @returns Delete response with status
   * @throws Error if non-admin attempts deletion
   */
  async delete(id: IdField): Promise<DeleteResponse> {
    // Role-based permission check
    if (this.role !== Roles.Admin) {
      throw new Error("Only admins can delete leave balances");
    }

    return api("leave-balance").delete(id);
  }
}