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
import { Search, PlusCircle, Calendar, FileText, Clock, CheckCircle, XCircle, Edit, Eye, ChevronLeft, ChevronRight } from "lucide-react";

type LeaveRequest = LeaveRequestForRole<typeof Roles.Employee>;

export function EmployeeLeaveRequestsPage() {
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const table = useTable<LeaveRequest>({
    source: "leave-request",
    columns: [
      { fieldId: "LeaveRequestId", label: "Request ID", enableSorting: true },
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

  // Form for viewing/editing leave request details
  const detailsForm = useForm<LeaveRequest>({
    source: "leave-request",
    operation: "update",
    recordId: selectedRequest?._id,
    enabled: showDetails && !!selectedRequest,
  });

  // Form for creating new leave requests
  const createForm = useForm<LeaveRequest>({
    source: "leave-request",
    operation: "create",
    enabled: showCreateForm,
  });

  const handleRowClick = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedRequest(null);
  };

  const handleCreateNew = () => {
    setShowCreateForm(true);
  };

  const handleCloseCreate = () => {
    setShowCreateForm(false);
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    table.refetch(); // Refresh the table
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

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const canEdit = (request: LeaveRequest) => {
    // Can only edit requests in INITIATE status
    return request.CurrentStatus === "INITIATE";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-green-900 to-slate-700 bg-clip-text text-transparent">
            My Leave Requests
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage your leave requests and track their status
          </p>
        </div>

        {/* Create New Leave Request */}
        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  Leave Requests
                </CardTitle>
                <CardDescription className="text-base">
                  Click on a row to view details or edit (if in draft status)
                </CardDescription>
              </div>
              <Button 
                onClick={handleCreateNew}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                New Leave Request
              </Button>
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
                    placeholder="Search requests..."
                    value={table.searchValue || ""}
                    onChange={(e) => table.setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table.rows.length > 0 ? (
                    table.rows.map((request) => (
                      <TableRow
                        key={request._id}
                        className="cursor-pointer hover:bg-green-50/50 transition-colors duration-200"
                        onClick={() => handleRowClick(request)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {canEdit(request) ? <Edit className="h-3 w-3 text-blue-500" /> : <Eye className="h-3 w-3 text-gray-500" />}
                            {request.LeaveRequestId}
                          </div>
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
                        <TableCell className="text-gray-600">
                          {formatDate(request.CreatedAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
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
                      className="border-gray-300 hover:border-green-400 hover:bg-green-50 transition-all duration-200"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.pagination.canGoNext}
                      className="border-gray-300 hover:border-green-400 hover:bg-green-50 transition-all duration-200"
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

      {/* Leave Request Details Modal */}
      {showDetails && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Leave Request Details</CardTitle>
                  <CardDescription>
                    Request ID: {selectedRequest.LeaveRequestId}
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
              {detailsForm.isLoading ? (
                <div className="text-center py-8">Loading details...</div>
              ) : (
                <form
                  onSubmit={detailsForm.handleSubmit()}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 gap-4">
                    {/* Start Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        {...detailsForm.register("StartDate")}
                        disabled={!canEdit(selectedRequest)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      />
                      {detailsForm.errors.StartDate && (
                        <p className="mt-1 text-sm text-red-600">
                          {detailsForm.errors.StartDate.message}
                        </p>
                      )}
                    </div>

                    {/* End Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        {...detailsForm.register("EndDate")}
                        disabled={!canEdit(selectedRequest)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      />
                      {detailsForm.errors.EndDate && (
                        <p className="mt-1 text-sm text-red-600">
                          {detailsForm.errors.EndDate.message}
                        </p>
                      )}
                    </div>

                    {/* Leave Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Leave Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...detailsForm.register("LeaveType")}
                        disabled={!canEdit(selectedRequest)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      >
                        <option value="PTO">Paid Time Off</option>
                        <option value="Sick">Sick Leave</option>
                        <option value="Parental">Parental Leave</option>
                      </select>
                      {detailsForm.errors.LeaveType && (
                        <p className="mt-1 text-sm text-red-600">
                          {detailsForm.errors.LeaveType.message}
                        </p>
                      )}
                    </div>

                    {/* Leave Days (computed) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Leave Days
                      </label>
                      <input
                        type="number"
                        value={selectedRequest.LeaveDays}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                      />
                    </div>

                    {/* Current Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <Badge variant={getStatusBadge(selectedRequest.CurrentStatus)}>
                        {getStatusLabel(selectedRequest.CurrentStatus)}
                      </Badge>
                    </div>

                    {/* Loss of Pay */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Loss of Pay
                      </label>
                      <Badge variant={selectedRequest.LossOfPay ? "secondary" : "outline"}>
                        {selectedRequest.LossOfPay ? "Yes" : "No"}
                      </Badge>
                    </div>

                    {/* Reason */}
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reason <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={4}
                        {...detailsForm.register("Reason")}
                        disabled={!canEdit(selectedRequest)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        placeholder="Please provide a detailed reason for your leave request"
                      />
                      {detailsForm.errors.Reason && (
                        <p className="mt-1 text-sm text-red-600">
                          {detailsForm.errors.Reason.message}
                        </p>
                      )}
                    </div>

                    {/* Manager Remarks (if available) */}
                    {selectedRequest.ManagerRemarks && (
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Manager Remarks
                        </label>
                        <textarea
                          rows={3}
                          value={selectedRequest.ManagerRemarks}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                        />
                      </div>
                    )}

                    {/* HR Comments (if available) */}
                    {selectedRequest.HrComments && (
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          HR Comments
                        </label>
                        <textarea
                          rows={3}
                          value={selectedRequest.HrComments}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                        />
                      </div>
                    )}
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={handleCloseDetails}
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      {canEdit(selectedRequest) ? "Cancel" : "Close"}
                    </button>
                    {canEdit(selectedRequest) && (
                      <button
                        type="submit"
                        disabled={detailsForm.isSubmitting}
                        className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {detailsForm.isSubmitting ? "Updating..." : "Update Request"}
                      </button>
                    )}
                  </div>

                  {/* Show form errors */}
                  {detailsForm.submitError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">
                        {detailsForm.submitError.message}
                      </p>
                    </div>
                  )}
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create New Leave Request Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>New Leave Request</CardTitle>
                  <CardDescription>
                    Submit a new leave request
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCloseCreate}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {createForm.isLoading ? (
                <div className="text-center py-8">Loading form...</div>
              ) : (
                <form
                  onSubmit={createForm.handleSubmit(handleCreateSuccess)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 gap-4">
                    {/* Start Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        {...createForm.register("StartDate")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {createForm.errors.StartDate && (
                        <p className="mt-1 text-sm text-red-600">
                          {createForm.errors.StartDate.message}
                        </p>
                      )}
                    </div>

                    {/* End Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        {...createForm.register("EndDate")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {createForm.errors.EndDate && (
                        <p className="mt-1 text-sm text-red-600">
                          {createForm.errors.EndDate.message}
                        </p>
                      )}
                    </div>

                    {/* Leave Type */}
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Leave Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...createForm.register("LeaveType")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select leave type...</option>
                        <option value="PTO">Paid Time Off</option>
                        <option value="Sick">Sick Leave</option>
                        <option value="Parental">Parental Leave</option>
                      </select>
                      {createForm.errors.LeaveType && (
                        <p className="mt-1 text-sm text-red-600">
                          {createForm.errors.LeaveType.message}
                        </p>
                      )}
                    </div>

                    {/* Reason */}
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reason <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={4}
                        {...createForm.register("Reason")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Please provide a detailed reason for your leave request (minimum 10 characters)"
                      />
                      {createForm.errors.Reason && (
                        <p className="mt-1 text-sm text-red-600">
                          {createForm.errors.Reason.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={handleCloseCreate}
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createForm.isSubmitting}
                      className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {createForm.isSubmitting ? "Submitting..." : "Submit Request"}
                    </button>
                  </div>

                  {/* Show form errors */}
                  {createForm.submitError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">
                        {createForm.submitError.message}
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