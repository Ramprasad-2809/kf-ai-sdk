import { useMemo } from "react";
import { Routes, Route } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import { RoleBasedRoute } from "./components/RoleBasedRoute";
import { ManagerDashboardPage } from "./pages/ManagerDashboardPage";
import { EmployeeDashboardPage } from "./pages/EmployeeDashboardPage";
import { ManagerLeaveApprovalsPage } from "./pages/ManagerLeaveApprovalsPage";
import { EmployeeLeaveRequestsPage } from "./pages/EmployeeLeaveRequestsPage";
import { RoleProvider } from "./providers/RoleProvider";
import { initializeMockApi } from "./utils/mockApiClient";

function App() {
  useMemo(() => {
    initializeMockApi();
  }, []);

  return (
    <RoleProvider>
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <main className="container mx-auto px-4 py-8">
          <Routes>
            {/* Dashboard - Role-based home page */}
            <Route
              path="/"
              element={
                <RoleBasedRoute
                  managerPage={<ManagerDashboardPage />}
                  employeePage={<EmployeeDashboardPage />}
                />
              }
            />

            {/* Leave Approvals - Manager only */}
            <Route
              path="/approvals"
              element={
                <RoleBasedRoute
                  managerPage={<ManagerLeaveApprovalsPage />}
                  employeePage={
                    <div className="text-center py-12">
                      <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
                      <p className="text-gray-600">You don't have permission to access this page.</p>
                    </div>
                  }
                />
              }
            />

            {/* My Leaves - Employee only */}
            <Route
              path="/my-leaves"
              element={
                <RoleBasedRoute
                  managerPage={
                    <div className="text-center py-12">
                      <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
                      <p className="text-gray-600">Managers should use the Approvals page instead.</p>
                    </div>
                  }
                  employeePage={<EmployeeLeaveRequestsPage />}
                />
              }
            />

            {/* 404 - Not Found */}
            <Route 
              path="*" 
              element={
                <div className="text-center py-12">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                  <p className="text-gray-600">Page not found</p>
                </div>
              } 
            />
          </Routes>
        </main>
      </div>
    </RoleProvider>
  );
}

export default App;
