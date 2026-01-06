import { mockProducts, filterProductsByRole } from "./data/products.js";
import {
  getCartItems,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartCount,
} from "./data/cart.js";
import {
  getRestockingTasks,
  getRestockingTask,
  createRestockingTask,
  updateRestockingTask,
  deleteRestockingTask,
} from "./data/restocking.js";

export function setupMockAPI(middlewares) {
  console.log(
    "[Mock API] Setting up BDO-compliant e-commerce mock API handlers..."
  );

  middlewares.use((req, res, next) => {
    const url = req.url || "";
    const method = req.method || "GET";

    // Handle /api routes following Swagger BDO pattern
    if (!url.startsWith("/api/")) {
      next();
      return;
    }

    console.log(`[Mock API] ${method} ${url}`);

    // Add delay to simulate network
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // Parse body for POST/PUT/PATCH
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
          Error: {
            Code: status,
            Message: message,
            Timestamp: new Date().toISOString(),
          },
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

    // ==================== BDO PRODUCT ENDPOINTS ====================

    // BDO Pattern: POST /api/app/BDO_AmazonProductMaster/list
    if (
      url.match(/^\/api\/app\/BDO_AmazonProductMaster\/list$/i) &&
      method === "POST"
    ) {
      parseBody().then(async (body) => {
        let products = filterProductsByRole(mockProducts, role, userId);
        products = applyFiltersAndSearch(products, body);

        // Apply sorting (support both old and new formats)
        if (body.Sort && body.Sort[0]) {
          // New format: { fieldName: "ASC" } or old format: { Field: "fieldName", Order: "ASC" }
          const sortObj = body.Sort[0];
          const Field = sortObj.Field || Object.keys(sortObj)[0];
          const Order = sortObj.Order || sortObj[Field];
          const direction = Order === "ASC" ? 1 : -1;

          products = [...products].sort((a, b) => {
            let aVal = a[Field];
            let bVal = b[Field];

            // Handle nested objects
            if (Field === "price" && typeof aVal === "object") {
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
        });
      });
      return;
    }

    // BDO Pattern: POST /api/app/BDO_AmazonProductMaster/metric (used for count)
    if (
      url.match(/^\/api\/app\/BDO_AmazonProductMaster\/metric$/i) &&
      method === "POST"
    ) {
      parseBody().then(async (body) => {
        let products = filterProductsByRole(mockProducts, role, userId);
        products = applyFiltersAndSearch(products, body);

        // Return metric response format for count
        await sendJSON({
          Data: [{ _id_Count: products.length }],
        });
      });
      return;
    }

    // BDO Pattern: GET /api/app/BDO_AmazonProductMaster/{instance_id}/read
    if (
      url.match(/^\/api\/app\/BDO_AmazonProductMaster\/([^/]+)\/read$/i) &&
      method === "GET"
    ) {
      const match = url.match(
        /^\/api\/app\/BDO_AmazonProductMaster\/([^/]+)\/read$/i
      );
      const productId = match[1];

      const products = filterProductsByRole(mockProducts, role, userId);
      const product = products.find((p) => p._id === productId);

      if (product) {
        sendJSON({
          Data: product,
        });
      } else {
        sendError(`Product with ID ${productId} not found`, 404);
      }
      return;
    }

    // BDO Pattern: POST /api/app/BDO_AmazonProductMaster/create
    if (
      url.match(/^\/api\/app\/BDO_AmazonProductMaster\/create$/i) &&
      method === "POST"
    ) {
      // Check permissions
      const allowedRoles = ["Admin", "Seller"];
      if (!allowedRoles.includes(role)) {
        sendError("Insufficient permissions to create products", 403);
        return;
      }

      parseBody().then(async (body) => {
        const newId = body._id || `PROD-${Date.now()}`;
        const newProduct = {
          _id: newId,
          ...body,
          sellerId: userId,
          sellerName: "My Store",
          _created_at: new Date().toISOString(),
          _modified_at: new Date().toISOString(),
          _created_by: { _id: userId, username: role.toLowerCase() },
          _modified_by: { _id: userId, username: role.toLowerCase() },
          _version: "1.0",
          _m_version: "1.0",
        };

        // Apply business rules
        if (newProduct.MRP && newProduct.Price) {
          // Calculate discount: IF(MRP > 0, ((MRP - Price) / MRP) * 100, 0)
          newProduct.Discount =
            newProduct.MRP > 0
              ? ((newProduct.MRP - newProduct.Price) / newProduct.MRP) * 100
              : 0;
        }

        if (
          newProduct.Stock !== undefined &&
          newProduct.ReorderLevel !== undefined
        ) {
          // Check low stock: Stock <= ReorderLevel
          newProduct.LowStock = newProduct.Stock <= newProduct.ReorderLevel;
        }

        mockProducts.push(newProduct);

        await sendJSON({
          _id: newId,
          Success: true,
          Message: "Product created successfully",
        });
      });
      return;
    }

    // BDO Pattern: PATCH /api/app/BDO_AmazonProductMaster/{instance_id}/draft
    // Interactive mode - returns only computed fields without persisting changes
    if (
      url.match(/^\/api\/app\/BDO_AmazonProductMaster\/([^/]+)\/draft$/i) &&
      method === "PATCH"
    ) {
      const match = url.match(
        /^\/api\/app\/BDO_AmazonProductMaster\/([^/]+)\/draft$/i
      );
      const productId = match[1];

      // Check permissions
      const allowedRoles = [
        "Admin",
        "Seller",
        "InventoryManager",
        "WarehouseStaff",
      ];
      if (!allowedRoles.includes(role)) {
        sendError("Insufficient permissions to update products", 403);
        return;
      }

      let product = mockProducts.find((p) => p._id === productId);

      // For create operations, productId might be "new" or draft ID
      if (!product && productId !== "new") {
        sendError(`Product with ID ${productId} not found`, 404);
        return;
      }

      parseBody().then(async (body) => {
        // Get current or default values
        const currentValues = product ? { ...product } : {};
        const updatedFields = { ...body };

        // Apply business rules for computed fields
        const computedFields = {};

        // RULE_CALC_DISCOUNT: Calculate discount percentage
        if (
          updatedFields.MRP !== undefined ||
          updatedFields.Price !== undefined
        ) {
          const mrp =
            updatedFields.MRP !== undefined
              ? updatedFields.MRP
              : currentValues.MRP || 0;
          const price =
            updatedFields.Price !== undefined
              ? updatedFields.Price
              : currentValues.Price || 0;

          // IF(MRP > 0, ((MRP - Price) / MRP) * 100, 0)
          computedFields.Discount = mrp > 0 ? ((mrp - price) / mrp) * 100 : 0;
        }

        // RULE_CHECK_LOW_STOCK: Check if stock is below reorder level
        if (
          updatedFields.Stock !== undefined ||
          updatedFields.ReorderLevel !== undefined
        ) {
          const stock =
            updatedFields.Stock !== undefined
              ? updatedFields.Stock
              : currentValues.Stock || 0;
          const reorderLevel =
            updatedFields.ReorderLevel !== undefined
              ? updatedFields.ReorderLevel
              : currentValues.ReorderLevel || 10;

          // Stock <= ReorderLevel
          computedFields.LowStock = stock <= reorderLevel;
        }

        // Return ONLY computed fields (don't persist changes)
        await sendJSON(computedFields);
      });
      return;
    }

    // BDO Pattern: POST /api/app/BDO_AmazonProductMaster/draft (for create operations)
    if (
      url.match(/^\/api\/app\/BDO_AmazonProductMaster\/draft$/i) &&
      method === "POST"
    ) {
      // Check permissions
      const allowedRoles = ["Admin", "Seller"];
      if (!allowedRoles.includes(role)) {
        sendError("Insufficient permissions to create products", 403);
        return;
      }

      parseBody().then(async (body) => {
        const updatedFields = { ...body };

        // Apply business rules for computed fields
        const computedFields = {};

        // RULE_CALC_DISCOUNT: Calculate discount percentage
        if (
          updatedFields.MRP !== undefined ||
          updatedFields.Price !== undefined
        ) {
          const mrp = updatedFields.MRP || 0;
          const price = updatedFields.Price || 0;

          computedFields.Discount = mrp > 0 ? ((mrp - price) / mrp) * 100 : 0;
        }

        // RULE_CHECK_LOW_STOCK: Check if stock is below reorder level
        if (
          updatedFields.Stock !== undefined ||
          updatedFields.ReorderLevel !== undefined
        ) {
          const stock = updatedFields.Stock || 0;
          const reorderLevel = updatedFields.ReorderLevel || 10;

          computedFields.LowStock = stock <= reorderLevel;
        }

        // Return ONLY computed fields
        await sendJSON(computedFields);
      });
      return;
    }

    // BDO Pattern: POST /api/app/BDO_AmazonProductMaster/{instance_id}/update
    if (
      url.match(/^\/api\/app\/BDO_AmazonProductMaster\/([^/]+)\/update$/i) &&
      method === "POST"
    ) {
      const match = url.match(
        /^\/api\/app\/BDO_AmazonProductMaster\/([^/]+)\/update$/i
      );
      const productId = match[1];

      // Check permissions
      const allowedRoles = [
        "Admin",
        "Seller",
        "InventoryManager",
        "WarehouseStaff",
      ];
      if (!allowedRoles.includes(role)) {
        sendError("Insufficient permissions to update products", 403);
        return;
      }

      const product = mockProducts.find((p) => p._id === productId);

      if (!product) {
        sendError(`Product with ID ${productId} not found`, 404);
        return;
      }

      // Additional permission checks for sellers
      if (role === "Seller" && product.sellerId !== userId) {
        sendError("You can only update your own products", 403);
        return;
      }

      parseBody().then(async (body) => {
        // Apply updates
        const updatedFields = { ...body };

        // Apply business rules for computed fields
        const computedFields = {};

        if (
          updatedFields.MRP !== undefined ||
          updatedFields.Price !== undefined
        ) {
          const mrp =
            updatedFields.MRP !== undefined ? updatedFields.MRP : product.MRP;
          const price =
            updatedFields.Price !== undefined
              ? updatedFields.Price
              : product.Price;

          // Calculate discount
          if (mrp && price) {
            computedFields.Discount = mrp > 0 ? ((mrp - price) / mrp) * 100 : 0;
          }
        }

        if (
          updatedFields.Stock !== undefined ||
          updatedFields.ReorderLevel !== undefined
        ) {
          const stock =
            updatedFields.Stock !== undefined
              ? updatedFields.Stock
              : product.Stock;
          const reorderLevel =
            updatedFields.ReorderLevel !== undefined
              ? updatedFields.ReorderLevel
              : product.ReorderLevel;

          // Check low stock
          if (stock !== undefined && reorderLevel !== undefined) {
            computedFields.LowStock = stock <= reorderLevel;
          }
        }

        // Apply all updates
        Object.assign(product, updatedFields, computedFields, {
          _modified_at: new Date().toISOString(),
          _modified_by: { _id: userId, username: role.toLowerCase() },
        });

        await sendJSON({
          _id: productId,
          Success: true,
          Message: "Product updated successfully",
          computedFields, // Return computed fields for client update
        });
      });
      return;
    }

    // BDO Pattern: DELETE /api/app/BDO_AmazonProductMaster/{instance_id}/delete
    if (
      url.match(/^\/api\/app\/BDO_AmazonProductMaster\/([^/]+)\/delete$/i) &&
      method === "DELETE"
    ) {
      const match = url.match(
        /^\/api\/app\/BDO_AmazonProductMaster\/([^/]+)\/delete$/i
      );
      const productId = match[1];

      // Only admins can delete
      if (role !== "Admin") {
        sendError("Only admins can delete products", 403);
        return;
      }

      const productIndex = mockProducts.findIndex((p) => p._id === productId);

      if (productIndex === -1) {
        sendError(`Product with ID ${productId} not found`, 404);
        return;
      }

      mockProducts.splice(productIndex, 1);

      sendJSON({
        Success: true,
        Message: "Product deleted successfully",
      });
      return;
    }

    // ==================== BDO METADATA ENDPOINTS ====================

    // BDO Pattern: GET /api/app/metadata/BDO_AmazonProductMaster/read
    if (
      url.match(/^\/api\/app\/metadata\/BDO_AmazonProductMaster\/read$/i) &&
      method === "GET"
    ) {
      const schema = {
        Id: "BDO_AmazonProductMaster",
        Name: "Amazon Product Master",
        Kind: "BusinessObject",
        Description:
          "Comprehensive product master data with inventory and pricing",
        Rules: {
          Computation: {
            RULE_CALC_DISCOUNT: {
              Id: "RULE_CALC_DISCOUNT",
              Name: "Calculate Discount Percentage",
              Description: "Calculates discount percentage from MRP and Price",
              Expression: "IF(MRP > 0, ((MRP - Price) / MRP) * 100, 0)",
              ExpressionTree: {
                Type: "CallExpression",
                Callee: "IF",
                Arguments: [
                  {
                    Type: "BinaryExpression",
                    Operator: ">",
                    Arguments: [
                      {
                        Type: "Identifier",
                        Name: "MRP",
                        Source: "BDO_AmazonProductMaster",
                      },
                      { Type: "Literal", Value: 0 },
                    ],
                  },
                  {
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
                                Name: "MRP",
                                Source: "BDO_AmazonProductMaster",
                              },
                              {
                                Type: "Identifier",
                                Name: "Price",
                                Source: "BDO_AmazonProductMaster",
                              },
                            ],
                          },
                          {
                            Type: "Identifier",
                            Name: "MRP",
                            Source: "BDO_AmazonProductMaster",
                          },
                        ],
                      },
                      { Type: "Literal", Value: 100 },
                    ],
                  },
                  { Type: "Literal", Value: 0 },
                ],
              },
              ResultType: "Number",
            },
            RULE_CHECK_LOW_STOCK: {
              Id: "RULE_CHECK_LOW_STOCK",
              Name: "Check Low Stock",
              Description: "Determines if stock is below reorder level",
              Expression: "Stock <= ReorderLevel",
              ExpressionTree: {
                Type: "BinaryExpression",
                Operator: "<=",
                Arguments: [
                  {
                    Type: "Identifier",
                    Name: "Stock",
                    Source: "BDO_AmazonProductMaster",
                  },
                  {
                    Type: "Identifier",
                    Name: "ReorderLevel",
                    Source: "BDO_AmazonProductMaster",
                  },
                ],
              },
              ResultType: "Boolean",
            },
          },
          Validation: {
            RULE_ASIN_REQUIRED: {
              Id: "RULE_ASIN_REQUIRED",
              Name: "ASIN Required",
              Description: "ASIN field must have a value",
              Expression: "ASIN != null AND TRIM(ASIN) != ''",
              ExpressionTree: {
                Type: "LogicalExpression",
                Operator: "AND",
                Arguments: [
                  {
                    Type: "BinaryExpression",
                    Operator: "!=",
                    Arguments: [
                      {
                        Type: "Identifier",
                        Name: "ASIN",
                        Source: "BDO_AmazonProductMaster",
                      },
                      { Type: "Literal", Value: null },
                    ],
                  },
                  {
                    Type: "BinaryExpression",
                    Operator: "!=",
                    Arguments: [
                      {
                        Type: "CallExpression",
                        Callee: "TRIM",
                        Arguments: [
                          {
                            Type: "Identifier",
                            Name: "ASIN",
                            Source: "BDO_AmazonProductMaster",
                          },
                        ],
                      },
                      { Type: "Literal", Value: "" },
                    ],
                  },
                ],
              },
              Message: "ASIN is required",
            },
            RULE_ASIN_FORMAT: {
              Id: "RULE_ASIN_FORMAT",
              Name: "ASIN Format Validation",
              Description: "Validates ASIN is 10 alphanumeric characters",
              Expression:
                "LENGTH(ASIN) == 10 AND MATCHES(ASIN, '^[A-Z0-9]{10}$')",
              ExpressionTree: {
                Type: "LogicalExpression",
                Operator: "AND",
                Arguments: [
                  {
                    Type: "BinaryExpression",
                    Operator: "==",
                    Arguments: [
                      {
                        Type: "CallExpression",
                        Callee: "LENGTH",
                        Arguments: [
                          {
                            Type: "Identifier",
                            Name: "ASIN",
                            Source: "BDO_AmazonProductMaster",
                          },
                        ],
                      },
                      { Type: "Literal", Value: 10 },
                    ],
                  },
                  {
                    Type: "CallExpression",
                    Callee: "MATCHES",
                    Arguments: [
                      {
                        Type: "Identifier",
                        Name: "ASIN",
                        Source: "BDO_AmazonProductMaster",
                      },
                      { Type: "Literal", Value: "^[A-Z0-9]{10}$" },
                    ],
                  },
                ],
              },
              Message: "ASIN must be exactly 10 alphanumeric characters",
            },
          },
        },
        Fields: {
          ProductId: {
            Id: "ProductId",
            Name: "Product ID",
            Type: "String",
            Unique: true,
          },
          ASIN: {
            Id: "ASIN",
            Name: "Amazon Standard Identification Number",
            Type: "String",
            Unique: true,
            Validation: ["RULE_ASIN_REQUIRED", "RULE_ASIN_FORMAT"],
          },
          SKU: {
            Id: "SKU",
            Name: "Stock Keeping Unit",
            Type: "String",
            Unique: true,
          },
          Title: {
            Id: "Title",
            Name: "Product Title",
            Type: "String",
            Required: true,
          },
          Description: {
            Id: "Description",
            Name: "Product Description",
            Type: "String",
          },
          Price: {
            Id: "Price",
            Name: "Selling Price",
            Type: "Number",
            Required: true,
          },
          MRP: {
            Id: "MRP",
            Name: "Maximum Retail Price",
            Type: "Number",
            Required: true,
          },
          Cost: { Id: "Cost", Name: "Product Cost", Type: "Number" },
          Discount: {
            Id: "Discount",
            Name: "Discount Percentage",
            Type: "Number",
            Computed: true,
          },
          Category: {
            Id: "Category",
            Name: "Product Category",
            Type: "String",
            Required: true,
            Values: {
              Mode: "Static",
              Items: [
                { Value: "Electronics", Label: "Electronics" },
                { Value: "Books", Label: "Books" },
                { Value: "Clothing", Label: "Clothing & Accessories" },
                { Value: "Home", Label: "Home & Kitchen" },
                { Value: "Sports", Label: "Sports & Outdoors" },
                { Value: "Toys", Label: "Toys & Games" },
              ],
            },
          },
          Brand: { Id: "Brand", Name: "Brand Name", Type: "String" },
          Tags: {
            Id: "Tags",
            Name: "Product Tags",
            Type: "Array",
            Items: { Type: "String" },
          },
          Stock: {
            Id: "Stock",
            Name: "Stock Quantity",
            Type: "Number",
            Required: true,
          },
          Warehouse: {
            Id: "Warehouse",
            Name: "Warehouse Location",
            Type: "String",
            Values: {
              Mode: "Static",
              Items: [
                { Value: "Warehouse_A", Label: "Warehouse A - North" },
                { Value: "Warehouse_B", Label: "Warehouse B - South" },
                { Value: "Warehouse_C", Label: "Warehouse C - East" },
              ],
            },
          },
          ReorderLevel: {
            Id: "ReorderLevel",
            Name: "Reorder Level",
            Type: "Number",
          },
          LowStock: {
            Id: "LowStock",
            Name: "Low Stock Indicator",
            Type: "Boolean",
            Computed: true,
          },
          IsActive: { Id: "IsActive", Name: "Is Active", Type: "Boolean" },
        },
        RolePermission: {
          Admin: {
            Editable: ["*"],
            ReadOnly: ["*"],
            Methods: ["*"],
          },
          Seller: {
            Editable: [
              "Title",
              "Description",
              "Price",
              "MRP",
              "Category",
              "Brand",
              "Tags",
              "Stock",
              "Warehouse",
            ],
            ReadOnly: [
              "ProductId",
              "ASIN",
              "SKU",
              "Cost",
              "Discount",
              "LowStock",
              "_created_at",
              "_modified_at",
            ],
            Methods: ["create", "read", "update", "list"],
          },
          Buyer: {
            Editable: [],
            ReadOnly: [
              "ProductId",
              "ASIN",
              "SKU",
              "Title",
              "Description",
              "Price",
              "MRP",
              "Discount",
              "Category",
              "Brand",
              "Tags",
              "Stock",
              "IsActive",
            ],
            Filters: {
              Operator: "AND",
              Condition: [
                {
                  LhsField: "IsActive",
                  Operator: "EQ",
                  RhsType: "Literal",
                  RhsValue: true,
                },
              ],
            },
            Methods: ["read", "list"],
          },
          InventoryManager: {
            Editable: ["Stock", "Warehouse", "ReorderLevel"],
            ReadOnly: ["*"],
            Methods: ["read", "update", "list"],
          },
          WarehouseStaff: {
            Editable: ["Stock"],
            ReadOnly: [
              "ProductId",
              "SKU",
              "Title",
              "Stock",
              "Warehouse",
              "ReorderLevel",
              "LowStock",
            ],
            Filters: {
              Operator: "AND",
              Condition: [
                {
                  LhsField: "Warehouse",
                  Operator: "EQ",
                  RhsType: "Field",
                  RhsValue: { Expression: "CURRENT_USER.Warehouse" },
                },
              ],
            },
            Methods: ["read", "update", "list"],
          },
        },
        Roles: {
          Admin: {
            Name: "Admin",
            Description: "System Administrator with full access",
          },
          Seller: {
            Name: "Seller",
            Description: "Product seller with create and update permissions",
          },
          Buyer: {
            Name: "Buyer",
            Description: "Product buyer with read-only access",
          },
          InventoryManager: {
            Name: "Inventory Manager",
            Description: "Manages inventory levels and warehouse assignments",
          },
          WarehouseStaff: {
            Name: "Warehouse Staff",
            Description: "Updates stock for assigned warehouse",
          },
        },
      };

      sendJSON(schema);
      return;
    }

    // ==================== BDO CART ENDPOINTS ====================

    // BDO Pattern: POST /api/app/BDO_Cart/metric (used for count)
    if (url.match(/^\/api\/app\/BDO_Cart\/metric$/i) && method === "POST") {
      if (role !== "Buyer") {
        sendError("Only buyers can access cart", 403);
        return;
      }

      const count = getCartCount(userId);
      sendJSON({
        Data: [{ _id_Count: count }],
      });
      return;
    }

    // BDO Pattern: POST /api/app/BDO_Cart/list
    if (url.match(/^\/api\/app\/BDO_Cart\/list$/i) && method === "POST") {
      if (role !== "Buyer") {
        sendError("Only buyers can access cart", 403);
        return;
      }

      const items = getCartItems(userId);
      sendJSON({
        Data: items,
      });
      return;
    }

    // BDO Pattern: POST /api/app/BDO_Cart/create
    if (url.match(/^\/api\/app\/BDO_Cart\/create$/i) && method === "POST") {
      if (role !== "Buyer") {
        sendError("Only buyers can add to cart", 403);
        return;
      }

      parseBody().then(async (body) => {
        const item = addToCart(userId, body);

        await sendJSON({
          _id: item._id,
          Success: true,
          Message: "Item added to cart",
        });
      });
      return;
    }

    // BDO Pattern: POST /api/app/BDO_Cart/{instance_id}/update
    if (
      url.match(/^\/api\/app\/BDO_Cart\/([^/]+)\/update$/i) &&
      method === "POST"
    ) {
      if (role !== "Buyer") {
        sendError("Only buyers can update cart", 403);
        return;
      }

      const match = url.match(/^\/api\/app\/BDO_Cart\/([^/]+)\/update$/i);
      const itemId = match[1];

      parseBody().then(async (body) => {
        const item = updateCartItem(userId, itemId, body.quantity);

        if (!item) {
          await sendError("Cart item not found", 404);
          return;
        }

        await sendJSON({
          _id: itemId,
          Success: true,
          Message: "Cart updated",
        });
      });
      return;
    }

    // BDO Pattern: DELETE /api/app/BDO_Cart/{instance_id}/delete
    if (
      url.match(/^\/api\/app\/BDO_Cart\/([^/]+)\/delete$/i) &&
      method === "DELETE"
    ) {
      if (role !== "Buyer") {
        sendError("Only buyers can remove from cart", 403);
        return;
      }

      const match = url.match(/^\/api\/app\/BDO_Cart\/([^/]+)\/delete$/i);
      const itemId = match[1];

      const removed = removeFromCart(userId, itemId);

      if (!removed) {
        sendError("Cart item not found", 404);
        return;
      }

      sendJSON({
        Success: true,
        Message: "Item removed from cart",
      });
      return;
    }

    // BDO Pattern: POST /api/app/BDO_Cart/clear
    if (url.match(/^\/api\/app\/BDO_Cart\/clear$/i) && method === "POST") {
      if (role !== "Buyer") {
        sendError("Only buyers can clear cart", 403);
        return;
      }

      clearCart(userId);

      sendJSON({
        Success: true,
        Message: "Cart cleared",
      });
      return;
    }

    // ==================== BDO PRODUCT RESTOCKING ENDPOINTS ====================

    // BDO Pattern: POST /api/app/BDO_ProductRestocking/list
    if (
      url.match(/^\/api\/app\/BDO_ProductRestocking\/list$/i) &&
      method === "POST"
    ) {
      if (role !== "InventoryManager") {
        sendError("Only inventory managers can access restocking tasks", 403);
        return;
      }

      parseBody().then(async (body) => {
        let tasks = getRestockingTasks(role, userId);
        tasks = applyFiltersAndSearch(tasks, body);

        // Apply sorting
        if (body.Sort && body.Sort[0]) {
          const { Field, Order } = body.Sort[0];
          const direction = Order === "ASC" ? 1 : -1;

          tasks = [...tasks].sort((a, b) => {
            let aVal = a[Field];
            let bVal = b[Field];

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

        const paginatedTasks = tasks.slice(startIndex, endIndex);

        await sendJSON({
          Data: paginatedTasks,
        });
      });
      return;
    }

    // BDO Pattern: POST /api/app/BDO_ProductRestocking/metric (used for count)
    if (
      url.match(/^\/api\/app\/BDO_ProductRestocking\/metric$/i) &&
      method === "POST"
    ) {
      if (role !== "InventoryManager") {
        sendError("Only inventory managers can access restocking tasks", 403);
        return;
      }

      parseBody().then(async (body) => {
        let tasks = getRestockingTasks(role, userId);
        tasks = applyFiltersAndSearch(tasks, body);

        await sendJSON({
          Data: [{ _id_Count: tasks.length }],
        });
      });
      return;
    }

    // BDO Pattern: GET /api/app/BDO_ProductRestocking/{instance_id}/read
    if (
      url.match(/^\/api\/app\/BDO_ProductRestocking\/([^/]+)\/read$/i) &&
      method === "GET"
    ) {
      if (role !== "InventoryManager") {
        sendError("Only inventory managers can access restocking tasks", 403);
        return;
      }

      const match = url.match(
        /^\/api\/app\/BDO_ProductRestocking\/([^/]+)\/read$/i
      );
      const taskId = match[1];

      const task = getRestockingTask(taskId, role);

      if (task) {
        sendJSON({
          Data: task,
        });
      } else {
        sendError(`Restocking task with ID ${taskId} not found`, 404);
      }
      return;
    }

    // BDO Pattern: POST /api/app/BDO_ProductRestocking/create
    if (
      url.match(/^\/api\/app\/BDO_ProductRestocking\/create$/i) &&
      method === "POST"
    ) {
      if (role !== "InventoryManager") {
        sendError("Only inventory managers can create restocking tasks", 403);
        return;
      }

      parseBody().then(async (body) => {
        const newTask = createRestockingTask(body, userId);

        await sendJSON({
          _id: newTask._id,
          Success: true,
          Message: "Restocking task created successfully",
        });
      });
      return;
    }

    // BDO Pattern: POST /api/app/BDO_ProductRestocking/{instance_id}/update
    if (
      url.match(/^\/api\/app\/BDO_ProductRestocking\/([^/]+)\/update$/i) &&
      method === "POST"
    ) {
      if (role !== "InventoryManager") {
        sendError("Only inventory managers can update restocking tasks", 403);
        return;
      }

      const match = url.match(
        /^\/api\/app\/BDO_ProductRestocking\/([^/]+)\/update$/i
      );
      const taskId = match[1];

      parseBody().then(async (body) => {
        const task = updateRestockingTask(taskId, body, userId);

        if (!task) {
          await sendError(`Restocking task with ID ${taskId} not found`, 404);
          return;
        }

        await sendJSON({
          _id: taskId,
          Success: true,
          Message: "Restocking task updated successfully",
        });
      });
      return;
    }

    // BDO Pattern: DELETE /api/app/BDO_ProductRestocking/{instance_id}/delete
    if (
      url.match(/^\/api\/app\/BDO_ProductRestocking\/([^/]+)\/delete$/i) &&
      method === "DELETE"
    ) {
      if (role !== "InventoryManager") {
        sendError("Only inventory managers can delete restocking tasks", 403);
        return;
      }

      const match = url.match(
        /^\/api\/app\/BDO_ProductRestocking\/([^/]+)\/delete$/i
      );
      const taskId = match[1];

      const deleted = deleteRestockingTask(taskId);

      if (!deleted) {
        sendError(`Restocking task with ID ${taskId} not found`, 404);
        return;
      }

      sendJSON({
        Success: true,
        Message: "Restocking task deleted successfully",
      });
      return;
    }

    // If we got here, it's an unhandled route
    next();
  });
}

// Helper function to apply filters and search - same logic but ensures BDO compliance
function applyFiltersAndSearch(products, body) {
  let result = [...products];

  // Apply search
  if (body.Search) {
    const searchValue = body.Search.toLowerCase();
    result = result.filter((product) => {
      const searchableFields = ["Title", "Category", "Description", "Brand"];
      return searchableFields.some((field) => {
        const value = product[field];
        return value && String(value).toLowerCase().includes(searchValue);
      });
    });
  }

  // Apply filtering with BDO structure
  if (body.Filter && body.Filter.Condition) {
    result = result.filter((product) => {
      return evaluateFilterConditions(product, body.Filter);
    });
  }

  return result;
}

// Helper to evaluate filter conditions - enhanced for BDO compliance
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

    // Use LhsField (BDO pattern) or fallback to LHSField (legacy)
    const fieldName = cond.LhsField || cond.LHSField;
    const value = product[fieldName];
    const rhsValue = cond.RhsValue || cond.RHSValue;

    switch (cond.Operator) {
      case "EQ":
        return value === rhsValue;
      case "NE":
        return value !== rhsValue;
      case "GT":
        return Number(value) > Number(rhsValue);
      case "GTE":
        return Number(value) >= Number(rhsValue);
      case "LT":
        return Number(value) < Number(rhsValue);
      case "LTE":
        return Number(value) <= Number(rhsValue);
      case "Contains":
        return String(value)
          .toLowerCase()
          .includes(String(rhsValue).toLowerCase());
      case "IN":
        return Array.isArray(rhsValue) && rhsValue.includes(value);
      case "BETWEEN":
        return (
          Array.isArray(rhsValue) &&
          rhsValue.length === 2 &&
          Number(value) >= Number(rhsValue[0]) &&
          Number(value) <= Number(rhsValue[1])
        );
      default:
        return true;
    }
  });

  // Handle "And"/"Or" (capitalized first letter)
  if (Operator === "And") {
    return results.every(Boolean);
  } else if (Operator === "Or") {
    return results.some(Boolean);
  }

  return true;
}
