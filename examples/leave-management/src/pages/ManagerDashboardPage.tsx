import { useTable } from "../../../../sdk/components/hooks/useTable";
import { LeaveRequestForRole, Roles } from "../../../../app";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Clock, CheckCircle, Users, TrendingUp, Calendar, Filter } from "lucide-react";

type LeaveRequest = LeaveRequestForRole<typeof Roles.Manager>;

export function ManagerDashboardPage() {
  const navigate = useNavigate();

  // Fetch team leave requests for the dashboard
  const teamRequests = useTable<LeaveRequest>({
    source: "leave-request",
    columns: [
      { fieldId: "LeaveRequestId", label: "Request ID", enableSorting: false },
      { fieldId: "FullName", label: "Employee", enableSorting: false },
      { fieldId: "StartDate", label: "Start Date", enableSorting: false },
      { fieldId: "EndDate", label: "End Date", enableSorting: false },
      { fieldId: "LeaveType", label: "Type", enableSorting: false },
      { fieldId: "LeaveDays", label: "Days", enableSorting: false },
      { fieldId: "CurrentStatus", label: "Status", enableSorting: false },
      { fieldId: "CreatedAt", label: "Applied", enableSorting: false },
    ],
    enablePagination: true,
    initialState: {
      pagination: { pageNo: 1, pageSize: 5 },
      sorting: { field: "CreatedAt" as keyof LeaveRequest, direction: "desc" },
    },
  });

  // Fetch pending approvals (requests awaiting manager approval)
  const pendingApprovals = useTable<LeaveRequest>({
    source: "leave-request",
    columns: [
      { fieldId: "LeaveRequestId", label: "Request ID", enableSorting: false },
      { fieldId: "FullName", label: "Employee", enableSorting: false },
      { fieldId: "StartDate", label: "Start Date", enableSorting: false },
      { fieldId: "EndDate", label: "End Date", enableSorting: false },
      { fieldId: "LeaveType", label: "Type", enableSorting: false },
      { fieldId: "LeaveDays", label: "Days", enableSorting: false },
    ],
    enablePagination: true,
    initialState: {
      pagination: { pageNo: 1, pageSize: 3 },
      sorting: { field: "CreatedAt" as keyof LeaveRequest, direction: "asc" },
      // Filter for pending manager approval
      filters: [
        {
          id: "pending-approval-filter",
          lhsField: "CurrentStatus",
          operator: "EQ",
          rhsValue: "MANAGER_APPROVAL",
          isValid: true,
        },
      ],
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      INITIATE: "secondary",
      MANAGER_APPROVAL: "outline",
      FINANCE_APPROVAL: "outline",
      HR_PROCESS: "outline",
      COMPLETED: "default",
    };
    return variants[status] || "outline";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      INITIATE: "Draft",
      MANAGER_APPROVAL: "Pending Manager Approval",
      FINANCE_APPROVAL: "Pending Finance Approval",
      HR_PROCESS: "HR Processing",
      COMPLETED: "Completed",
    };
    return labels[status] || status;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Calculate summary statistics
  const totalRequests = teamRequests.rows.length;
  const pendingApprovalCount = teamRequests.rows.filter(
    (req) => req.CurrentStatus === "MANAGER_APPROVAL"
  ).length;
  const approvedRequests = teamRequests.rows.filter(
    (req) => req.ManagerApproved === true
  ).length;
  const teamOnLeaveToday = teamRequests.rows.filter((req) => {
    if (req.CurrentStatus !== "COMPLETED" || req.ManagerApproved !== true)
      return false;
    const today = new Date();
    const startDate = new Date(req.StartDate);
    const endDate = new Date(req.EndDate);
    return today >= startDate && today <= endDate;
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-700 bg-clip-text text-transparent">
            Manager Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage your team's leave requests and track approval workflows
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <Card className="border-0 bg-gradient-to-br from-orange-50 to-orange-100/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium text-orange-700">
                  Pending Approvals
                </CardTitle>
                <CardDescription className="text-xs text-orange-600">
                  Require your attention
                </CardDescription>
              </div>
              <div className="h-10 w-10 rounded-lg bg-orange-500 flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-orange-600">
                {pendingApprovalCount}
              </div>
              <div className="flex items-center pt-1">
                <TrendingUp className="h-3 w-3 text-orange-600 mr-1" />
                <span className="text-xs text-orange-600 font-medium">
                  Urgent priority
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium text-blue-700">
                  Total Requests
                </CardTitle>
                <CardDescription className="text-xs text-blue-600">
                  All team submissions
                </CardDescription>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center">
                <CalendarDays className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-blue-600">{totalRequests}</div>
              <div className="flex items-center pt-1">
                <Users className="h-3 w-3 text-blue-600 mr-1" />
                <span className="text-xs text-blue-600 font-medium">
                  From your team
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium text-green-700">
                  Approved Requests
                </CardTitle>
                <CardDescription className="text-xs text-green-600">
                  Successfully processed
                </CardDescription>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-green-600">
                {approvedRequests}
              </div>
              <div className="flex items-center pt-1">
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-xs text-green-600 font-medium">
                  {totalRequests > 0
                    ? `${Math.round((approvedRequests / totalRequests) * 100)}% approval rate`
                    : "No requests yet"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium text-purple-700">Team On Leave</CardTitle>
                <CardDescription className="text-xs text-purple-600">
                  Currently absent
                </CardDescription>
              </div>
              <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-purple-600">
                {teamOnLeaveToday}
              </div>
              <div className="flex items-center pt-1">
                <Calendar className="h-3 w-3 text-purple-600 mr-1" />
                <span className="text-xs text-purple-600 font-medium">
                  Active today
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-600" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Streamline your team management workflows
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button 
                size="lg" 
                onClick={() => navigate("/approvals")}
                className="h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Clock className="h-5 w-5 mr-2" />
                Review Pending Approvals
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate("/approvals")}
                className="h-12 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300"
              >
                <TrendingUp className="h-5 w-5 mr-2" />
                View All Team Requests
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  Pending Approvals
                </CardTitle>
                <CardDescription className="text-base">
                  Leave requests requiring your immediate attention
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                onClick={() => navigate("/approvals")}
                className="border-orange-200 hover:border-orange-400 hover:bg-orange-50 transition-all duration-300"
              >
                View All
              </Button>
            </div>
          </CardHeader>
        <CardContent>
          {pendingApprovals.isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-600">Loading pending approvals...</div>
            </div>
          ) : pendingApprovals.error ? (
            <div className="text-red-600 text-center py-8">
              Error loading approvals: {pendingApprovals.error.message}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingApprovals.rows.length > 0 ? (
                  pendingApprovals.rows.map((request) => (
                    <TableRow key={request._id}>
                      <TableCell className="font-medium">
                        {request.LeaveRequestId}
                      </TableCell>
                      <TableCell>{request.FullName}</TableCell>
                      <TableCell>
                        {formatDate(request.StartDate)} -{" "}
                        {formatDate(request.EndDate)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{request.LeaveType}</Badge>
                      </TableCell>
                      <TableCell>{request.LeaveDays}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => navigate("/approvals")}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-gray-500"
                    >
                      No pending approvals 🎉
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

        {/* Recent Team Requests */}
        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-blue-600" />
                  Recent Team Requests
                </CardTitle>
                <CardDescription className="text-base">
                  Latest leave requests from your team members
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                onClick={() => navigate("/approvals")}
                className="border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300"
              >
                View All
              </Button>
            </div>
          </CardHeader>
        <CardContent>
          {teamRequests.isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-600">Loading team requests...</div>
            </div>
          ) : teamRequests.error ? (
            <div className="text-red-600 text-center py-8">
              Error loading requests: {teamRequests.error.message}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamRequests.rows.length > 0 ? (
                  teamRequests.rows.map((request) => (
                    <TableRow key={request._id}>
                      <TableCell className="font-medium">
                        {request.LeaveRequestId}
                      </TableCell>
                      <TableCell>{request.FullName}</TableCell>
                      <TableCell>
                        {formatDate(request.StartDate)} -{" "}
                        {formatDate(request.EndDate)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{request.LeaveType}</Badge>
                      </TableCell>
                      <TableCell>{request.LeaveDays}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(request.CurrentStatus)}>
                          {getStatusLabel(request.CurrentStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatDate(request.CreatedAt)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-gray-500"
                    >
                      No team requests found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
