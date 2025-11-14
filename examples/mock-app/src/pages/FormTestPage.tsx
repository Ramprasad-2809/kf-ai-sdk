// ============================================================
// FORM TEST PAGE - Testing the new useForm hook
// ============================================================

import React from 'react';
import { useForm } from '../../../../sdk/components/hooks/useForm';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

// Mock schema for testing
const mockSchema = {
  "FirstName": {
    "Type": "String",
    "Required": true,
    "Validation": [
      {
        "Id": "VAL_FIRSTNAME_001",
        "Type": "Expression",
        "Condition": {
          "Expression": "LENGTH(TRIM(FirstName)) >= 2",
          "ExpressionTree": {
            "Type": "BinaryExpression",
            "Operator": ">=",
            "Arguments": [
              {
                "Type": "CallExpression",
                "Callee": "LENGTH",
                "Arguments": [
                  {
                    "Type": "CallExpression",
                    "Callee": "TRIM",
                    "Arguments": [
                      {
                        "Type": "Identifier",
                        "Name": "FirstName",
                        "Source": "BO_User"
                      }
                    ]
                  }
                ]
              },
              {
                "Type": "Literal",
                "Value": 2
              }
            ]
          }
        },
        "Message": "First name must be at least 2 characters"
      }
    ]
  },
  "LastName": {
    "Type": "String",
    "Required": true,
    "Validation": [
      {
        "Id": "VAL_LASTNAME_001", 
        "Type": "Expression",
        "Condition": {
          "Expression": "LENGTH(TRIM(LastName)) >= 2",
          "ExpressionTree": {
            "Type": "BinaryExpression",
            "Operator": ">=",
            "Arguments": [
              {
                "Type": "CallExpression",
                "Callee": "LENGTH",
                "Arguments": [
                  {
                    "Type": "CallExpression",
                    "Callee": "TRIM",
                    "Arguments": [
                      {
                        "Type": "Identifier",
                        "Name": "LastName",
                        "Source": "BO_User"
                      }
                    ]
                  }
                ]
              },
              {
                "Type": "Literal",
                "Value": 2
              }
            ]
          }
        },
        "Message": "Last name must be at least 2 characters"
      }
    ]
  },
  "Email": {
    "Type": "String",
    "Required": true,
    "Unique": true
  },
  "Age": {
    "Type": "Number",
    "Required": true,
    "Validation": [
      {
        "Id": "VAL_AGE_001",
        "Type": "Expression", 
        "Condition": {
          "Expression": "Age >= 18 AND Age <= 120",
          "ExpressionTree": {
            "Type": "LogicalExpression",
            "Operator": "AND",
            "Arguments": [
              {
                "Type": "BinaryExpression",
                "Operator": ">=",
                "Arguments": [
                  {
                    "Type": "Identifier",
                    "Name": "Age",
                    "Source": "BO_User"
                  },
                  {
                    "Type": "Literal",
                    "Value": 18
                  }
                ]
              },
              {
                "Type": "BinaryExpression",
                "Operator": "<=",
                "Arguments": [
                  {
                    "Type": "Identifier",
                    "Name": "Age", 
                    "Source": "BO_User"
                  },
                  {
                    "Type": "Literal",
                    "Value": 120
                  }
                ]
              }
            ]
          }
        },
        "Message": "Age must be between 18 and 120"
      }
    ]
  },
  "FullName": {
    "Type": "String",
    "Formula": {
      "Expression": "CONCAT(FirstName, ' ', LastName)",
      "ExpressionTree": {
        "Type": "CallExpression",
        "Callee": "CONCAT",
        "Arguments": [
          {
            "Type": "Identifier", 
            "Name": "FirstName",
            "Source": "BO_User"
          },
          {
            "Type": "Literal",
            "Value": " "
          },
          {
            "Type": "Identifier",
            "Name": "LastName", 
            "Source": "BO_User"
          }
        ]
      }
    },
    "Computed": true
  }
};

interface User {
  FirstName: string;
  LastName: string;
  Email: string;
  Age: number;
  FullName?: string;
}

export function FormTestPage() {
  const form = useForm<User>({
    source: 'user',
    operation: 'create',
    skipSchemaFetch: true,
    schema: mockSchema as any,
    defaultValues: {
      FirstName: '',
      LastName: '',
      Email: '',
      Age: 18
    },
    onSuccess: (data) => {
      alert(`Form submitted successfully!\n\n${JSON.stringify(data, null, 2)}`);
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    }
  });

  if (form.isLoadingInitialData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Loading form schema...</div>
      </div>
    );
  }

  if (form.loadError) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card className="border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error Loading Form</CardTitle>
            <CardDescription className="text-red-600">
              {form.loadError.message}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Form Test Page</h1>
        <p className="text-gray-600">
          Testing the new useForm hook with mock schema and validation
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Registration Form</CardTitle>
          <CardDescription>
            This form demonstrates backend-driven validation with expression trees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit()} className="space-y-6">
            {/* First Name */}
            <div className="space-y-2">
              <label htmlFor="FirstName" className="block text-sm font-medium text-gray-700">
                First Name *
              </label>
              <Input
                id="FirstName"
                {...form.register('FirstName')}
                placeholder="Enter your first name"
              />
              {form.formState.errors.FirstName && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.FirstName.message}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <label htmlFor="LastName" className="block text-sm font-medium text-gray-700">
                Last Name *
              </label>
              <Input
                id="LastName"
                {...form.register('LastName')}
                placeholder="Enter your last name"
              />
              {form.formState.errors.LastName && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.LastName.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="Email" className="block text-sm font-medium text-gray-700">
                Email *
              </label>
              <Input
                id="Email"
                type="email"
                {...form.register('Email')}
                placeholder="Enter your email"
              />
              {form.formState.errors.Email && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.Email.message}
                </p>
              )}
            </div>

            {/* Age */}
            <div className="space-y-2">
              <label htmlFor="Age" className="block text-sm font-medium text-gray-700">
                Age * (18-120)
              </label>
              <Input
                id="Age"
                type="number"
                {...form.register('Age')}
                placeholder="Enter your age"
              />
              {form.formState.errors.Age && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.Age.message}
                </p>
              )}
            </div>

            {/* Computed Field Display */}
            {form.watch('FullName') && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Full Name (Computed)
                </label>
                <div className="p-3 bg-gray-100 rounded-md text-gray-800">
                  {form.watch('FullName')}
                </div>
              </div>
            )}

            {/* Form State Info */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-blue-900">Form Information</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p><strong>Required Fields:</strong> {form.requiredFields.join(', ')}</p>
                <p><strong>Computed Fields:</strong> {form.computedFields.join(', ')}</p>
                <p><strong>Form Valid:</strong> {form.formState.isValid ? 'Yes' : 'No'}</p>
                <p><strong>Form Dirty:</strong> {form.formState.isDirty ? 'Yes' : 'No'}</p>
              </CardContent>
            </Card>

            {/* Submit Error */}
            {form.submitError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-600">{form.submitError.message}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <Button type="submit" disabled={form.isSubmitting}>
                {form.isSubmitting ? 'Submitting...' : 'Submit Form'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => form.reset()}
              >
                Reset
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => form.clearErrors()}
              >
                Clear Errors
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Developer Notes */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-sm text-green-900">
            ✅ Implementation Features
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-green-800 space-y-2">
          <p><strong>Backend Schema Integration:</strong> Form fields and validation rules are defined in the mock schema</p>
          <p><strong>Expression Tree Evaluation:</strong> Complex validation rules are evaluated using expression trees</p>
          <p><strong>Computed Fields:</strong> FullName is automatically calculated from FirstName + LastName</p>
          <p><strong>Type Safety:</strong> Full TypeScript integration with proper field types</p>
          <p><strong>React Hook Form:</strong> Leverages react-hook-form for form state management</p>
          <p><strong>Error Handling:</strong> Comprehensive error handling for schema, validation, and submission</p>
        </CardContent>
      </Card>
    </div>
  );
}