# Auth SDK API

React hook for authentication and session management.

## Imports

```typescript
import { useAuth, AuthProvider } from "@ram_28/kf-ai-sdk/auth";
import type { UseAuthReturnType, UserDetailsType, AuthStatusType } from "@ram_28/kf-ai-sdk/auth/types";
```

---

## Common Mistakes (READ FIRST)

### 1. Wrong user name property

```typescript
// ❌ WRONG — `name` does not exist
user?.name

// ✅ CORRECT — underscore prefix
user?._name
```

### 2. Not casting unknown properties

All properties except `_id`, `_name`, and `Role` are typed as `unknown`.

```typescript
// ❌ WRONG — Email is unknown, can't render in JSX
<p>{user?.Email}</p>

// ✅ CORRECT
<p>{String(user?.Email ?? "")}</p>
```

---

## Type Definitions

```typescript
interface UserDetailsType {
  _id: string;
  _name: string;
  Role: string;
  [key: string]: unknown;  // Other properties are unknown — cast when rendering
}

type AuthStatusType = "loading" | "authenticated" | "unauthenticated";

interface UseAuthReturnType {
  user: UserDetailsType | null;
  status: AuthStatusType;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  login: (provider?: string, options?: { callbackUrl?: string }) => void;
  logout: (options?: { redirectUrl?: string }) => Promise<void>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  refreshSession: () => Promise<any>;
  clearError: () => void;
  staticBaseUrl: string | null;
  buildId: string | null;
}
```

## Usage

```tsx
import { useAuth } from "@ram_28/kf-ai-sdk/auth";

function AppContent() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <button onClick={() => login()}>Login</button>;

  return (
    <div>
      <h1>Hello, {user?._name}</h1>
      <p>Role: {user?.Role}</p>
      <button onClick={() => logout()}>Sign Out</button>
    </div>
  );
}
```
