import { createContext, useContext, useState, ReactNode } from 'react';

type Role = 'manager' | 'employee';

interface RoleContextType {
  currentRole: Role;
  setRole: (role: Role) => void;
  isManager: boolean;
  isEmployee: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

interface RoleProviderProps {
  children: ReactNode;
}

export function RoleProvider({ children }: RoleProviderProps) {
  const [currentRole, setCurrentRole] = useState<Role>('manager');

  const setRole = (role: Role) => {
    setCurrentRole(role);
    // Update API client headers for mock API
    const event = new CustomEvent('roleChanged', { detail: { role } });
    window.dispatchEvent(event);
  };

  const value: RoleContextType = {
    currentRole,
    setRole,
    isManager: currentRole === 'manager',
    isEmployee: currentRole === 'employee',
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}