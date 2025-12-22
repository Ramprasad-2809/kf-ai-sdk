// BDO-compliant Amazon Product Master mock data
// Following the exact schema structure from BDO_AmazonProductMaster

const amazonProducts = [
  // Electronics
  {
    ProductId: "PROD-2024-0001",
    ASIN: "B08N5WRWNW",
    SKU: "ECHO-DOT-4TH",
    Title: "Echo Dot (4th Gen) | Smart speaker with Alexa | Charcoal",
    Description:
      "Meet Echo Dot - Our most popular smart speaker with a fabric design. It is our most compact smart speaker that fits perfectly into small space.",
    imageUrl:
      "https://images.unsplash.com/photo-1543512214-318c7553f230?w=400&h=400&fit=crop",
    Price: 49.99,
    MRP: 59.99,
    Cost: 25.0,
    Category: "Electronics",
    Brand: "Amazon",
    Tags: ["smart speaker", "alexa", "echo", "voice control"],
    Stock: 150,
    Warehouse: "Warehouse_A",
    ReorderLevel: 20,
    IsActive: true,
  },
  {
    ProductId: "PROD-2024-0002",
    ASIN: "B07XJ8C8F7",
    SKU: "FIRE-TV-STICK",
    Title: "Fire TV Stick with Alexa Voice Remote (includes TV controls)",
    Description:
      "The most powerful streaming media stick with a new Wi-Fi antenna design optimized for 4K Ultra HD streaming.",
    imageUrl:
      "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop",
    Price: 39.99,
    MRP: 49.99,
    Cost: 20.0,
    Category: "Electronics",
    Brand: "Amazon",
    Tags: ["streaming", "fire tv", "alexa", "4k"],
    Stock: 200,
    Warehouse: "Warehouse_B",
    ReorderLevel: 30,
    IsActive: true,
  },

  // Books
  {
    ProductId: "PROD-2024-0003",
    ASIN: "B09X5HJKL3",
    SKU: "COOKBOOK-WORLD",
    Title: "The Complete Guide to World Cuisines: 300 Authentic Recipes",
    Description:
      "Explore culinary traditions from around the globe with this comprehensive cookbook featuring 300 time-tested recipes from professional chefs.",
    imageUrl:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=400&fit=crop",
    Price: 24.99,
    MRP: 34.99,
    Cost: 12.5,
    Category: "Books",
    Brand: "Culinary Press",
    Tags: ["cookbook", "recipes", "international", "cooking"],
    Stock: 75,
    Warehouse: "Warehouse_A",
    ReorderLevel: 15,
    IsActive: true,
  },
  {
    ProductId: "PROD-2024-0004",
    ASIN: "B08M3N2P5Q",
    SKU: "TECH-CODE-ART",
    Title: "The Art of Clean Code: A Developer's Guide to Excellence",
    Description:
      "Master the principles of writing maintainable, elegant code that stands the test of time. Essential reading for developers at all levels.",
    imageUrl:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&h=400&fit=crop",
    Price: 39.99,
    MRP: 49.99,
    Cost: 18.0,
    Category: "Books",
    Brand: "Tech Publishers",
    Tags: ["programming", "software", "development", "coding"],
    Stock: 50,
    Warehouse: "Warehouse_C",
    ReorderLevel: 10,
    IsActive: true,
  },

  // Clothing
  {
    ProductId: "PROD-2024-0005",
    ASIN: "B07Y4K9L8M",
    SKU: "DENIM-CLASSIC",
    Title: "Classic Vintage Denim Jacket - Unisex Casual Outerwear",
    Description:
      "Timeless denim jacket crafted from premium cotton blend. Features classic styling with modern comfort for everyday wear.",
    imageUrl:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop",
    Price: 79.99,
    MRP: 99.99,
    Cost: 40.0,
    Category: "Clothing",
    Brand: "Vintage Co",
    Tags: ["denim", "jacket", "casual", "unisex"],
    Stock: 30,
    Warehouse: "Warehouse_B",
    ReorderLevel: 8,
    IsActive: true,
  },
  {
    ProductId: "PROD-2024-0006",
    ASIN: "B09A1B2C3D",
    SKU: "SNEAKER-SPORT",
    Title: "Performance Running Sneakers - Lightweight Athletic Shoes",
    Description:
      "Engineered for comfort and performance. Breathable mesh upper with responsive cushioning for serious runners.",
    imageUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
    Price: 129.99,
    MRP: 149.99,
    Cost: 65.0,
    Category: "Clothing",
    Brand: "SportMax",
    Tags: ["sneakers", "running", "athletic", "performance"],
    Stock: 45,
    Warehouse: "Warehouse_A",
    ReorderLevel: 12,
    IsActive: true,
  },

  // Home & Kitchen
  {
    ProductId: "PROD-2024-0007",
    ASIN: "B08F5G6H7I",
    SKU: "LAMP-DESK-LED",
    Title: "Modern LED Desk Lamp with Wireless Charging Base",
    Description:
      "Sleek minimalist design with adjustable brightness levels and built-in wireless charging pad for smartphones.",
    imageUrl:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=400&fit=crop",
    Price: 89.99,
    MRP: 109.99,
    Cost: 45.0,
    Category: "Home",
    Brand: "Modern Living",
    Tags: ["desk lamp", "led", "wireless charging", "modern"],
    Stock: 25,
    Warehouse: "Warehouse_C",
    ReorderLevel: 5,
    IsActive: true,
  },
  {
    ProductId: "PROD-2024-0008",
    ASIN: "B07P8Q9R0S",
    SKU: "VASE-CERAMIC",
    Title: "Handcrafted Ceramic Vase - Contemporary Design",
    Description:
      "Beautiful artisan-made ceramic vase with contemporary styling. Perfect for fresh flowers or as a standalone decorative piece.",
    imageUrl:
      "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=400&h=400&fit=crop",
    Price: 34.99,
    MRP: 44.99,
    Cost: 15.0,
    Category: "Home",
    Brand: "Artisan Craft",
    Tags: ["vase", "ceramic", "handcrafted", "decor"],
    Stock: 20,
    Warehouse: "Warehouse_A",
    ReorderLevel: 5,
    IsActive: true,
  },

  // Sports & Outdoors
  {
    ProductId: "PROD-2024-0009",
    ASIN: "B09T1U2V3W",
    SKU: "BASKETBALL-PRO",
    Title: "Professional Court Basketball - Official Size and Weight",
    Description:
      "High-quality leather basketball with superior grip and bounce. Meets all official standards for competitive play.",
    imageUrl:
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=400&fit=crop",
    Price: 34.99,
    MRP: 39.99,
    Cost: 18.0,
    Category: "Sports",
    Brand: "Pro Sports",
    Tags: ["basketball", "professional", "official", "leather"],
    Stock: 60,
    Warehouse: "Warehouse_B",
    ReorderLevel: 15,
    IsActive: true,
  },
  {
    ProductId: "PROD-2024-0010",
    ASIN: "B08X4Y5Z6A",
    SKU: "YOGA-MAT-PREMIUM",
    Title: "Premium Non-Slip Yoga Mat with Alignment Lines",
    Description:
      "Extra-thick 6mm yoga mat with superior grip and cushioning. Features alignment lines to perfect your poses.",
    imageUrl:
      "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&h=400&fit=crop",
    Price: 49.99,
    MRP: 59.99,
    Cost: 22.0,
    Category: "Sports",
    Brand: "Zen Fitness",
    Tags: ["yoga mat", "non-slip", "premium", "alignment"],
    Stock: 40,
    Warehouse: "Warehouse_C",
    ReorderLevel: 10,
    IsActive: true,
  },

  // Toys & Games
  {
    ProductId: "PROD-2024-0011",
    ASIN: "B07L3M4N5O",
    SKU: "PUZZLE-WORLD",
    Title: "World Landmarks 1000-Piece Jigsaw Puzzle",
    Description:
      "Challenging 1000-piece puzzle featuring famous landmarks from around the world. High-quality printing with vibrant colors.",
    imageUrl:
      "https://images.unsplash.com/photo-1594301872815-12b5e0b9a3b0?w=400&h=400&fit=crop",
    Price: 19.99,
    MRP: 24.99,
    Cost: 8.0,
    Category: "Toys",
    Brand: "Puzzle Master",
    Tags: ["puzzle", "jigsaw", "landmarks", "1000-piece"],
    Stock: 35,
    Warehouse: "Warehouse_A",
    ReorderLevel: 8,
    IsActive: true,
  },
];

const sellers = [
  { id: "seller_001", name: "Prime Tech" },
  { id: "seller_002", name: "Fashion Forward" },
];

// Apply business rules to calculate computed fields
function calculateComputedFields(product) {
  const computed = { ...product };

  // Calculate discount: IF(MRP > 0, ((MRP - Price) / MRP) * 100, 0)
  if (computed.MRP > 0) {
    computed.Discount = ((computed.MRP - computed.Price) / computed.MRP) * 100;
  } else {
    computed.Discount = 0;
  }

  // Check low stock: Stock <= ReorderLevel
  computed.LowStock = computed.Stock <= computed.ReorderLevel;

  return computed;
}

export function generateProducts() {
  const timestamp = new Date().toISOString();

  return amazonProducts.map((product, index) => {
    const seller = sellers[index % sellers.length];
    const processedProduct = calculateComputedFields(product);

    return {
      // Core product data
      ...processedProduct,

      // Legacy compatibility fields
      name: processedProduct.Title,
      price: {
        value: processedProduct.Price,
        currency: "USD",
      },
      description: processedProduct.Description,
      category: processedProduct.Category.toLowerCase(),
      availableQuantity: processedProduct.Stock,

      // System fields
      _id: product.ProductId,
      sellerId: seller.id,
      sellerName: seller.name,
      _created_at: timestamp,
      _modified_at: timestamp,
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

// Role-based filtering following BDO RolePermission schema
export function filterProductsByRole(products, role, userId = null) {
  return products
    .map((product) => {
      const filtered = { ...product };

      switch (role) {
        case "Admin":
          // Admin can see all fields
          // Add ImageUrl in PascalCase for BDO schema compatibility
          if (filtered.imageUrl && !filtered.ImageUrl) {
            filtered.ImageUrl = filtered.imageUrl;
          }
          return filtered;

        case "Seller":
          // Seller can see most fields but not internal costs
          const { Cost, ...sellerView } = filtered;
          // Add ImageUrl in PascalCase for BDO schema compatibility
          if (sellerView.imageUrl && !sellerView.ImageUrl) {
            sellerView.ImageUrl = sellerView.imageUrl;
          }
          return sellerView;

        case "Buyer":
          // Buyer can only see public product information
          const {
            ProductId,
            ASIN,
            SKU,
            Title,
            Description,
            Price,
            MRP,
            Discount,
            Category,
            Brand,
            Tags,
            Stock,
            IsActive,
            _created_at,
            _modified_at,
            _version,
            _m_version,
            _id,
            // Legacy compatibility fields
            name,
            price: legacyPrice,
            description: legacyDesc,
            category: legacyCat,
            availableQuantity,
            imageUrl,
            sellerName,
          } = filtered;

          return {
            ProductId,
            ASIN,
            SKU,
            Title,
            Description,
            ImageUrl: imageUrl,
            Price,
            MRP,
            Discount,
            Category,
            Brand,
            Tags,
            Stock,
            IsActive,
            _id,
            _created_at,
            _modified_at,
            _version,
            _m_version,
            // Legacy fields for backward compatibility
            name,
            price: legacyPrice,
            description: legacyDesc,
            category: legacyCat,
            availableQuantity,
            imageUrl,
            sellerName,
          };

        case "InventoryManager":
          // InventoryManager focuses on inventory fields
          const {
            ProductId: invProdId,
            SKU: invSKU,
            Title: invTitle,
            Stock: invStock,
            Warehouse,
            ReorderLevel,
            LowStock,
            _created_at: invCreated,
            _modified_at: invModified,
            _id: invId,
          } = filtered;

          return {
            ProductId: invProdId,
            SKU: invSKU,
            Title: invTitle,
            Stock: invStock,
            Warehouse,
            ReorderLevel,
            LowStock,
            _id: invId,
            _created_at: invCreated,
            _modified_at: invModified,
          };

        case "WarehouseStaff":
          // WarehouseStaff only sees basic product and stock info
          const {
            ProductId: whsProdId,
            SKU: whsSKU,
            Title: whsTitle,
            Stock: whsStock,
            Warehouse: whsWarehouse,
            ReorderLevel: whsReorder,
            LowStock: whsLowStock,
            _id: whsId,
          } = filtered;

          return {
            ProductId: whsProdId,
            SKU: whsSKU,
            Title: whsTitle,
            Stock: whsStock,
            Warehouse: whsWarehouse,
            ReorderLevel: whsReorder,
            LowStock: whsLowStock,
            _id: whsId,
          };

        default:
          // Legacy role handling for backward compatibility
          if (role === "seller" && userId) {
            // Legacy seller role - filter by sellerId
            return product.sellerId === userId ? filtered : null;
          }

          if (role === "buyer") {
            // Legacy buyer role - return buyer view
            const {
              sellerId,
              _created_by,
              _modified_by,
              Cost,
              ...buyerProduct
            } = filtered;
            return {
              ...buyerProduct,
              sellerName: product.sellerName,
            };
          }

          // Unknown role - return minimal view
          const {
            ProductId: defProdId,
            Title: defTitle,
            Price: defPrice,
            _id: defId,
          } = filtered;
          return {
            ProductId: defProdId,
            Title: defTitle,
            Price: defPrice,
            _id: defId,
          };
      }
    })
    .filter(Boolean); // Remove null entries from legacy filtering
}

// Generate products on module load
export const mockProducts = generateProducts();
