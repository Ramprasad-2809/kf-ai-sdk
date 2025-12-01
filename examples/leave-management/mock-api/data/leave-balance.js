// Mock Leave Balance Data
export const mockLeaveBalances = [
  {
    _id: "lb_001",
    EmpId: 1001,
    EmployeeName: "John Smith",
    LeaveType: "PTO",
    AllocatedDays: 20,
    UsedDays: 8,
    RemainingDays: 12,
    CarryForwardDays: 3,
    Year: 2024,
    _created_at: new Date("2024-01-01T00:00:00Z"),
    _modified_at: new Date("2024-03-15T10:30:00Z"),
  },
  {
    _id: "lb_002",
    EmpId: 1001,
    EmployeeName: "John Smith",
    LeaveType: "Sick",
    AllocatedDays: 10,
    UsedDays: 2,
    RemainingDays: 8,
    CarryForwardDays: 0,
    Year: 2024,
    _created_at: new Date("2024-01-01T00:00:00Z"),
    _modified_at: new Date("2024-02-20T14:15:00Z"),
  },
  {
    _id: "lb_003",
    EmpId: 1002,
    EmployeeName: "Sarah Johnson",
    LeaveType: "PTO",
    AllocatedDays: 25,
    UsedDays: 15,
    RemainingDays: 10,
    CarryForwardDays: 5,
    Year: 2024,
    _created_at: new Date("2024-01-01T00:00:00Z"),
    _modified_at: new Date("2024-11-10T09:45:00Z"),
  },
  {
    _id: "lb_004",
    EmpId: 1003,
    EmployeeName: "Mike Davis",
    LeaveType: "PTO",
    AllocatedDays: 18,
    UsedDays: 3,
    RemainingDays: 15,
    CarryForwardDays: 2,
    Year: 2024,
    _created_at: new Date("2024-01-01T00:00:00Z"),
    _modified_at: new Date("2024-04-05T16:20:00Z"),
  },
  {
    _id: "lb_005",
    EmpId: 1004,
    EmployeeName: "Emily Wilson",
    LeaveType: "Parental",
    AllocatedDays: 12,
    UsedDays: 0,
    RemainingDays: 12,
    CarryForwardDays: 0,
    Year: 2024,
    _created_at: new Date("2024-01-01T00:00:00Z"),
    _modified_at: new Date("2024-01-01T00:00:00Z"),
  },
];

export function filterLeaveBalancesByRole(balances, role, userId = "user_001") {
  switch (role) {
    case "admin":
      return balances; // Admins see all balances
    
    case "manager":
      // Managers see balances for their team members
      // For demo, manager manages employees 1001-1003
      return balances.filter(balance => [1001, 1002, 1003].includes(balance.EmpId));
    
    case "employee":
      // Employees see only their own balance
      // Map user_001 to EmpId 1001, user_002 to EmpId 1002, etc.
      const empId = parseInt(userId.split('_')[1]) + 1000;
      return balances.filter(balance => balance.EmpId === empId);
    
    default:
      return [];
  }
}