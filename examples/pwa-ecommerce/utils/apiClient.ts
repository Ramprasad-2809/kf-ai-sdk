import { setApiBaseUrl, setDefaultHeaders } from 'kf-ai-sdk';
import { storage } from './storage';

/**
 * Initialize the API client with role-based headers
 * Adapted from e-commerce example to use cross-platform storage
 */
// Mock API server URL - runs on e-commerce app's Vite server
const MOCK_API_URL = 'http://localhost:3003/api';

export async function initializeApi(role?: string) {
  setApiBaseUrl(MOCK_API_URL);

  const currentRole = role || (await storage.getItem('currentRole')) || 'Buyer';
  const userId = getRoleUserId(currentRole);

  setDefaultHeaders({
    'Content-Type': 'application/json',
    'x-user-role': currentRole,
    'x-user-id': userId,
  });
}

/**
 * Update API headers when role changes
 */
export async function updateApiRole(role: string) {
  await storage.setItem('currentRole', role);
  const userId = getRoleUserId(role);

  setDefaultHeaders({
    'Content-Type': 'application/json',
    'x-user-role': role,
    'x-user-id': userId,
  });
}

/**
 * Get user ID based on role
 */
function getRoleUserId(role: string): string {
  switch (role) {
    case 'Buyer':
      return 'buyer_001';
    case 'Seller':
      return 'seller_001';
    case 'Admin':
      return 'admin_001';
    case 'InventoryManager':
      return 'inventory_001';
    case 'WarehouseStaff':
      return 'warehouse_001';
    default:
      return 'buyer_001';
  }
}
