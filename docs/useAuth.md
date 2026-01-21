# useAuth

Authentication state management with OAuth providers, session handling, and role-based access control.

## Imports

```typescript
import { useAuth, AuthProvider } from "@ram_28/kf-ai-sdk/auth";
import type {
  UseAuthReturnType,
  UserDetailsType,
  AuthStatusType,
  AuthProviderPropsType,
  AuthProviderNameType,
  AuthConfigType,
  LoginOptionsType,
  LogoutOptionsType,
} from "@ram_28/kf-ai-sdk/auth/types";
```

## Type Definitions

```typescript
// User details from session
interface UserDetailsType {
  _id: string;
  _name: string;
  Role: string;
  [key: string]: unknown;
}

// Authentication status
type AuthStatusType = "loading" | "authenticated" | "unauthenticated";

// Supported providers
type AuthProviderNameType = "google" | "microsoft" | "github" | "custom";

// Hook return type
interface UseAuthReturnType {
  user: UserDetailsType | null;
  staticBaseUrl: string | null;
  buildId: string | null;
  status: AuthStatusType;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;

  login: (provider?, options?) => void;
  logout: (options?) => Promise<void>;
  refreshSession: () => Promise<SessionResponseType | null>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  clearError: () => void;
}
```

## Basic Example

Set up authentication with AuthProvider and access auth state.

```tsx
import { useAuth, AuthProvider } from "@ram_28/kf-ai-sdk/auth";

// App wrapper
function App() {
  return (
    <AuthProvider
      config={{
        sessionEndpoint: "/api/id",
        defaultProvider: "google",
      }}
    >
      <AppContent />
    </AuthProvider>
  );
}

// Component using auth
function AppContent() {
  const auth = useAuth();

  if (auth.isLoading) return <div>Loading...</div>;

  if (!auth.isAuthenticated) {
    return (
      <div>
        <h1>Welcome</h1>
        <button onClick={() => auth.login()}>Sign In</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Hello, {auth.user?._name}</h1>
      <button onClick={() => auth.logout()}>Sign Out</button>
    </div>
  );
}
```

---

## Provider Setup

### Basic Configuration

Configure AuthProvider with essential options.

```tsx
function App() {
  return (
    <AuthProvider
      config={{
        sessionEndpoint: "/api/id",
        defaultProvider: "google",
        autoRedirect: false,
      }}
    >
      <AppContent />
    </AuthProvider>
  );
}
```

### Full Configuration

Configure all available options.

```tsx
import type { AuthConfigType, AuthProviderPropsType } from "@ram_28/kf-ai-sdk/auth/types";

function App() {
  const config: Partial<AuthConfigType> = {
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

  const handleAuthChange = (status: AuthStatusType, user: UserDetailsType | null) => {
    console.log("Auth changed:", status, user?._name);
  };

  return (
    <AuthProvider
      config={config}
      onAuthChange={handleAuthChange}
      onError={(error) => console.error("Auth error:", error)}
      loadingComponent={<div>Checking authentication...</div>}
    >
      <AppContent />
    </AuthProvider>
  );
}
```

### Custom Loading and Unauthenticated Views

Provide custom components for different states.

```tsx
function App() {
  return (
    <AuthProvider
      config={{ sessionEndpoint: "/api/id" }}
      loadingComponent={<LoadingSpinner />}
      unauthenticatedComponent={<LoginPage />}
    >
      <Dashboard />
    </AuthProvider>
  );
}

function LoadingSpinner() {
  return (
    <div className="loading">
      <span className="spinner" />
      <p>Checking authentication...</p>
    </div>
  );
}

function LoginPage() {
  const auth = useAuth();

  return (
    <div className="login-page">
      <h1>Sign In Required</h1>
      <button onClick={() => auth.login("google")}>
        Continue with Google
      </button>
    </div>
  );
}
```

---

## Login

### Login with Default Provider

Use the configured default provider.

```tsx
function LoginButton() {
  const auth = useAuth();

  return (
    <button onClick={() => auth.login()} disabled={auth.isLoading}>
      Sign In
    </button>
  );
}
```

### Login with Specific Provider

Choose which OAuth provider to use.

```tsx
function LoginOptions() {
  const auth = useAuth();

  return (
    <div className="login-options">
      <button onClick={() => auth.login("google")}>
        Sign in with Google
      </button>
      <button onClick={() => auth.login("microsoft")}>
        Sign in with Microsoft
      </button>
      <button onClick={() => auth.login("github")}>
        Sign in with GitHub
      </button>
    </div>
  );
}
```

### Login with Callback URL

Redirect to a specific page after login.

```tsx
function LoginWithRedirect() {
  const auth = useAuth();

  const handleLogin = (provider: AuthProviderNameType) => {
    auth.login(provider, {
      callbackUrl: "/dashboard",
    });
  };

  return (
    <button onClick={() => handleLogin("google")}>
      Sign In
    </button>
  );
}
```

### Login with Custom Parameters

Pass additional parameters to the auth provider.

```tsx
function LoginWithParams() {
  const auth = useAuth();

  const handleMicrosoftLogin = () => {
    auth.login("microsoft", {
      callbackUrl: "/dashboard",
      params: {
        prompt: "select_account", // Force account selection
      },
    });
  };

  return (
    <button onClick={handleMicrosoftLogin}>
      Sign in with Microsoft
    </button>
  );
}
```

---

## Logout

### Basic Logout

Sign out the current user.

```tsx
function LogoutButton() {
  const auth = useAuth();

  return (
    <button onClick={() => auth.logout()}>
      Sign Out
    </button>
  );
}
```

### Logout with Redirect

Redirect to a specific page after logout.

```tsx
function LogoutWithRedirect() {
  const auth = useAuth();

  const handleLogout = async () => {
    await auth.logout({
      redirectUrl: "/login",
    });
  };

  return (
    <button onClick={handleLogout}>
      Sign Out
    </button>
  );
}
```

### Logout Options

Control logout behavior.

```tsx
function LogoutWithOptions() {
  const auth = useAuth();

  const handleLogout = async () => {
    await auth.logout({
      redirectUrl: "/goodbye",
      callLogoutEndpoint: true, // Call server logout endpoint
    });
  };

  return (
    <button onClick={handleLogout}>
      Sign Out
    </button>
  );
}
```

---

## User Info

### Access User Details

Display information about the current user.

```tsx
function UserProfile() {
  const auth = useAuth();

  if (!auth.isAuthenticated || !auth.user) {
    return <div>Not signed in</div>;
  }

  return (
    <div className="user-profile">
      <p>Name: {auth.user._name}</p>
      <p>ID: {auth.user._id}</p>
      <p>Role: {auth.user.Role}</p>
    </div>
  );
}
```

### User Header Component

Common pattern for displaying user info in a header.

```tsx
function UserHeader() {
  const auth = useAuth();

  if (auth.isLoading) {
    return <div className="header-loading">...</div>;
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="header">
        <button onClick={() => auth.login()}>Sign In</button>
      </div>
    );
  }

  return (
    <div className="header">
      <span>Welcome, {auth.user?._name}</span>
      <span className="role">{auth.user?.Role}</span>
      <button onClick={() => auth.logout()}>Sign Out</button>
    </div>
  );
}
```

### Access Session Metadata

The hook also provides `staticBaseUrl` and `buildId` from the session response.

```tsx
function AppWithSessionInfo() {
  const auth = useAuth();

  if (!auth.isAuthenticated) {
    return <div>Please sign in</div>;
  }

  return (
    <div>
      <p>User: {auth.user?._name}</p>

      {/* Static base URL for assets/CDN */}
      {auth.staticBaseUrl && (
        <img src={`${auth.staticBaseUrl}/images/logo.png`} alt="Logo" />
      )}

      {/* Build ID for cache busting or version display */}
      <footer>
        <small>Build: {auth.buildId}</small>
      </footer>
    </div>
  );
}
```

| Property | Type | Description |
|----------|------|-------------|
| `auth.staticBaseUrl` | `string \| null` | Base URL for static assets from session |
| `auth.buildId` | `string \| null` | Current build identifier from session |

---

## Role-Based Access

### Check Single Role

Verify if user has a specific role.

```tsx
function AdminPanel() {
  const auth = useAuth();

  if (!auth.hasRole("Admin")) {
    return <div>Access denied. Admin role required.</div>;
  }

  return (
    <div className="admin-panel">
      <h2>Admin Panel</h2>
      {/* Admin content */}
    </div>
  );
}
```

### Check Multiple Roles

Verify if user has any of the specified roles.

```tsx
function StaffSection() {
  const auth = useAuth();

  const canAccess = auth.hasAnyRole(["Admin", "Manager", "Staff"]);

  if (!canAccess) {
    return <div>Staff access only.</div>;
  }

  return (
    <div className="staff-section">
      <h2>Staff Area</h2>
      {/* Staff content */}
    </div>
  );
}
```

### Conditional UI Based on Role

Show different content based on user role.

```tsx
function Dashboard() {
  const auth = useAuth();

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      {/* Everyone sees this */}
      <section>
        <h2>Overview</h2>
        <p>Welcome to the dashboard</p>
      </section>

      {/* Sellers and Admins see this */}
      {auth.hasAnyRole(["Seller", "Admin"]) && (
        <section>
          <h2>Product Management</h2>
          <p>Manage your products</p>
        </section>
      )}

      {/* Only Admins see this */}
      {auth.hasRole("Admin") && (
        <section>
          <h2>System Settings</h2>
          <p>Configure system settings</p>
        </section>
      )}

      {/* Buyers see this */}
      {auth.hasRole("Buyer") && (
        <section>
          <h2>My Orders</h2>
          <p>View your order history</p>
        </section>
      )}
    </div>
  );
}
```

---

## Protected Routes

### Basic Protected Route

Restrict access to authenticated users.

```tsx
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (!auth.isAuthenticated) {
    return <div>Please sign in to continue.</div>;
  }

  return <>{children}</>;
}

// Usage
function App() {
  return (
    <AuthProvider config={{ sessionEndpoint: "/api/id" }}>
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    </AuthProvider>
  );
}
```

### Role-Protected Route

Restrict access based on user roles.

```tsx
function RoleProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) {
  const auth = useAuth();

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (!auth.isAuthenticated) {
    return <div>Please sign in.</div>;
  }

  if (!auth.hasAnyRole(allowedRoles)) {
    return <div>Access denied. Required role: {allowedRoles.join(" or ")}</div>;
  }

  return <>{children}</>;
}

// Usage
function AdminPage() {
  return (
    <RoleProtectedRoute allowedRoles={["Admin"]}>
      <AdminDashboard />
    </RoleProtectedRoute>
  );
}

function SellerPage() {
  return (
    <RoleProtectedRoute allowedRoles={["Seller", "Admin"]}>
      <SellerDashboard />
    </RoleProtectedRoute>
  );
}
```

---

## Session Management

### Refresh Session

Manually refresh the user's session.

```tsx
function SessionRefresher() {
  const auth = useAuth();

  const handleRefresh = async () => {
    const session = await auth.refreshSession();
    if (session) {
      console.log("Session refreshed:", session.userDetails._name);
    } else {
      console.log("Session refresh failed");
    }
  };

  return (
    <button onClick={handleRefresh}>
      Refresh Session
    </button>
  );
}
```

### Session Status Display

Show current authentication status.

```tsx
function AuthStatus() {
  const auth = useAuth();

  return (
    <div className="auth-status">
      <p>Status: {auth.status}</p>
      <p>Authenticated: {auth.isAuthenticated ? "Yes" : "No"}</p>
      {auth.user && (
        <>
          <p>User: {auth.user._name}</p>
          <p>Role: {auth.user.Role}</p>
        </>
      )}
    </div>
  );
}
```

---

## Error Handling

### Display Auth Errors

Show and clear authentication errors.

```tsx
function AuthErrorBanner() {
  const auth = useAuth();

  if (!auth.error) return null;

  return (
    <div className="error-banner">
      <p>Authentication error: {auth.error.message}</p>
      <button onClick={auth.clearError}>Dismiss</button>
    </div>
  );
}
```

### Handle Errors in Login Flow

Handle errors during the login process.

```tsx
function LoginWithErrorHandling() {
  const auth = useAuth();

  return (
    <div className="login">
      {auth.error && (
        <div className="error">
          {auth.error.message}
          <button onClick={auth.clearError}>×</button>
        </div>
      )}

      <button
        onClick={() => auth.login("google")}
        disabled={auth.isLoading}
      >
        {auth.isLoading ? "Signing in..." : "Sign in with Google"}
      </button>

      <p className="status">Current status: {auth.status}</p>
    </div>
  );
}
```

---

## Auth State Callbacks

### React to Auth Changes

Handle authentication state changes.

```tsx
function App() {
  const handleAuthChange = (
    status: AuthStatusType,
    user: UserDetailsType | null
  ) => {
    if (status === "authenticated") {
      console.log("User signed in:", user?._name);
      // Track analytics, update state, etc.
    } else if (status === "unauthenticated") {
      console.log("User signed out");
      // Clear local state, redirect, etc.
    }
  };

  return (
    <AuthProvider
      config={{ sessionEndpoint: "/api/id" }}
      onAuthChange={handleAuthChange}
    >
      <AppContent />
    </AuthProvider>
  );
}
```

### Handle Auth Errors Globally

Catch and handle authentication errors.

```tsx
function App() {
  const handleError = (error: Error) => {
    console.error("Auth error:", error.message);

    // Show toast notification
    toast.error(`Authentication failed: ${error.message}`);
  };

  return (
    <AuthProvider
      config={{ sessionEndpoint: "/api/id" }}
      onError={handleError}
    >
      <AppContent />
    </AuthProvider>
  );
}
```
