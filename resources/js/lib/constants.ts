// Priority levels for tasks
export const PRIORITIES = {
    low: { label: 'Low', color: 'bg-slate-100 text-slate-700', value: 'low' },
    medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700', value: 'medium' },
    high: { label: 'High', color: 'bg-orange-100 text-orange-700', value: 'high' },
    urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700', value: 'urgent' },
    critical: { label: 'Critical', color: 'bg-red-200 text-red-800', value: 'critical' },
} as const;

export type Priority = keyof typeof PRIORITIES;

// Default colors for projects
export const PROJECT_COLORS = [
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Blue', value: '#3b82f6' },
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
