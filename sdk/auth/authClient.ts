// ============================================================
// AUTH API CLIENT
// ============================================================
// Low-level functions for authentication API calls

import type {
  SessionResponseType,
  AuthProviderNameType,
  LoginOptionsType,
  LogoutOptionsType,
} from "./types";
import {
  getAuthBaseUrl,
  getAuthConfig,
  getProviderConfig,
} from "./authConfig";
import { getDefaultHeaders } from "../api/client";

/**
 * Custom error class for authentication errors
 */
export class AuthenticationError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "AuthenticationError";
    this.statusCode = statusCode;
  }
}

/**
 * Fetch current session from the server
 * Calls the session endpoint (default: /api/id)
 *
 * @throws AuthenticationError if session check fails or user is not authenticated
 */
export async function fetchSession(): Promise<SessionResponseType> {
  const config = getAuthConfig();
  const baseUrl = getAuthBaseUrl();
  const headers = getDefaultHeaders();

  const response = await fetch(`${baseUrl}${config.sessionEndpoint}`, {
    method: "GET",
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new AuthenticationError("Not authenticated", response.status);
    }
    throw new AuthenticationError(
      `Session check failed: ${response.statusText}`,
      response.status
    );
  }

  const data: SessionResponseType = await response.json();
  return data;
}

/**
 * Initiates OAuth login flow by redirecting to the auth provider.
 *
 * @remarks
 * This function redirects the browser and never resolves.
 * Any code after calling this function will not execute.
 *
 * @param provider - OAuth provider to use (defaults to config.defaultProvider)
 * @param options - Login options including callback URL and custom params
 * @returns Promise that never resolves (browser redirects away)
 *
 * @example
 * ```typescript
 * // Correct usage - no code after login()
 * function handleLoginClick() {
 *   login('google');
 *   // Don't put code here - it won't run
 * }
 * ```
 */
export function initiateLogin(
  provider?: AuthProviderNameType,
  options?: LoginOptionsType
): Promise<never> {
  return new Promise(() => {
    const config = getAuthConfig();
    const baseUrl = getAuthBaseUrl();

    // Validate base URL
    if (!baseUrl) {
      throw new Error(
        'Auth base URL is not configured. Call setApiBaseUrl("https://...") or configureAuth({ baseUrl: "https://..." }) first.'
      );
    }

    const selectedProvider = provider || config.defaultProvider;
    const providerConfig = getProviderConfig(selectedProvider);

    // Validate provider config
    if (!providerConfig) {
      const availableProviders = Object.keys(config.providers || {}).join(", ") || "none";
      throw new Error(
        `Auth provider "${selectedProvider}" is not configured. Available providers: ${availableProviders}`
      );
    }

    // Validate login path
    if (!providerConfig.loginPath) {
      throw new Error(
        `Login path not configured for provider "${selectedProvider}". ` +
        `Configure it with: configureAuth({ providers: { ${selectedProvider}: { loginPath: '/api/auth/...' } } })`
      );
    }

    // Validate URL construction
    let loginUrl: URL;
    try {
      loginUrl = new URL(`${baseUrl}${providerConfig.loginPath}`);
    } catch {
      throw new Error(
        `Failed to construct login URL. Base URL: "${baseUrl}", Login path: "${providerConfig.loginPath}". ` +
        `Ensure baseUrl is a valid URL (e.g., "https://example.com").`
      );
    }

    if (options?.callbackUrl || config.callbackUrl) {
      loginUrl.searchParams.set(
        "callbackUrl",
        options?.callbackUrl || config.callbackUrl || window.location.href
      );
    }

    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        loginUrl.searchParams.set(key, value);
      });
    }

    window.open(loginUrl.toString(), '_blank');
    // Promise never resolves - login opens in new tab
  });
}

/**
 * Logout the current user
 * Optionally calls the logout endpoint before clearing client state
 */
export async function performLogout(options?: LogoutOptionsType): Promise<void> {
  const config = getAuthConfig();
  const baseUrl = getAuthBaseUrl();
  const headers = getDefaultHeaders();

  const providerConfig = getProviderConfig(config.defaultProvider);
  const logoutPath = providerConfig?.logoutPath;

  if (logoutPath && options?.callLogoutEndpoint !== false) {
    try {
      await fetch(`${baseUrl}${logoutPath}`, {
        method: "POST",
        headers,
        credentials: "include",
      });
    } catch (error) {
      console.warn("Logout endpoint call failed:", error);
    }
  }

  if (options?.redirectUrl) {
    window.location.href = options.redirectUrl;
  } else if (config.loginRedirectUrl) {
    window.location.href = config.loginRedirectUrl;
  }
}
