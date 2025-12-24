// Mock restocking task data
export let mockRestockingTasks = [
  {
    _id: "RESTOCK-001",
    title: "Wireless Bluetooth Headphones - Restock",
    columnId: "LowStockAlert",
    position: 0,
    productId: "PROD-001",
    productTitle: "Wireless Bluetooth Headphones",
    productSKU: "WBH-001",
    productASIN: "B08X12AB34",
    currentStock: 3,
    reorderLevel: 10,
    warehouse: "Warehouse_A",
    quantityOrdered: 50,
    estimatedCost: { value: 1500, currency: "USD" },
    supplier: "",
    orderDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    expectedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    status: "LowStockAlert",
    priority: "Critical",
    notes: "Stock critically low. Urgent reorder needed.",
    _created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    _modified_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    _created_by: { _id: "inventory_001", username: "inventorymanager" },
    _modified_by: { _id: "inventory_001", username: "inventorymanager" },
    _version: "1.0",
    _m_version: "1.0",
  },
  {
    _id: "RESTOCK-002",
    title: "4K Smart TV 55 inch - Restock",
    columnId: "OrderPlaced",
    position: 0,
    productId: "PROD-002",
    productTitle: "4K Smart TV 55 inch",
    productSKU: "TV-55-4K-001",
    productASIN: "B08Y34CD56",
    currentStock: 5,
    reorderLevel: 10,
    warehouse: "Warehouse_A",
    quantityOrdered: 25,
    estimatedCost: { value: 12500, currency: "USD" },
    supplier: "TechVision Distributors",
    orderDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    status: "OrderPlaced",
    priority: "High",
    notes: "Order #ORD-2024-1234 placed with supplier. Tracking number: TRK789012",
    _created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    _modified_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    _created_by: { _id: "inventory_001", username: "inventorymanager" },
    _modified_by: { _id: "inventory_001", username: "inventorymanager" },
    _version: "1.0",
    _m_version: "1.0",
  },
  {
    _id: "RESTOCK-003",
    title: "Running Shoes Size 10 - Restock",
    columnId: "InTransit",
    position: 0,
    productId: "PROD-003",
    productTitle: "Running Shoes Size 10",
    productSKU: "SHOE-RUN-10",
    productASIN: "B09Z56EF78",
    currentStock: 8,
    reorderLevel: 15,
    warehouse: "Warehouse_B",
    quantityOrdered: 100,
    estimatedCost: { value: 4000, currency: "USD" },
    supplier: "SportGear International",
    orderDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    expectedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    status: "InTransit",
    priority: "Medium",
    notes: "Shipment departed from port. ETA: 2 days. Tracking: SHIP456789",
    _created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    _modified_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    _created_by: { _id: "inventory_001", username: "inventorymanager" },
    _modified_by: { _id: "inventory_001", username: "inventorymanager" },
    _version: "1.0",
    _m_version: "1.0",
  },
  {
    _id: "RESTOCK-004",
    title: "Coffee Maker Deluxe - Restock",
    columnId: "LowStockAlert",
    position: 1,
    productId: "PROD-004",
    productTitle: "Coffee Maker Deluxe",
    productSKU: "CM-DLX-001",
    productASIN: "B07A78GH90",
    currentStock: 2,
    reorderLevel: 8,
    warehouse: "Warehouse_C",
    quantityOrdered: 30,
    estimatedCost: { value: 1200, currency: "USD" },
    supplier: "",
    orderDate: new Date(Date.now()).toISOString(), // today
    expectedDeliveryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
    status: "LowStockAlert",
    priority: "High",
    notes: "Popular item during morning rush. Need quick turnaround.",
    _created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    _modified_at: new Date(Date.now()).toISOString(),
    _created_by: { _id: "inventory_001", username: "inventorymanager" },
    _modified_by: { _id: "inventory_001", username: "inventorymanager" },
    _version: "1.0",
    _m_version: "1.0",
  },
  {
    _id: "RESTOCK-005",
    title: "Yoga Mat Premium - Restock",
    columnId: "OrderPlaced",
    position: 1,
    productId: "PROD-005",
    productTitle: "Yoga Mat Premium",
    productSKU: "YM-PREM-001",
    productASIN: "B06B89IJ01",
    currentStock: 12,
    reorderLevel: 20,
    warehouse: "Warehouse_B",
    quantityOrdered: 75,
    estimatedCost: { value: 1875, currency: "USD" },
    supplier: "Wellness Suppliers LLC",
    orderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    expectedDeliveryDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days from now
    status: "OrderPlaced",
    priority: "Medium",
    notes: "Seasonal demand increase expected. PO#WS-2024-5678",
    _created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    _modified_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    _created_by: { _id: "inventory_001", username: "inventorymanager" },
    _modified_by: { _id: "inventory_001", username: "inventorymanager" },
    _version: "1.0",
    _m_version: "1.0",
  },
];

// Helper functions
export function getRestockingTasks(role, userId) {
  // Only inventory managers can access restocking tasks
  if (role !== "InventoryManager") {
    return [];
  }

  return mockRestockingTasks;
}

export function getRestockingTask(taskId, role) {
  if (role !== "InventoryManager") {
    return null;
  }

  return mockRestockingTasks.find((task) => task._id === taskId);
}

export function createRestockingTask(data, userId) {
  const newId = `RESTOCK-${String(mockRestockingTasks.length + 1).padStart(3, "0")}`;

  const newTask = {
    _id: newId,
    title: data.title || `${data.productTitle} - Restock`,
    columnId: data.columnId || "LowStockAlert",
    position: data.position || 0,
    productId: data.productId,
    productTitle: data.productTitle,
    productSKU: data.productSKU,
    productASIN: data.productASIN,
    currentStock: data.currentStock || 0,
    reorderLevel: data.reorderLevel || 10,
    warehouse: data.warehouse || "Warehouse_A",
    quantityOrdered: data.quantityOrdered || 0,
    estimatedCost: data.estimatedCost || { value: 0, currency: "USD" },
    supplier: data.supplier || "",
    orderDate: data.orderDate || new Date().toISOString(),
    expectedDeliveryDate: data.expectedDeliveryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: data.status || data.columnId || "LowStockAlert",
    priority: data.priority || calculatePriority(data.currentStock, data.reorderLevel),
    notes: data.notes || "",
    _created_at: new Date().toISOString(),
    _modified_at: new Date().toISOString(),
    _created_by: { _id: userId, username: "inventorymanager" },
    _modified_by: { _id: userId, username: "inventorymanager" },
    _version: "1.0",
    _m_version: "1.0",
  };

  mockRestockingTasks.push(newTask);
  return newTask;
}

export function updateRestockingTask(taskId, data, userId) {
  const task = mockRestockingTasks.find((t) => t._id === taskId);

  if (!task) {
    return null;
  }

  // Update fields
  Object.assign(task, data, {
    _modified_at: new Date().toISOString(),
    _modified_by: { _id: userId, username: "inventorymanager" },
  });

  // Ensure status matches columnId
  if (data.columnId) {
    task.status = data.columnId;
  }

  return task;
}

export function deleteRestockingTask(taskId) {
  const index = mockRestockingTasks.findIndex((t) => t._id === taskId);

  if (index === -1) {
    return false;
  }

  mockRestockingTasks.splice(index, 1);
  return true;
}

function calculatePriority(currentStock, reorderLevel) {
  if (currentStock === 0) return "Critical";

  const percentage = (currentStock / reorderLevel) * 100;

  if (percentage <= 25) return "Critical";
  if (percentage <= 50) return "High";
  if (percentage <= 75) return "Medium";
  return "Low";
}
