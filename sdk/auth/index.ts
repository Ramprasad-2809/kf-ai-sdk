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
  UserDetailsType,
  SessionResponseType,
  AuthStatusType,
  AuthProviderPropsType,
  UseAuthReturnType,
} from "./types";
