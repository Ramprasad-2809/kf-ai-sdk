// ============================================================
// AUTH API CLIENT
// ============================================================
// Low-level functions for authentication API calls

import type {
  SessionResponse,
  AuthProviderName,
  LoginOptions,
  LogoutOptions,
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
export async function fetchSession(): Promise<SessionResponse> {
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

  const data: SessionResponse = await response.json();
  return data;
}

/**
 * Initiate login flow by redirecting to the auth provider
 * The server handles the OAuth flow and sets cookies
 */
export function initiateLogin(
  provider?: AuthProviderName,
  options?: LoginOptions
): void {
  const config = getAuthConfig();
  const baseUrl = getAuthBaseUrl();
  const selectedProvider = provider || config.defaultProvider;

  const providerConfig = getProviderConfig(selectedProvider);
  if (!providerConfig) {
    throw new Error(`Auth provider "${selectedProvider}" is not configured`);
  }

  const loginUrl = new URL(`${baseUrl}${providerConfig.loginPath}`);

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

  window.location.href = loginUrl.toString();
}

/**
 * Logout the current user
 * Optionally calls the logout endpoint before clearing client state
 */
export async function performLogout(options?: LogoutOptions): Promise<void> {
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
