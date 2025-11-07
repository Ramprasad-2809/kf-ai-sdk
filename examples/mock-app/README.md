# KF AI SDK - Mock React App

A comprehensive testing application for the KF AI SDK's `useTable` hook with role-based access control, mock API backend, and interactive error testing.

## Features

- 🎭 **Role-based Testing**: Switch between Admin and User roles to test different access levels
- 🗃️ **Multiple Data Types**: Products and Orders with realistic mock data
- 🔄 **Complete CRUD Simulation**: Mock API with filtering, sorting, and pagination
- ⚠️ **Error Scenario Testing**: Simulate network errors, auth failures, and edge cases
- 🎨 **Modern UI**: Tailwind CSS with responsive design and accessibility
- ⚡ **Hot Reload**: Instant development feedback with Vite
- 🧪 **React Query DevTools**: Built-in query inspection and debugging

## Project Structure

```
src/
├── components/
│   └── Navigation.tsx          # Role switcher and navigation
├── pages/                      # Role+Source+Usecase+Page format
│   ├── AdminProductListPage.tsx    # Full admin product table
│   ├── UserProductListPage.tsx     # Limited user product view
│   ├── AdminOrderDashboardPage.tsx # Order management dashboard
│   ├── UserOrderHistoryPage.tsx    # Personal order history
│   └── ErrorTestingPage.tsx        # Error scenario testing
├── providers/
│   ├── QueryProvider.tsx      # React Query setup
│   └── RoleProvider.tsx       # Role state management
└── utils/
    └── mockApiClient.ts        # API client configuration

mock-api/
├── data/                       # Mock data generators
│   ├── products.js            # Product data with role filtering
│   └── orders.js              # Order data with role filtering
├── handlers/                   # API endpoint handlers
│   ├── common.js              # Shared utilities
│   ├── products.js            # Product API endpoints
│   └── orders.js              # Order API endpoints
└── index.js                   # Vite middleware setup
```

## Getting Started

### 1. Install Dependencies

```bash
cd examples/mock-app
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The app will be available at http://localhost:3004 (or next available port)

### 3. Explore Features

- **Role Switching**: Use the role toggle in the navigation to switch between Admin and User views
- **Data Tables**: Test sorting, filtering, and pagination on different entity types
- **Error Testing**: Visit the Error Testing page to simulate various failure scenarios
- **API Inspection**: Use React Query DevTools (bottom-left toggle) to inspect API calls

## Testing Scenarios

### Role-Based Access Control

1. **Admin Role**:
   - Full product data including cost, supplier, and profit margins
   - Complete order dashboard with financial analytics
   - Management capabilities (create, update, delete)

2. **User Role**:
   - Limited product data (no cost/supplier information)
   - Personal order history only
   - Read-only access

### Data Operations

- **Sorting**: Click column headers to sort data
- **Filtering**: Use search boxes to filter across multiple fields
- **Pagination**: Navigate through large datasets with page controls

### Error Handling

Visit `/error-testing` to test:

- Network failures (500 errors)
- Authentication failures (401 errors)
- Not found errors (404 errors)
- Loading and error states

## Mock API Features

### Realistic Data

- 150+ product records with varied categories
- 75+ order records with different statuses
- Proper relationships and data types

### API Behavior

- 100-600ms response delays for realistic testing
- Role-based data filtering
- Full query parameter support (sorting, filtering, pagination)
- Error injection for testing edge cases

### Endpoints

- `POST /api/product/list` - List products with filtering/sorting
- `GET /api/product/:id` - Get single product
- `POST /api/order/list` - List orders with role-based filtering
- `GET /api/order/:id` - Get single order

## Development Notes

### Hot Reload

The app supports hot reload for both:

- React component changes
- Mock API modifications

### TypeScript

Full TypeScript support with:

- SDK type imports
- Role-based type safety
- Proper interface definitions

### Styling

- Tailwind CSS for rapid UI development
- Responsive design for mobile testing
- Accessible components with proper ARIA labels

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Vite will automatically find next available port starting from 3002
2. **API Errors**: Check browser console for mock API logs
3. **Role Changes**: Clear localStorage if role switching stops working

### Debug Tools

- Browser DevTools Network tab for API inspection
- React Query DevTools for cache management
- Console logs for mock API request tracking

## Next Steps

This mock app demonstrates the `useTable` hook's capabilities. To integrate with a real backend:

1. Replace mock API handlers with actual API endpoints
2. Update `mockApiClient.ts` to configure real authentication
3. Modify role provider to use actual user sessions
4. Add proper error boundaries for production use
