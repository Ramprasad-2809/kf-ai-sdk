# useAuth Hook - Usage Guide

The `useAuth` hook provides a complete authentication solution for managing user sessions, login/logout flows, and role-based access control. It integrates with OAuth providers and handles session persistence automatically.

## Table of Contents

- [Quick Start](#quick-start)
- [Type Reference](#type-reference)
- [API Reference](#api-reference)
- [Features](#features)
  - [Authentication Status](#authentication-status)
  - [Login Flow](#login-flow)
  - [Logout Flow](#logout-flow)
  - [Role Checking](#role-checking)
  - [Session Management](#session-management)
- [Complete Example](#complete-example)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Basic Usage

```tsx
import { useAuth } from 'kf-ai-sdk';

function UserProfile() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <h1>Welcome, {user._name}</h1>
      <p>Role: {user.Role}</p>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}
```

### With AuthProvider

```tsx
import { AuthProvider } from 'kf-ai-sdk';

function App() {
  return (
    <AuthProvider
      onAuthChange={(status, user) => {
        console.log('Auth status changed:', status, user);
      }}
    >
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
```

## Type Reference

### Import Types

```typescript
import { useAuth } from 'kf-ai-sdk';
import type {
  UseAuthReturn,
  UserDetails,
  AuthStatus,
  AuthProviderProps,
  LoginOptions,
  LogoutOptions,
  AuthProviderName,
  AuthConfig,
} from 'kf-ai-sdk';
```

### UserDetails

User information returned from the session endpoint.

```typescript
interface UserDetails {
  /** Unique user identifier */
  _id: string;
  /** User's display name */
  _name: string;
  /** User's current role */
  Role: string;
  /** Additional custom fields from the backend */
  [key: string]: unknown;
}
```

### AuthStatus

Authentication state indicator.

```typescript
type AuthStatus = "loading" | "authenticated" | "unauthenticated";
```

### AuthProviderName

Supported OAuth providers.

```typescript
type AuthProviderName = "google" | "microsoft" | "github" | "custom";
```

### LoginOptions

Options for the login operation.

```typescript
interface LoginOptions {
  /** URL to redirect after successful login */
  callbackUrl?: string;
  /** Additional query parameters for login URL */
  params?: Record<string, string>;
}
```

### LogoutOptions

Options for the logout operation.

```typescript
interface LogoutOptions {
  /** URL to redirect after logout */
  redirectUrl?: string;
  /** Whether to call logout endpoint (default: true) */
  callLogoutEndpoint?: boolean;
}
```

### AuthProviderProps

Props for the AuthProvider component.

```typescript
interface AuthProviderProps {
  /** Child components */
  children: React.ReactNode;
  /** Override global config for this provider instance */
  config?: Partial<AuthConfig>;
  /** Callback when authentication status changes */
  onAuthChange?: (status: AuthStatus, user: UserDetails | null) => void;
  /** Callback on authentication error */
  onError?: (error: Error) => void;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  /** Custom unauthenticated component (shown when autoRedirect is false) */
  unauthenticatedComponent?: React.ReactNode;
  /** Disable automatic session check on mount */
  skipInitialCheck?: boolean;
}
```

### AuthConfig

Global authentication configuration.

```typescript
interface AuthConfig {
  /** Base URL for auth endpoints (defaults to apiBaseUrl) */
  baseUrl?: string;
  /** Session check endpoint (default: "/api/id") */
  sessionEndpoint: string;
  /** Auth provider configurations */
  providers: Partial<Record<AuthProviderName, AuthEndpointConfig>>;
  /** Default provider to use for login */
  defaultProvider: AuthProviderName;
  /** Auto-redirect to login when unauthenticated */
  autoRedirect: boolean;
  /** Custom redirect URL (if not using provider's login path) */
  loginRedirectUrl?: string;
  /** URL to redirect after successful login */
  callbackUrl?: string;
  /** Session check interval in milliseconds (0 to disable) */
  sessionCheckInterval: number;
  /** Retry configuration for session check */
  retry: {
    count: number;
    delay: number;
  };
  /** React Query stale time for session data */
  staleTime: number;
  /** Refetch session when window regains focus (default: true) */
  refetchOnWindowFocus?: boolean;
  /** Refetch session when network reconnects (default: true) */
  refetchOnReconnect?: boolean;
}
```

### UseAuthReturn

Return type for the useAuth hook.

```typescript
interface UseAuthReturn {
  /** Current authenticated user (null if not authenticated) */
  user: UserDetails | null;
  /** Static base URL from session */
  staticBaseUrl: string | null;
  /** Build ID from session */
  buildId: string | null;
  /** Current authentication status */
  status: AuthStatus;
  /** Convenience boolean for authenticated state */
  isAuthenticated: boolean;
  /** Convenience boolean for loading state */
  isLoading: boolean;
  /**
   * Initiate login flow
   * @param provider - Auth provider to use (defaults to configured default)
   * @param options - Additional options for login
   */
  login: (provider?: AuthProviderName, options?: LoginOptions) => void;
  /**
   * Logout the current user
   * @param options - Additional options for logout
   */
  logout: (options?: LogoutOptions) => Promise<void>;
  /**
   * Manually refresh the session
   */
  refreshSession: () => Promise<SessionResponse | null>;
  /**
   * Check if user has a specific role
   */
  hasRole: (role: string) => boolean;
  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole: (roles: string[]) => boolean;
  /** Last authentication error */
  error: Error | null;
  /** Clear the current error */
  clearError: () => void;
}
```

## API Reference

### useAuth()

Hook to access authentication state and operations. Must be used within an AuthProvider component.

```typescript
function useAuth(): UseAuthReturn;
```

**Returns:** `UseAuthReturn` - Authentication state and methods

## Features

### Authentication Status

Track the current authentication state.

```tsx
function AuthStatusDisplay() {
  const { status, isAuthenticated, isLoading } = useAuth();

  // Using status directly
  switch (status) {
    case "loading":
      return <LoadingSpinner />;
    case "authenticated":
      return <Dashboard />;
    case "unauthenticated":
      return <LoginPrompt />;
  }

  // Or using convenience booleans
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <LoginPrompt />;
  return <Dashboard />;
}
```

### Login Flow

Initiate OAuth login with various providers.

```tsx
function LoginPage() {
  const { login, isLoading } = useAuth();

  const handleGoogleLogin = () => {
    login("google", {
      callbackUrl: "/dashboard",
    });
  };

  const handleMicrosoftLogin = () => {
    login("microsoft", {
      callbackUrl: "/dashboard",
      params: { prompt: "select_account" },
    });
  };

  return (
    <div>
      <button onClick={handleGoogleLogin} disabled={isLoading}>
        Sign in with Google
      </button>
      <button onClick={handleMicrosoftLogin} disabled={isLoading}>
        Sign in with Microsoft
      </button>
    </div>
  );
}
```

### Logout Flow

Handle user logout with options.

```tsx
function LogoutButton() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout({
      redirectUrl: "/login",
      callLogoutEndpoint: true,
    });
  };

  return <button onClick={handleLogout}>Sign Out</button>;
}
```

### Role Checking

Check user roles for authorization.

```tsx
function AdminPanel() {
  const { user, hasRole, hasAnyRole } = useAuth();

  // Single role check
  if (!hasRole("Admin")) {
    return <AccessDenied />;
  }

  // Multiple role check (any)
  const canManageProducts = hasAnyRole(["Admin", "Seller", "InventoryManager"]);

  return (
    <div>
      <h1>Admin Panel</h1>
      <p>Welcome, {user._name}</p>
      {canManageProducts && <ProductManagement />}
    </div>
  );
}
```

### Session Management

Manually refresh or check the session.

```tsx
function SessionManager() {
  const { refreshSession, user, error, clearError } = useAuth();

  const handleRefresh = async () => {
    try {
      const session = await refreshSession();
      if (session) {
        console.log("Session refreshed:", session.userDetails);
      }
    } catch (err) {
      console.error("Failed to refresh session");
    }
  };

  return (
    <div>
      {error && (
        <div className="error">
          {error.message}
          <button onClick={clearError}>Dismiss</button>
        </div>
      )}
      <button onClick={handleRefresh}>Refresh Session</button>
    </div>
  );
}
```

## Complete Example

Here's a complete login page example from the e-commerce app:

```tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "kf-ai-sdk";
import type { AuthStatus, UserDetails } from "kf-ai-sdk";

type Role = "Admin" | "Buyer" | "Seller" | "InventoryManager" | "WarehouseStaff";

export function LoginPage() {
  const navigate = useNavigate();
  const { user, login, refreshSession, isLoading } = useAuth();
  const [isSettingRole, setIsSettingRole] = useState(false);

  const currentRole = (user?.Role as Role) ?? null;
  const userName = user?._name ?? "";

  // Helper function to set role and navigate
  const setRoleAndNavigate = async (userId: string, role: Role) => {
    try {
      const response = await fetch(
        `/api/user/${userId}/preview/role/${role}/set`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to set role: ${response.status}`);
      }

      // Refresh session to get updated user data
      await refreshSession();

      // Navigate based on role
      if (role === "InventoryManager" || role === "WarehouseStaff") {
        navigate("/inventory/restocking");
      } else {
        navigate("/products");
      }
    } finally {
      setIsSettingRole(false);
    }
  };

  // Handle pending role after OAuth callback
  useEffect(() => {
    const applyPendingRole = async () => {
      const pendingRole = sessionStorage.getItem("pendingRole");

      if (pendingRole && user?._id) {
        sessionStorage.removeItem("pendingRole");

        try {
          setIsSettingRole(true);
          await setRoleAndNavigate(user._id, pendingRole as Role);
        } catch (err) {
          console.error("Failed to apply pending role:", err);
          toast.error("Failed to set role. Please try again.");
          setIsSettingRole(false);
        }
      }
    };

    applyPendingRole();
  }, [user?._id]);

  // Main login handler
  const handleLogin = async (role: Role) => {
    try {
      setIsSettingRole(true);

      // If no user, store pending role and redirect to OAuth
      if (!user?._id) {
        sessionStorage.setItem("pendingRole", role);
        login(); // Uses default provider
        return;
      }

      // User exists - switch role directly
      await setRoleAndNavigate(user._id, role);
    } catch (err) {
      console.error("Failed to set role:", err);
      toast.error("Failed to switch role. Please try again.");
      setIsSettingRole(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="login-page">
      {/* Current Role Display */}
      {currentRole && (
        <div className="current-role">
          <span>{userName}</span>
          <span>{currentRole}</span>
        </div>
      )}

      {/* Role Selection */}
      <div className="role-cards">
        {["Admin", "Buyer", "Seller", "InventoryManager", "WarehouseStaff"].map(
          (role) => (
            <button
              key={role}
              onClick={() => handleLogin(role as Role)}
              disabled={isSettingRole}
            >
              {currentRole === role ? "Continue" : `Login as ${role}`}
            </button>
          )
        )}
      </div>
    </div>
  );
}
```

## Best Practices

### 1. Wrap App with AuthProvider

```tsx
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider
        onAuthChange={(status, user) => {
          // Log auth changes for debugging
          console.log("Auth:", status, user?._name);
        }}
        onError={(error) => {
          // Handle auth errors globally
          toast.error(error.message);
        }}
      >
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

### 2. Create Protected Route Component

```tsx
function ProtectedRoute({ children, roles }: {
  children: React.ReactNode;
  roles?: string[];
}) {
  const { isAuthenticated, isLoading, hasAnyRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !hasAnyRole(roles)) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}

// Usage
<Route
  path="/admin"
  element={
    <ProtectedRoute roles={["Admin"]}>
      <AdminDashboard />
    </ProtectedRoute>
  }
/>
```

### 3. Handle Session Expiration

```tsx
function SessionExpirationHandler() {
  const { status, refreshSession, logout } = useAuth();
  const prevStatus = useRef(status);

  useEffect(() => {
    // Detect transition from authenticated to unauthenticated
    if (
      prevStatus.current === "authenticated" &&
      status === "unauthenticated"
    ) {
      toast.warning("Your session has expired. Please log in again.");
    }
    prevStatus.current = status;
  }, [status]);

  return null;
}
```

### 4. Store User Context for Easy Access

```tsx
function UserContextProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  // Derive additional user properties
  const userContext = useMemo(() => ({
    ...auth,
    isAdmin: auth.hasRole("Admin"),
    isSeller: auth.hasRole("Seller"),
    isBuyer: auth.hasRole("Buyer"),
    canManageProducts: auth.hasAnyRole(["Admin", "Seller"]),
  }), [auth]);

  return (
    <UserContext.Provider value={userContext}>
      {children}
    </UserContext.Provider>
  );
}
```

## Troubleshooting

### Issue: Session Not Persisting

**Symptoms:** User is logged out after page refresh

**Solutions:**
1. Verify cookies are being set correctly with proper domain/path
2. Check that credentials are included in fetch requests
3. Ensure session endpoint returns valid session data
4. Check browser's cookie storage for session cookies

### Issue: Login Redirect Loop

**Symptoms:** User keeps being redirected to login page

**Solutions:**
1. Check that session endpoint is returning correct status
2. Verify AuthProvider is wrapping the entire app
3. Check for CORS issues with authentication endpoints
4. Ensure `autoRedirect` is configured correctly

### Issue: Role Not Updated After Change

**Symptoms:** User role shows old value after role switch

**Solutions:**
1. Call `refreshSession()` after changing role on backend
2. Check that role endpoint returns updated user data
3. Verify React Query cache is invalidated properly

### Issue: OAuth Callback Not Working

**Symptoms:** OAuth login completes but app doesn't recognize user

**Solutions:**
1. Verify callback URL matches OAuth provider configuration
2. Check that session cookies are set after OAuth callback
3. Ensure `refetchOnWindowFocus` is enabled for session updates
4. Debug network requests to verify session endpoint response

---

For more examples, see the [e-commerce example](../examples/e-commerce/) in the repository.
