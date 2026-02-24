// ============================================================
// AUTH CONFIGURATION
// ============================================================
// Global auth configuration following the setApiBaseUrl pattern

import type { AuthConfigType, AuthProviderNameType, AuthEndpointConfigType } from "./types";
import { getApiBaseUrl } from "../api/client";

/**
 * Default auth configuration
 */
const defaultAuthConfig: AuthConfigType = {
  sessionEndpoint: "/api/id",
  providers: {
    google: {
      loginPath: "/api/auth/google/login",
      logoutPath: "/api/auth/logout",
    },
  },
  defaultProvider: "google",
  autoRedirect: false,
  sessionCheckInterval: 0,
  retry: {
    count: 3,
    delay: 1000,
  },
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
};

/**
 * Current auth configuration (mutable)
 */
let authConfig: AuthConfigType = { ...defaultAuthConfig };

/**
 * Configure authentication settings globally
 * @example
 * ```ts
 * configureAuth({
 *   defaultProvider: "google",
 *   autoRedirect: true,
 *   providers: {
 *     google: { loginPath: "/api/auth/google/login" },
 *     azure: { loginPath: "/api/auth/azure/login" },
 *   },
 * });
 * ```
 */
export function configureAuth(config: Partial<AuthConfigType>): void {
  authConfig = {
    ...authConfig,
    ...config,
    providers: {
      ...authConfig.providers,
      ...config.providers,
    },
    retry: {
      ...authConfig.retry,
      ...config.retry,
    },
  };
}

/**
 * Add or update an auth provider configuration
 */
export function setAuthProvider(
  provider: AuthProviderNameType,
  config: AuthEndpointConfigType
): void {
  authConfig.providers[provider] = config;
}

/**
 * Get current auth configuration
 */
export function getAuthConfig(): Readonly<AuthConfigType> {
  return { ...authConfig };
}

/**
 * Get the base URL for auth endpoints
 * Falls back to API base URL, then window.location.origin
 */
export function getAuthBaseUrl(): string {
  return authConfig.baseUrl || getApiBaseUrl() || (typeof window !== 'undefined' ? window.location.origin : '');
}

/**
 * Get endpoint configuration for a specific provider
 */
export function getProviderConfig(
  provider: AuthProviderNameType
): AuthEndpointConfigType | undefined {
  return authConfig.providers[provider];
}

/**
 * Reset auth configuration to defaults
 */
export function resetAuthConfig(): void {
  authConfig = { ...defaultAuthConfig };
}
