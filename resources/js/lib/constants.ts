// Priority levels for tasks
export const PRIORITIES = {
    low: { label: 'Low', color: 'bg-slate-100 text-slate-700', value: 'low' },
    medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700', value: 'medium' },
    high: { label: 'High', color: 'bg-orange-100 text-orange-700', value: 'high' },
    urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700', value: 'urgent' },
} as const;

export type Priority = keyof typeof PRIORITIES;

// Default colors for projects
export const PROJECT_COLORS = [
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#ef4444', // Red
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#14b8a6', // Teal
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
] as const;

// Default column names for new boards
export const DEFAULT_COLUMNS = [
    { name: 'To Do', color: '#94a3b8' },
    { name: 'In Progress', color: '#3b82f6' },
    { name: 'Review', color: '#f59e0b' },
    { name: 'Done', color: '#22c55e' },
] as const;

// Project member roles
export const PROJECT_ROLES = {
    owner: { label: 'Owner', description: 'Full access to project settings and members' },
    admin: { label: 'Admin', description: 'Can manage boards and invite members' },
    member: { label: 'Member', description: 'Can create and manage tasks' },
} as const;

export type ProjectRole = keyof typeof PROJECT_ROLES;
