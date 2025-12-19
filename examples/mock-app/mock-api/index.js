import { mockProducts, filterProductsByRole } from "./data/products.js";
import { mockOrders, filterOrdersByRole } from "./data/orders.js";
import { 
  mockColumns, 
  mockCards, 
  filterColumnsByRole, 
  filterCardsByRole,
  getNextPosition,
  getNextColumnPosition,
  generateCardId,
  generateColumnId
} from "./data/kanban.js";

// Helper to evaluate SDK Filter Payload recursively
function evaluateFilter(item, filter) {
  if (!filter) return true;

  // Handle logical operators (AND/OR)
  if (filter.Operator === "AND" || filter.Operator === "OR") {
    if (!filter.Condition || !Array.isArray(filter.Condition) || filter.Condition.length === 0) {
      return true;
    }

    const results = filter.Condition.map(c => evaluateFilter(item, c));
    
    if (filter.Operator === "AND") {
      return results.every(r => r === true);
    } else {
      return results.some(r => r === true);
    }
  }

  // Handle Leaf Conditions
  if (filter.LHSField) {
    const value = item[filter.LHSField];
    const rhsValue = filter.RHSValue;
    
    // Handle specific operators
    switch (filter.Operator) {
      case "EQ":
        return String(value) === String(rhsValue);
      case "NEQ":
        return String(value) !== String(rhsValue);
      case "Contains":
        return String(value || "").toLowerCase().includes(String(rhsValue || "").toLowerCase());
      case "GT":
        return value > rhsValue;
      case "GTE":
        return value >= rhsValue;
      case "LT":
        return value < rhsValue;
      case "LTE":
        return value <= rhsValue;
      case "IN":
        return Array.isArray(rhsValue) && rhsValue.includes(value);
      case "NIN":
        return Array.isArray(rhsValue) && !rhsValue.includes(value);
      default:
        // Default fallthrough or unknown operator
        return false;
    }
  }

  // Fallback for malformed structure
  return true;
}

export function setupMockAPI(middlewares) {
  console.log("[Mock API] Setting up mock API handlers...");

  middlewares.use(async (req, res, next) => {
    const url = req.url || "";
    const method = req.method || "GET";

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
      await delay(Math.random() * 400 + 100); // 100-500ms delay
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
      await delay(200);
      res.statusCode = status;
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,PUT,POST,DELETE,PATCH,OPTIONS"
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, x-user-role, x-user-id"
      );
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

    // ==================== PRODUCT ENDPOINTS ====================
    if (url.includes("/product/count") && method === "POST") {
      parseBody()
        .then(async (body) => {
          // Check for error simulation
          const errorType = new URL(
            req.url,
            "http://localhost"
          ).searchParams.get("error");

          if (errorType === "network") {
            await sendError("Network error simulation", 500);
            return;
          }

          if (errorType === "auth") {
            await sendError("Unauthorized access", 401);
            return;
          }

          // Get role from headers
          const role = req.headers["x-user-role"] || "admin";

          // Filter products by role
          let products = filterProductsByRole(mockProducts, role);

          // Apply search (separate from filters)
          if (body.Search) {
            const searchValue = body.Search.toLowerCase();
            products = products.filter((product) => {
              // Search across multiple fields
              const searchableFields = ["name", "category", "supplier"];
              return searchableFields.some((field) => {
                const value = product[field];
                return (
                  value && String(value).toLowerCase().includes(searchValue)
                );
              });
            });
          }

          // Apply filtering from request body (separate from search)
          if (body.Filter && body.Filter.Condition) {
            products = products.filter((product) => {
              return body.Filter.Condition.some((condition) => {
                const value = product[condition.LHSField];
                const searchValue = condition.RHSValue.toLowerCase();

                if (condition.Operator === "Contains") {
                  return String(value).toLowerCase().includes(searchValue);
                }
                return false;
              });
            });
          }

          await sendJSON({
            Count: products.length,
            Success: true,
            Timestamp: new Date().toISOString(),
          });
        })
        .catch(async (error) => {
          console.error("[Mock API Error]:", error);
          await sendError("Internal server error", 500);
        });
      return;
    }

    if (url.includes("/product/list") && method === "POST") {
      parseBody()
        .then(async (body) => {
          // Check for error simulation
          const errorType = new URL(
            req.url,
            "http://localhost"
          ).searchParams.get("error");

          if (errorType === "network") {
            await sendError("Network error simulation", 500);
            return;
          }

          if (errorType === "auth") {
            await sendError("Unauthorized access", 401);
            return;
          }

          if (errorType === "notfound") {
            await sendError("Products not found", 404);
            return;
          }

          // Get role from headers
          const role = req.headers["x-user-role"] || "admin";

          // Filter products by role
          let products = filterProductsByRole(mockProducts, role);

          // Apply search (separate from filters)
          if (body.Search) {
            const searchValue = body.Search.toLowerCase();
            products = products.filter((product) => {
              // Search across multiple fields
              const searchableFields = ["name", "category", "supplier"];
              return searchableFields.some((field) => {
                const value = product[field];
                return (
                  value && String(value).toLowerCase().includes(searchValue)
                );
              });
            });
          }

          // Apply filtering from request body (separate from search)
          if (body.Filter && body.Filter.Condition) {
            products = products.filter((product) => {
              return body.Filter.Condition.some((condition) => {
                const value = product[condition.LHSField];
                const searchValue = condition.RHSValue.toLowerCase();

                if (condition.Operator === "Contains") {
                  return String(value).toLowerCase().includes(searchValue);
                }
                return false;
              });
            });
          }

          // Apply sorting
          if (body.Sort && body.Sort[0]) {
            const { Field, Order } = body.Sort[0];
            const direction = Order === "ASC" ? 1 : -1;

            products = [...products].sort((a, b) => {
              const aVal = a[Field];
              const bVal = b[Field];

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
        })
        .catch(async (error) => {
          console.error("[Mock API Error]:", error);
          await sendError("Internal server error", 500);
        });
      return;
    }

    // Product read endpoint - exclude /field and /read paths
    if (
      url.match(/\/product\/[^/]+$/i) &&
      !url.includes("/field") &&
      !url.includes("/read") &&
      method === "GET"
    ) {
      const productId = url.split("/").pop();
      const role = req.headers["x-user-role"] || "admin";

      const products = filterProductsByRole(mockProducts, role);
      const product = products.find((p) => p._id === productId);

      if (product) {
        sendJSON({
          Data: product,
          Success: true,
          Timestamp: new Date().toISOString(),
        });
      } else {
        await sendError(`Product with ID ${productId} not found`, 404);
      }
      return;
    }

    // ==================== ORDER ENDPOINTS ====================
    if (url.includes("/order/count") && method === "POST") {
      parseBody()
        .then(async (body) => {
          // Check for error simulation
          const errorType = new URL(
            req.url,
            "http://localhost"
          ).searchParams.get("error");

          if (errorType === "network") {
            await sendError("Network error simulation", 500);
            return;
          }

          if (errorType === "auth") {
            await sendError("Unauthorized access", 401);
            return;
          }

          // Get role from headers
          const role = req.headers["x-user-role"] || "admin";

          // Filter orders by role
          let orders = filterOrdersByRole(mockOrders, role);

          // For user role, only show their own orders (simulate)
          if (role === "user") {
            const userId = req.headers["x-user-id"] || "user_001";
            orders = orders.filter(
              (order) =>
                order.customerEmail.includes("customer1") ||
                order.customerEmail.includes("customer2")
            );
          }

          // Apply search (separate from filters)
          if (body.Search) {
            const searchValue = body.Search.toLowerCase();
            orders = orders.filter((order) => {
              // Search across multiple fields
              const searchableFields = [
                "_id",
                "customerName",
                "customerEmail",
                "status",
              ];
              return searchableFields.some((field) => {
                const value = order[field];
                return (
                  value && String(value).toLowerCase().includes(searchValue)
                );
              });
            });
          }

          // Apply filtering from request body (separate from search)
          if (body.Filter && body.Filter.Condition) {
            orders = orders.filter((order) => {
              return body.Filter.Condition.some((condition) => {
                const value = order[condition.LHSField];
                const searchValue = condition.RHSValue.toLowerCase();

                if (condition.Operator === "Contains") {
                  return String(value).toLowerCase().includes(searchValue);
                }
                return false;
              });
            });
          }

          await sendJSON({
            Count: orders.length,
            Success: true,
            Timestamp: new Date().toISOString(),
          });
        })
        .catch(async (error) => {
          console.error("[Mock API Error]:", error);
          await sendError("Internal server error", 500);
        });
      return;
    }

    if (url.includes("/order/list") && method === "POST") {
      parseBody()
        .then(async (body) => {
          // Check for error simulation
          const errorType = new URL(
            req.url,
            "http://localhost"
          ).searchParams.get("error");

          if (errorType === "network") {
            await sendError("Network error simulation", 500);
            return;
          }

          if (errorType === "auth") {
            await sendError("Unauthorized access", 401);
            return;
          }

          // Get role from headers
          const role = req.headers["x-user-role"] || "admin";

          // Filter orders by role
          let orders = filterOrdersByRole(mockOrders, role);

          // For user role, only show their own orders (simulate)
          if (role === "user") {
            const userId = req.headers["x-user-id"] || "user_001";
            orders = orders.filter(
              (order) =>
                order.customerEmail.includes("customer1") ||
                order.customerEmail.includes("customer2")
            );
          }

          // Apply search (separate from filters)
          if (body.Search) {
            const searchValue = body.Search.toLowerCase();
            orders = orders.filter((order) => {
              // Search across multiple fields
              const searchableFields = [
                "_id",
                "customerName",
                "customerEmail",
                "status",
              ];
              return searchableFields.some((field) => {
                const value = order[field];
                return (
                  value && String(value).toLowerCase().includes(searchValue)
                );
              });
            });
          }

          // Apply filtering from request body (separate from search)
          if (body.Filter && body.Filter.Condition) {
            orders = orders.filter((order) => {
              return body.Filter.Condition.some((condition) => {
                const value = order[condition.LHSField];
                const searchValue = condition.RHSValue.toLowerCase();

                if (condition.Operator === "Contains") {
                  return String(value).toLowerCase().includes(searchValue);
                }
                return false;
              });
            });
          }

          // Apply sorting
          if (body.Sort && body.Sort[0]) {
            const { Field, Order } = body.Sort[0];
            const direction = Order === "ASC" ? 1 : -1;

            orders = [...orders].sort((a, b) => {
              const aVal = a[Field];
              const bVal = b[Field];

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

          const paginatedOrders = orders.slice(startIndex, endIndex);

          await sendJSON({
            Data: paginatedOrders,
            Success: true,
            Timestamp: new Date().toISOString(),
          });
        })
        .catch(async (error) => {
          console.error("[Mock API Error]:", error);
          await sendError("Internal server error", 500);
        });
      return;
    }

    // Order read endpoint - exclude /field and /read paths
    if (
      url.match(/\/order\/[^/]+$/i) &&
      !url.includes("/field") &&
      !url.includes("/read") &&
      method === "GET"
    ) {
      const orderId = url.split("/").pop();
      const role = req.headers["x-user-role"] || "admin";

      const orders = filterOrdersByRole(mockOrders, role);
      const order = orders.find((o) => o._id === orderId);

      if (!order) {
        await sendError(`Order with ID ${orderId} not found`, 404);
        return;
      }

      // For user role, check if they own this order
      if (role === "user") {
        const userId = req.headers["x-user-id"] || "user_001";
        if (
          !order.customerEmail.includes("customer1") &&
          !order.customerEmail.includes("customer2")
        ) {
          await sendError("You can only view your own orders", 403);
          return;
        }
      }

      sendJSON({
        Data: order,
        Success: true,
        Timestamp: new Date().toISOString(),
      });
      return;
    }

    // ==================== READ ENDPOINTS ====================
    // Product read endpoint: /api/bo/product/{item_id}/read
    if (url.match(/\/api\/bo\/product\/[^/]+\/read$/i) && method === "GET") {
      const pathParts = url.split("/");
      const productId = pathParts[pathParts.length - 2]; // Get the ID before '/read'
      const role = req.headers["x-user-role"] || "admin";

      const products = filterProductsByRole(mockProducts, role);
      const product = products.find((p) => p._id === productId);

      if (product) {
        sendJSON({
          Data: product,
          Success: true,
          Timestamp: new Date().toISOString(),
        });
      } else {
        await sendError(`Product with ID ${productId} not found`, 404);
      }
      return;
    }

    // Order read endpoint: /api/bo/order/{item_id}/read
    if (url.match(/\/api\/bo\/order\/[^/]+\/read$/i) && method === "GET") {
      const pathParts = url.split("/");
      const orderId = pathParts[pathParts.length - 2]; // Get the ID before '/read'
      const role = req.headers["x-user-role"] || "admin";

      const orders = filterOrdersByRole(mockOrders, role);
      const order = orders.find((o) => o._id === orderId);

      if (order) {
        sendJSON({
          Data: order,
          Success: true,
          Timestamp: new Date().toISOString(),
        });
      } else {
        await sendError(`Order with ID ${orderId} not found`, 404);
      }
      return;
    }

    // ==================== CREATE/UPDATE ENDPOINTS ====================
    // Product create endpoint: /api/bo/product/create
    if (url.match(/\/api\/bo\/product\/create$/i) && method === "POST") {
      parseBody().then(async (body) => {
        await sendJSON({
          Success: true,
          Data: { ...body, _id: `product_${Date.now()}` },
          Message: "Product created successfully",
          Timestamp: new Date().toISOString(),
        });
      });
      return;
    }

    // Product update endpoint: /api/bo/product/{id}/update
    if (url.match(/\/api\/bo\/product\/[^/]+\/update$/i) && method === "POST") {
      parseBody().then(async (body) => {
        const pathParts = url.split("/");
        const productId = pathParts[pathParts.length - 2]; // Get the ID before '/update'

        await sendJSON({
          Success: true,
          Data: { ...body, _id: productId },
          Message: "Product updated successfully",
          Timestamp: new Date().toISOString(),
        });
      });
      return;
    }

    // Order create endpoint: /api/bo/order/create
    if (url.match(/\/api\/bo\/order\/create$/i) && method === "POST") {
      parseBody().then(async (body) => {
        await sendJSON({
          Success: true,
          Data: { ...body, _id: `order_${Date.now()}` },
          Message: "Order created successfully",
          Timestamp: new Date().toISOString(),
        });
      });
      return;
    }

    // Order update endpoint: /api/bo/order/{id}/update
    if (url.match(/\/api\/bo\/order\/[^/]+\/update$/i) && method === "POST") {
      parseBody().then(async (body) => {
        const pathParts = url.split("/");
        const orderId = pathParts[pathParts.length - 2]; // Get the ID before '/update'

        await sendJSON({
          Success: true,
          Data: { ...body, _id: orderId },
          Message: "Order updated successfully",
          Timestamp: new Date().toISOString(),
        });
      });
      return;
    }

    // ==================== FORM SCHEMA ENDPOINTS ====================
    if (url.includes("/api/bo/product/field") && method === "GET") {
      const role = req.headers["x-user-role"] || "admin";

      let schema = {
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
                            {
                              Type: "Identifier",
                              Name: "name",
                              Source: "BO_Product",
                            },
                          ],
                        },
                      ],
                    },
                    {
                      Type: "Literal",
                      Value: 2,
                    },
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
          Validation: [
            {
              Id: "VAL_PRODUCT_DESC_001",
              Type: "Expression",
              Condition: {
                Expression: "LENGTH(TRIM(description)) >= 10",
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
                            {
                              Type: "Identifier",
                              Name: "description",
                              Source: "BO_Product",
                            },
                          ],
                        },
                      ],
                    },
                    {
                      Type: "Literal",
                      Value: 10,
                    },
                  ],
                },
              },
              Message: "Description must be at least 10 characters",
            },
          ],
        },
        price: {
          Type: "Number",
          Required: true,
          Validation: [
            {
              Id: "VAL_PRODUCT_PRICE_001",
              Type: "Expression",
              Condition: {
                Expression: "price > 0 AND price <= 10000",
                ExpressionTree: {
                  Type: "LogicalExpression",
                  Operator: "AND",
                  Arguments: [
                    {
                      Type: "BinaryExpression",
                      Operator: ">",
                      Arguments: [
                        {
                          Type: "Identifier",
                          Name: "price",
                          Source: "BO_Product",
                        },
                        {
                          Type: "Literal",
                          Value: 0,
                        },
                      ],
                    },
                    {
                      Type: "BinaryExpression",
                      Operator: "<=",
                      Arguments: [
                        {
                          Type: "Identifier",
                          Name: "price",
                          Source: "BO_Product",
                        },
                        {
                          Type: "Literal",
                          Value: 10000,
                        },
                      ],
                    },
                  ],
                },
              },
              Message: "Price must be between $0.01 and $10,000",
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
        inStock: {
          Type: "Boolean",
          DefaultValue: {
            Expression: "true",
            ExpressionTree: {
              Type: "AssignmentExpression",
              Arguments: [
                {
                  Type: "Literal",
                  Value: true,
                },
              ],
            },
          },
        },
        profitMargin: {
          Type: "Number",
          Formula: {
            Expression: "(price - cost) / cost * 100",
            ExpressionTree: {
              Type: "BinaryExpression",
              Operator: "*",
              Arguments: [
                {
                  Type: "BinaryExpression",
                  Operator: "/",
                  Arguments: [
                    {
                      Type: "BinaryExpression",
                      Operator: "-",
                      Arguments: [
                        {
                          Type: "Identifier",
                          Name: "price",
                          Source: "BO_Product",
                        },
                        {
                          Type: "Identifier",
                          Name: "cost",
                          Source: "BO_Product",
                        },
                      ],
                    },
                    {
                      Type: "Identifier",
                      Name: "cost",
                      Source: "BO_Product",
                    },
                  ],
                },
                {
                  Type: "Literal",
                  Value: 100,
                },
              ],
            },
          },
          Computed: true,
        },
      };

      // Admin-only fields
      if (role === "admin") {
        schema.cost = {
          Type: "Number",
          Required: false,
          Validation: [
            {
              Id: "VAL_PRODUCT_COST_001",
              Type: "Expression",
              Condition: {
                Expression: "cost >= 0",
                ExpressionTree: {
                  Type: "BinaryExpression",
                  Operator: ">=",
                  Arguments: [
                    {
                      Type: "Identifier",
                      Name: "cost",
                      Source: "BO_Product",
                    },
                    {
                      Type: "Literal",
                      Value: 0,
                    },
                  ],
                },
              },
              Message: "Cost must be non-negative",
            },
          ],
        };

        schema.supplier = {
          Type: "String",
          Required: false,
        };

        schema.margin = {
          Type: "Number",
          Required: false,
          Validation: [
            {
              Id: "VAL_PRODUCT_MARGIN_001",
              Type: "Expression",
              Condition: {
                Expression: "margin >= 0 AND margin <= 100",
                ExpressionTree: {
                  Type: "LogicalExpression",
                  Operator: "AND",
                  Arguments: [
                    {
                      Type: "BinaryExpression",
                      Operator: ">=",
                      Arguments: [
                        {
                          Type: "Identifier",
                          Name: "margin",
                          Source: "BO_Product",
                        },
                        {
                          Type: "Literal",
                          Value: 0,
                        },
                      ],
                    },
                    {
                      Type: "BinaryExpression",
                      Operator: "<=",
                      Arguments: [
                        {
                          Type: "Identifier",
                          Name: "margin",
                          Source: "BO_Product",
                        },
                        {
                          Type: "Literal",
                          Value: 100,
                        },
                      ],
                    },
                  ],
                },
              },
              Message: "Margin must be between 0% and 100%",
            },
          ],
        };

        schema.lastRestocked = {
          Type: "DateTime",
          Required: false,
        };
      }

      sendJSON(schema);
      return;
    }

    if (url.includes("/api/bo/order/field") && method === "GET") {
      const role = req.headers["x-user-role"] || "admin";

      let schema = {
        customerName: {
          Type: "String",
          Required: true,
          Validation: [
            {
              Id: "VAL_ORDER_CUSTOMER_001",
              Type: "Expression",
              Condition: {
                Expression: "LENGTH(TRIM(customerName)) >= 2",
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
                            {
                              Type: "Identifier",
                              Name: "customerName",
                              Source: "BO_Order",
                            },
                          ],
                        },
                      ],
                    },
                    {
                      Type: "Literal",
                      Value: 2,
                    },
                  ],
                },
              },
              Message: "Customer name must be at least 2 characters",
            },
          ],
        },
        customerEmail: {
          Type: "String",
          Required: true,
          Validation: [
            {
              Id: "VAL_ORDER_EMAIL_001",
              Type: "Expression",
              Condition: {
                Expression: "CONTAINS(customerEmail, '@')",
                ExpressionTree: {
                  Type: "CallExpression",
                  Callee: "CONTAINS",
                  Arguments: [
                    {
                      Type: "Identifier",
                      Name: "customerEmail",
                      Source: "BO_Order",
                    },
                    {
                      Type: "Literal",
                      Value: "@",
                    },
                  ],
                },
              },
              Message: "Please enter a valid email address",
            },
          ],
        },
        status: {
          Type: "String",
          Required: true,
          Values: {
            Mode: "Static",
            Items: [
              { Value: "pending", Label: "Pending" },
              { Value: "processing", Label: "Processing" },
              { Value: "shipped", Label: "Shipped" },
              { Value: "delivered", Label: "Delivered" },
              { Value: "cancelled", Label: "Cancelled" },
            ],
          },
          DefaultValue: {
            Expression: "pending",
            ExpressionTree: {
              Type: "AssignmentExpression",
              Arguments: [
                {
                  Type: "Literal",
                  Value: "pending",
                },
              ],
            },
          },
        },
        total: {
          Type: "Number",
          Required: true,
          Validation: [
            {
              Id: "VAL_ORDER_TOTAL_001",
              Type: "Expression",
              Condition: {
                Expression: "total > 0",
                ExpressionTree: {
                  Type: "BinaryExpression",
                  Operator: ">",
                  Arguments: [
                    {
                      Type: "Identifier",
                      Name: "total",
                      Source: "BO_Order",
                    },
                    {
                      Type: "Literal",
                      Value: 0,
                    },
                  ],
                },
              },
              Message: "Order total must be greater than $0",
            },
          ],
        },
        itemCount: {
          Type: "Number",
          Required: true,
          Validation: [
            {
              Id: "VAL_ORDER_ITEMS_001",
              Type: "Expression",
              Condition: {
                Expression: "itemCount >= 1 AND itemCount <= 100",
                ExpressionTree: {
                  Type: "LogicalExpression",
                  Operator: "AND",
                  Arguments: [
                    {
                      Type: "BinaryExpression",
                      Operator: ">=",
                      Arguments: [
                        {
                          Type: "Identifier",
                          Name: "itemCount",
                          Source: "BO_Order",
                        },
                        {
                          Type: "Literal",
                          Value: 1,
                        },
                      ],
                    },
                    {
                      Type: "BinaryExpression",
                      Operator: "<=",
                      Arguments: [
                        {
                          Type: "Identifier",
                          Name: "itemCount",
                          Source: "BO_Order",
                        },
                        {
                          Type: "Literal",
                          Value: 100,
                        },
                      ],
                    },
                  ],
                },
              },
              Message: "Item count must be between 1 and 100",
            },
          ],
        },
        orderSummary: {
          Type: "String",
          Formula: {
            Expression:
              "CONCAT(itemCount, ' items totaling $', total, ' for ', customerName)",
            ExpressionTree: {
              Type: "CallExpression",
              Callee: "CONCAT",
              Arguments: [
                {
                  Type: "Identifier",
                  Name: "itemCount",
                  Source: "BO_Order",
                },
                {
                  Type: "Literal",
                  Value: " items totaling $",
                },
                {
                  Type: "Identifier",
                  Name: "total",
                  Source: "BO_Order",
                },
                {
                  Type: "Literal",
                  Value: " for ",
                },
                {
                  Type: "Identifier",
                  Name: "customerName",
                  Source: "BO_Order",
                },
              ],
            },
          },
          Computed: true,
        },
        customerFullInfo: {
          Type: "String",
          Formula: {
            Expression: "CONCAT(customerName, ' <', customerEmail, '>')",
            ExpressionTree: {
              Type: "CallExpression",
              Callee: "CONCAT",
              Arguments: [
                {
                  Type: "Identifier",
                  Name: "customerName",
                  Source: "BO_Order",
                },
                {
                  Type: "Literal",
                  Value: " <",
                },
                {
                  Type: "Identifier",
                  Name: "customerEmail",
                  Source: "BO_Order",
                },
                {
                  Type: "Literal",
                  Value: ">",
                },
              ],
            },
          },
          Computed: true,
        },
        totalWithShipping: {
          Type: "Number",
          Formula: {
            Expression: "total + shippingCost",
            ExpressionTree: {
              Type: "BinaryExpression",
              Operator: "+",
              Arguments: [
                {
                  Type: "Identifier",
                  Name: "total",
                  Source: "BO_Order",
                },
                {
                  Type: "Identifier",
                  Name: "shippingCost",
                  Source: "BO_Order",
                },
              ],
            },
          },
          Computed: true,
        },
      };

      // Admin-only fields
      if (role === "admin") {
        schema.profit = {
          Type: "Number",
          Required: false,
          Validation: [
            {
              Id: "VAL_ORDER_PROFIT_001",
              Type: "Expression",
              Condition: {
                Expression: "profit >= 0",
                ExpressionTree: {
                  Type: "BinaryExpression",
                  Operator: ">=",
                  Arguments: [
                    {
                      Type: "Identifier",
                      Name: "profit",
                      Source: "BO_Order",
                    },
                    {
                      Type: "Literal",
                      Value: 0,
                    },
                  ],
                },
              },
              Message: "Profit must be non-negative",
            },
          ],
        };

        schema.shippingCost = {
          Type: "Number",
          Required: false,
          Validation: [
            {
              Id: "VAL_ORDER_SHIPPING_001",
              Type: "Expression",
              Condition: {
                Expression: "shippingCost >= 0",
                ExpressionTree: {
                  Type: "BinaryExpression",
                  Operator: ">=",
                  Arguments: [
                    {
                      Type: "Identifier",
                      Name: "shippingCost",
                      Source: "BO_Order",
                    },
                    {
                      Type: "Literal",
                      Value: 0,
                    },
                  ],
                },
              },
              Message: "Shipping cost must be non-negative",
            },
          ],
        };

        schema.internalNotes = {
          Type: "String",
          Required: false,
        };
      }

      sendJSON(schema);
      return;
    }

    // ==================== CREATE/UPDATE/DELETE ====================
    if (
      url.includes("/product") &&
      method === "POST" &&
      !url.includes("/list")
    ) {
      const role = req.headers["x-user-role"] || "admin";

      if (role !== "admin") {
        await sendError("Only admins can create products", 403);
        return;
      }

      parseBody().then(async (body) => {
        const newId = `product_${Date.now()}`;

        await sendJSON(
          {
            Success: true,
            Data: { _id: newId },
            Message: "Product created successfully",
            Timestamp: new Date().toISOString(),
          },
          201
        );
      });
      return;
    }

    if (url.includes("/order") && method === "POST" && !url.includes("/list")) {
      parseBody().then(async (body) => {
        const newId = `order_${Date.now()}`;

        await sendJSON(
          {
            Success: true,
            Data: { _id: newId },
            Message: "Order created successfully",
            Timestamp: new Date().toISOString(),
          },
          201
        );
      });
      return;
    }

    // ==================== KANBAN COLUMN ENDPOINTS ====================
    
    // Column count endpoint
    if (url.includes("/board-column/count") && method === "POST") {
      parseBody()
        .then(async (body) => {
          const role = req.headers["x-user-role"] || "admin";
          let columns = filterColumnsByRole(mockColumns, role);

          // Apply search if provided
          if (body.Search) {
            const searchValue = body.Search.toLowerCase();
            columns = columns.filter(column => 
              column.title.toLowerCase().includes(searchValue)
            );
          }

          // Apply filtering if provided
          if (body.Filter && body.Filter.Condition) {
            columns = columns.filter(column => {
              return body.Filter.Condition.some(condition => {
                const value = column[condition.LHSField];
                const searchValue = condition.RHSValue.toLowerCase();
                
                if (condition.Operator === "Contains") {
                  return String(value).toLowerCase().includes(searchValue);
                }
                if (condition.Operator === "EQ") {
                  return String(value).toLowerCase() === searchValue;
                }
                return false;
              });
            });
          }

          await sendJSON({
            Count: columns.length,
            Success: true,
            Timestamp: new Date().toISOString(),
          });
        })
        .catch(error => {
          console.error("[Mock API Error]:", error);
          sendError("Internal server error", 500);
        });
      return;
    }

    // Column list endpoint
    if (url.includes("/board-column/list") && method === "POST") {
      parseBody()
        .then(async (body) => {
          const role = req.headers["x-user-role"] || "admin";
          let columns = filterColumnsByRole([...mockColumns], role);

          // Apply search if provided
          if (body.Search) {
            const searchValue = body.Search.toLowerCase();
            columns = columns.filter(column => 
              column.title.toLowerCase().includes(searchValue)
            );
          }

          // Apply filtering if provided
          if (body.Filter && body.Filter.Condition) {
            columns = columns.filter(column => {
              return body.Filter.Condition.some(condition => {
                const value = column[condition.LHSField];
                const searchValue = condition.RHSValue.toLowerCase();
                
                if (condition.Operator === "Contains") {
                  return String(value).toLowerCase().includes(searchValue);
                }
                if (condition.Operator === "EQ") {
                  return String(value).toLowerCase() === searchValue;
                }
                return false;
              });
            });
          }

          // Apply sorting (default by position)
          if (body.Sort && body.Sort[0]) {
            const { Field, Order } = body.Sort[0];
            const direction = Order === "ASC" ? 1 : -1;
            
            columns = columns.sort((a, b) => {
              const aVal = a[Field];
              const bVal = b[Field];
              
              if (aVal < bVal) return -1 * direction;
              if (aVal > bVal) return 1 * direction;
              return 0;
            });
          } else {
            // Default sort by position
            columns = columns.sort((a, b) => a.position - b.position);
          }

          await sendJSON({
            Data: columns,
            Success: true,
            Timestamp: new Date().toISOString(),
          });
        })
        .catch(error => {
          console.error("[Mock API Error]:", error);
          sendError("Internal server error", 500);
        });
      return;
    }

    // Column create endpoint
    if (url.match(/\/api\/bo\/board-column\/create$/i) && method === "POST") {
      parseBody().then(async (body) => {
        const newId = generateColumnId();
        const position = body.position !== undefined ? body.position : getNextColumnPosition(mockColumns);
        
        const newColumn = {
          _id: newId,
          title: body.title || "New Column",
          position: position,
          color: body.color || "#e3f2fd",
          limit: body.limit || null,
          _created_at: new Date(),
          _modified_at: new Date(),
        };

        // Add to mock data
        mockColumns.push(newColumn);
        mockColumns.sort((a, b) => a.position - b.position);

        await sendJSON({
          _id: newId,
          Success: true,
          Message: "Column created successfully",
          Timestamp: new Date().toISOString(),
        });
      });
      return;
    }

    // Column update endpoint
    if (url.match(/\/api\/bo\/board-column\/[^/]+\/update$/i) && method === "POST") {
      parseBody().then(async (body) => {
        const pathParts = url.split("/");
        const columnId = pathParts[pathParts.length - 2];
        
        const columnIndex = mockColumns.findIndex(col => col._id === columnId);
        if (columnIndex === -1) {
          await sendError("Column not found", 404);
          return;
        }

        // Update the column
        mockColumns[columnIndex] = {
          ...mockColumns[columnIndex],
          ...body,
          _modified_at: new Date(),
        };

        await sendJSON({
          _id: columnId,
          Success: true,
          Message: "Column updated successfully",
          Timestamp: new Date().toISOString(),
        });
      });
      return;
    }

    // Column delete endpoint
    if (url.match(/\/api\/bo\/board-column\/[^/]+\/delete$/i) && method === "DELETE") {
      const pathParts = url.split("/");
      const columnId = pathParts[pathParts.length - 2];
      
      const columnIndex = mockColumns.findIndex(col => col._id === columnId);
      if (columnIndex === -1) {
        await sendError("Column not found", 404);
        return;
      }

      // Remove column and all its cards
      mockColumns.splice(columnIndex, 1);
      
      // Remove all cards in this column
      for (let i = mockCards.length - 1; i >= 0; i--) {
        if (mockCards[i].columnId === columnId) {
          mockCards.splice(i, 1);
        }
      }

      await sendJSON({
        status: "success",
        Message: "Column and associated cards deleted successfully",
        Timestamp: new Date().toISOString(),
      });
      return;
    }

    // ==================== KANBAN CARD ENDPOINTS ====================
    
    // Card count endpoint
    if (url.includes("/task/count") && method === "POST") {
      parseBody()
        .then(async (body) => {
          const role = req.headers["x-user-role"] || "admin";
          let cards = filterCardsByRole(mockCards, role);

          // Apply search if provided
          if (body.Search) {
            const searchValue = body.Search.toLowerCase();
            cards = cards.filter(card => {
              const searchableFields = ["title", "description", "assignee", "priority"];
              return searchableFields.some(field => {
                const value = card[field];
                return value && String(value).toLowerCase().includes(searchValue);
              });
            });
          }

          // Apply filtering if provided
          if (body.Filter && body.Filter.Condition) {
            cards = cards.filter(card => {
              return body.Filter.Condition.some(condition => {
                const value = card[condition.LHSField];
                const searchValue = condition.RHSValue.toLowerCase();
                
                if (condition.Operator === "Contains") {
                  return String(value).toLowerCase().includes(searchValue);
                }
                if (condition.Operator === "EQ") {
                  return String(value).toLowerCase() === searchValue;
                }
                return false;
              });
            });
          }

          await sendJSON({
            Count: cards.length,
            Success: true,
            Timestamp: new Date().toISOString(),
          });
        })
        .catch(error => {
          console.error("[Mock API Error]:", error);
          sendError("Internal server error", 500);
        });
      return;
    }

    // Card list endpoint
    if (url.includes("/task/list") && method === "POST") {
      parseBody()
        .then(async (body) => {
          const role = req.headers["x-user-role"] || "admin";
          let cards = filterCardsByRole([...mockCards], role);

          // Apply search if provided
          if (body.Search) {
            const searchValue = body.Search.toLowerCase();
            cards = cards.filter(card => {
              const searchableFields = ["title", "description", "assignee", "priority"];
              return searchableFields.some(field => {
                const value = card[field];
                return value && String(value).toLowerCase().includes(searchValue);
              });
            });
          }

          // Apply filtering if provided
          // Apply filtering if provided (Robust Recursive Logic)
          if (body.Filter) {
            cards = cards.filter(card => evaluateFilter(card, body.Filter));
            console.log(`[Mock API] Task List Filtered: ${cards.length} cards remaining`);
          }

          // Apply sorting (default by columnId then position)
          if (body.Sort && body.Sort[0]) {
            const { Field, Order } = body.Sort[0];
            const direction = Order === "ASC" ? 1 : -1;
            
            cards = cards.sort((a, b) => {
              const aVal = a[Field];
              const bVal = b[Field];
              
              if (aVal < bVal) return -1 * direction;
              if (aVal > bVal) return 1 * direction;
              return 0;
            });
          } else {
            // Default sort by columnId then position
            cards = cards.sort((a, b) => {
              if (a.columnId !== b.columnId) {
                return a.columnId.localeCompare(b.columnId);
              }
              return a.position - b.position;
            });
          }

          // Apply pagination if provided
          if (body.Page && body.PageSize) {
            const page = body.Page || 1;
            const pageSize = body.PageSize || 10;
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            cards = cards.slice(startIndex, endIndex);
          }

          await sendJSON({
            Data: cards,
            Success: true,
            Timestamp: new Date().toISOString(),
          });
        })
        .catch(error => {
          console.error("[Mock API Error]:", error);
          sendError("Internal server error", 500);
        });
      return;
    }

    // Card create endpoint
    if (url.match(/\/api\/bo\/task\/create$/i) && method === "POST") {
      parseBody().then(async (body) => {
        const newId = generateCardId();
        const position = body.position !== undefined ? body.position : getNextPosition(body.columnId, mockCards);
        
        const newCard = {
          _id: newId,
          title: body.title || "New Task",
          description: body.description || "",
          columnId: body.columnId,
          position: position,
          priority: body.priority || "medium",
          assignee: body.assignee || "",
          tags: Array.isArray(body.tags) ? body.tags : [],
          estimatedHours: body.estimatedHours || null,
          dueDate: body.dueDate || null,
          _created_at: new Date(),
          _modified_at: new Date(),
        };

        // Add to mock data
        mockCards.push(newCard);

        await sendJSON({
          _id: newId,
          Success: true,
          Message: "Card created successfully",
          Timestamp: new Date().toISOString(),
        });
      });
      return;
    }

    // Card update endpoint
    if (url.match(/\/api\/bo\/task\/[^/]+\/update$/i) && method === "POST") {
      parseBody().then(async (body) => {
        const pathParts = url.split("/");
        const cardId = pathParts[pathParts.length - 2];
        
        const cardIndex = mockCards.findIndex(card => card._id === cardId);
        if (cardIndex === -1) {
          await sendError("Card not found", 404);
          return;
        }

        // Update the card
        mockCards[cardIndex] = {
          ...mockCards[cardIndex],
          ...body,
          _modified_at: new Date(),
        };

        await sendJSON({
          _id: cardId,
          Success: true,
          Message: "Card updated successfully",
          Timestamp: new Date().toISOString(),
        });
      });
      return;
    }

    // Card delete endpoint
    if (url.match(/\/api\/bo\/task\/[^/]+\/delete$/i) && method === "DELETE") {
      const pathParts = url.split("/");
      const cardId = pathParts[pathParts.length - 2];
      
      const cardIndex = mockCards.findIndex(card => card._id === cardId);
      if (cardIndex === -1) {
        await sendError("Card not found", 404);
        return;
      }

      // Remove the card
      mockCards.splice(cardIndex, 1);

      await sendJSON({
        status: "success",
        Message: "Card deleted successfully",
        Timestamp: new Date().toISOString(),
      });
      return;
    }

    // Card read endpoint
    if (url.match(/\/api\/bo\/task\/[^/]+\/read$/i) && method === "GET") {
      const pathParts = url.split("/");
      const cardId = pathParts[pathParts.length - 2];
      
      const card = mockCards.find(card => card._id === cardId);
      if (!card) {
        await sendError("Card not found", 404);
        return;
      }

      await sendJSON({
        Data: card,
        Success: true,
        Timestamp: new Date().toISOString(),
      });
      return;
    }

    // Column read endpoint
    if (url.match(/\/api\/bo\/board-column\/[^/]+\/read$/i) && method === "GET") {
      const pathParts = url.split("/");
      const columnId = pathParts[pathParts.length - 2];
      
      const column = mockColumns.find(col => col._id === columnId);
      if (!column) {
        await sendError("Column not found", 404);
        return;
      }

      await sendJSON({
        Data: column,
        Success: true,
        Timestamp: new Date().toISOString(),
      });
      return;
    }

    // If we got here, it's an unhandled route
    next();
  });
}
