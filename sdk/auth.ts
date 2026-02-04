// ============================================================
// AUTH MODULE - Main Entry Point
// @ram_28/kf-ai-sdk/auth
// ============================================================

// Provider component
export { AuthProvider } from './auth/AuthProvider';

// Main hook
export { useAuth } from './auth/useAuth';

// Error class
export { AuthenticationError } from './auth/authClient';

// Configuration
export {
  configureAuth,
  getAuthConfig,
  setAuthProvider,
  getAuthBaseUrl,
  resetAuthConfig,
} from './auth/authConfig';

// Constants
export {
  AuthStatus,
  AuthProviderName,
} from './types/constants';
