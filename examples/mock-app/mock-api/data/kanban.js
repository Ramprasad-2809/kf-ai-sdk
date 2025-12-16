// ============================================================
// MOCK DATA - KANBAN BOARDS
// ============================================================

export const mockColumns = [
  {
    _id: "col_todo",
    title: "To Do",
    position: 0,
    color: "#e3f2fd",
    limit: null,
    _created_at: new Date("2024-01-01T10:00:00Z"),
    _modified_at: new Date("2024-01-01T10:00:00Z"),
  },
  {
    _id: "col_progress",
    title: "In Progress",
    position: 1,
    color: "#fff3e0",
    limit: 3,
    _created_at: new Date("2024-01-01T10:05:00Z"),
    _modified_at: new Date("2024-01-01T10:05:00Z"),
  },
  {
    _id: "col_review",
    title: "Review",
    position: 2,
    color: "#fce4ec",
    limit: 2,
    _created_at: new Date("2024-01-01T10:10:00Z"),
    _modified_at: new Date("2024-01-01T10:10:00Z"),
  },
  {
    _id: "col_done",
    title: "Done",
    position: 3,
    color: "#e8f5e8",
    limit: null,
    _created_at: new Date("2024-01-01T10:15:00Z"),
    _modified_at: new Date("2024-01-01T10:15:00Z"),
  },
];

export const mockCards = [
  {
    _id: "task_001",
    title: "Setup project repository",
    description: "Initialize the project with proper folder structure, README, and basic configuration files.",
    columnId: "col_done",
    position: 0,
    priority: "medium",
    assignee: "John Smith",
    tags: ["setup", "infrastructure"],
    estimatedHours: 2,
    dueDate: "2024-01-15",
    _created_at: new Date("2024-01-01T11:00:00Z"),
    _modified_at: new Date("2024-01-02T14:30:00Z"),
  },
  {
    _id: "task_002",
    title: "Design database schema",
    description: "Create comprehensive database schema for user management, permissions, and core functionality.",
    columnId: "col_done",
    position: 1,
    priority: "high",
    assignee: "Sarah Johnson",
    tags: ["database", "design"],
    estimatedHours: 8,
    dueDate: "2024-01-20",
    _created_at: new Date("2024-01-02T09:00:00Z"),
    _modified_at: new Date("2024-01-05T16:45:00Z"),
  },
  {
    _id: "task_003",
    title: "Implement user authentication",
    description: "Build secure user authentication system with JWT tokens, password hashing, and session management.",
    columnId: "col_progress",
    position: 0,
    priority: "critical",
    assignee: "Mike Chen",
    tags: ["auth", "security", "backend"],
    estimatedHours: 12,
    dueDate: "2024-01-25",
    _created_at: new Date("2024-01-03T10:30:00Z"),
    _modified_at: new Date("2024-01-08T11:20:00Z"),
  },
  {
    _id: "task_004",
    title: "Create responsive UI components",
    description: "Develop reusable React components following design system guidelines with proper accessibility support.",
    columnId: "col_progress",
    position: 1,
    priority: "medium",
    assignee: "Emily Davis",
    tags: ["frontend", "ui", "components"],
    estimatedHours: 15,
    dueDate: "2024-02-01",
    _created_at: new Date("2024-01-04T14:15:00Z"),
    _modified_at: new Date("2024-01-09T10:30:00Z"),
  },
  {
    _id: "task_005",
    title: "Write API documentation",
    description: "Document all REST API endpoints with examples, parameter descriptions, and response formats.",
    columnId: "col_review",
    position: 0,
    priority: "medium",
    assignee: "David Wilson",
    tags: ["documentation", "api"],
    estimatedHours: 6,
    dueDate: "2024-01-30",
    _created_at: new Date("2024-01-05T16:00:00Z"),
    _modified_at: new Date("2024-01-10T09:15:00Z"),
  },
  {
    _id: "task_006",
    title: "Setup CI/CD pipeline",
    description: "Configure automated testing, building, and deployment pipeline using GitHub Actions.",
    columnId: "col_todo",
    position: 0,
    priority: "high",
    assignee: "Alex Thompson",
    tags: ["devops", "automation", "ci/cd"],
    estimatedHours: 10,
    dueDate: "2024-02-05",
    _created_at: new Date("2024-01-06T13:45:00Z"),
    _modified_at: new Date("2024-01-06T13:45:00Z"),
  },
  {
    _id: "task_007",
    title: "Implement search functionality",
    description: "Add full-text search capabilities with filters, sorting, and pagination for better user experience.",
    columnId: "col_todo",
    position: 1,
    priority: "low",
    assignee: "Lisa Brown",
    tags: ["search", "database", "optimization"],
    estimatedHours: 8,
    dueDate: "2024-02-10",
    _created_at: new Date("2024-01-07T11:20:00Z"),
    _modified_at: new Date("2024-01-07T11:20:00Z"),
  },
  {
    _id: "task_008",
    title: "Add real-time notifications",
    description: "Implement WebSocket-based real-time notifications for important events and user interactions.",
    columnId: "col_todo",
    position: 2,
    priority: "medium",
    assignee: "James Miller",
    tags: ["realtime", "websockets", "notifications"],
    estimatedHours: 12,
    dueDate: "2024-02-15",
    _created_at: new Date("2024-01-08T15:30:00Z"),
    _modified_at: new Date("2024-01-08T15:30:00Z"),
  },
  {
    _id: "task_009",
    title: "Optimize database queries",
    description: "Analyze and optimize slow database queries, add proper indexes, and implement query caching.",
    columnId: "col_review",
    position: 1,
    priority: "high",
    assignee: "Anna Garcia",
    tags: ["performance", "database", "optimization"],
    estimatedHours: 6,
    dueDate: "2024-02-08",
    _created_at: new Date("2024-01-09T12:10:00Z"),
    _modified_at: new Date("2024-01-11T14:20:00Z"),
  },
  {
    _id: "task_010",
    title: "Security audit and testing",
    description: "Conduct comprehensive security audit, vulnerability testing, and implement security best practices.",
    columnId: "col_todo",
    position: 3,
    priority: "critical",
    assignee: "Robert Taylor",
    tags: ["security", "testing", "audit"],
    estimatedHours: 16,
    dueDate: "2024-02-20",
    _created_at: new Date("2024-01-10T08:45:00Z"),
    _modified_at: new Date("2024-01-10T08:45:00Z"),
  },
];

// Filter functions for role-based access
export function filterColumnsByRole(columns, role) {
  // For this example, all users can see all columns
  return [...columns];
}

export function filterCardsByRole(cards, role) {
  // For this example, all users can see all cards
  return [...cards];
}

// Utility functions for managing kanban data
export function getCardsByColumn(columnId, cards = mockCards) {
  return cards
    .filter(card => card.columnId === columnId)
    .sort((a, b) => a.position - b.position);
}

export function getNextPosition(columnId, cards = mockCards) {
  const columnCards = getCardsByColumn(columnId, cards);
  return columnCards.length > 0 
    ? Math.max(...columnCards.map(card => card.position)) + 1 
    : 0;
}

export function getNextColumnPosition(columns = mockColumns) {
  return columns.length > 0 
    ? Math.max(...columns.map(col => col.position)) + 1 
    : 0;
}

// Generate new IDs
export function generateCardId() {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateColumnId() {
  return `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}