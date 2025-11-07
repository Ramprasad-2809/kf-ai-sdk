// Mock product data generator
export function generateProducts(count = 100) {
  const categories = ['electronics', 'clothing', 'books', 'home', 'sports'];
  const suppliers = ['Tech Corp', 'Fashion Inc', 'Book Publishers', 'Home Goods LLC', 'Sports Gear Co'];
  const productNames = {
    electronics: ['Smartphone', 'Laptop', 'Headphones', 'Tablet', 'Smart Watch', 'Camera', 'Speaker'],
    clothing: ['T-Shirt', 'Jeans', 'Sneakers', 'Jacket', 'Dress', 'Sweater', 'Pants'],
    books: ['Programming Guide', 'Novel', 'Textbook', 'Biography', 'Manual', 'Dictionary', 'Cookbook'],
    home: ['Coffee Maker', 'Lamp', 'Chair', 'Table', 'Pillow', 'Vase', 'Mirror'],
    sports: ['Basketball', 'Soccer Ball', 'Tennis Racket', 'Running Shoes', 'Yoga Mat', 'Dumbbells', 'Bicycle'],
  };

  const products = [];

  for (let i = 1; i <= count; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const nameOptions = productNames[category];
    const baseName = nameOptions[Math.floor(Math.random() * nameOptions.length)];
    const name = `${baseName} ${i}`;
    
    const basePrice = Math.random() * 500 + 10; // $10-$510
    const cost = basePrice * (0.4 + Math.random() * 0.3); // 40-70% of price
    const margin = ((basePrice - cost) / cost * 100);
    
    const createdAt = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000); // Last year
    const lastRestocked = new Date(createdAt.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000); // Within 30 days of creation

    products.push({
      _id: `product_${i.toString().padStart(3, '0')}`,
      name,
      price: {
        value: Math.round(basePrice * 100) / 100,
        currency: 'USD'
      },
      description: `High-quality ${baseName.toLowerCase()} with excellent features and durability. Perfect for everyday use.`,
      category,
      inStock: Math.random() > 0.2, // 80% in stock
      _created_at: createdAt,
      _modified_at: new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000), // Modified within a week
      _created_by: {
        _id: 'user_001',
        username: 'admin'
      },
      _modified_by: {
        _id: 'user_001', 
        username: 'admin'
      },
      _version: '1.0',
      _m_version: '1.0',
      
      // Admin-only fields
      cost: {
        value: Math.round(cost * 100) / 100,
        currency: 'USD'
      },
      supplier: suppliers[Math.floor(Math.random() * suppliers.length)],
      margin: Math.round(margin * 100) / 100,
      lastRestocked,
    });
  }

  return products;
}

// Filter products based on role
export function filterProductsByRole(products, role = 'admin') {
  if (role === 'user') {
    // Remove admin-only fields for user role
    return products.map(product => {
      const { cost, supplier, margin, lastRestocked, ...userProduct } = product;
      return userProduct;
    });
  }
  
  return products; // Admin gets all fields
}

// Generate products on module load
export const mockProducts = generateProducts(150);