import { createContext, useContext, useState, ReactNode } from 'react';

type Role = 'admin' | 'user';

interface RoleContextType {
  currentRole: Role;
  setRole: (role: Role) => void;
  isAdmin: boolean;
  isUser: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

interface RoleProviderProps {
  children: ReactNode;
}

export function RoleProvider({ children }: RoleProviderProps) {
  const [currentRole, setCurrentRole] = useState<Role>('admin');

  const setRole = (role: Role) => {
    setCurrentRole(role);
    // Update API client headers for mock API
    const event = new CustomEvent('roleChanged', { detail: { role } });
    window.dispatchEvent(event);
  };

  const value: RoleContextType = {
    currentRole,
    setRole,
    isAdmin: currentRole === 'admin',
    isUser: currentRole === 'user',
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