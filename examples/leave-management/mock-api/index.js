import { mockLeaveBalances, filterLeaveBalancesByRole } from "./data/leave-balance.js";
import { mockLeaveRequests, filterLeaveRequestsByRole } from "./data/leave-request.js";

export function setupMockAPI(middlewares) {
  console.log("[Leave Management Mock API] Setting up mock API handlers...");

  middlewares.use((req, res, next) => {
    const url = req.url || "";
    const method = req.method || "GET";

    console.log(`[Leave Management Mock API] ${method} ${url}`);

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

    // ==================== LEAVE REQUEST ENDPOINTS ====================
    if (url.includes("/leave-request/count") && method === "POST") {
      parseBody()
        .then(async (body) => {
          const role = req.headers["x-user-role"] || "employee";
          const userId = req.headers["x-user-id"] || "user_001";
          
          let requests = filterLeaveRequestsByRole(mockLeaveRequests, role, userId);

          // Apply search filters
          if (body.Search) {
            const searchValue = body.Search.toLowerCase();
            requests = requests.filter((request) => {
              const searchableFields = ["LeaveRequestId", "FullName", "LeaveType", "CurrentStatus", "Reason"];
              return searchableFields.some((field) => {
                const value = request[field];
                return value && String(value).toLowerCase().includes(searchValue);
              });
            });
          }

          // Apply filters
          if (body.Filter && body.Filter.Condition) {
            requests = requests.filter((request) => {
              return body.Filter.Condition.some((condition) => {
                const value = request[condition.LHSField];
                const searchValue = condition.RHSValue.toLowerCase();

                if (condition.Operator === "Contains") {
                  return String(value).toLowerCase().includes(searchValue);
                }
                return false;
              });
            });
          }

          await sendJSON({
            Count: requests.length,
            Success: true,
            Timestamp: new Date().toISOString(),
          });
        })
        .catch((error) => {
          console.error("[Mock API Error]:", error);
          sendError("Internal server error", 500);
        });
      return;
    }

    if (url.includes("/leave-request/list") && method === "POST") {
      parseBody()
        .then(async (body) => {
          const role = req.headers["x-user-role"] || "employee";
          const userId = req.headers["x-user-id"] || "user_001";

          let requests = filterLeaveRequestsByRole(mockLeaveRequests, role, userId);

          // Apply search filters
          if (body.Search) {
            const searchValue = body.Search.toLowerCase();
            requests = requests.filter((request) => {
              const searchableFields = ["LeaveRequestId", "FullName", "LeaveType", "CurrentStatus", "Reason"];
              return searchableFields.some((field) => {
                const value = request[field];
                return value && String(value).toLowerCase().includes(searchValue);
              });
            });
          }

          // Apply filters
          if (body.Filter && body.Filter.Condition) {
            requests = requests.filter((request) => {
              return body.Filter.Condition.some((condition) => {
                const value = request[condition.LHSField];
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

            requests = [...requests].sort((a, b) => {
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

          const paginatedRequests = requests.slice(startIndex, endIndex);

          await sendJSON({
            Data: paginatedRequests,
            Success: true,
            Timestamp: new Date().toISOString(),
          });
        })
        .catch((error) => {
          console.error("[Mock API Error]:", error);
          sendError("Internal server error", 500);
        });
      return;
    }

    // ==================== LEAVE BALANCE ENDPOINTS ====================
    if (url.includes("/leave-balance/count") && method === "POST") {
      parseBody()
        .then(async (body) => {
          const role = req.headers["x-user-role"] || "employee";
          const userId = req.headers["x-user-id"] || "user_001";
          
          let balances = filterLeaveBalancesByRole(mockLeaveBalances, role, userId);

          await sendJSON({
            Count: balances.length,
            Success: true,
            Timestamp: new Date().toISOString(),
          });
        })
        .catch((error) => {
          console.error("[Mock API Error]:", error);
          sendError("Internal server error", 500);
        });
      return;
    }

    if (url.includes("/leave-balance/list") && method === "POST") {
      parseBody()
        .then(async (body) => {
          const role = req.headers["x-user-role"] || "employee";
          const userId = req.headers["x-user-id"] || "user_001";

          let balances = filterLeaveBalancesByRole(mockLeaveBalances, role, userId);

          // Apply pagination
          const page = body.Page || 1;
          const pageSize = body.PageSize || 10;
          const startIndex = (page - 1) * pageSize;
          const endIndex = startIndex + pageSize;

          const paginatedBalances = balances.slice(startIndex, endIndex);

          await sendJSON({
            Data: paginatedBalances,
            Success: true,
            Timestamp: new Date().toISOString(),
          });
        })
        .catch((error) => {
          console.error("[Mock API Error]:", error);
          sendError("Internal server error", 500);
        });
      return;
    }

    // ==================== READ ENDPOINTS ====================
    if (url.match(/\/api\/bo\/leave-request\/[^/]+\/read$/i) && method === "GET") {
      const pathParts = url.split("/");
      const requestId = pathParts[pathParts.length - 2];
      const role = req.headers["x-user-role"] || "employee";
      const userId = req.headers["x-user-id"] || "user_001";

      const requests = filterLeaveRequestsByRole(mockLeaveRequests, role, userId);
      const request = requests.find((r) => r._id === requestId);

      if (request) {
        sendJSON({
          Data: request,
          Success: true,
          Timestamp: new Date().toISOString(),
        });
      } else {
        sendError(`Leave request with ID ${requestId} not found`, 404);
      }
      return;
    }

    // ==================== CREATE/UPDATE ENDPOINTS ====================
    if (url.match(/\/api\/bo\/leave-request\/create$/i) && method === "POST") {
      parseBody().then(async (body) => {
        const newId = `lr_${Date.now()}`;
        const leaveRequestId = `LR-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;
        
        await sendJSON({
          Success: true,
          Data: { 
            _id: newId, 
            LeaveRequestId: leaveRequestId,
            CurrentStatus: "INITIATE",
            CreatedAt: new Date().toISOString()
          },
          Message: "Leave request created successfully",
          Timestamp: new Date().toISOString(),
        });
      });
      return;
    }

    if (url.match(/\/api\/bo\/leave-request\/[^/]+\/update$/i) && method === "POST") {
      parseBody().then(async (body) => {
        const pathParts = url.split("/");
        const requestId = pathParts[pathParts.length - 2];

        await sendJSON({
          Success: true,
          Data: { 
            ...body, 
            _id: requestId,
            UpdatedAt: new Date().toISOString()
          },
          Message: "Leave request updated successfully",
          Timestamp: new Date().toISOString(),
        });
      });
      return;
    }

    // ==================== FORM SCHEMA ENDPOINTS ====================
    if (url.includes("/api/bo/leave-request/field") && method === "GET") {
      const role = req.headers["x-user-role"] || "employee";

      let schema = {
        StartDate: {
          Type: "Date",
          Required: true,
        },
        EndDate: {
          Type: "Date", 
          Required: true,
        },
        LeaveType: {
          Type: "String",
          Required: true,
          Values: {
            Mode: "Static",
            Items: [
              { Value: "PTO", Label: "Paid Time Off" },
              { Value: "Sick", Label: "Sick Leave" },
              { Value: "Parental", Label: "Parental Leave" },
            ],
          },
        },
        Reason: {
          Type: "String",
          Required: true,
          Validation: [
            {
              Id: "VAL_REASON_001",
              Type: "Expression",
              Message: "Reason must be at least 10 characters",
            },
          ],
        },
      };

      // Manager-specific fields
      if (role === "manager") {
        schema.ManagerRemarks = {
          Type: "String",
          Required: false,
        };
        schema.ManagerApproved = {
          Type: "Boolean",
          Required: false,
        };
      }

      sendJSON(schema);
      return;
    }

    // If we got here, it's an unhandled route
    next();
  });
}