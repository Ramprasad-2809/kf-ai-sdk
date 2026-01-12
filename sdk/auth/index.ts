// ============================================================
// AUTH MODULE EXPORTS
// ============================================================

// Provider component
export { AuthProvider } from "./AuthProvider";

// Main hook
export { useAuth } from "./useAuth";

// Configuration functions
export {
  configureAuth,
  setAuthProvider,
  getAuthConfig,
  getAuthBaseUrl,
  resetAuthConfig,
} from "./authConfig";

// API client functions (for advanced use cases)
export {
  fetchSession,
  initiateLogin,
  performLogout,
  AuthenticationError,
} from "./authClient";

// Type exports
export type {
  UserDetails,
  SessionResponse,
  AuthStatus,
  AuthConfig,
  AuthProviderName,
  AuthEndpointConfig,
  AuthProviderProps,
  UseAuthReturn,
  LoginOptions,
  LogoutOptions,
} from "./types";
