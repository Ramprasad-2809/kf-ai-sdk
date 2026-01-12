// ============================================================
// USE AUTH HOOK
// ============================================================
// Main hook for consuming authentication state

import { useMemo } from "react";
import type { UseAuthReturn } from "./types";
import { useAuthContext } from "./AuthProvider";

/**
 * Hook to access authentication state and operations
 *
 * Must be used within an AuthProvider component.
 *
 * @example
 * ```tsx
 * function UserProfile() {
 *   const { user, isAuthenticated, logout } = useAuth();
 *
 *   if (!isAuthenticated) {
 *     return <div>Please log in</div>;
 *   }
 *
 *   return (
 *     <div>
 *       <h1>Welcome, {user._name}</h1>
 *       <p>Role: {user.Role}</p>
 *       <button onClick={() => logout()}>Logout</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
  const context = useAuthContext();

  return useMemo(
    () => ({
      user: context.user,
      staticBaseUrl: context.staticBaseUrl,
      buildId: context.buildId,
      status: context.status,
      isAuthenticated: context.isAuthenticated,
      isLoading: context.isLoading,
      login: context.login,
      logout: context.logout,
      refreshSession: context.refreshSession,
      hasRole: context.hasRole,
      hasAnyRole: context.hasAnyRole,
      error: context.error,
      clearError: context.clearError,
    }),
    [
      context.user,
      context.staticBaseUrl,
      context.buildId,
      context.status,
      context.isAuthenticated,
      context.isLoading,
      context.login,
      context.logout,
      context.refreshSession,
      context.hasRole,
      context.hasAnyRole,
      context.error,
      context.clearError,
    ]
  );
}
