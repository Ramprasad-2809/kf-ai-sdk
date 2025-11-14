import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { AdminProductListPage } from './pages/AdminProductListPage';
import { UserProductListPage } from './pages/UserProductListPage';
import { AdminOrderDashboardPage } from './pages/AdminOrderDashboardPage';
import { UserOrderHistoryPage } from './pages/UserOrderHistoryPage';
import { ErrorTestingPage } from './pages/ErrorTestingPage';
import { FilterTestPage } from './pages/FilterTestPage';
import { FormTestPage } from './pages/FormTestPage';
import { ProductManagementPage } from './pages/ProductManagementPage';
import { OrderManagementPage } from './pages/OrderManagementPage';
import { initializeMockApi } from './utils/mockApiClient';

function App() {
  useEffect(() => {
    initializeMockApi();
  }, []);
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<AdminProductListPage />} />
          <Route path="/admin/products" element={<AdminProductListPage />} />
          <Route path="/user/products" element={<UserProductListPage />} />
          <Route path="/admin/orders" element={<AdminOrderDashboardPage />} />
          <Route path="/user/orders" element={<UserOrderHistoryPage />} />
          <Route path="/error-testing" element={<ErrorTestingPage />} />
          <Route path="/filter-test" element={<FilterTestPage />} />
          <Route path="/form-test" element={<FormTestPage />} />
          <Route path="/product-management" element={<ProductManagementPage />} />
          <Route path="/order-management" element={<OrderManagementPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;