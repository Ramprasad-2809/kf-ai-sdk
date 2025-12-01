import React from 'react';
import { useRole } from '../providers/RoleProvider';

interface RoleBasedRouteProps {
  managerPage: React.ReactNode;
  employeePage: React.ReactNode;
}

export function RoleBasedRoute({ managerPage, employeePage }: RoleBasedRouteProps) {
  const { currentRole } = useRole();

  switch (currentRole) {
    case 'manager':
      return <>{managerPage}</>;
    case 'employee':
      return <>{employeePage}</>;
    default:
      return <div>Access denied</div>;
  }
}