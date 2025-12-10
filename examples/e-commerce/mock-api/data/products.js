// Mock product data generator for e-commerce
// 2 Items per category with realistic Unsplash images

const curatedProducts = [
  // Electronics
  {
    name: "Pro Wireless Noise-Canceling Headphones",
    category: "electronics",
    price: 299.99,
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
    description:
      "Experience premium sound quality with active noise cancellation and 30-hour battery life.",
  },
  {
    name: "Smart Watch Series 5",
    category: "electronics",
    price: 399.0,
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80",
    description:
      "Track your fitness, heart rate, and notifications on your wrist with the latest Series 5.",
  },

  // Clothing
  {
    name: "Classic Denim Jacket",
    category: "clothing",
    price: 79.5,
    image:
      "https://images.unsplash.com/photo-1543076447-215ad9ba6923?w=500&q=80",
    description:
      "Timeless style meets comfort. This durable denim jacket is perfect for any casual outfit.",
  },
  {
    name: "Performance Running Sneakers",
    category: "clothing",
    price: 120.0,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80",
    description:
      "Lightweight, breathable, and responsive. Designed for the serious runner.",
  },

  // Books
  {
    name: "The Art of Code",
    category: "books",
    price: 49.99,
    image:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&q=80",
    description:
      "Unlock the secrets of software creation. A masterpiece for developers and designers.",
  },
  {
    name: "Culinary Journey Cookbook",
    category: "books",
    price: 35.0,
    image:
      "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500&q=80",
    description:
      "Explore world flavors with over 100 authentic recipes from around the globe.",
  },

  // Home
  {
    name: "Minimalist Desk Lamp",
    category: "home",
    price: 45.0,
    image:
      "https://plus.unsplash.com/premium_photo-1685287731216-a7a0fae7a41a?w=500&q=80",
    description:
      "Brighten your workspace with this sleek, adjustable LED desk lamp.",
  },
  {
    name: "Ceramic Artisan Vase",
    category: "home",
    price: 28.0,
    image:
      "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=500&q=80",
    description:
      "Handcrafted ceramic vase, perfect for displaying fresh flowers or as a standalone piece.",
  },

  // Sports
  {
    name: "Pro Court Basketball",
    category: "sports",
    price: 29.99,
    image:
      "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=500&q=80",
    description:
      "Official size and weight. Superior grip for indoor and outdoor play.",
  },
  {
    name: "Premium Yoga Mat",
    category: "sports",
    price: 24.99,
    image:
      "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500&q=80",
    description:
      "Non-slip surface with extra cushioning for joint support during yoga practices.",
  },
];

const sellers = [
  { id: "seller_001", name: "Prime Tech" },
  { id: "seller_002", name: "Fashion Forward" },
];

export function generateProducts() {
  // count ignored in this fixed version
  return curatedProducts.map((item, index) => {
    const seller = sellers[index % sellers.length];
    const i = index + 1;
    const createdAt = new Date().toISOString();

    return {
      _id: `product_${i.toString().padStart(3, "0")}`,
      name: item.name,
      price: {
        value: item.price,
        currency: "USD",
      },
      description: item.description,
      category: item.category,
      availableQuantity: 50, // Fixed stock
      imageUrl: item.image,
      sellerId: seller.id,
      sellerName: seller.name,
      _created_at: createdAt,
      _modified_at: createdAt,
      _created_by: {
        _id: seller.id,
        username: seller.name,
      },
      _modified_by: {
        _id: seller.id,
        username: seller.name,
      },
      _version: "1.0",
      _m_version: "1.0",
    };
  });
}

// Filter products based on role
export function filterProductsByRole(products, role, userId = null) {
  if (role === "seller" && userId) {
    // Seller only sees their own products
    return products.filter((product) => product.sellerId === userId);
  }

  if (role === "buyer") {
    // Buyer sees all products but with limited fields
    return products.map((product) => {
      const { sellerId, _created_by, _modified_by, ...buyerProduct } = product;
      return {
        ...buyerProduct,
        sellerName: product.sellerName,
      };
    });
  }

  return products; // Admin gets all fields
}

// Generate products on module load
export const mockProducts = generateProducts();
