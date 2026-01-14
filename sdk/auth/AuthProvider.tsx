// ============================================================
// AUTH PROVIDER COMPONENT
// ============================================================
// React Context Provider for authentication state

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  AuthContextValue,
  AuthProviderProps,
  AuthStatus,
  UserDetails,
  SessionResponse,
  AuthProviderName,
  LoginOptions,
  LogoutOptions,
} from "./types";

import {
  fetchSession,
  initiateLogin,
  performLogout,
  AuthenticationError,
} from "./authClient";
import { getAuthConfig, configureAuth } from "./authConfig";

// ============================================================
// CONTEXT
// ============================================================

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_QUERY_KEY = ["auth", "session"] as const;

// ============================================================
// PROVIDER COMPONENT
// ============================================================

export function AuthProvider({
  children,
  config: configOverride,
  onAuthChange,
  onError,
  loadingComponent,
  unauthenticatedComponent,
  skipInitialCheck = false,
}: AuthProviderProps): React.ReactElement {
  const configApplied = useRef(false);

  if (configOverride && !configApplied.current) {
    configureAuth(configOverride);
    configApplied.current = true;
  }

  const queryClient = useQueryClient();
  const authConfig = getAuthConfig();

  // ============================================================
  // SESSION QUERY
  // ============================================================

  const {
    data: sessionData,
    isLoading,
    error: queryError,
    refetch,
    isFetching,
  } = useQuery<SessionResponse, Error>({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchSession,
    enabled: !skipInitialCheck,
    retry: (failureCount, error) => {
      if (error instanceof AuthenticationError) {
        if (error.statusCode === 401 || error.statusCode === 403) {
          return false;
        }
      }
      return failureCount < authConfig.retry.count;
    },
    retryDelay: authConfig.retry.delay,
    staleTime: authConfig.staleTime,
    gcTime: authConfig.staleTime * 2,
    refetchOnWindowFocus: authConfig.refetchOnWindowFocus ?? true,
    refetchOnReconnect: authConfig.refetchOnReconnect ?? true,
    refetchInterval: authConfig.sessionCheckInterval || false,
  });

  // ============================================================
  // DERIVED STATE
  // ============================================================

  const [error, setError] = useState<Error | null>(null);

  const status: AuthStatus = useMemo(() => {
    if (isLoading || isFetching) return "loading";
    if (sessionData?.userDetails) return "authenticated";
    return "unauthenticated";
  }, [isLoading, isFetching, sessionData]);

  const user: UserDetails | null = sessionData?.userDetails || null;
  const staticBaseUrl: string | null = sessionData?.staticBaseUrl || null;
  const buildId: string | null = sessionData?.buildId || null;
  const isAuthenticated = status === "authenticated";

  // ============================================================
  // REFS FOR CALLBACKS
  // ============================================================

  const onAuthChangeRef = useRef(onAuthChange);
  onAuthChangeRef.current = onAuthChange;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // ============================================================
  // EFFECTS
  // ============================================================

  useEffect(() => {
    if (!isLoading) {
      onAuthChangeRef.current?.(status, user);
    }
  }, [status, user, isLoading]);

  useEffect(() => {
    if (queryError) {
      setError(queryError);
      onErrorRef.current?.(queryError);
    }
  }, [queryError]);

  useEffect(() => {
    if (
      status === "unauthenticated" &&
      authConfig.autoRedirect &&
      !isLoading
    ) {
      initiateLogin();
    }
  }, [status, isLoading, authConfig.autoRedirect]);

  // ============================================================
  // AUTH OPERATIONS
  // ============================================================

  const login = useCallback(
    (provider?: AuthProviderName, options?: LoginOptions) => {
      initiateLogin(provider, options);
    },
    []
  );

  const logout = useCallback(
    async (options?: LogoutOptions) => {
      queryClient.removeQueries({ queryKey: SESSION_QUERY_KEY });
      await performLogout(options);
    },
    [queryClient]
  );

  const refreshSession = useCallback(async (): Promise<SessionResponse | null> => {
    // Prevent concurrent refreshes - return existing data if already fetching
    if (isFetching) {
      return sessionData || null;
    }

    try {
      const result = await refetch();
      return result.data || null;
    } catch (err) {
      setError(err as Error);
      return null;
    }
  }, [refetch, isFetching, sessionData]);

  const hasRole = useCallback(
    (role: string): boolean => {
      return user?.Role === role;
    },
    [user]
  );

  const hasAnyRole = useCallback(
    (roles: string[]): boolean => {
      return roles.includes(user?.Role || "");
    },
    [user]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const _forceCheck = useCallback(() => {
    refetch();
  }, [refetch]);

  // ============================================================
  // CONTEXT VALUE
  // ============================================================

  const contextValue: AuthContextValue = useMemo(
    () => ({
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
      _forceCheck,
    }),
    [
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
      _forceCheck,
    ]
  );

  // ============================================================
  // RENDER
  // ============================================================

  if (status === "loading" && loadingComponent) {
    return <>{loadingComponent}</>;
  }

  if (
    status === "unauthenticated" &&
    !authConfig.autoRedirect &&
    unauthenticatedComponent
  ) {
    return <>{unauthenticatedComponent}</>;
  }

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// ============================================================
// CONTEXT HOOK (internal)
// ============================================================

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
