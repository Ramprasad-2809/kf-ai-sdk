// Mock order data generator
export function generateOrders(count = 50) {
  const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  const customers = [
    'John Smith', 'Jane Doe', 'Bob Johnson', 'Alice Wilson', 'Charlie Brown',
    'Diana Prince', 'Eve Adams', 'Frank Castle', 'Grace Lee', 'Henry Ford'
  ];

  const orders = [];

  for (let i = 1; i <= count; i++) {
    const createdAt = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000); // Last 90 days
    const itemCount = Math.floor(Math.random() * 5) + 1; // 1-5 items
    const itemPrice = Math.random() * 100 + 20; // $20-$120 per item
    const total = itemCount * itemPrice;

    orders.push({
      _id: `order_${i.toString().padStart(3, '0')}`,
      customerName: customers[Math.floor(Math.random() * customers.length)],
      customerEmail: `customer${i}@example.com`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      total: {
        value: Math.round(total * 100) / 100,
        currency: 'USD'
      },
      itemCount,
      _created_at: createdAt,
      _modified_at: new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000),
      _created_by: {
        _id: 'user_001',
        username: 'system'
      },
      _modified_by: {
        _id: 'user_001',
        username: 'system'
      },
      _version: '1.0',
      _m_version: '1.0',

      // Admin-only fields
      profit: {
        value: Math.round(total * 0.3 * 100) / 100, // 30% profit margin
        currency: 'USD'
      },
      internalNotes: `Order processed automatically. Customer tier: ${Math.random() > 0.5 ? 'Premium' : 'Standard'}`,
      shippingCost: {
        value: Math.round(Math.random() * 15 + 5) * 100 / 100, // $5-$20
        currency: 'USD'
      }
    });
  }

  return orders;
}

// Filter orders based on role
export function filterOrdersByRole(orders, role = 'admin') {
  if (role === 'user') {
    // Remove admin-only fields for user role
    return orders.map(order => {
      const { profit, internalNotes, shippingCost, ...userOrder } = order;
      return userOrder;
    });
  }
  
  return orders; // Admin gets all fields
}

// Generate orders on module load
export const mockOrders = generateOrders(75);