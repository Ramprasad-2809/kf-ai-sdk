import { useState, useEffect } from "react";
import { useRole } from "../providers/RoleProvider";
import { Roles } from "../../../../app";

interface RoleBasedRouteProps {
  adminPage: React.ReactNode;
  userPage: React.ReactNode;
}

/**
 * Route component that renders different pages based on current user role
 * Includes loading state when role switches
 */
export function RoleBasedRoute({ adminPage, userPage }: RoleBasedRouteProps) {
  const { currentRole } = useRole();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedRole, setDisplayedRole] = useState(currentRole);

  useEffect(() => {
    // When role changes, show loading state briefly
    if (currentRole !== displayedRole) {
      setIsTransitioning(true);

      const timer = setTimeout(() => {
        setDisplayedRole(currentRole);
        setIsTransitioning(false);
      }, 300); // Short transition delay

      return () => clearTimeout(timer);
    }
  }, [currentRole, displayedRole]);

  if (isTransitioning) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Switching role...</p>
        </div>
      </div>
    );
  }

  return <>{displayedRole === Roles.Admin ? adminPage : userPage}</>;
}
