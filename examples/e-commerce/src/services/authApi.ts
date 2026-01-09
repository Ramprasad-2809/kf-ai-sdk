import type { IdentityResponse, AppRole } from "../types/auth";

/**
 * Fetch current user identity
 * GET /api/id
 */
export async function fetchIdentity(): Promise<IdentityResponse> {
  const response = await fetch("/api/id", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch identity: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Set user role (preview mode)
 * PUT /api/user/{user_id}/preview/role/{role_id}/set
 */
export async function setUserRole(
  userId: string,
  roleId: AppRole
): Promise<void> {
  const response = await fetch(
    `/api/user/${userId}/preview/role/${roleId}/set`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to set role: ${response.status} ${response.statusText}`
    );
  }
}
