import { useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { Task, Column } from '@/types';

interface TaskMovedEvent {
    task: {
        id: number;
        title: string;
        column_id: number;
        position: number;
    };
    from_column_id: number;
    to_column_id: number;
    new_position: number;
    moved_by_user_id: number;
}

interface TaskCreatedEvent {
    task: Task;
    created_by_user_id: number;
}

interface TaskUpdatedEvent {
    task: Task;
    updated_by_user_id: number;
}

interface TaskDeletedEvent {
    task_id: number;
    column_id: number;
    deleted_by_user_id: number;
}

interface UseBoardChannelProps {
    boardId: number;
    currentUserId: number;
    columns: Column[];
    setColumns: React.Dispatch<React.SetStateAction<Column[]>>;
}

export function useBoardChannel({
    boardId,
    currentUserId,
    columns,
    setColumns,
}: UseBoardChannelProps) {
    const handleTaskMoved = useCallback(
        (event: TaskMovedEvent) => {
            // Skip if this user initiated the action
            if (event.moved_by_user_id === currentUserId) return;

            setColumns((prevColumns) => {
                return prevColumns.map((column) => {
                    // Remove from source column
                    if (column.id === event.from_column_id) {
                        return {
                            ...column,
                            tasks: column.tasks?.filter((t) => t.id !== event.task.id) || [],
                        };
                    }
                    // Add to destination column
                    if (column.id === event.to_column_id) {
                        const existingTask = column.tasks?.find((t) => t.id === event.task.id);
                        if (existingTask) {
                            // Task already exists in column, just update position
                            const newTasks = column.tasks?.filter((t) => t.id !== event.task.id) || [];
                            newTasks.splice(event.new_position, 0, {
                                ...existingTask,
                                column_id: event.to_column_id,
                                position: event.new_position,
                            });
                            return { ...column, tasks: newTasks };
                        }
                        // Add new task to column
                        const newTasks = [...(column.tasks || [])];
                        newTasks.splice(event.new_position, 0, {
                            ...event.task,
                        } as Task);
                        return { ...column, tasks: newTasks };
                    }
                    return column;
                });
            });
        },
        [currentUserId, setColumns]
    );

    const handleTaskCreated = useCallback(
        (event: TaskCreatedEvent) => {
            // Skip if this user created the task (already in state)
            if (event.created_by_user_id === currentUserId) return;

            setColumns((prevColumns) => {
                return prevColumns.map((column) => {
                    if (column.id === event.task.column_id) {
                        // Add task if not already present
                        if (column.tasks?.some((t) => t.id === event.task.id)) {
                            return column;
                        }
                        return {
                            ...column,
                            tasks: [...(column.tasks || []), event.task],
                        };
                    }
                    return column;
                });
            });
        },
        [currentUserId, setColumns]
    );

    const handleTaskUpdated = useCallback(
        (event: TaskUpdatedEvent) => {
            // Skip if this user updated the task
            if (event.updated_by_user_id === currentUserId) return;

            setColumns((prevColumns) => {
                return prevColumns.map((column) => {
                    return {
                        ...column,
                        tasks: column.tasks?.map((task) =>
                            task.id === event.task.id ? { ...task, ...event.task } : task
                        ),
                    };
                });
            });
        },
        [currentUserId, setColumns]
    );

    const handleTaskDeleted = useCallback(
        (event: TaskDeletedEvent) => {
            // Skip if this user deleted the task
            if (event.deleted_by_user_id === currentUserId) return;

            setColumns((prevColumns) => {
                return prevColumns.map((column) => {
                    if (column.id === event.column_id) {
                        return {
                            ...column,
                            tasks: column.tasks?.filter((t) => t.id !== event.task_id) || [],
                        };
                    }
                    return column;
                });
            });
        },
        [currentUserId, setColumns]
    );

    useEffect(() => {
        if (!window.Echo) {
            console.warn('Echo is not initialized');
            return;
        }

        const channel = window.Echo.private(`board.${boardId}`);

        channel
            .listen('TaskMoved', handleTaskMoved)
            .listen('TaskCreated', handleTaskCreated)
            .listen('TaskUpdated', handleTaskUpdated)
            .listen('TaskDeleted', handleTaskDeleted);

        return () => {
            channel
                .stopListening('TaskMoved')
                .stopListening('TaskCreated')
                .stopListening('TaskUpdated')
                .stopListening('TaskDeleted');
            window.Echo.leave(`board.${boardId}`);
        };
    }, [boardId, handleTaskMoved, handleTaskCreated, handleTaskUpdated, handleTaskDeleted]);
}
