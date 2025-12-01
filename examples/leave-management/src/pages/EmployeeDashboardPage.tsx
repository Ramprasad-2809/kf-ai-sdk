import { useState } from "react";
import { useTable } from "../../../../sdk/components/hooks/useTable";
import { LeaveRequestForRole, LeaveBalanceForRole, Roles } from "../../../../app";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { Calendar, Clock, CheckCircle, AlertCircle, FileText, PlusCircle, BarChart3, TrendingUp } from "lucide-react";

type LeaveRequest = LeaveRequestForRole<typeof Roles.Employee>;
type LeaveBalance = LeaveBalanceForRole<typeof Roles.Employee>;

export function EmployeeDashboardPage() {
  const navigate = useNavigate();

  // Fetch employee's leave balances
  const leaveBalances = useTable<LeaveBalance>({
    source: "leave-balance",
    columns: [
      { fieldId: "LeaveType", label: "Leave Type", enableSorting: false },
      { fieldId: "AllocatedDays", label: "Allocated", enableSorting: false },
      { fieldId: "UsedDays", label: "Used", enableSorting: false },
      { fieldId: "RemainingDays", label: "Remaining", enableSorting: false },
    ],
    enablePagination: false,
  });

  // Fetch recent leave requests for the dashboard (last 3)
  const recentRequests = useTable<LeaveRequest>({
    source: "leave-request",
    columns: [
      { fieldId: "LeaveRequestId", label: "Request ID", enableSorting: false },
      { fieldId: "StartDate", label: "Start Date", enableSorting: false },
      { fieldId: "EndDate", label: "End Date", enableSorting: false },
      { fieldId: "LeaveType", label: "Type", enableSorting: false },
      { fieldId: "LeaveDays", label: "Days", enableSorting: false },
      { fieldId: "CurrentStatus", label: "Status", enableSorting: false },
    ],
    enablePagination: true,
    initialState: {
      pagination: { pageNo: 1, pageSize: 3 },
      sorting: { field: "CreatedAt" as keyof LeaveRequest, direction: "desc" },
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
  const totalAllocated = leaveBalances.rows.reduce((sum, balance) => sum + balance.AllocatedDays, 0);
  const totalUsed = leaveBalances.rows.reduce((sum, balance) => sum + balance.UsedDays, 0);
  const totalRemaining = leaveBalances.rows.reduce((sum, balance) => sum + balance.RemainingDays, 0);
  const pendingRequests = recentRequests.rows.filter(req => 
    req.CurrentStatus !== "COMPLETED" && !req.CancelRequested
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-green-900 to-slate-700 bg-clip-text text-transparent">
            My Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Overview of your leave balances and recent requests
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium text-blue-700">
                  Total Allocated
                </CardTitle>
                <CardDescription className="text-xs text-blue-600">
                  Days this year
                </CardDescription>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-blue-600">{totalAllocated}</div>
              <div className="flex items-center pt-1">
                <BarChart3 className="h-3 w-3 text-blue-600 mr-1" />
                <span className="text-xs text-blue-600 font-medium">
                  Annual allocation
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium text-green-700">
                  Days Used
                </CardTitle>
                <CardDescription className="text-xs text-green-600">
                  {totalAllocated > 0 ? `${Math.round((totalUsed / totalAllocated) * 100)}% of allocation` : "No allocation"}
                </CardDescription>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-green-600">{totalUsed}</div>
              <div className="flex items-center pt-1">
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-xs text-green-600 font-medium">
                  Utilized
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-emerald-50 to-emerald-100/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium text-emerald-700">
                  Remaining Days
                </CardTitle>
                <CardDescription className="text-xs text-emerald-600">
                  Available to use
                </CardDescription>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-emerald-600">{totalRemaining}</div>
              <div className="flex items-center pt-1">
                <Calendar className="h-3 w-3 text-emerald-600 mr-1" />
                <span className="text-xs text-emerald-600 font-medium">
                  Ready to book
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-orange-50 to-orange-100/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium text-orange-700">
                  Pending Requests
                </CardTitle>
                <CardDescription className="text-xs text-orange-600">
                  Awaiting approval
                </CardDescription>
              </div>
              <div className="h-10 w-10 rounded-lg bg-orange-500 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-orange-600">{pendingRequests}</div>
              <div className="flex items-center pt-1">
                <Clock className="h-3 w-3 text-orange-600 mr-1" />
                <span className="text-xs text-orange-600 font-medium">
                  In progress
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-green-600" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Manage your leave requests efficiently
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button 
                size="lg" 
                onClick={() => navigate("/my-leaves")}
                className="h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Apply for Leave
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate("/my-leaves")}
                className="h-12 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300"
              >
                <FileText className="h-5 w-5 mr-2" />
                View All Requests
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Leave Balances */}
        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Leave Balances
            </CardTitle>
            <CardDescription className="text-base">
              Your current leave balance by type
            </CardDescription>
          </CardHeader>
        <CardContent>
          {leaveBalances.isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-600">Loading balances...</div>
            </div>
          ) : leaveBalances.error ? (
            <div className="text-red-600 text-center py-8">
              Error loading balances: {leaveBalances.error.message}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leave Type</TableHead>
                  <TableHead className="text-center">Allocated</TableHead>
                  <TableHead className="text-center">Used</TableHead>
                  <TableHead className="text-center">Remaining</TableHead>
                  <TableHead className="text-center">Utilization</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveBalances.rows.length > 0 ? (
                  leaveBalances.rows.map((balance) => (
                    <TableRow key={balance._id}>
                      <TableCell className="font-medium">
                        <Badge variant="outline">
                          {balance.LeaveType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{balance.AllocatedDays}</TableCell>
                      <TableCell className="text-center">{balance.UsedDays}</TableCell>
                      <TableCell className="text-center font-semibold text-green-600">
                        {balance.RemainingDays}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${Math.min((balance.UsedDays / balance.AllocatedDays) * 100, 100)}%`,
                              }}
                            ></div>
                          </div>
                          <span className="ml-2 text-xs text-gray-600">
                            {Math.round((balance.UsedDays / balance.AllocatedDays) * 100)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-gray-500"
                    >
                      No leave balances found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

        {/* Recent Leave Requests */}
        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  Recent Leave Requests
                </CardTitle>
                <CardDescription className="text-base">
                  Your latest 3 leave requests
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                onClick={() => navigate("/my-leaves")}
                className="border-green-200 hover:border-green-400 hover:bg-green-50 transition-all duration-300"
              >
                View All
              </Button>
            </div>
          </CardHeader>
        <CardContent>
          {recentRequests.isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-600">Loading requests...</div>
            </div>
          ) : recentRequests.error ? (
            <div className="text-red-600 text-center py-8">
              Error loading requests: {recentRequests.error.message}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRequests.rows.length > 0 ? (
                  recentRequests.rows.map((request) => (
                    <TableRow key={request._id}>
                      <TableCell className="font-medium">
                        {request.LeaveRequestId}
                      </TableCell>
                      <TableCell>
                        {formatDate(request.StartDate)} - {formatDate(request.EndDate)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {request.LeaveType}
                        </Badge>
                      </TableCell>
                      <TableCell>{request.LeaveDays}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(request.CurrentStatus)}>
                          {getStatusLabel(request.CurrentStatus)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-gray-500"
                    >
                      No leave requests found
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