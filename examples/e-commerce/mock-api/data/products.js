// Mock product data generator for e-commerce
const categories = ["electronics", "clothing", "books", "home", "sports"];

const productNames = {
  electronics: [
    "Smartphone",
    "Laptop",
    "Headphones",
    "Tablet",
    "Smart Watch",
    "Camera",
    "Speaker",
  ],
  clothing: [
    "T-Shirt",
    "Jeans",
    "Sneakers",
    "Jacket",
    "Dress",
    "Sweater",
    "Pants",
  ],
  books: [
    "Programming Guide",
    "Novel",
    "Textbook",
    "Biography",
    "Manual",
    "Dictionary",
    "Cookbook",
  ],
  home: [
    "Coffee Maker",
    "Lamp",
    "Chair",
    "Table",
    "Pillow",
    "Vase",
    "Mirror",
  ],
  sports: [
    "Basketball",
    "Soccer Ball",
    "Tennis Racket",
    "Running Shoes",
    "Yoga Mat",
    "Dumbbells",
    "Bicycle",
  ],
};

const productImages = {
  electronics: "https://picsum.photos/seed/electronics/400/300",
  clothing: "https://picsum.photos/seed/clothing/400/300",
  books: "https://picsum.photos/seed/books/400/300",
  home: "https://picsum.photos/seed/home/400/300",
  sports: "https://picsum.photos/seed/sports/400/300",
};

const sellers = [
  { id: "seller_001", name: "Tech Store" },
  { id: "seller_002", name: "Fashion Hub" },
  { id: "seller_003", name: "Book World" },
  { id: "seller_004", name: "Home Essentials" },
  { id: "seller_005", name: "Sports Zone" },
];

export function generateProducts(count = 50) {
  const products = [];

  for (let i = 1; i <= count; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const nameOptions = productNames[category];
    const baseName = nameOptions[Math.floor(Math.random() * nameOptions.length)];
    const name = `${baseName} ${i}`;

    const basePrice = Math.random() * 500 + 10; // $10-$510
    const seller = sellers[Math.floor(Math.random() * sellers.length)];

    const createdAt = new Date(
      Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
    );

    products.push({
      _id: `product_${i.toString().padStart(3, "0")}`,
      name,
      price: {
        value: Math.round(basePrice * 100) / 100,
        currency: "USD",
      },
      description: `High-quality ${baseName.toLowerCase()} with excellent features and durability. Perfect for everyday use. This ${category} item is a customer favorite with great reviews.`,
      category,
      availableQuantity: Math.floor(Math.random() * 100) + 1,
      imageUrl: `${productImages[category]}${i}`,
      sellerId: seller.id,
      sellerName: seller.name,
      _created_at: createdAt.toISOString(),
      _modified_at: new Date(
        createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
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
    });
  }

  return products;
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
      const {
        sellerId,
        _created_by,
        _modified_by,
        ...buyerProduct
      } = product;
      return {
        ...buyerProduct,
        sellerName: product.sellerName,
      };
    });
  }

  return products; // Admin gets all fields
}

// Generate products on module load
export const mockProducts = generateProducts(50);
