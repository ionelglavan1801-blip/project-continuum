import { History, Plus, Pencil, Trash2, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityLog {
    id: number;
    action: string;
    changes: {
        old?: Record<string, unknown>;
        new?: Record<string, unknown>;
        title?: string;
        column_id?: number;
    } | null;
    created_at: string;
    user: {
        id: number;
        name: string;
    } | null;
    task_id: number;
}

interface Props {
    activities: ActivityLog[];
    columns?: { id: number; name: string }[];
}

export function ActivityFeed({ activities, columns = [] }: Props) {
    const getColumnName = (columnId: number) => {
        const col = columns.find(c => c.id === columnId);
        return col?.name || `Column ${columnId}`;
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'created':
                return <Plus className="h-3 w-3 text-green-500" />;
            case 'updated':
                return <Pencil className="h-3 w-3 text-blue-500" />;
            case 'deleted':
                return <Trash2 className="h-3 w-3 text-red-500" />;
            default:
                return <History className="h-3 w-3 text-muted-foreground" />;
        }
    };

    const getActionDescription = (log: ActivityLog) => {
        const userName = log.user?.name || 'Someone';

        switch (log.action) {
            case 'created':
                const taskTitle = log.changes?.title || `Task #${log.task_id}`;
                return (
                    <>
                        <span className="font-medium">{userName}</span>
                        {' created '}
                        <span className="font-medium">"{taskTitle}"</span>
                    </>
                );

            case 'updated':
                const changes = log.changes;
                if (changes?.old && changes?.new) {
                    const changedFields = Object.keys(changes.new);

                    // Check if it's a column move
                    if (changedFields.includes('column_id')) {
                        const fromCol = getColumnName(changes.old.column_id as number);
                        const toCol = getColumnName(changes.new.column_id as number);
                        return (
                            <>
                                <span className="font-medium">{userName}</span>
                                {' moved task from '}
                                <span className="font-medium">{fromCol}</span>
                                {' to '}
                                <span className="font-medium">{toCol}</span>
                            </>
                        );
                    }

                    // Check for title change
                    if (changedFields.includes('title')) {
                        return (
                            <>
                                <span className="font-medium">{userName}</span>
                                {' renamed task to '}
                                <span className="font-medium">"{String(changes.new.title)}"</span>
                            </>
                        );
                    }

                    // Check for priority change
                    if (changedFields.includes('priority')) {
                        return (
                            <>
                                <span className="font-medium">{userName}</span>
                                {' changed priority to '}
                                <span className="font-medium">{String(changes.new.priority)}</span>
                            </>
                        );
                    }

                    // Generic update
                    return (
                        <>
                            <span className="font-medium">{userName}</span>
                            {' updated '}
                            <span className="font-medium">{changedFields.join(', ')}</span>
                        </>
                    );
                }
                return (
                    <>
                        <span className="font-medium">{userName}</span>
                        {' updated a task'}
                    </>
                );

            case 'deleted':
                return (
                    <>
                        <span className="font-medium">{userName}</span>
                        {' deleted a task'}
                    </>
                );

            default:
                return (
                    <>
                        <span className="font-medium">{userName}</span>
                        {` ${log.action} a task`}
                    </>
                );
        }
    };

    if (activities.length === 0) {
        return (
            <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                    <History className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium text-sm">Recent Activity</h3>
                </div>
                <p className="text-sm text-muted-foreground text-center py-4">
                    No recent activity
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
                <History className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium text-sm">Recent Activity</h3>
            </div>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {activities.map((log) => (
                    <div key={log.id} className="flex items-start gap-2 text-xs">
                        <div className="mt-0.5 flex-shrink-0">
                            {getActionIcon(log.action)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-muted-foreground leading-relaxed">
                                {getActionDescription(log)}
                            </p>
                            <p className="text-muted-foreground/60 mt-0.5">
                                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
