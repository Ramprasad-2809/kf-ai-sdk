// ============================================================
// IMPORTS
// ============================================================
import {
  IdField,
  StringField,
  NumberField,
  DateTimeField,
  BooleanField,
  SelectField,
  DateField,
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
// TYPE DEFINITION (using field types for semantic meaning)
// ============================================================

/**
 * Complete Leave Request type with all fields
 * Field types provide semantic meaning but resolve to their base TypeScript types
 */
export type LeaveRequestType = {
  /** Unique leave request identifier */
  _id: IdField;

  /** System-generated leave request ID */
  LeaveRequestId: StringField;

  /** Employee ID */
  EmpId: NumberField;

  /** Employee full name (computed) */
  FullName: StringField;

  /** Leave start date */
  StartDate: DateField;

  /** Leave end date */
  EndDate: DateField;

  /** Type of leave */
  LeaveType: SelectField<"PTO" | "Sick" | "Parental">;

  /** Number of leave days (computed) */
  LeaveDays: NumberField;

  /** Whether this is loss of pay (computed) */
  LossOfPay: BooleanField;

  /** Reason for leave */
  Reason: StringField;

  /** Current workflow status */
  CurrentStatus: SelectField<
    "INITIATE" | "MANAGER_APPROVAL" | "FINANCE_APPROVAL" | "HR_PROCESS" | "COMPLETED"
  >;

  /** Manager's remarks */
  ManagerRemarks: StringField;

  /** Manager's approval decision */
  ManagerApproved: BooleanField;

  /** Finance team comments */
  FinanceComments: StringField;

  /** Finance team approval */
  FinanceApproved: BooleanField;

  /** HR team comments */
  HrComments: StringField;

  /** HR processing completion */
  HrCompleted: BooleanField;

  /** Employee cancellation request */
  CancelRequested: BooleanField;

  /** When the request was created */
  CreatedAt: DateTimeField;

  /** When the request was last updated */
  UpdatedAt: DateTimeField;

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
 * Admin view - can see all fields including finance data
 */
export type AdminLeaveRequest = LeaveRequestType;

/**
 * Manager view - can see all fields, can edit approval fields
 */
export type ManagerLeaveRequest = LeaveRequestType;

/**
 * Employee view - cannot see finance-specific fields
 */
export type EmployeeLeaveRequest = Omit<
  LeaveRequestType,
  "FinanceComments" | "FinanceApproved"
>;

// ============================================================
// CONDITIONAL TYPE MAPPER
// ============================================================

/**
 * Maps role to appropriate view type
 * This is how TypeScript knows which fields to allow
 */
export type LeaveRequestForRole<TRole extends Role> = TRole extends typeof Roles.Admin
  ? AdminLeaveRequest
  : TRole extends typeof Roles.Manager
    ? ManagerLeaveRequest
    : TRole extends typeof Roles.Employee
    ? EmployeeLeaveRequest
    : never;

// ============================================================
// CLASS IMPLEMENTATION
// ============================================================

/**
 * Leave Request client with role-based access control
 * @template TRole - User's role determining field visibility
 */
export class LeaveRequest<TRole extends Role = typeof Roles.Employee> {
  /**
   * Create leave request client for specific role
   * @param role - User role (must use Roles constant)
   */
  constructor(private role: TRole) {}

  /**
   * List leave requests with optional filtering and pagination
   * @param options - Query options (filter, sort, pagination)
   * @returns Paginated list of leave requests (filtered by role)
   */
  async list(
    options?: ListOptions
  ): Promise<ListResponse<LeaveRequestForRole<TRole>>> {
    return api("leave-request").list(options);
  }

  /**
   * Get single leave request by ID
   * @param id - Leave Request ID
   * @returns Leave request data (filtered by role)
   */
  async get(id: IdField): Promise<LeaveRequestForRole<TRole>> {
    return api("leave-request").get(id);
  }

  /**
   * Create new leave request
   * @param data - Leave request data (only fields visible to role)
   * @returns Create response with leave request ID
   */
  async create(
    data: Partial<LeaveRequestForRole<TRole>>
  ): Promise<CreateUpdateResponse> {
    return api("leave-request").create(data);
  }

  /**
   * Update existing leave request
   * @param id - Leave Request ID
   * @param data - Updated fields (only fields visible to role)
   * @returns Update response with leave request ID
   */
  async update(
    id: IdField,
    data: Partial<LeaveRequestForRole<TRole>>
  ): Promise<CreateUpdateResponse> {
    return api("leave-request").update(id, data);
  }

  /**
   * Delete leave request (admin only)
   * @param id - Leave Request ID
   * @returns Delete response with status
   * @throws Error if non-admin attempts deletion
   */
  async delete(id: IdField): Promise<DeleteResponse> {
    // Role-based permission check
    if (this.role !== Roles.Admin) {
      throw new Error("Only admins can delete leave requests");
    }

    return api("leave-request").delete(id);
  }
}