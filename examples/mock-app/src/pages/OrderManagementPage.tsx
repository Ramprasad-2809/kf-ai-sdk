// ============================================================
// ORDER MANAGEMENT PAGE - Table + Form Integration
// ============================================================

import React, { useState, useCallback } from 'react';
import { useTable } from '../../../../sdk/components/hooks/useTable';
import { useForm } from '../../../../sdk/components/hooks/useForm';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

interface Order {
  _id: string;
  customerName: string;
  customerEmail: string;
  status: string;
  total: number;
  itemCount: number;
  orderSummary?: string;
  _created_at: Date;
}

export function OrderManagementPage() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'update'>('create');

  // Table for listing orders
  const table = useTable<Order>({
    source: 'order',
    columns: [
      { fieldId: '_id', label: 'Order ID', enableSorting: true },
      { fieldId: 'customerName', label: 'Customer', enableSorting: true },
      { fieldId: 'status', label: 'Status', enableSorting: true },
      { fieldId: 'total', label: 'Total', enableSorting: true },
      { fieldId: 'itemCount', label: 'Items', enableSorting: true },
    ],
    enableSorting: true,
    enableFiltering: true,
    enablePagination: true,
    initialState: {
      pagination: { pageNo: 1, pageSize: 10 },
      sorting: { field: '_created_at', direction: 'desc' }
    },
    onSuccess: (data) => {
      console.log('Orders loaded:', data.length);
    },
    onError: (error) => {
      console.error('Failed to load orders:', error);
    }
  });

  // Stable callbacks to prevent infinite loops
  const handleFormSuccess = useCallback((data: any) => {
    console.log(`Order ${formMode}d successfully:`, data);
    setShowForm(false);
    setSelectedOrder(null);
    table.refetch(); // Refresh the table
  }, [formMode, table]);

  const handleFormError = useCallback((error: Error) => {
    console.error(`Failed to ${formMode} order:`, error);
  }, [formMode]);

  // Form for creating/editing orders
  const form = useForm<Order>({
    source: 'order',
    operation: formMode,
    recordId: selectedOrder?._id,
    enabled: showForm, // Only fetch schema and initialize when form is shown
    defaultValues: {
      customerName: '',
      customerEmail: '',
      status: 'pending',
      total: 0,
      itemCount: 1
    },
    onSuccess: handleFormSuccess,
    onError: handleFormError
  });

  // Handlers
  const handleCreateNew = () => {
    setFormMode('create');
    setSelectedOrder(null);
    setShowForm(true);
    form.reset();
  };

  const handleEditOrder = (order: Order) => {
    setFormMode('update');
    setSelectedOrder(order);
    setShowForm(true);
    // Form will automatically load the record data
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedOrder(null);
    form.reset();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  if (table.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Loading orders...</div>
      </div>
    );
  }

  if (table.error) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <Card className="border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error Loading Orders</CardTitle>
            <CardDescription className="text-red-600">
              {table.error.message}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600">
            Manage customer orders with integrated table and form
          </p>
        </div>
        <Button onClick={handleCreateNew} disabled={showForm}>
          Create New Order
        </Button>
      </div>

      {/* Table Section */}
      {!showForm && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Orders ({table.totalItems})</CardTitle>
                <CardDescription>
                  Click on a row to edit an order
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Search orders..."
                  value={table.search.query}
                  onChange={(e) => table.search.setQuery(e.target.value)}
                  className="w-64"
                />
                <Button
                  variant="outline"
                  onClick={() => table.search.clear()}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => table.sort.toggle('_id')}
                  >
                    Order ID
                    {table.sort.field === '_id' && (
                      <span className="ml-1">
                        {table.sort.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => table.sort.toggle('customerName')}
                  >
                    Customer
                    {table.sort.field === 'customerName' && (
                      <span className="ml-1">
                        {table.sort.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => table.sort.toggle('status')}
                  >
                    Status
                    {table.sort.field === 'status' && (
                      <span className="ml-1">
                        {table.sort.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => table.sort.toggle('total')}
                  >
                    Total
                    {table.sort.field === 'total' && (
                      <span className="ml-1">
                        {table.sort.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.rows.map((order) => (
                  <TableRow 
                    key={order._id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleEditOrder(order)}
                  >
                    <TableCell className="font-mono text-sm">{order._id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customerName}</div>
                        <div className="text-sm text-gray-500">{order.customerEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(order.total)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDate(order._created_at)}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditOrder(order);
                        }}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-600">
                Showing {table.rows.length} of {table.totalItems} orders
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.pagination.goToPrevious()}
                  disabled={!table.pagination.canGoPrevious}
                >
                  Previous
                </Button>
                <span className="flex items-center px-3 text-sm">
                  Page {table.pagination.currentPage} of {table.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.pagination.goToNext()}
                  disabled={!table.pagination.canGoNext}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Section */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {formMode === 'create' ? 'Create New Order' : `Edit Order: ${selectedOrder?._id}`}
            </CardTitle>
            <CardDescription>
              {formMode === 'create' 
                ? 'Fill in the order details below'
                : 'Update the order information'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Loading States */}
            {form.isLoadingInitialData && (
              <div className="flex items-center justify-center p-8">
                <div className="text-gray-600">Loading form schema...</div>
              </div>
            )}

            {/* Schema Error */}
            {form.loadError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="text-red-800 font-medium">Error Loading Form</h4>
                <p className="text-red-600 text-sm">{form.loadError.message}</p>
              </div>
            )}

            {/* Form */}
            {!form.isLoadingInitialData && !form.loadError && (
              <form onSubmit={form.handleSubmit()} className="space-y-6">
                {/* Customer Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">
                      Customer Name *
                    </label>
                    <Input
                      id="customerName"
                      {...form.register('customerName')}
                      placeholder="Enter customer name"
                    />
                    {form.formState.errors.customerName && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.customerName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700">
                      Customer Email *
                    </label>
                    <Input
                      id="customerEmail"
                      type="email"
                      {...form.register('customerEmail')}
                      placeholder="customer@example.com"
                    />
                    {form.formState.errors.customerEmail && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.customerEmail.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Order Details */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                      Order Status *
                    </label>
                    <select
                      id="status"
                      {...form.register('status')}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    >
                      {form.getField('status')?.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {form.formState.errors.status && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.status.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="total" className="block text-sm font-medium text-gray-700">
                      Order Total * ($)
                    </label>
                    <Input
                      id="total"
                      type="number"
                      step="0.01"
                      min="0.01"
                      {...form.register('total')}
                      placeholder="0.00"
                    />
                    {form.formState.errors.total && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.total.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="itemCount" className="block text-sm font-medium text-gray-700">
                      Item Count * (1-100)
                    </label>
                    <Input
                      id="itemCount"
                      type="number"
                      min="1"
                      max="100"
                      {...form.register('itemCount')}
                      placeholder="1"
                    />
                    {form.formState.errors.itemCount && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.itemCount.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Computed Field Display */}
                {form.watch('orderSummary') && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Order Summary (Computed)
                    </label>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800">
                      {form.watch('orderSummary')}
                    </div>
                  </div>
                )}

                {/* Submit Error */}
                {form.submitError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                    <p className="text-sm text-red-600">{form.submitError.message}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={form.isSubmitting}>
                    {form.isSubmitting ? 'Saving...' : (formMode === 'create' ? 'Create Order' : 'Update Order')}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCloseForm}>
                    Cancel
                  </Button>
                  {formMode === 'update' && (
                    <Button type="button" variant="outline" onClick={() => form.reset()}>
                      Reset
                    </Button>
                  )}
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Form State Debug (Development) */}
      {showForm && process.env.NODE_ENV === 'development' && (
        <Card className="bg-gray-50 border-gray-200">
          <CardHeader>
            <CardTitle className="text-sm">Debug Info</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            <p><strong>Form Mode:</strong> {formMode}</p>
            <p><strong>Required Fields:</strong> {form.requiredFields.join(', ')}</p>
            <p><strong>Computed Fields:</strong> {form.computedFields.join(', ')}</p>
            <p><strong>Form Valid:</strong> {form.formState.isValid ? 'Yes' : 'No'}</p>
            <p><strong>Form Dirty:</strong> {form.formState.isDirty ? 'Yes' : 'No'}</p>
            {selectedOrder && (
              <p><strong>Editing:</strong> {selectedOrder._id}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}