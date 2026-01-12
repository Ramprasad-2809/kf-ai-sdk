// ============================================================
// AUTH MODULE EXPORTS
// ============================================================

// Provider component
export { AuthProvider } from "./AuthProvider";

// Main hook
export { useAuth } from "./useAuth";

// Error class (for error handling)
export { AuthenticationError } from "./authClient";

// Type exports
export type {
  UserDetails,
  SessionResponse,
  AuthStatus,
  AuthProviderProps,
  UseAuthReturn,
} from "./types";
