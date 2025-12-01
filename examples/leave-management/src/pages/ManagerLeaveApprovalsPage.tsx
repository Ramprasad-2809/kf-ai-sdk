import { useState } from "react";
import { useTable, useForm } from "../../../../sdk";
import { LeaveRequestForRole, Roles } from "../../../../app";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Clock, CheckCircle, XCircle, AlertTriangle, FileText, Calendar, User, ChevronLeft, ChevronRight } from "lucide-react";

type LeaveRequest = LeaveRequestForRole<typeof Roles.Manager>;

export function ManagerLeaveApprovalsPage() {
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const table = useTable<LeaveRequest>({
    source: "leave-request",
    columns: [
      { fieldId: "LeaveRequestId", label: "Request ID", enableSorting: true },
      { fieldId: "FullName", label: "Employee", enableSorting: true },
      { fieldId: "StartDate", label: "Start Date", enableSorting: true },
      { fieldId: "EndDate", label: "End Date", enableSorting: true },
      { fieldId: "LeaveType", label: "Type", enableSorting: true },
      { fieldId: "LeaveDays", label: "Days", enableSorting: true },
      { fieldId: "CurrentStatus", label: "Status", enableSorting: true },
      { fieldId: "CreatedAt", label: "Applied", enableSorting: true },
    ],
    enableSorting: true,
    enableFiltering: true,
    enablePagination: true,
    initialState: {
      pagination: { pageNo: 1, pageSize: 10 },
      sorting: { field: "CreatedAt" as keyof LeaveRequest, direction: "desc" },
    },
  });

  // Form for reviewing and approving/rejecting leave requests
  const approvalForm = useForm<LeaveRequest>({
    source: "leave-request",
    operation: "update",
    recordId: selectedRequest?._id,
    enabled: showDetails && !!selectedRequest,
  });

  const handleRowClick = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedRequest(null);
  };

  const handleApprovalSuccess = () => {
    setShowDetails(false);
    setSelectedRequest(null);
    table.refetch(); // Refresh the table
  };

  const handleApprove = () => {
    if (approvalForm.setValue) {
      approvalForm.setValue("ManagerApproved", true);
    }
  };

  const handleReject = () => {
    if (approvalForm.setValue) {
      approvalForm.setValue("ManagerApproved", false);
    }
  };

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

  const getApprovalBadge = (approved: boolean | null) => {
    if (approved === true) return (
      <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        Approved
      </Badge>
    );
    if (approved === false) return (
      <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-200">
        <XCircle className="h-3 w-3 mr-1" />
        Rejected
      </Badge>
    );
    return (
      <Badge variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const canApprove = (request: LeaveRequest) => {
    // Can only approve requests in MANAGER_APPROVAL status that haven't been approved/rejected yet
    return request.CurrentStatus === "MANAGER_APPROVAL" && request.ManagerApproved === null;
  };

  const getUrgencyBadge = (request: LeaveRequest) => {
    const startDate = new Date(request.StartDate);
    const today = new Date();
    const daysUntilStart = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilStart < 0) return (
      <Badge variant="secondary" className="bg-red-100 text-red-700">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Past Due
      </Badge>
    );
    if (daysUntilStart <= 7) return (
      <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Urgent
      </Badge>
    );
    if (daysUntilStart <= 14) return (
      <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50">
        <Clock className="h-3 w-3 mr-1" />
        Soon
      </Badge>
    );
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-orange-900 to-slate-700 bg-clip-text text-transparent">
            Leave Approvals
          </h1>
          <p className="text-lg text-muted-foreground">
            Review and approve leave requests from your team members
          </p>
        </div>

        {/* Team Leave Requests */}
        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-600" />
                  Team Leave Requests
                </CardTitle>
                <CardDescription className="text-base">
                  Click on a row to review and approve/reject the request
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        <CardContent>
          {table.isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-600">Loading requests...</div>
            </div>
          ) : table.error ? (
            <div className="text-red-600 text-center py-8">
              Error loading requests: {table.error.message}
            </div>
          ) : (
            <div>
              {/* Search and Filter */}
              <div className="mb-6 flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search by employee, request ID, or type..."
                    value={table.searchValue || ""}
                    onChange={(e) => table.setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <select
                    className="pl-10 pr-8 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white appearance-none min-w-[180px]"
                    onChange={(e) => {
                      console.log("Filter by status:", e.target.value);
                    }}
                  >
                    <option value="">All Statuses</option>
                    <option value="MANAGER_APPROVAL">Pending Approval</option>
                    <option value="FINANCE_APPROVAL">Finance Review</option>
                    <option value="HR_PROCESS">HR Processing</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>My Decision</TableHead>
                    <TableHead>Applied</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table.rows.length > 0 ? (
                    table.rows.map((request) => (
                      <TableRow
                        key={request._id}
                        className="cursor-pointer hover:bg-orange-50/50 transition-colors duration-200"
                        onClick={() => handleRowClick(request)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {request.LeaveRequestId}
                            {getUrgencyBadge(request)}
                          </div>
                        </TableCell>
                        <TableCell>{request.FullName}</TableCell>
                        <TableCell>
                          {formatDate(request.StartDate)} - {formatDate(request.EndDate)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {request.LeaveType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {request.LeaveDays}
                            {request.LossOfPay && <Badge variant="secondary">LOP</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadge(request.CurrentStatus)}>
                            {getStatusLabel(request.CurrentStatus)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getApprovalBadge(request.ManagerApproved)}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {formatDate(request.CreatedAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-gray-500"
                      >
                        No leave requests found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {table.pagination && (
                <div className="mt-6 flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 font-medium">
                    Showing {table.pagination.startIndex} to {table.pagination.endIndex} of{" "}
                    {table.pagination.totalCount} results
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.previousPage()}
                      disabled={!table.pagination.canGoPrevious}
                      className="border-gray-300 hover:border-orange-400 hover:bg-orange-50 transition-all duration-200"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.pagination.canGoNext}
                      className="border-gray-300 hover:border-orange-400 hover:bg-orange-50 transition-all duration-200"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
        </Card>

      {/* Leave Request Review Modal */}
      {showDetails && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Review Leave Request</CardTitle>
                  <CardDescription>
                    Request ID: {selectedRequest.LeaveRequestId} - {selectedRequest.FullName}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCloseDetails}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {approvalForm.isLoading ? (
                <div className="text-center py-8">Loading details...</div>
              ) : (
                <form
                  onSubmit={approvalForm.handleSubmit(handleApprovalSuccess)}
                  className="space-y-6"
                >
                  {/* Request Details (Read-only) */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Leave Request Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Employee
                        </label>
                        <p className="text-sm text-gray-900">{selectedRequest.FullName}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Leave Type
                        </label>
                        <Badge variant="outline">
                          {selectedRequest.LeaveType}
                        </Badge>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date
                        </label>
                        <p className="text-sm text-gray-900">{formatDate(selectedRequest.StartDate)}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date
                        </label>
                        <p className="text-sm text-gray-900">{formatDate(selectedRequest.EndDate)}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Leave Days
                        </label>
                        <p className="text-sm text-gray-900">{selectedRequest.LeaveDays} days</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Loss of Pay
                        </label>
                        <Badge variant={selectedRequest.LossOfPay ? "secondary" : "outline"}>
                          {selectedRequest.LossOfPay ? "Yes" : "No"}
                        </Badge>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Reason
                        </label>
                        <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                          {selectedRequest.Reason}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Current Status
                        </label>
                        <Badge variant={getStatusBadge(selectedRequest.CurrentStatus)}>
                          {getStatusLabel(selectedRequest.CurrentStatus)}
                        </Badge>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Applied On
                        </label>
                        <p className="text-sm text-gray-900">{formatDate(selectedRequest.CreatedAt)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Manager Review Section */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4">Manager Review</h3>
                    <div className="space-y-4">
                      {/* Current Approval Status */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Decision
                        </label>
                        {getApprovalBadge(selectedRequest.ManagerApproved)}
                      </div>

                      {/* Manager Remarks */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Manager Remarks
                        </label>
                        <textarea
                          rows={4}
                          {...approvalForm.register("ManagerRemarks")}
                          disabled={!canApprove(selectedRequest)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                          placeholder="Add your comments about this leave request..."
                        />
                        {approvalForm.errors.ManagerRemarks && (
                          <p className="mt-1 text-sm text-red-600">
                            {approvalForm.errors.ManagerRemarks.message}
                          </p>
                        )}
                      </div>

                      {/* Quick Approval Buttons */}
                      {canApprove(selectedRequest) && (
                        <div className="flex gap-3">
                          <Button
                            type="button"
                            onClick={handleApprove}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            ✅ Approve
                          </Button>
                          <Button
                            type="button"
                            onClick={handleReject}
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            ❌ Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Finance Comments (if available) */}
                  {selectedRequest.FinanceComments && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="text-md font-medium mb-2">Finance Comments</h4>
                      <p className="text-sm text-gray-900">{selectedRequest.FinanceComments}</p>
                    </div>
                  )}

                  {/* HR Comments (if available) */}
                  {selectedRequest.HrComments && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="text-md font-medium mb-2">HR Comments</h4>
                      <p className="text-sm text-gray-900">{selectedRequest.HrComments}</p>
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={handleCloseDetails}
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      {canApprove(selectedRequest) ? "Cancel" : "Close"}
                    </button>
                    {canApprove(selectedRequest) && (
                      <button
                        type="submit"
                        disabled={approvalForm.isSubmitting}
                        className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {approvalForm.isSubmitting ? "Saving..." : "Save Decision"}
                      </button>
                    )}
                  </div>

                  {/* Show form errors */}
                  {approvalForm.submitError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">
                        {approvalForm.submitError.message}
                      </p>
                    </div>
                  )}
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </div>
  );
}