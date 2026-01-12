// ============================================================
// USE AUTH HOOK
// ============================================================
// Main hook for consuming authentication state

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

  const {
    user,
    staticBaseUrl,
    buildId,
    status,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshSession,
    hasRole,
    hasAnyRole,
    error,
    clearError,
  } = context;

  return {
    user,
    staticBaseUrl,
    buildId,
    status,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshSession,
    hasRole,
    hasAnyRole,
    error,
    clearError,
  };
}
