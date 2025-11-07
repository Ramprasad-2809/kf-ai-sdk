import { Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { AdminProductListPage } from './pages/AdminProductListPage';
import { UserProductListPage } from './pages/UserProductListPage';
import { AdminOrderDashboardPage } from './pages/AdminOrderDashboardPage';
import { UserOrderHistoryPage } from './pages/UserOrderHistoryPage';
import { ErrorTestingPage } from './pages/ErrorTestingPage';

function App() {
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
        </Routes>
      </main>
    </div>
  );
}

export default App;