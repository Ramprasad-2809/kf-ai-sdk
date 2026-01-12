// ============================================================
// AUTH CONFIGURATION
// ============================================================
// Global auth configuration following the setApiBaseUrl pattern

import type { AuthConfig, AuthProviderName, AuthEndpointConfig } from "./types";
import { getApiBaseUrl } from "../api/client";

/**
 * Default auth configuration
 */
const defaultAuthConfig: AuthConfig = {
  sessionEndpoint: "/api/id",
  providers: {
    google: {
      loginPath: "/api/auth/google/login",
      logoutPath: "/api/auth/logout",
    },
  },
  defaultProvider: "google",
  autoRedirect: true,
  sessionCheckInterval: 0,
  retry: {
    count: 3,
    delay: 1000,
  },
  staleTime: 5 * 60 * 1000,
};

/**
 * Current auth configuration (mutable)
 */
let authConfig: AuthConfig = { ...defaultAuthConfig };

/**
 * Configure authentication settings globally
 * @example
 * ```ts
 * configureAuth({
 *   defaultProvider: "google",
 *   autoRedirect: true,
 *   providers: {
 *     google: { loginPath: "/api/auth/google/login" },
 *     microsoft: { loginPath: "/api/auth/microsoft/login" },
 *   },
 * });
 * ```
 */
export function configureAuth(config: Partial<AuthConfig>): void {
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
  provider: AuthProviderName,
  config: AuthEndpointConfig
): void {
  authConfig.providers[provider] = config;
}

/**
 * Get current auth configuration
 */
export function getAuthConfig(): Readonly<AuthConfig> {
  return { ...authConfig };
}

/**
 * Get the base URL for auth endpoints
 * Falls back to API base URL if not explicitly set
 */
export function getAuthBaseUrl(): string {
  return authConfig.baseUrl || getApiBaseUrl();
}

/**
 * Get endpoint configuration for a specific provider
 */
export function getProviderConfig(
  provider: AuthProviderName
): AuthEndpointConfig | undefined {
  return authConfig.providers[provider];
}

/**
 * Reset auth configuration to defaults
 */
export function resetAuthConfig(): void {
  authConfig = { ...defaultAuthConfig };
}
