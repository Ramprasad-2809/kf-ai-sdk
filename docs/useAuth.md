# Auth SDK API

This Auth SDK API provides necessary React-hooks and Components to build the
authentication and state management with session handling.

Here is the example how to use this API:

## Imports

```typescript
import { useAuth, AuthProvider } from "@ram_28/kf-ai-sdk/auth";
import type {
  UseAuthReturnType,
  UserDetailsType,
  AuthStatusType,
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

// Hook return type
interface UseAuthReturnType {
  // User state
  user: UserDetailsType | null;
  staticBaseUrl: string | null;
  buildId: string | null;

  // Auth status
  status: AuthStatusType;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;

  // Auth actions
  login: (provider?: string, options?: { callbackUrl?: string }) => void;
  logout: (options?: { redirectUrl?: string }) => Promise<void>;
  refreshSession: () => Promise<SessionResponseType | null>;

  // Role checks
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;

  // Error handling
  clearError: () => void;
}
```

## Usage Example

Wrap your app with `AuthProvider` and use `useAuth` in components.

```tsx
import { useAuth, AuthProvider } from "@ram_28/kf-ai-sdk/auth";

// 1. Wrap app with AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

// 2. Use useAuth in components
function AppContent() {
  const auth: UseAuthReturnType = useAuth();

  if (auth.isLoading) return <div>Loading...</div>;

  if (!auth.isAuthenticated) {
    return (
      <div>
        <h1>Welcome</h1>
        <button onClick={() => auth.login()}>Login with Google</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Hello, {auth.user?._name}</h1>
      <p>Role: {auth.user?.Role}</p>
      <button onClick={() => auth.logout()}>Sign Out</button>
    </div>
  );
}
```

## useAuth Properties

| Property          | Type                                         | Description                                                      |
| ----------------- | -------------------------------------------- | ---------------------------------------------------------------- |
| `user`            | `UserDetailsType \| null`                    | Current authenticated user details                               |
| `isAuthenticated` | `boolean`                                    | Whether user is logged in                                        |
| `isLoading`       | `boolean`                                    | Whether auth state is being determined                           |
| `status`          | `AuthStatusType`                             | Full status: `"loading"`, `"authenticated"`, `"unauthenticated"` |
| `error`           | `Error \| null`                              | Last authentication error                                        |
| `staticBaseUrl`   | `string \| null`                             | Base URL for static assets from session                          |
| `buildId`         | `string \| null`                             | Current build identifier from session                            |
| `login`           | `(provider?, options?) => void`              | Start login flow                                                 |
| `logout`          | `(options?) => Promise<void>`                | Sign out user                                                    |
| `hasRole`         | `(role: string) => boolean`                  | Check if user has specific role                                  |
| `hasAnyRole`      | `(roles: string[]) => boolean`               | Check if user has any of the roles                               |
| `refreshSession`  | `() => Promise<SessionResponseType \| null>` | Manually refresh session                                         |
| `clearError`      | `() => void`                                 | Clear the current error state                                    |
