// Mock cart data for e-commerce

// In-memory cart storage (keyed by buyer ID)
const cartsByBuyer = new Map();

// Initialize with some sample cart items
// Initialize with some sample cart items
function initializeSampleCart() {
  cartsByBuyer.set("buyer_001", []);
}

initializeSampleCart();

// Get cart items for a buyer
export function getCartItems(buyerId) {
  return cartsByBuyer.get(buyerId) || [];
}

// Add item to cart
export function addToCart(buyerId, item) {
  if (!cartsByBuyer.has(buyerId)) {
    cartsByBuyer.set(buyerId, []);
  }

  const cart = cartsByBuyer.get(buyerId);

  // Check if product already in cart
  const existingIndex = cart.findIndex((i) => i.productId === item.productId);

  if (existingIndex >= 0) {
    // Update quantity
    const existing = cart[existingIndex];
    existing.quantity += item.quantity;
    existing.subtotal = {
      value: existing.quantity * existing.productPrice.value,
      currency: existing.productPrice.currency,
    };
    existing._modified_at = new Date().toISOString();
    return existing;
  }

  // Add new item
  const newItem = {
    _id: `cart_${Date.now()}`,
    ...item,
    subtotal: {
      value: item.quantity * item.productPrice.value,
      currency: item.productPrice.currency,
    },
    buyerId,
    _created_at: new Date().toISOString(),
    _modified_at: new Date().toISOString(),
    _created_by: { _id: buyerId, username: "buyer" },
    _modified_by: { _id: buyerId, username: "buyer" },
    _version: "1.0",
    _m_version: "1.0",
  };

  cart.push(newItem);
  return newItem;
}

// Update cart item quantity
export function updateCartItem(buyerId, itemId, quantity) {
  const cart = cartsByBuyer.get(buyerId) || [];
  const item = cart.find((i) => i._id === itemId);

  if (!item) {
    return null;
  }

  if (quantity <= 0) {
    // Remove item if quantity is 0 or less
    return removeFromCart(buyerId, itemId);
  }

  item.quantity = quantity;
  item.subtotal = {
    value: quantity * item.productPrice.value,
    currency: item.productPrice.currency,
  };
  item._modified_at = new Date().toISOString();

  return item;
}

// Remove item from cart
export function removeFromCart(buyerId, itemId) {
  const cart = cartsByBuyer.get(buyerId) || [];
  const index = cart.findIndex((i) => i._id === itemId);

  if (index >= 0) {
    const removed = cart.splice(index, 1)[0];
    return removed;
  }

  return null;
}

// Clear entire cart
export function clearCart(buyerId) {
  cartsByBuyer.set(buyerId, []);
  return true;
}

// Get cart count
export function getCartCount(buyerId) {
  const cart = cartsByBuyer.get(buyerId) || [];
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

// Get cart total
export function getCartTotal(buyerId) {
  const cart = cartsByBuyer.get(buyerId) || [];
  const total = cart.reduce((sum, item) => sum + item.subtotal.value, 0);
  return { value: Math.round(total * 100) / 100, currency: "USD" };
}
