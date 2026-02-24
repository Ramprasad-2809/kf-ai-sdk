// ============================================================
// AUTHENTICATION TYPE DEFINITIONS
// ============================================================

/**
 * User details returned from the session endpoint
 */
export interface UserDetailsType {
  _id: string;
  _name: string;
  Role: string;
  [key: string]: unknown;
}

/**
 * Session response from /api/id endpoint
 */
export interface SessionResponseType {
  userDetails: UserDetailsType;
  staticBaseUrl: string;
  buildId: string;
}

/**
 * Authentication status
 */
export type AuthStatusType = "loading" | "authenticated" | "unauthenticated";

/**
 * Authentication provider type (extensible for multiple OAuth providers)
 */
export type AuthProviderNameType = "google" | "azure" | "github" | "custom";

/**
 * Auth endpoint configuration for a specific provider
 */
export interface AuthEndpointConfigType {
  /** Login endpoint path (e.g., "/api/auth/google/login") */
  loginPath: string;
  /** Optional logout endpoint path */
  logoutPath?: string;
  /** Optional callback endpoint path */
  callbackPath?: string;
}

/**
 * Global authentication configuration
 */
export interface AuthConfigType {
  /** Base URL for auth endpoints (defaults to apiBaseUrl) */
  baseUrl?: string;

  /** Session check endpoint (default: "/api/id") */
  sessionEndpoint: string;

  /** Auth provider configurations */
  providers: Partial<Record<AuthProviderNameType, AuthEndpointConfigType>>;

  /** Default provider to use for login */
  defaultProvider: AuthProviderNameType;

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

/**
 * AuthProvider component props
 */
export interface AuthProviderPropsType {
  children: React.ReactNode;

  /** Override global config for this provider instance */
  config?: Partial<AuthConfigType>;

  /** Callback when authentication status changes */
  onAuthChange?: (status: AuthStatusType, user: UserDetailsType | null) => void;

  /** Callback on authentication error */
  onError?: (error: Error) => void;

  /** Custom loading component */
  loadingComponent?: React.ReactNode;

  /** Custom unauthenticated component (shown when autoRedirect is false) */
  unauthenticatedComponent?: React.ReactNode;

  /** Disable automatic session check on mount */
  skipInitialCheck?: boolean;
}

/**
 * Options for login operation
 */
export interface LoginOptionsType {
  /** URL to redirect after successful login */
  callbackUrl?: string;
  /** Additional query parameters for login URL */
  params?: Record<string, string>;
}

/**
 * Options for logout operation
 */
export interface LogoutOptionsType {
  /** URL to redirect after logout */
  redirectUrl?: string;
  /** Whether to call logout endpoint (default: true) */
  callLogoutEndpoint?: boolean;
}

/**
 * Return type for useAuth hook
 */
export interface UseAuthReturnType {
  // ============================================================
  // USER STATE
  // ============================================================

  /** Current authenticated user (null if not authenticated) */
  user: UserDetailsType | null;

  /** Static base URL from session */
  staticBaseUrl: string | null;

  /** Build ID from session */
  buildId: string | null;

  /** Current authentication status */
  status: AuthStatusType;

  /** Convenience boolean for authenticated state */
  isAuthenticated: boolean;

  /** Convenience boolean for loading state */
  isLoading: boolean;

  // ============================================================
  // AUTH OPERATIONS
  // ============================================================

  /**
   * Initiate login flow
   * @param provider - Auth provider to use (defaults to configured default)
   * @param options - Additional options for login
   */
  login: (provider?: AuthProviderNameType, options?: LoginOptionsType) => void;

  /**
   * Logout the current user
   * @param options - Additional options for logout
   */
  logout: (options?: LogoutOptionsType) => Promise<void>;

  /**
   * Manually refresh the session
   */
  refreshSession: () => Promise<SessionResponseType | null>;

  /**
   * Check if user has a specific role
   */
  hasRole: (role: string) => boolean;

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole: (roles: string[]) => boolean;

  // ============================================================
  // ERROR STATE
  // ============================================================

  /** Last authentication error */
  error: Error | null;

  /** Clear the current error */
  clearError: () => void;
}

/**
 * Auth context value (internal)
 */
export interface AuthContextValueType extends UseAuthReturnType {
  /** Internal: force re-check session */
  _forceCheck: () => void;
}
