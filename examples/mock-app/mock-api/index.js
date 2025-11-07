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
        
        // Apply filtering from request body
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

    if (url.match(/\/product\/[^/]+$/i) && method === 'GET') {
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
        
        // Apply filtering from request body
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

    if (url.match(/\/order\/[^/]+$/i) && method === 'GET') {
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