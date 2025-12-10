import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Search, Menu, User, LogOut, Package } from "lucide-react";
// import { Badge } from "./ui/badge"; // Removed 
// import { Badge } from "./ui/badge"; // Removed
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { Cart } from "../../../../app/sources/ecommerce/cart";
import { Roles } from "../../../../app/types/roles";

interface NavigationProps {
  currentRole: "buyer" | "seller";
  onLogout: () => void;
}

export function Navigation({ currentRole, onLogout }: NavigationProps) {
  const location = useLocation();

  // Fetch cart count using React Query (only for buyers)
  const { data: cartCount = 0 } = useQuery({
    queryKey: ["cart-count"],
    queryFn: async () => {
      if (currentRole === "buyer") {
        const cart = new Cart(Roles.Buyer);
        return await cart.count();
      }
      return 0;
    },
    enabled: currentRole === "buyer",
    refetchInterval: 30000,
  });

  if (location.pathname === "/") return null;

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-50">
      {/* Top Bar - Main Navigation */}
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        
        {/* Logo & Mobile Menu */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="lg:hidden text-white hover:bg-slate-800">
            <Menu className="h-6 w-6" />
          </Button>
          <Link to="/products" className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl leading-none tracking-tight">PrimeStore</span>
              <span className="text-[10px] text-slate-400 font-medium">KF AI SDK DEMO</span>
            </div>
          </Link>
        </div>

        {/* Search Bar (Hidden on mobile for now) */}
        <div className="hidden md:flex flex-1 max-w-2xl mx-4">
          <div className="relative w-full group">
            <input
              type="text"
              placeholder="Search for products..."
              className="w-full h-10 pl-4 pr-10 rounded-l-md text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="absolute right-0 top-0 h-10 w-12 bg-blue-600 hover:bg-blue-700 rounded-r-md flex items-center justify-center transition-colors">
              <Search className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-6">
          
          {/* User Account Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex flex-col items-start leading-tight hover:outline-none group">
                <span className="text-xs text-slate-400 group-hover:text-blue-400 transition-colors">Hello, {currentRole === 'buyer' ? 'Buyer' : 'Seller'}</span>
                <span className="font-bold text-sm flex items-center gap-1 group-hover:underline">
                  Account & Lists
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>My Account ({currentRole})</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Package className="mr-2 h-4 w-4" />
                <span>Orders</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Cart */}
          {currentRole === "buyer" && (
            <Link to="/cart" className="flex items-center gap-2 hover:text-blue-400 transition-colors relative">
              <div className="relative">
                <ShoppingCart className="h-8 w-8" />
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-slate-900">
                  {cartCount}
                </span>
              </div>
              <span className="font-bold text-sm hidden sm:block mt-3">Cart</span>
            </Link>
          )}
        </div>
      </div>
      
      {/* Secondary Bar (Categories - Visual Only) */}
      <div className="bg-slate-800 h-10 hidden md:flex items-center px-4 text-sm text-slate-200 gap-6 overflow-x-auto">
        <button className="flex items-center gap-1 font-bold hover:text-white transition-colors">
          <Menu className="h-4 w-4" />
          All
        </button>
        <button className="hover:text-white transition-colors">Today's Deals</button>
        <button className="hover:text-white transition-colors">Customer Service</button>
        <button className="hover:text-white transition-colors">Registry</button>
        <button className="hover:text-white transition-colors">Gift Cards</button>
        <button className="hover:text-white transition-colors">Sell</button>
      </div>
    </header>
  );
}
