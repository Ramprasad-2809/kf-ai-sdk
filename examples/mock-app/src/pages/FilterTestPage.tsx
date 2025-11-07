import { useState } from 'react';
import { useTable } from '@sdk/components/hooks/useTable';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// Product interface for type safety
interface Product {
  _id: string;
  name: string;
  price: { value: number; currency: string };
  description: string;
  category: string;
  inStock: boolean;
  _created_at: Date;
  _modified_at: Date;
}

export function FilterTestPage() {
  const [filterFieldInput, setFilterFieldInput] = useState('');
  const [filterValueInput, setFilterValueInput] = useState('');
  const [selectedOperator, setSelectedOperator] = useState<string>('EQ');

  // Use table with filter functionality
  const {
    rows,
    isLoading,
    error,
    pagination,
    filter,
    search,
    sort
  } = useTable<Product>({
    source: 'product',
    enablePagination: true,
    enableSorting: true,
    enableFiltering: true,
    columns: [
      { fieldId: '_id', label: 'ID' },
      { fieldId: 'name', label: 'Product Name', enableSorting: true },
      { fieldId: 'price', label: 'Price', enableSorting: true },
      { fieldId: 'category', label: 'Category', enableSorting: true },
      { fieldId: 'inStock', label: 'In Stock' },
      { fieldId: '_created_at', label: 'Created At', enableSorting: true }
    ],
    fieldDefinitions: {
      _id: {
        type: 'string',
        allowedOperators: ['EQ', 'NE', 'Contains', 'NotContains', 'IN', 'NIN', 'Empty', 'NotEmpty']
      },
      name: {
        type: 'string',
        allowedOperators: ['EQ', 'NE', 'Contains', 'NotContains', 'IN', 'NIN', 'Empty', 'NotEmpty']
      },
      price: {
        type: 'currency',
        allowedOperators: ['EQ', 'NE', 'GT', 'GTE', 'LT', 'LTE', 'Between', 'NotBetween', 'Empty', 'NotEmpty']
      },
      category: {
        type: 'select',
        allowedOperators: ['EQ', 'NE', 'IN', 'NIN', 'Empty', 'NotEmpty'],
        selectOptions: [
          { label: 'Electronics', value: 'electronics' },
          { label: 'Clothing', value: 'clothing' },
          { label: 'Books', value: 'books' },
          { label: 'Home', value: 'home' },
          { label: 'Sports', value: 'sports' }
        ]
      },
      inStock: {
        type: 'boolean',
        allowedOperators: ['EQ', 'NE', 'Empty', 'NotEmpty']
      },
      _created_at: {
        type: 'date',
        allowedOperators: ['EQ', 'NE', 'GT', 'GTE', 'LT', 'LTE', 'Between', 'NotBetween', 'Empty', 'NotEmpty']
      },
      description: {
        type: 'string',
        allowedOperators: ['Contains', 'NotContains', 'Empty', 'NotEmpty']
      },
      _modified_at: {
        type: 'date',
        allowedOperators: ['EQ', 'NE', 'GT', 'GTE', 'LT', 'LTE', 'Between', 'NotBetween', 'Empty', 'NotEmpty']
      }
    }
  });

  const handleAddFilter = () => {
    if (filterFieldInput && filterValueInput && selectedOperator) {
      const conditionId = filter.addCondition({
        operator: selectedOperator as any,
        lhsField: filterFieldInput,
        rhsValue: filterValueInput,
        rhsType: 'Constant'
      });
      
      console.log('Added filter condition with ID:', conditionId);
      
      // Clear inputs
      setFilterFieldInput('');
      setFilterValueInput('');
    }
  };

  const handleRemoveFilter = (conditionId: string) => {
    const success = filter.removeCondition(conditionId);
    console.log('Removed filter condition:', success);
  };

  const formatValue = (value: any, field: keyof Product) => {
    if (field === 'price' && value && typeof value === 'object') {
      return `${value.currency} ${value.value}`;
    }
    if (field === '_created_at' || field === '_modified_at') {
      return new Date(value).toLocaleDateString();
    }
    if (field === 'inStock') {
      return value ? 'Yes' : 'No';
    }
    return String(value);
  };

  if (error) {
    return <div className="p-4 text-red-600">Error: {error.message}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Filter Test Page</h1>

      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Filter Form */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Field</label>
              <Input
                value={filterFieldInput}
                onChange={(e) => setFilterFieldInput(e.target.value)}
                placeholder="e.g. name, category, price"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Operator</label>
              <select
                value={selectedOperator}
                onChange={(e) => setSelectedOperator(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="EQ">Equals (EQ)</option>
                <option value="NE">Not Equals (NE)</option>
                <option value="GT">Greater Than (GT)</option>
                <option value="GTE">Greater Than or Equal (GTE)</option>
                <option value="LT">Less Than (LT)</option>
                <option value="LTE">Less Than or Equal (LTE)</option>
                <option value="Contains">Contains</option>
                <option value="NotContains">Not Contains</option>
                <option value="IN">In (IN)</option>
                <option value="NIN">Not In (NIN)</option>
                <option value="Empty">Empty</option>
                <option value="NotEmpty">Not Empty</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Value</label>
              <Input
                value={filterValueInput}
                onChange={(e) => setFilterValueInput(e.target.value)}
                placeholder="Filter value"
              />
            </div>
            <Button onClick={handleAddFilter}>
              Add Filter
            </Button>
          </div>

          {/* Filter Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Logical Operator:</span>
              <div className="flex gap-2">
                <Button
                  variant={filter.logicalOperator === 'AND' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => filter.setLogicalOperator('AND')}
                >
                  AND
                </Button>
                <Button
                  variant={filter.logicalOperator === 'OR' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => filter.setLogicalOperator('OR')}
                >
                  OR
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Filter Status:</span>
              <Badge variant={filter.isValid ? 'default' : 'destructive'}>
                {filter.isValid ? 'Valid' : 'Invalid'}
              </Badge>
              <span className="text-sm text-gray-600">
                {filter.conditions.length} condition(s)
              </span>
            </div>
          </div>

          {/* Active Filters */}
          {filter.conditions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Active Filters:</h4>
              <div className="space-y-2">
                {filter.conditions.map((condition) => (
                  <div
                    key={condition.id}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                  >
                    <Badge variant="outline">
                      {condition.lhsField}
                    </Badge>
                    <span className="text-sm">{condition.operator}</span>
                    <span className="text-sm font-mono">
                      {Array.isArray(condition.rhsValue)
                        ? `[${condition.rhsValue.join(', ')}]`
                        : String(condition.rhsValue)}
                    </span>
                    <Badge variant={condition.isValid ? 'default' : 'destructive'}>
                      {condition.isValid ? 'Valid' : 'Invalid'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveFilter(condition.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={filter.clearConditions}
                >
                  Clear All Filters
                </Button>
              </div>
            </div>
          )}

          {/* Validation Errors */}
          {filter.validationErrors.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-red-600">Validation Errors:</h4>
              <div className="space-y-1">
                {filter.validationErrors.map((error, index) => (
                  <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {error.field}: {error.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={search.query}
              onChange={(e) => search.setQuery(e.target.value)}
              placeholder="Search products..."
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={search.clear}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({rows.length} of {pagination.totalItems})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-gray-600">Loading...</div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => sort.toggle('_id')}
                    >
                      ID {sort.field === '_id' && (sort.direction === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => sort.toggle('name')}
                    >
                      Name {sort.field === 'name' && (sort.direction === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => sort.toggle('price')}
                    >
                      Price {sort.field === 'price' && (sort.direction === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => sort.toggle('category')}
                    >
                      Category {sort.field === 'category' && (sort.direction === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead>In Stock</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => sort.toggle('_created_at')}
                    >
                      Created {sort.field === '_created_at' && (sort.direction === 'asc' ? '↑' : '↓')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((product) => (
                    <TableRow key={product._id}>
                      <TableCell className="font-mono">{product._id}</TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{formatValue(product.price, 'price')}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{product.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.inStock ? 'default' : 'destructive'}>
                          {formatValue(product.inStock, 'inStock')}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatValue(product._created_at, '_created_at')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Page {pagination.currentPage} of {pagination.totalPages}
                  {' '}({pagination.totalItems} total items)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.canGoPrevious}
                    onClick={pagination.goToPrevious}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.canGoNext}
                    onClick={pagination.goToNext}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}