import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { storage } from '../utils/storage';
import { updateApiRole, initializeApi } from '../utils/apiClient';
import { Role, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load role from storage on mount
  useEffect(() => {
    async function loadRole() {
      try {
        const savedRole = await storage.getItem('currentRole');
        if (savedRole && (savedRole === 'Buyer' || savedRole === 'Seller')) {
          setRoleState(savedRole as Role);
          await initializeApi(savedRole);
        }
      } catch (error) {
        console.error('Failed to load role:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadRole();
  }, []);

  const setRole = async (newRole: Role | null) => {
    try {
      if (newRole) {
        await storage.setItem('currentRole', newRole);
        await updateApiRole(newRole);
        setRoleState(newRole);
      } else {
        await storage.removeItem('currentRole');
        setRoleState(null);
      }
    } catch (error) {
      console.error('Failed to set role:', error);
    }
  };

  const logout = async () => {
    await setRole(null);
  };

  return (
    <AuthContext.Provider value={{ role, setRole, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
