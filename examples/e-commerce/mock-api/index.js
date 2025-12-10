import { mockProducts, filterProductsByRole } from "./data/products.js";
import {
  getCartItems,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartCount,
} from "./data/cart.js";

export function setupMockAPI(middlewares) {
  console.log("[Mock API] Setting up e-commerce mock API handlers...");

  middlewares.use((req, res, next) => {
    const url = req.url || "";
    const method = req.method || "GET";

    // Only handle /api/bo routes
    if (!url.startsWith("/api/bo")) {
      next();
      return;
    }

    console.log(`[Mock API] ${method} ${url}`);

    // Add delay to simulate network
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // Parse body for POST/PUT
    const parseBody = () => {
      return new Promise((resolve) => {
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            resolve(body ? JSON.parse(body) : {});
          } catch {
            resolve({});
          }
        });
      });
    };

    const sendJSON = async (data, status = 200) => {
      await delay(Math.random() * 200 + 50); // 50-250ms delay
      res.statusCode = status;
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,PUT,POST,DELETE,PATCH,OPTIONS"
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, x-user-role, x-user-id"
      );
      res.end(JSON.stringify(data));
    };

    const sendError = async (message, status = 500) => {
      await delay(100);
      res.statusCode = status;
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.end(
        JSON.stringify({
          error: message,
          timestamp: new Date().toISOString(),
        })
      );
    };

    // Handle CORS preflight
    if (method === "OPTIONS") {
      res.statusCode = 200;
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,PUT,POST,DELETE,PATCH,OPTIONS"
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, x-user-role, x-user-id"
      );
      res.end();
      return;
    }

    // Get role and user ID from headers
    const role = req.headers["x-user-role"] || "buyer";
    const userId = req.headers["x-user-id"] || "buyer_001";

    // ==================== PRODUCT ENDPOINTS ====================

    // Product count
    if (url.includes("/product/count") && method === "POST") {
      parseBody().then(async (body) => {
        let products = filterProductsByRole(mockProducts, role, userId);
        products = applyFiltersAndSearch(products, body);

        await sendJSON({
          Count: products.length,
          Success: true,
          Timestamp: new Date().toISOString(),
        });
      });
      return;
    }

    // Product list
    if (url.includes("/product/list") && method === "POST") {
      parseBody().then(async (body) => {
        let products = filterProductsByRole(mockProducts, role, userId);
        products = applyFiltersAndSearch(products, body);

        // Apply sorting
        if (body.Sort && body.Sort[0]) {
          const { Field, Order } = body.Sort[0];
          const direction = Order === "ASC" ? 1 : -1;

          products = [...products].sort((a, b) => {
            let aVal = a[Field];
            let bVal = b[Field];

            // Handle price object
            if (Field === "price") {
              aVal = aVal?.value || 0;
              bVal = bVal?.value || 0;
            }

            if (aVal < bVal) return -1 * direction;
            if (aVal > bVal) return 1 * direction;
            return 0;
          });
        }

        // Apply pagination
        const page = body.Page || 1;
        const pageSize = body.PageSize || 10;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        const paginatedProducts = products.slice(startIndex, endIndex);

        await sendJSON({
          Data: paginatedProducts,
          Success: true,
          Timestamp: new Date().toISOString(),
        });
      });
      return;
    }

    // Product read
    if (url.match(/\/api\/bo\/product\/[^/]+\/read$/i) && method === "GET") {
      const pathParts = url.split("/");
      const productId = pathParts[pathParts.length - 2];

      const products = filterProductsByRole(mockProducts, role, userId);
      const product = products.find((p) => p._id === productId);

      if (product) {
        sendJSON({
          Data: product,
          Success: true,
          Timestamp: new Date().toISOString(),
        });
      } else {
        sendError(`Product with ID ${productId} not found`, 404);
      }
      return;
    }

    // Product create
    if (url.match(/\/api\/bo\/product\/create$/i) && method === "POST") {
      if (role !== "seller") {
        sendError("Only sellers can create products", 403);
        return;
      }

      parseBody().then(async (body) => {
        const newId = `product_${Date.now()}`;
        const newProduct = {
          _id: newId,
          ...body,
          sellerId: userId,
          sellerName: "My Store",
          _created_at: new Date().toISOString(),
          _modified_at: new Date().toISOString(),
          _created_by: { _id: userId, username: "seller" },
          _modified_by: { _id: userId, username: "seller" },
          _version: "1.0",
          _m_version: "1.0",
        };

        mockProducts.push(newProduct);

        await sendJSON({
          Success: true,
          Data: { _id: newId },
          Message: "Product created successfully",
          Timestamp: new Date().toISOString(),
        });
      });
      return;
    }

    // Product update
    if (url.match(/\/api\/bo\/product\/[^/]+\/update$/i) && method === "POST") {
      if (role !== "seller") {
        sendError("Only sellers can update products", 403);
        return;
      }

      const pathParts = url.split("/");
      const productId = pathParts[pathParts.length - 2];

      const product = mockProducts.find((p) => p._id === productId);

      if (!product) {
        sendError(`Product with ID ${productId} not found`, 404);
        return;
      }

      if (product.sellerId !== userId) {
        sendError("You can only update your own products", 403);
        return;
      }

      parseBody().then(async (body) => {
        Object.assign(product, body, {
          _modified_at: new Date().toISOString(),
          _modified_by: { _id: userId, username: "seller" },
        });

        await sendJSON({
          Success: true,
          Data: { _id: productId },
          Message: "Product updated successfully",
          Timestamp: new Date().toISOString(),
        });
      });
      return;
    }

    // Product delete
    if (url.match(/\/api\/bo\/product\/[^/]+\/delete$/i) && (method === "POST" || method === "DELETE")) {
      if (role !== "seller") {
        sendError("Only sellers can delete products", 403);
        return;
      }

      const pathParts = url.split("/");
      const productId = pathParts[pathParts.length - 2];

      const productIndex = mockProducts.findIndex((p) => p._id === productId);

      if (productIndex === -1) {
        sendError(`Product with ID ${productId} not found`, 404);
        return;
      }

      if (mockProducts[productIndex].sellerId !== userId) {
        sendError("You can only delete your own products", 403);
        return;
      }

      mockProducts.splice(productIndex, 1);

      sendJSON({
        Success: true,
        Message: "Product deleted successfully",
        Timestamp: new Date().toISOString(),
      });
      return;
    }

    // Product field schema
    if (url.includes("/api/bo/product/field") && method === "GET") {
      const schema = {
        name: {
          Type: "String",
          Required: true,
          Validation: [
            {
              Id: "VAL_PRODUCT_NAME_001",
              Type: "Expression",
              Condition: {
                Expression: "LENGTH(TRIM(name)) >= 2",
                ExpressionTree: {
                  Type: "BinaryExpression",
                  Operator: ">=",
                  Arguments: [
                    {
                      Type: "CallExpression",
                      Callee: "LENGTH",
                      Arguments: [
                        {
                          Type: "CallExpression",
                          Callee: "TRIM",
                          Arguments: [
                            { Type: "Identifier", Name: "name", Source: "BO_Product" },
                          ],
                        },
                      ],
                    },
                    { Type: "Literal", Value: 2 },
                  ],
                },
              },
              Message: "Product name must be at least 2 characters",
            },
          ],
        },
        description: {
          Type: "String",
          Required: true,
        },
        price: {
          Type: "Number",
          Required: true,
          Validation: [
            {
              Id: "VAL_PRODUCT_PRICE_001",
              Type: "Expression",
              Condition: {
                Expression: "price > 0",
                ExpressionTree: {
                  Type: "BinaryExpression",
                  Operator: ">",
                  Arguments: [
                    { Type: "Identifier", Name: "price", Source: "BO_Product" },
                    { Type: "Literal", Value: 0 },
                  ],
                },
              },
              Message: "Price must be greater than $0",
            },
          ],
        },
        category: {
          Type: "String",
          Required: true,
          Values: {
            Mode: "Static",
            Items: [
              { Value: "electronics", Label: "Electronics" },
              { Value: "clothing", Label: "Clothing" },
              { Value: "books", Label: "Books" },
              { Value: "home", Label: "Home & Garden" },
              { Value: "sports", Label: "Sports" },
            ],
          },
        },
        availableQuantity: {
          Type: "Number",
          Required: true,
          Validation: [
            {
              Id: "VAL_PRODUCT_QTY_001",
              Type: "Expression",
              Condition: {
                Expression: "availableQuantity >= 0",
                ExpressionTree: {
                  Type: "BinaryExpression",
                  Operator: ">=",
                  Arguments: [
                    { Type: "Identifier", Name: "availableQuantity", Source: "BO_Product" },
                    { Type: "Literal", Value: 0 },
                  ],
                },
              },
              Message: "Quantity must be 0 or greater",
            },
          ],
        },
      };

      sendJSON(schema);
      return;
    }

    // ==================== CART ENDPOINTS ====================

    // Cart count
    if (url.includes("/cart/count") && method === "POST") {
      if (role !== "buyer") {
        sendError("Only buyers can access cart", 403);
        return;
      }

      const count = getCartCount(userId);
      sendJSON({
        Count: count,
        Success: true,
        Timestamp: new Date().toISOString(),
      });
      return;
    }

    // Cart list
    if (url.includes("/cart/list") && method === "POST") {
      if (role !== "buyer") {
        sendError("Only buyers can access cart", 403);
        return;
      }

      const items = getCartItems(userId);
      sendJSON({
        Data: items,
        Success: true,
        Timestamp: new Date().toISOString(),
      });
      return;
    }

    // Cart add (create)
    if (url.match(/\/api\/bo\/cart\/create$/i) && method === "POST") {
      if (role !== "buyer") {
        sendError("Only buyers can add to cart", 403);
        return;
      }

      parseBody().then(async (body) => {
        const item = addToCart(userId, body);

        await sendJSON({
          Success: true,
          Data: item,
          Message: "Item added to cart",
          Timestamp: new Date().toISOString(),
        });
      });
      return;
    }

    // Cart update
    if (url.match(/\/api\/bo\/cart\/[^/]+\/update$/i) && method === "POST") {
      if (role !== "buyer") {
        sendError("Only buyers can update cart", 403);
        return;
      }

      const pathParts = url.split("/");
      const itemId = pathParts[pathParts.length - 2];

      parseBody().then(async (body) => {
        const item = updateCartItem(userId, itemId, body.quantity);

        if (!item) {
          await sendError("Cart item not found", 404);
          return;
        }

        await sendJSON({
          Success: true,
          Data: item,
          Message: "Cart updated",
          Timestamp: new Date().toISOString(),
        });
      });
      return;
    }

    // Cart delete item
    if (url.match(/\/api\/bo\/cart\/[^/]+\/delete$/i) && (method === "POST" || method === "DELETE")) {
      if (role !== "buyer") {
        sendError("Only buyers can remove from cart", 403);
        return;
      }

      const pathParts = url.split("/");
      const itemId = pathParts[pathParts.length - 2];

      const removed = removeFromCart(userId, itemId);

      if (!removed) {
        sendError("Cart item not found", 404);
        return;
      }

      sendJSON({
        Success: true,
        Message: "Item removed from cart",
        Timestamp: new Date().toISOString(),
      });
      return;
    }

    // Cart clear
    if (url.match(/\/api\/bo\/cart\/clear$/i) && method === "POST") {
      if (role !== "buyer") {
        sendError("Only buyers can clear cart", 403);
        return;
      }

      clearCart(userId);

      sendJSON({
        Success: true,
        Message: "Cart cleared",
        Timestamp: new Date().toISOString(),
      });
      return;
    }

    // If we got here, it's an unhandled route
    next();
  });
}

// Helper function to apply filters and search
function applyFiltersAndSearch(products, body) {
  let result = [...products];

  // Apply search
  if (body.Search) {
    const searchValue = body.Search.toLowerCase();
    result = result.filter((product) => {
      const searchableFields = ["name", "category", "description", "sellerName"];
      return searchableFields.some((field) => {
        const value = product[field];
        return value && String(value).toLowerCase().includes(searchValue);
      });
    });
  }

  // Apply filtering
  if (body.Filter && body.Filter.Condition) {
    result = result.filter((product) => {
      return evaluateFilterConditions(product, body.Filter);
    });
  }

  return result;
}

// Helper to evaluate filter conditions
function evaluateFilterConditions(product, filter) {
  const { Operator, Condition } = filter;

  if (!Condition || Condition.length === 0) {
    return true;
  }

  const results = Condition.map((cond) => {
    if (cond.Condition) {
      // Nested filter
      return evaluateFilterConditions(product, cond);
    }

    const value = product[cond.LHSField];
    const rhsValue = cond.RHSValue;

    switch (cond.Operator) {
      case "EQ":
        return value === rhsValue;
      case "NE":
        return value !== rhsValue;
      case "GT":
        return value > rhsValue;
      case "GTE":
        return value >= rhsValue;
      case "LT":
        return value < rhsValue;
      case "LTE":
        return value <= rhsValue;
      case "Contains":
        return String(value).toLowerCase().includes(String(rhsValue).toLowerCase());
      case "IN":
        return Array.isArray(rhsValue) && rhsValue.includes(value);
      default:
        return true;
    }
  });

  if (Operator === "AND") {
    return results.every(Boolean);
  } else if (Operator === "OR") {
    return results.some(Boolean);
  }

  return true;
}
