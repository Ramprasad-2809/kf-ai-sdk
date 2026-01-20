# useAuth

## Brief Description

- Provides authentication state management with support for multiple OAuth providers (Google, Microsoft, GitHub, custom)
- Handles session checking, login flow initiation, and logout operations with automatic session refresh
- Includes role-based access control helpers (`hasRole`, `hasAnyRole`) for permission checking
- Must be used within an `AuthProvider` component that manages the authentication context

## Type Reference

```typescript
import { useAuth, AuthProvider } from "@ram_28/kf-ai-sdk/auth";
import type {
  UseAuthReturnType,
  UserDetailsType,
  AuthStatusType,
  AuthProviderPropsType,
  AuthProviderNameType,
  AuthConfigType,
  AuthEndpointConfigType,
  LoginOptionsType,
  LogoutOptionsType,
  SessionResponseType,
} from "@ram_28/kf-ai-sdk/auth/types";

// User details from session
interface UserDetailsType {
  _id: string;
  _name: string;
  Role: string;
  [key: string]: unknown;
}

// Session response from API
interface SessionResponseType {
  userDetails: UserDetailsType;
  staticBaseUrl: string;
  buildId: string;
}

// Authentication status
type AuthStatusType = "loading" | "authenticated" | "unauthenticated";

// Supported auth providers
type AuthProviderNameType = "google" | "microsoft" | "github" | "custom";

// Auth endpoint configuration for a provider
interface AuthEndpointConfigType {
  loginPath: string;
  logoutPath?: string;
  callbackPath?: string;
}

// Global auth configuration
interface AuthConfigType {
  baseUrl?: string;
  sessionEndpoint: string;
  providers: Partial<Record<AuthProviderNameType, AuthEndpointConfigType>>;
  defaultProvider: AuthProviderNameType;
  autoRedirect: boolean;
  loginRedirectUrl?: string;
  callbackUrl?: string;
  sessionCheckInterval: number;
  retry: { count: number; delay: number };
  staleTime: number;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
}

// AuthProvider component props
interface AuthProviderPropsType {
  children: React.ReactNode;
  config?: Partial<AuthConfigType>;
  onAuthChange?: (status: AuthStatusType, user: UserDetailsType | null) => void;
  onError?: (error: Error) => void;
  loadingComponent?: React.ReactNode;
  unauthenticatedComponent?: React.ReactNode;
  skipInitialCheck?: boolean;
}

// Login options
interface LoginOptionsType {
  callbackUrl?: string;
  params?: Record<string, string>;
}

// Logout options
interface LogoutOptionsType {
  redirectUrl?: string;
  callLogoutEndpoint?: boolean;
}

// Hook return type
interface UseAuthReturnType {
  // User state
  user: UserDetailsType | null;
  staticBaseUrl: string | null;
  buildId: string | null;
  status: AuthStatusType;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Auth operations
  login: (provider?: AuthProviderNameType, options?: LoginOptionsType) => void;
  logout: (options?: LogoutOptionsType) => Promise<void>;
  refreshSession: () => Promise<SessionResponseType | null>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;

  // Error state
  error: Error | null;
  clearError: () => void;
}
```

## Usage Example

```tsx
import { useAuth, AuthProvider } from "@ram_28/kf-ai-sdk/auth";
import type {
  UseAuthReturnType,
  UserDetailsType,
  AuthStatusType,
  AuthProviderPropsType,
  AuthProviderNameType,
  AuthConfigType,
  AuthEndpointConfigType,
  LoginOptionsType,
  LogoutOptionsType,
  SessionResponseType,
} from "@ram_28/kf-ai-sdk/auth/types";

// Define available roles
type Role = "Admin" | "Buyer" | "Seller" | "InventoryManager";

// Auth configuration
const authConfig: Partial<AuthConfigType> = {
  sessionEndpoint: "/api/id",
  defaultProvider: "google",
  autoRedirect: false,
  sessionCheckInterval: 5 * 60 * 1000, // 5 minutes
  providers: {
    google: {
      loginPath: "/api/auth/google/login",
      logoutPath: "/api/auth/logout",
    },
    microsoft: {
      loginPath: "/api/auth/microsoft/login",
      logoutPath: "/api/auth/logout",
    },
  },
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
};

// App wrapper with AuthProvider
function App() {
  // Auth status change handler
  const handleAuthChange = (status: AuthStatusType, user: UserDetailsType | null) => {
    console.log("Auth status:", status, "User:", user?._name);
  };

  // Auth error handler
  const handleAuthError = (error: Error) => {
    console.error("Auth error:", error.message);
  };

  // AuthProviderPropsType configuration
  const providerProps: AuthProviderPropsType = {
    children: <AppRoutes />,
    config: authConfig,
    onAuthChange: handleAuthChange,
    onError: handleAuthError,
    loadingComponent: <div>Checking authentication...</div>,
    unauthenticatedComponent: <LoginPage />,
    skipInitialCheck: false,
  };

  return <AuthProvider {...providerProps} />;
}

// Login page component
function LoginPage() {
  const auth: UseAuthReturnType = useAuth();

  // Login with Google
  const handleGoogleLogin = () => {
    const options: LoginOptionsType = {
      callbackUrl: "/dashboard",
    };
    auth.login("google", options);
  };

  // Login with Microsoft
  const handleMicrosoftLogin = () => {
    const options: LoginOptionsType = {
      callbackUrl: "/dashboard",
      params: { prompt: "select_account" },
    };
    auth.login("microsoft", options);
  };

  // Login with default provider
  const handleDefaultLogin = () => {
    auth.login(); // Uses defaultProvider from config
  };

  // Access auth status
  const status: AuthStatusType = auth.status;

  return (
    <div className="login-page">
      <h1>Welcome</h1>
      <p>Please sign in to continue</p>

      {/* Error display */}
      {auth.error && (
        <div className="error">
          {auth.error.message}
          <button onClick={auth.clearError}>Dismiss</button>
        </div>
      )}

      {/* Login buttons */}
      <div className="login-buttons">
        <button onClick={handleGoogleLogin} disabled={auth.isLoading}>
          Sign in with Google
        </button>
        <button onClick={handleMicrosoftLogin} disabled={auth.isLoading}>
          Sign in with Microsoft
        </button>
        <button onClick={handleDefaultLogin} disabled={auth.isLoading}>
          Sign in (Default)
        </button>
      </div>

      {/* Loading state */}
      {auth.isLoading && <span>Loading...</span>}

      {/* Status display */}
      <p>Current status: {status}</p>
    </div>
  );
}

// Dashboard component (authenticated users)
function Dashboard() {
  const auth: UseAuthReturnType = useAuth();

  // Logout handler
  const handleLogout = async () => {
    const options: LogoutOptionsType = {
      redirectUrl: "/login",
      callLogoutEndpoint: true,
    };
    await auth.logout(options);
  };

  // Refresh session handler
  const handleRefreshSession = async () => {
    const session: SessionResponseType | null = await auth.refreshSession();
    if (session) {
      console.log("Session refreshed:", session.userDetails._name);
      console.log("Static URL:", session.staticBaseUrl);
      console.log("Build ID:", session.buildId);
    }
  };

  // Access user details
  const user: UserDetailsType | null = auth.user;

  // Role-based access control
  const isAdmin: boolean = auth.hasRole("Admin");
  const canManageProducts: boolean = auth.hasAnyRole(["Admin", "Seller"]);
  const canViewReports: boolean = auth.hasAnyRole(["Admin", "InventoryManager"]);

  // Guard against unauthenticated access
  if (!auth.isAuthenticated) {
    return <div>Please log in to access the dashboard</div>;
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header>
        <h1>Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user?._name}</span>
          <span>Role: {user?.Role}</span>
          <button onClick={handleRefreshSession}>Refresh Session</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* Main content */}
      <main>
        {/* User info section */}
        <section className="user-section">
          <h2>User Information</h2>
          <p>User ID: {user?._id}</p>
          <p>Name: {user?._name}</p>
          <p>Role: {user?.Role}</p>
          <p>Static Base URL: {auth.staticBaseUrl}</p>
          <p>Build ID: {auth.buildId}</p>
          <p>Status: {auth.status}</p>
          <p>Authenticated: {auth.isAuthenticated ? "Yes" : "No"}</p>
        </section>

        {/* Role-based sections */}
        {canManageProducts && (
          <section className="products-section">
            <h2>Product Management</h2>
            <p>You have access to manage products.</p>
          </section>
        )}

        {canViewReports && (
          <section className="reports-section">
            <h2>Reports</h2>
            <p>You have access to view reports.</p>
          </section>
        )}

        {isAdmin && (
          <section className="admin-section">
            <h2>Admin Panel</h2>
            <p>Full administrative access.</p>
          </section>
        )}

        {!isAdmin && (
          <section className="restricted-section">
            <p>Admin panel is restricted to administrators.</p>
          </section>
        )}
      </main>

      {/* Error banner */}
      {auth.error && (
        <div className="error-banner">
          Error: {auth.error.message}
          <button onClick={auth.clearError}>Dismiss</button>
        </div>
      )}
    </div>
  );
}

// Protected route component
function ProtectedRoute({
  children,
  requiredRoles,
}: {
  children: React.ReactNode;
  requiredRoles?: string[];
}) {
  const auth: UseAuthReturnType = useAuth();

  // Show loading while checking auth
  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  // Redirect if not authenticated
  if (!auth.isAuthenticated) {
    return <div>Access denied. Please log in.</div>;
  }

  // Check role requirements
  if (requiredRoles && !auth.hasAnyRole(requiredRoles)) {
    return <div>Access denied. Insufficient permissions.</div>;
  }

  return <>{children}</>;
}

// App routes with protected routes
function AppRoutes() {
  return (
    <div>
      {/* Public route */}
      <LoginPage />

      {/* Protected route - any authenticated user */}
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>

      {/* Protected route - admin only */}
      <ProtectedRoute requiredRoles={["Admin"]}>
        <div>Admin Only Content</div>
      </ProtectedRoute>

      {/* Protected route - multiple roles */}
      <ProtectedRoute requiredRoles={["Admin", "Seller", "InventoryManager"]}>
        <div>Staff Only Content</div>
      </ProtectedRoute>
    </div>
  );
}
```
