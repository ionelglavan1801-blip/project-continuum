import { Priority, ProjectRole } from '@/lib/constants';

export type { Priority, ProjectRole } from '@/lib/constants';

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    avatar?: string;
    created_at: string;
    updated_at: string;
}

export interface Project {
    id: number;
    name: string;
    description?: string;
    color: string;
    owner_id: number;
    owner?: User;
    members?: ProjectMember[];
    boards?: Board[];
    labels?: Label[];
    tasks_count?: number;
    created_at: string;
    updated_at: string;
}

export interface ProjectMember {
    id: number;
    project_id: number;
    user_id: number;
    role: ProjectRole;
    user?: User;
    created_at: string;
}

export interface Board {
    id: number;
    project_id: number;
    name: string;
    description?: string;
    is_default: boolean;
    project?: Project;
    columns?: Column[];
    created_at: string;
    updated_at: string;
}

export interface Column {
    id: number;
    board_id: number;
    name: string;
    color: string;
    position: number;
    board?: Board;
    tasks?: Task[];
    created_at: string;
    updated_at: string;
}

export interface Task {
    id: number;
    column_id: number;
    parent_id?: number;
    title: string;
    description?: string;
    position: number;
    priority: Priority;
    due_date?: string;
    estimated_hours?: number;
    created_by: number;
    column?: Column;
    parent?: Task;
    subtasks?: Task[];
    assignees?: User[];
    labels?: Label[];
    time_entries?: TimeEntry[];
    comments?: Comment[];
    creator?: User;
    total_time_minutes?: number;
    created_at: string;
    updated_at: string;
}

export interface Label {
    id: number;
    project_id: number;
    name: string;
    color: string;
    project?: Project;
    created_at: string;
    updated_at: string;
}

export interface TimeEntry {
    id: number;
    task_id: number;
    user_id: number;
    description?: string;
    started_at: string;
    ended_at?: string;
    duration_minutes?: number;
    task?: Task;
    user?: User;
    created_at: string;
    updated_at: string;
}

export interface Comment {
    id: number;
    task_id: number;
    user_id: number;
    content: string;
    task?: Task;
    user?: User;
    created_at: string;
    updated_at: string;
}

export interface ActivityLog {
    id: number;
    user_id: number;
    loggable_type: string;
    loggable_id: number;
    action: string;
    changes?: Record<string, unknown>;
    user?: User;
    created_at: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    flash?: {
        success?: string;
        error?: string;
    };
};

