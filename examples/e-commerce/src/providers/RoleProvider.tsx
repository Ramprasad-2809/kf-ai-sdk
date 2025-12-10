import { createContext, useContext, useState, ReactNode } from "react";

type EcommerceRole = "buyer" | "seller";

interface RoleContextType {
  currentRole: EcommerceRole;
  setRole: (role: EcommerceRole) => void;
  userId: string;
  isBuyer: boolean;
  isSeller: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

interface RoleProviderProps {
  children: ReactNode;
}

export function RoleProvider({ children }: RoleProviderProps) {
  const [currentRole, setCurrentRole] = useState<EcommerceRole>("buyer");

  const setRole = (role: EcommerceRole) => {
    setCurrentRole(role);
    localStorage.setItem("currentRole", role);

    // Dispatch event to update API headers
    const event = new CustomEvent("roleChanged", { detail: { role } });
    window.dispatchEvent(event);
  };

  // User ID based on role (for demo purposes)
  const userId = currentRole === "buyer" ? "buyer_001" : "seller_001";

  const value: RoleContextType = {
    currentRole,
    setRole,
    userId,
    isBuyer: currentRole === "buyer",
    isSeller: currentRole === "seller",
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
