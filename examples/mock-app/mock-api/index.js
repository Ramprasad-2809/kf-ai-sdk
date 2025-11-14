import { mockProducts, filterProductsByRole } from './data/products.js';
import { mockOrders, filterOrdersByRole } from './data/orders.js';

export function setupMockAPI(middlewares) {
  console.log('[Mock API] Setting up mock API handlers...');
  
  middlewares.use((req, res, next) => {
    const url = req.url || '';
    const method = req.method || 'GET';

    console.log(`[Mock API] ${method} ${url}`);

    // Add delay to simulate network
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Parse body for POST/PUT
    const parseBody = () => {
      return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', () => {
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
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-role, x-user-id');
      res.end(JSON.stringify(data));
    };

    const sendError = async (message, status = 500) => {
      await delay(200);
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-role, x-user-id');
      res.end(JSON.stringify({ 
        error: message,
        timestamp: new Date().toISOString()
      }));
    };

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      res.statusCode = 200;
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-role, x-user-id');
      res.end();
      return;
    }

    // ==================== PRODUCT ENDPOINTS ====================
    if (url.includes('/product/count') && method === 'POST') {
      parseBody().then(async (body) => {
        // Check for error simulation
        const errorType = new URL(req.url, 'http://localhost').searchParams.get('error');
        
        if (errorType === 'network') {
          await sendError('Network error simulation', 500);
          return;
        }
        
        if (errorType === 'auth') {
          await sendError('Unauthorized access', 401);
          return;
        }

        // Get role from headers
        const role = req.headers['x-user-role'] || 'admin';
        
        // Filter products by role
        let products = filterProductsByRole(mockProducts, role);
        
        // Apply search (separate from filters)
        if (body.Search) {
          const searchValue = body.Search.toLowerCase();
          products = products.filter(product => {
            // Search across multiple fields
            const searchableFields = ['name', 'category', 'supplier'];
            return searchableFields.some(field => {
              const value = product[field];
              return value && String(value).toLowerCase().includes(searchValue);
            });
          });
        }
        
        // Apply filtering from request body (separate from search)
        if (body.Filter && body.Filter.Condition) {
          products = products.filter(product => {
            return body.Filter.Condition.some(condition => {
              const value = product[condition.LHSField];
              const searchValue = condition.RHSValue.toLowerCase();
              
              if (condition.Operator === 'Contains') {
                return String(value).toLowerCase().includes(searchValue);
              }
              return false;
            });
          });
        }
        
        await sendJSON({
          Count: products.length,
          Success: true,
          Timestamp: new Date().toISOString()
        });
      }).catch(error => {
        console.error('[Mock API Error]:', error);
        sendError('Internal server error', 500);
      });
      return;
    }

    if (url.includes('/product/list') && method === 'POST') {
      parseBody().then(async (body) => {
        // Check for error simulation
        const errorType = new URL(req.url, 'http://localhost').searchParams.get('error');
        
        if (errorType === 'network') {
          await sendError('Network error simulation', 500);
          return;
        }
        
        if (errorType === 'auth') {
          await sendError('Unauthorized access', 401);
          return;
        }
        
        if (errorType === 'notfound') {
          await sendError('Products not found', 404);
          return;
        }

        // Get role from headers
        const role = req.headers['x-user-role'] || 'admin';
        
        // Filter products by role
        let products = filterProductsByRole(mockProducts, role);
        
        // Apply search (separate from filters)
        if (body.Search) {
          const searchValue = body.Search.toLowerCase();
          products = products.filter(product => {
            // Search across multiple fields
            const searchableFields = ['name', 'category', 'supplier'];
            return searchableFields.some(field => {
              const value = product[field];
              return value && String(value).toLowerCase().includes(searchValue);
            });
          });
        }
        
        // Apply filtering from request body (separate from search)
        if (body.Filter && body.Filter.Condition) {
          products = products.filter(product => {
            return body.Filter.Condition.some(condition => {
              const value = product[condition.LHSField];
              const searchValue = condition.RHSValue.toLowerCase();
              
              if (condition.Operator === 'Contains') {
                return String(value).toLowerCase().includes(searchValue);
              }
              return false;
            });
          });
        }
        
        // Apply sorting
        if (body.Sort && body.Sort[0]) {
          const { Field, Order } = body.Sort[0];
          const direction = Order === 'ASC' ? 1 : -1;
          
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
          Timestamp: new Date().toISOString()
        });
      }).catch(error => {
        console.error('[Mock API Error]:', error);
        sendError('Internal server error', 500);
      });
      return;
    }

    // Product read endpoint - exclude /field and /read paths
    if (url.match(/\/product\/[^/]+$/i) && !url.includes('/field') && !url.includes('/read') && method === 'GET') {
      const productId = url.split('/').pop();
      const role = req.headers['x-user-role'] || 'admin';
      
      const products = filterProductsByRole(mockProducts, role);
      const product = products.find(p => p._id === productId);
      
      if (product) {
        sendJSON({
          Data: product,
          Success: true,
          Timestamp: new Date().toISOString()
        });
      } else {
        sendError(`Product with ID ${productId} not found`, 404);
      }
      return;
    }

    // ==================== ORDER ENDPOINTS ====================
    if (url.includes('/order/count') && method === 'POST') {
      parseBody().then(async (body) => {
        // Check for error simulation
        const errorType = new URL(req.url, 'http://localhost').searchParams.get('error');
        
        if (errorType === 'network') {
          await sendError('Network error simulation', 500);
          return;
        }
        
        if (errorType === 'auth') {
          await sendError('Unauthorized access', 401);
          return;
        }

        // Get role from headers
        const role = req.headers['x-user-role'] || 'admin';
        
        // Filter orders by role
        let orders = filterOrdersByRole(mockOrders, role);
        
        // For user role, only show their own orders (simulate)
        if (role === 'user') {
          const userId = req.headers['x-user-id'] || 'user_001';
          orders = orders.filter(order => 
            order.customerEmail.includes('customer1') || 
            order.customerEmail.includes('customer2')
          );
        }
        
        // Apply search (separate from filters)
        if (body.Search) {
          const searchValue = body.Search.toLowerCase();
          orders = orders.filter(order => {
            // Search across multiple fields
            const searchableFields = ['_id', 'customerName', 'customerEmail', 'status'];
            return searchableFields.some(field => {
              const value = order[field];
              return value && String(value).toLowerCase().includes(searchValue);
            });
          });
        }
        
        // Apply filtering from request body (separate from search)
        if (body.Filter && body.Filter.Condition) {
          orders = orders.filter(order => {
            return body.Filter.Condition.some(condition => {
              const value = order[condition.LHSField];
              const searchValue = condition.RHSValue.toLowerCase();
              
              if (condition.Operator === 'Contains') {
                return String(value).toLowerCase().includes(searchValue);
              }
              return false;
            });
          });
        }
        
        await sendJSON({
          Count: orders.length,
          Success: true,
          Timestamp: new Date().toISOString()
        });
      }).catch(error => {
        console.error('[Mock API Error]:', error);
        sendError('Internal server error', 500);
      });
      return;
    }

    if (url.includes('/order/list') && method === 'POST') {
      parseBody().then(async (body) => {
        // Check for error simulation
        const errorType = new URL(req.url, 'http://localhost').searchParams.get('error');
        
        if (errorType === 'network') {
          await sendError('Network error simulation', 500);
          return;
        }
        
        if (errorType === 'auth') {
          await sendError('Unauthorized access', 401);
          return;
        }

        // Get role from headers
        const role = req.headers['x-user-role'] || 'admin';
        
        // Filter orders by role
        let orders = filterOrdersByRole(mockOrders, role);
        
        // For user role, only show their own orders (simulate)
        if (role === 'user') {
          const userId = req.headers['x-user-id'] || 'user_001';
          orders = orders.filter(order => 
            order.customerEmail.includes('customer1') || 
            order.customerEmail.includes('customer2')
          );
        }
        
        // Apply search (separate from filters)
        if (body.Search) {
          const searchValue = body.Search.toLowerCase();
          orders = orders.filter(order => {
            // Search across multiple fields
            const searchableFields = ['_id', 'customerName', 'customerEmail', 'status'];
            return searchableFields.some(field => {
              const value = order[field];
              return value && String(value).toLowerCase().includes(searchValue);
            });
          });
        }
        
        // Apply filtering from request body (separate from search)
        if (body.Filter && body.Filter.Condition) {
          orders = orders.filter(order => {
            return body.Filter.Condition.some(condition => {
              const value = order[condition.LHSField];
              const searchValue = condition.RHSValue.toLowerCase();
              
              if (condition.Operator === 'Contains') {
                return String(value).toLowerCase().includes(searchValue);
              }
              return false;
            });
          });
        }
        
        // Apply sorting
        if (body.Sort && body.Sort[0]) {
          const { Field, Order } = body.Sort[0];
          const direction = Order === 'ASC' ? 1 : -1;
          
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
          Timestamp: new Date().toISOString()
        });
      }).catch(error => {
        console.error('[Mock API Error]:', error);
        sendError('Internal server error', 500);
      });
      return;
    }

    // Order read endpoint - exclude /field and /read paths  
    if (url.match(/\/order\/[^/]+$/i) && !url.includes('/field') && !url.includes('/read') && method === 'GET') {
      const orderId = url.split('/').pop();
      const role = req.headers['x-user-role'] || 'admin';
      
      const orders = filterOrdersByRole(mockOrders, role);
      const order = orders.find(o => o._id === orderId);
      
      if (!order) {
        sendError(`Order with ID ${orderId} not found`, 404);
        return;
      }
      
      // For user role, check if they own this order
      if (role === 'user') {
        const userId = req.headers['x-user-id'] || 'user_001';
        if (!order.customerEmail.includes('customer1') && !order.customerEmail.includes('customer2')) {
          sendError('You can only view your own orders', 403);
          return;
        }
      }
      
      sendJSON({
        Data: order,
        Success: true,
        Timestamp: new Date().toISOString()
      });
      return;
    }

    // ==================== READ ENDPOINTS ====================
    // Product read endpoint: /api/bo/product/{item_id}/read
    if (url.match(/\/api\/bo\/product\/[^/]+\/read$/i) && method === 'GET') {
      const pathParts = url.split('/');
      const productId = pathParts[pathParts.length - 2]; // Get the ID before '/read'
      const role = req.headers['x-user-role'] || 'admin';
      
      const products = filterProductsByRole(mockProducts, role);
      const product = products.find(p => p._id === productId);
      
      if (product) {
        sendJSON({
          Data: product,
          Success: true,
          Timestamp: new Date().toISOString()
        });
      } else {
        sendError(`Product with ID ${productId} not found`, 404);
      }
      return;
    }

    // Order read endpoint: /api/bo/order/{item_id}/read
    if (url.match(/\/api\/bo\/order\/[^/]+\/read$/i) && method === 'GET') {
      const pathParts = url.split('/');
      const orderId = pathParts[pathParts.length - 2]; // Get the ID before '/read'
      const role = req.headers['x-user-role'] || 'admin';
      
      const orders = filterOrdersByRole(mockOrders, role);
      const order = orders.find(o => o._id === orderId);
      
      if (order) {
        sendJSON({
          Data: order,
          Success: true,
          Timestamp: new Date().toISOString()
        });
      } else {
        sendError(`Order with ID ${orderId} not found`, 404);
      }
      return;
    }

    // ==================== CREATE/UPDATE ENDPOINTS ====================
    // Product create endpoint: /api/bo/product/create
    if (url.match(/\/api\/bo\/product\/create$/i) && method === 'POST') {
      parseBody().then(async (body) => {
        await sendJSON({
          Success: true,
          Data: { ...body, _id: `product_${Date.now()}` },
          Message: 'Product created successfully',
          Timestamp: new Date().toISOString()
        });
      });
      return;
    }

    // Product update endpoint: /api/bo/product/{id}/update  
    if (url.match(/\/api\/bo\/product\/[^/]+\/update$/i) && method === 'POST') {
      parseBody().then(async (body) => {
        const pathParts = url.split('/');
        const productId = pathParts[pathParts.length - 2]; // Get the ID before '/update'
        
        await sendJSON({
          Success: true,
          Data: { ...body, _id: productId },
          Message: 'Product updated successfully',
          Timestamp: new Date().toISOString()
        });
      });
      return;
    }

    // Order create endpoint: /api/bo/order/create
    if (url.match(/\/api\/bo\/order\/create$/i) && method === 'POST') {
      parseBody().then(async (body) => {
        await sendJSON({
          Success: true,
          Data: { ...body, _id: `order_${Date.now()}` },
          Message: 'Order created successfully',
          Timestamp: new Date().toISOString()
        });
      });
      return;
    }

    // Order update endpoint: /api/bo/order/{id}/update
    if (url.match(/\/api\/bo\/order\/[^/]+\/update$/i) && method === 'POST') {
      parseBody().then(async (body) => {
        const pathParts = url.split('/');
        const orderId = pathParts[pathParts.length - 2]; // Get the ID before '/update'
        
        await sendJSON({
          Success: true,
          Data: { ...body, _id: orderId },
          Message: 'Order updated successfully',
          Timestamp: new Date().toISOString()
        });
      });
      return;
    }

    // ==================== FORM SCHEMA ENDPOINTS ====================
    if (url.includes('/api/bo/product/field') && method === 'GET') {
      sendJSON({
        "name": {
          "Type": "String",
          "Required": true,
          "Validation": [
            {
              "Id": "VAL_PRODUCT_NAME_001",
              "Type": "Expression",
              "Condition": {
                "Expression": "LENGTH(TRIM(name)) >= 2",
                "ExpressionTree": {
                  "Type": "BinaryExpression",
                  "Operator": ">=",
                  "Arguments": [
                    {
                      "Type": "CallExpression",
                      "Callee": "LENGTH",
                      "Arguments": [
                        {
                          "Type": "CallExpression",
                          "Callee": "TRIM",
                          "Arguments": [
                            {
                              "Type": "Identifier",
                              "Name": "name",
                              "Source": "BO_Product"
                            }
                          ]
                        }
                      ]
                    },
                    {
                      "Type": "Literal",
                      "Value": 2
                    }
                  ]
                }
              },
              "Message": "Product name must be at least 2 characters"
            }
          ]
        },
        "description": {
          "Type": "String",
          "Required": true,
          "Validation": [
            {
              "Id": "VAL_PRODUCT_DESC_001",
              "Type": "Expression",
              "Condition": {
                "Expression": "LENGTH(TRIM(description)) >= 10",
                "ExpressionTree": {
                  "Type": "BinaryExpression",
                  "Operator": ">=",
                  "Arguments": [
                    {
                      "Type": "CallExpression",
                      "Callee": "LENGTH",
                      "Arguments": [
                        {
                          "Type": "CallExpression",
                          "Callee": "TRIM",
                          "Arguments": [
                            {
                              "Type": "Identifier",
                              "Name": "description",
                              "Source": "BO_Product"
                            }
                          ]
                        }
                      ]
                    },
                    {
                      "Type": "Literal",
                      "Value": 10
                    }
                  ]
                }
              },
              "Message": "Description must be at least 10 characters"
            }
          ]
        },
        "price": {
          "Type": "Number",
          "Required": true,
          "Validation": [
            {
              "Id": "VAL_PRODUCT_PRICE_001",
              "Type": "Expression",
              "Condition": {
                "Expression": "price > 0 AND price <= 10000",
                "ExpressionTree": {
                  "Type": "LogicalExpression",
                  "Operator": "AND",
                  "Arguments": [
                    {
                      "Type": "BinaryExpression",
                      "Operator": ">",
                      "Arguments": [
                        {
                          "Type": "Identifier",
                          "Name": "price",
                          "Source": "BO_Product"
                        },
                        {
                          "Type": "Literal",
                          "Value": 0
                        }
                      ]
                    },
                    {
                      "Type": "BinaryExpression",
                      "Operator": "<=",
                      "Arguments": [
                        {
                          "Type": "Identifier",
                          "Name": "price",
                          "Source": "BO_Product"
                        },
                        {
                          "Type": "Literal",
                          "Value": 10000
                        }
                      ]
                    }
                  ]
                }
              },
              "Message": "Price must be between $0.01 and $10,000"
            }
          ]
        },
        "category": {
          "Type": "String",
          "Required": true,
          "Values": {
            "Mode": "Static",
            "Items": [
              {"Value": "electronics", "Label": "Electronics"},
              {"Value": "clothing", "Label": "Clothing"},
              {"Value": "books", "Label": "Books"},
              {"Value": "home", "Label": "Home & Garden"},
              {"Value": "sports", "Label": "Sports"}
            ]
          }
        },
        "inStock": {
          "Type": "Boolean",
          "DefaultValue": {
            "Expression": "true",
            "ExpressionTree": {
              "Type": "AssignmentExpression",
              "Arguments": [
                {
                  "Type": "Literal",
                  "Value": true
                }
              ]
            }
          }
        }
      });
      return;
    }

    if (url.includes('/api/bo/order/field') && method === 'GET') {
      sendJSON({
        "customerName": {
          "Type": "String",
          "Required": true,
          "Validation": [
            {
              "Id": "VAL_ORDER_CUSTOMER_001",
              "Type": "Expression",
              "Condition": {
                "Expression": "LENGTH(TRIM(customerName)) >= 2",
                "ExpressionTree": {
                  "Type": "BinaryExpression",
                  "Operator": ">=",
                  "Arguments": [
                    {
                      "Type": "CallExpression",
                      "Callee": "LENGTH",
                      "Arguments": [
                        {
                          "Type": "CallExpression",
                          "Callee": "TRIM",
                          "Arguments": [
                            {
                              "Type": "Identifier",
                              "Name": "customerName",
                              "Source": "BO_Order"
                            }
                          ]
                        }
                      ]
                    },
                    {
                      "Type": "Literal",
                      "Value": 2
                    }
                  ]
                }
              },
              "Message": "Customer name must be at least 2 characters"
            }
          ]
        },
        "customerEmail": {
          "Type": "String",
          "Required": true,
          "Validation": [
            {
              "Id": "VAL_ORDER_EMAIL_001",
              "Type": "Expression",
              "Condition": {
                "Expression": "CONTAINS(customerEmail, '@')",
                "ExpressionTree": {
                  "Type": "CallExpression",
                  "Callee": "CONTAINS",
                  "Arguments": [
                    {
                      "Type": "Identifier",
                      "Name": "customerEmail",
                      "Source": "BO_Order"
                    },
                    {
                      "Type": "Literal",
                      "Value": "@"
                    }
                  ]
                }
              },
              "Message": "Please enter a valid email address"
            }
          ]
        },
        "status": {
          "Type": "String",
          "Required": true,
          "Values": {
            "Mode": "Static",
            "Items": [
              {"Value": "pending", "Label": "Pending"},
              {"Value": "processing", "Label": "Processing"},
              {"Value": "shipped", "Label": "Shipped"},
              {"Value": "delivered", "Label": "Delivered"},
              {"Value": "cancelled", "Label": "Cancelled"}
            ]
          },
          "DefaultValue": {
            "Expression": "pending",
            "ExpressionTree": {
              "Type": "AssignmentExpression",
              "Arguments": [
                {
                  "Type": "Literal",
                  "Value": "pending"
                }
              ]
            }
          }
        },
        "total": {
          "Type": "Number",
          "Required": true,
          "Validation": [
            {
              "Id": "VAL_ORDER_TOTAL_001",
              "Type": "Expression",
              "Condition": {
                "Expression": "total > 0",
                "ExpressionTree": {
                  "Type": "BinaryExpression",
                  "Operator": ">",
                  "Arguments": [
                    {
                      "Type": "Identifier",
                      "Name": "total",
                      "Source": "BO_Order"
                    },
                    {
                      "Type": "Literal",
                      "Value": 0
                    }
                  ]
                }
              },
              "Message": "Order total must be greater than $0"
            }
          ]
        },
        "itemCount": {
          "Type": "Number",
          "Required": true,
          "Validation": [
            {
              "Id": "VAL_ORDER_ITEMS_001",
              "Type": "Expression",
              "Condition": {
                "Expression": "itemCount >= 1 AND itemCount <= 100",
                "ExpressionTree": {
                  "Type": "LogicalExpression",
                  "Operator": "AND",
                  "Arguments": [
                    {
                      "Type": "BinaryExpression",
                      "Operator": ">=",
                      "Arguments": [
                        {
                          "Type": "Identifier",
                          "Name": "itemCount",
                          "Source": "BO_Order"
                        },
                        {
                          "Type": "Literal",
                          "Value": 1
                        }
                      ]
                    },
                    {
                      "Type": "BinaryExpression",
                      "Operator": "<=",
                      "Arguments": [
                        {
                          "Type": "Identifier",
                          "Name": "itemCount",
                          "Source": "BO_Order"
                        },
                        {
                          "Type": "Literal",
                          "Value": 100
                        }
                      ]
                    }
                  ]
                }
              },
              "Message": "Item count must be between 1 and 100"
            }
          ]
        },
        "orderSummary": {
          "Type": "String",
          "Formula": {
            "Expression": "CONCAT(itemCount, ' items totaling $', total, ' for ', customerName)",
            "ExpressionTree": {
              "Type": "CallExpression",
              "Callee": "CONCAT",
              "Arguments": [
                {
                  "Type": "Identifier",
                  "Name": "itemCount",
                  "Source": "BO_Order"
                },
                {
                  "Type": "Literal",
                  "Value": " items totaling $"
                },
                {
                  "Type": "Identifier",
                  "Name": "total",
                  "Source": "BO_Order"
                },
                {
                  "Type": "Literal",
                  "Value": " for "
                },
                {
                  "Type": "Identifier",
                  "Name": "customerName",
                  "Source": "BO_Order"
                }
              ]
            }
          },
          "Computed": true
        }
      });
      return;
    }

    // ==================== CREATE/UPDATE/DELETE ====================
    if (url.includes('/product') && method === 'POST' && !url.includes('/list')) {
      const role = req.headers['x-user-role'] || 'admin';
      
      if (role !== 'admin') {
        sendError('Only admins can create products', 403);
        return;
      }
      
      parseBody().then(async (body) => {
        const newId = `product_${Date.now()}`;
        
        await sendJSON({
          Success: true,
          Data: { _id: newId },
          Message: 'Product created successfully',
          Timestamp: new Date().toISOString()
        }, 201);
      });
      return;
    }

    if (url.includes('/order') && method === 'POST' && !url.includes('/list')) {
      parseBody().then(async (body) => {
        const newId = `order_${Date.now()}`;
        
        await sendJSON({
          Success: true,
          Data: { _id: newId },
          Message: 'Order created successfully',
          Timestamp: new Date().toISOString()
        }, 201);
      });
      return;
    }

    // If we got here, it's an unhandled route
    next();
  });
}