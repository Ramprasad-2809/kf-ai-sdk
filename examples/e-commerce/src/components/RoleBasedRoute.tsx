import { useEffect, useState, ReactNode } from "react";
import { useRole } from "../providers/RoleProvider";

interface RoleBasedRouteProps {
  buyerPage: ReactNode;
  sellerPage: ReactNode;
}

export function RoleBasedRoute({ buyerPage, sellerPage }: RoleBasedRouteProps) {
  const { currentRole } = useRole();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedRole, setDisplayedRole] = useState(currentRole);

  useEffect(() => {
    if (currentRole !== displayedRole) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayedRole(currentRole);
        setIsTransitioning(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [currentRole, displayedRole]);

  if (isTransitioning) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <>{displayedRole === "buyer" ? buyerPage : sellerPage}</>;
}
