// Mock Leave Request Data
export const mockLeaveRequests = [
  {
    _id: "lr_001",
    LeaveRequestId: "LR-2024-001",
    EmpId: 1001,
    FullName: "John Smith",
    StartDate: new Date("2024-12-20"),
    EndDate: new Date("2024-12-22"),
    LeaveType: "PTO",
    LeaveDays: 3,
    LossOfPay: false,
    Reason: "Family vacation during holidays",
    CurrentStatus: "MANAGER_APPROVAL",
    ManagerRemarks: "",
    ManagerApproved: null,
    FinanceComments: "",
    FinanceApproved: null,
    HrComments: "",
    HrCompleted: null,
    CancelRequested: false,
    CreatedAt: new Date("2024-11-25T10:30:00Z"),
    UpdatedAt: new Date("2024-11-25T10:30:00Z"),
    _created_at: new Date("2024-11-25T10:30:00Z"),
    _modified_at: new Date("2024-11-25T10:30:00Z"),
  },
  {
    _id: "lr_002", 
    LeaveRequestId: "LR-2024-002",
    EmpId: 1002,
    FullName: "Sarah Johnson",
    StartDate: new Date("2024-11-15"),
    EndDate: new Date("2024-11-20"),
    LeaveType: "Sick",
    LeaveDays: 6,
    LossOfPay: false,
    Reason: "Medical treatment and recovery",
    CurrentStatus: "COMPLETED",
    ManagerRemarks: "Approved. Hope you feel better soon.",
    ManagerApproved: true,
    FinanceComments: "",
    FinanceApproved: null,
    HrComments: "Leave balance updated. Get well soon!",
    HrCompleted: true,
    CancelRequested: false,
    CreatedAt: new Date("2024-11-10T14:15:00Z"),
    UpdatedAt: new Date("2024-11-18T16:45:00Z"),
    _created_at: new Date("2024-11-10T14:15:00Z"),
    _modified_at: new Date("2024-11-18T16:45:00Z"),
  },
  {
    _id: "lr_003",
    LeaveRequestId: "LR-2024-003", 
    EmpId: 1003,
    FullName: "Mike Davis",
    StartDate: new Date("2025-01-15"),
    EndDate: new Date("2025-01-25"),
    LeaveType: "PTO",
    LeaveDays: 11,
    LossOfPay: true, // Exceeds available balance
    Reason: "Extended vacation to visit family abroad",
    CurrentStatus: "FINANCE_APPROVAL",
    ManagerRemarks: "Approved but exceeds leave balance",
    ManagerApproved: true,
    FinanceComments: "",
    FinanceApproved: null,
    HrComments: "",
    HrCompleted: null,
    CancelRequested: false,
    CreatedAt: new Date("2024-11-20T09:00:00Z"),
    UpdatedAt: new Date("2024-11-22T11:30:00Z"),
    _created_at: new Date("2024-11-20T09:00:00Z"),
    _modified_at: new Date("2024-11-22T11:30:00Z"),
  },
  {
    _id: "lr_004",
    LeaveRequestId: "LR-2024-004",
    EmpId: 1001,
    FullName: "John Smith", 
    StartDate: new Date("2024-10-10"),
    EndDate: new Date("2024-10-12"),
    LeaveType: "PTO",
    LeaveDays: 3,
    LossOfPay: false,
    Reason: "Personal time off for family event",
    CurrentStatus: "COMPLETED",
    ManagerRemarks: "Approved",
    ManagerApproved: true,
    FinanceComments: "",
    FinanceApproved: null,
    HrComments: "Processed successfully",
    HrCompleted: true,
    CancelRequested: false,
    CreatedAt: new Date("2024-09-25T13:20:00Z"),
    UpdatedAt: new Date("2024-10-01T10:15:00Z"),
    _created_at: new Date("2024-09-25T13:20:00Z"),
    _modified_at: new Date("2024-10-01T10:15:00Z"),
  },
  {
    _id: "lr_005",
    LeaveRequestId: "LR-2024-005",
    EmpId: 1004,
    FullName: "Emily Wilson",
    StartDate: new Date("2024-12-01"),
    EndDate: new Date("2024-12-02"),
    LeaveType: "Sick",
    LeaveDays: 2,
    LossOfPay: false,
    Reason: "Flu symptoms and need rest",
    CurrentStatus: "INITIATE",
    ManagerRemarks: "",
    ManagerApproved: null,
    FinanceComments: "",
    FinanceApproved: null,
    HrComments: "",
    HrCompleted: null,
    CancelRequested: false,
    CreatedAt: new Date("2024-11-28T08:45:00Z"),
    UpdatedAt: new Date("2024-11-28T08:45:00Z"),
    _created_at: new Date("2024-11-28T08:45:00Z"),
    _modified_at: new Date("2024-11-28T08:45:00Z"),
  },
];

export function filterLeaveRequestsByRole(requests, role, userId = "user_001") {
  switch (role) {
    case "admin":
      return requests; // Admins see all requests
    
    case "manager":
      // Managers see requests from their team members
      // For demo, manager manages employees 1001-1003
      return requests.filter(request => [1001, 1002, 1003].includes(request.EmpId));
    
    case "employee":
      // Employees see only their own requests
      // Map user_001 to EmpId 1001, user_002 to EmpId 1002, etc.
      const empId = parseInt(userId.split('_')[1]) + 1000;
      return requests.filter(request => request.EmpId === empId);
    
    default:
      return [];
  }
}