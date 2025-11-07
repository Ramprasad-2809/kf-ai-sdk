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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

// Available fields with user-friendly labels
const AVAILABLE_FIELDS = [
  { value: 'name', label: 'Product Name', type: 'string' },
  { value: 'category', label: 'Category', type: 'select' },
  { value: 'price', label: 'Price', type: 'currency' },
  { value: 'inStock', label: 'In Stock', type: 'boolean' },
  { value: '_created_at', label: 'Created Date', type: 'date' },
  { value: 'description', label: 'Description', type: 'string' },
  { value: '_id', label: 'Product ID', type: 'string' },
];

// Operator definitions with user-friendly labels
const OPERATORS = {
  string: [
    { value: 'EQ', label: 'equals' },
    { value: 'NE', label: 'does not equal' },
    { value: 'Contains', label: 'contains' },
    { value: 'NotContains', label: 'does not contain' },
    { value: 'IN', label: 'is one of' },
    { value: 'Empty', label: 'is empty' },
    { value: 'NotEmpty', label: 'is not empty' },
  ],
  currency: [
    { value: 'EQ', label: 'equals' },
    { value: 'NE', label: 'does not equal' },
    { value: 'GT', label: 'greater than' },
    { value: 'GTE', label: 'greater than or equal' },
    { value: 'LT', label: 'less than' },
    { value: 'LTE', label: 'less than or equal' },
    { value: 'Between', label: 'between' },
    { value: 'Empty', label: 'is empty' },
  ],
  boolean: [
    { value: 'EQ', label: 'is' },
    { value: 'NE', label: 'is not' },
  ],
  date: [
    { value: 'GT', label: 'after' },
    { value: 'GTE', label: 'on or after' },
    { value: 'LT', label: 'before' },
    { value: 'LTE', label: 'on or before' },
    { value: 'Between', label: 'between' },
  ],
  select: [
    { value: 'EQ', label: 'is' },
    { value: 'NE', label: 'is not' },
    { value: 'IN', label: 'is one of' },
  ],
};

const CATEGORY_OPTIONS = [
  { label: 'Electronics', value: 'electronics' },
  { label: 'Clothing', value: 'clothing' },
  { label: 'Books', value: 'books' },
  { label: 'Home', value: 'home' },
  { label: 'Sports', value: 'sports' },
];

export function FilterTestPage() {
  const [selectedField, setSelectedField] = useState<string>('');
  const [selectedOperator, setSelectedOperator] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');

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

  // Get selected field info
  const selectedFieldInfo = AVAILABLE_FIELDS.find(f => f.value === selectedField);
  const availableOperators = selectedFieldInfo ? OPERATORS[selectedFieldInfo.type as keyof typeof OPERATORS] || [] : [];

  const handleAddFilter = () => {
    if (selectedField && selectedOperator && filterValue) {
      let processedValue: any = filterValue;
      
      // Process value based on field type
      if (selectedFieldInfo?.type === 'boolean') {
        processedValue = filterValue === 'true';
      } else if (selectedFieldInfo?.type === 'currency') {
        processedValue = parseFloat(filterValue);
      }
      
      const conditionId = filter.addCondition({
        operator: selectedOperator as any,
        lhsField: selectedField,
        rhsValue: processedValue,
        rhsType: 'Constant'
      });
      
      console.log('Added filter condition with ID:', conditionId);
      
      // Clear inputs
      setSelectedField('');
      setSelectedOperator('');
      setFilterValue('');
    }
  };

  const canAddFilter = selectedField && selectedOperator && (filterValue || ['Empty', 'NotEmpty'].includes(selectedOperator));

  const renderValueInput = () => {
    if (!selectedFieldInfo || ['Empty', 'NotEmpty'].includes(selectedOperator)) {
      return null;
    }

    if (selectedFieldInfo.type === 'boolean') {
      return (
        <Select value={filterValue} onValueChange={setFilterValue}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select value" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Yes</SelectItem>
            <SelectItem value="false">No</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    if (selectedFieldInfo.type === 'select' && selectedFieldInfo.value === 'category') {
      return (
        <Select value={filterValue} onValueChange={setFilterValue}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <Input
        value={filterValue}
        onChange={(e) => setFilterValue(e.target.value)}
        placeholder={getValuePlaceholder()}
        type={selectedFieldInfo.type === 'currency' ? 'number' : 'text'}
        step={selectedFieldInfo.type === 'currency' ? '0.01' : undefined}
      />
    );
  };

  const getValuePlaceholder = () => {
    if (!selectedFieldInfo) return 'Enter value';
    
    switch (selectedFieldInfo.type) {
      case 'currency': return 'e.g. 99.99';
      case 'date': return 'e.g. 2024-01-01';
      case 'string': return 'Enter text';
      default: return 'Enter value';
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

  const formatFilterValue = (value: any, fieldType?: string) => {
    if (Array.isArray(value)) {
      return `[${value.join(', ')}]`;
    }
    if (fieldType === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (fieldType === 'currency') {
      return `$${value}`;
    }
    if (fieldType === 'select') {
      const option = CATEGORY_OPTIONS.find(opt => opt.value === value);
      return option?.label || value;
    }
    return String(value);
  };

  if (error) {
    return <div className="p-4 text-red-600">Error: {error.message}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Advanced Filter Testing
          </h1>
          <p className="text-gray-600 text-lg">Test the powerful filtering capabilities with a sleek interface</p>
        </div>

        {/* Filter Controls */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              🔍 Filter Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
          {/* Add Filter Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              {/* Field Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Field</label>
                <Select value={selectedField} onValueChange={(value) => {
                  setSelectedField(value);
                  setSelectedOperator('');
                  setFilterValue('');
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_FIELDS.map((field) => (
                      <SelectItem key={field.value} value={field.value}>
                        <div className="flex items-center gap-2">
                          <span>{field.label}</span>
                          <Badge variant="outline" className="text-xs">
                            {field.type}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Operator Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Condition</label>
                <Select 
                  value={selectedOperator} 
                  onValueChange={(value) => {
                    setSelectedOperator(value);
                    setFilterValue('');
                  }}
                  disabled={!selectedField}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOperators.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Value Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Value {['Empty', 'NotEmpty'].includes(selectedOperator) && (
                    <span className="text-xs text-gray-500">(not required)</span>
                  )}
                </label>
                <div className="min-h-[40px] flex items-center">
                  {['Empty', 'NotEmpty'].includes(selectedOperator) ? (
                    <div className="text-sm text-gray-500 italic">No value needed</div>
                  ) : (
                    renderValueInput()
                  )}
                </div>
              </div>

              {/* Add Button */}
              <div className="flex items-end">
                <Button 
                  onClick={handleAddFilter}
                  disabled={!canAddFilter}
                  className="w-full"
                >
                  Add Filter
                </Button>
              </div>
            </div>
          </div>

          {/* Filter Status & Controls */}
          {filter.conditions.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700">Combine conditions with:</span>
                  <div className="flex gap-2">
                    <Button
                      variant={filter.logicalOperator === 'AND' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => filter.setLogicalOperator('AND')}
                      className="text-xs"
                    >
                      AND
                    </Button>
                    <Button
                      variant={filter.logicalOperator === 'OR' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => filter.setLogicalOperator('OR')}
                      className="text-xs"
                    >
                      OR
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={filter.isValid ? 'default' : 'destructive'}>
                    {filter.isValid ? '✓ Valid' : '⚠ Invalid'}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {filter.conditions.length} condition{filter.conditions.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Active Filters */}
          {filter.conditions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">Active Filters</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={filter.clearConditions}
                  className="text-xs"
                >
                  Clear All
                </Button>
              </div>
              
              <div className="space-y-2">
                {filter.conditions.map((condition, index) => {
                  const fieldInfo = AVAILABLE_FIELDS.find(f => f.value === condition.lhsField);
                  const operatorInfo = OPERATORS[fieldInfo?.type as keyof typeof OPERATORS]?.find(op => op.value === condition.operator);
                  
                  return (
                    <div
                      key={condition.id}
                      className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                    >
                      {index > 0 && (
                        <Badge variant="secondary" className="text-xs font-medium">
                          {filter.logicalOperator}
                        </Badge>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="font-medium">
                          {fieldInfo?.label || condition.lhsField}
                        </Badge>
                        <span className="text-gray-600">{operatorInfo?.label || condition.operator}</span>
                        {!['Empty', 'NotEmpty'].includes(condition.operator) && (
                          <Badge variant="secondary" className="font-mono text-xs">
                            {formatFilterValue(condition.rhsValue, fieldInfo?.type)}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="ml-auto flex items-center gap-2">
                        <Badge variant={condition.isValid ? 'default' : 'destructive'} className="text-xs">
                          {condition.isValid ? '✓' : '⚠'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFilter(condition.id)}
                          className="text-gray-400 hover:text-red-600 h-6 w-6 p-0"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  );
                })}
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
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              🔍 Search Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Input
                  value={search.query}
                  onChange={(e) => search.setQuery(e.target.value)}
                  placeholder="Search products by name, description, or any field..."
                  className="pl-4 pr-12 h-11 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                />
                {search.query && (
                  <Button
                    variant="ghost"
                    onClick={search.clear}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 p-0 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </Button>
                )}
              </div>
              {search.query && (
                <Badge variant="secondary" className="self-center px-3 py-1">
                  {rows.length} result{rows.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                📊 Products
                <Badge variant="outline" className="ml-2">
                  {rows.length} of {pagination.totalItems}
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {filter.conditions.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {filter.conditions.length} filter{filter.conditions.length !== 1 ? 's' : ''} active
                    </Badge>
                  </div>
                )}
                {search.query && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      search: "{search.query}"
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <div className="text-gray-600 font-medium">Loading products...</div>
              </div>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center space-y-3">
                <div className="text-4xl">🔍</div>
                <div className="text-lg font-medium text-gray-900">No products found</div>
                <div className="text-gray-600">
                  {filter.conditions.length > 0 || search.query 
                    ? 'Try adjusting your filters or search terms'
                    : 'No products available'
                  }
                </div>
                {(filter.conditions.length > 0 || search.query) && (
                  <div className="flex gap-2 justify-center mt-4">
                    {filter.conditions.length > 0 && (
                      <Button variant="outline" size="sm" onClick={filter.clearConditions}>
                        Clear Filters
                      </Button>
                    )}
                    {search.query && (
                      <Button variant="outline" size="sm" onClick={search.clear}>
                        Clear Search
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-100 transition-colors font-semibold"
                        onClick={() => sort.toggle('_id')}
                      >
                        <div className="flex items-center gap-1">
                          ID
                          {sort.field === '_id' && (
                            <span className="text-blue-600">
                              {sort.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-100 transition-colors font-semibold"
                        onClick={() => sort.toggle('name')}
                      >
                        <div className="flex items-center gap-1">
                          Product Name
                          {sort.field === 'name' && (
                            <span className="text-blue-600">
                              {sort.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-100 transition-colors font-semibold"
                        onClick={() => sort.toggle('price')}
                      >
                        <div className="flex items-center gap-1">
                          Price
                          {sort.field === 'price' && (
                            <span className="text-blue-600">
                              {sort.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-100 transition-colors font-semibold"
                        onClick={() => sort.toggle('category')}
                      >
                        <div className="flex items-center gap-1">
                          Category
                          {sort.field === 'category' && (
                            <span className="text-blue-600">
                              {sort.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold">Stock Status</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-100 transition-colors font-semibold"
                        onClick={() => sort.toggle('_created_at')}
                      >
                        <div className="flex items-center gap-1">
                          Created Date
                          {sort.field === '_created_at' && (
                            <span className="text-blue-600">
                              {sort.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((product, index) => (
                      <TableRow 
                        key={product._id} 
                        className={`hover:bg-gray-50/75 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                        }`}
                      >
                        <TableCell className="font-mono text-sm text-gray-600">
                          {product._id}
                        </TableCell>
                        <TableCell className="font-medium text-gray-900">
                          <div className="max-w-xs truncate" title={product.name}>
                            {product.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-green-700">
                            {formatValue(product.price, 'price')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className="capitalize bg-blue-100 text-blue-800 hover:bg-blue-200"
                          >
                            {product.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={product.inStock ? 'default' : 'destructive'}
                            className={product.inStock 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }
                          >
                            {product.inStock ? '✓ In Stock' : '✗ Out of Stock'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatValue(product._created_at, '_created_at')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    Page <span className="font-medium">{pagination.currentPage}</span> of{' '}
                    <span className="font-medium">{pagination.totalPages}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    ({pagination.totalItems} total items)
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.canGoPrevious}
                    onClick={pagination.goToPrevious}
                    className="flex items-center gap-1"
                  >
                    ← Previous
                  </Button>
                  <div className="flex items-center gap-1 px-2">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === pagination.currentPage ? 'default' : 'ghost'}
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={() => pagination.goToPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    {pagination.totalPages > 5 && (
                      <span className="px-2 text-gray-400">...</span>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.canGoNext}
                    onClick={pagination.goToNext}
                    className="flex items-center gap-1"
                  >
                    Next →
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}