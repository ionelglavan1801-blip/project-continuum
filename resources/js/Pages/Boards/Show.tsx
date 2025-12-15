import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Board, Project, PageProps, Column, Task, Label } from '@/types';
import { Settings, Plus, ArrowLeft, Trash2, MoreVertical, X, Calendar, Check, History } from 'lucide-react';
import { toast } from 'sonner';
import { useState, FormEvent, useRef, useEffect } from 'react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { useBoardChannel } from '@/hooks/useBoardChannel';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    DragOverEvent,
    useDroppable,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    horizontalListSortingStrategy,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ActivityFeed } from '@/Components/ActivityFeed';

interface ActivityLog {
    id: number;
    action: string;
    changes: Record<string, unknown> | null;
    created_at: string;
    user: { id: number; name: string } | null;
    task_id: number;
}

interface Props extends PageProps {
    board: Board;
    project: Project;
    recentActivity?: ActivityLog[];
}

export default function Show({ board, project, auth, recentActivity = [] }: Props) {
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [addingColumn, setAddingColumn] = useState(false);
    const [addingTaskToColumn, setAddingTaskToColumn] = useState<number | null>(null);
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [columns, setColumns] = useState(board.columns || []);
    const [showActivity, setShowActivity] = useState(false);

    // Subscribe to real-time board updates via WebSocket
    useBoardChannel({
        boardId: board.id,
        currentUserId: auth.user.id,
        columns,
        setColumns,
    });

    // Sync columns when board data changes (e.g., after Inertia reload)
    useEffect(() => {
        setColumns(board.columns || []);
    }, [board.columns]);

    const isOwnerOrAdmin = project.owner_id === auth.user.id ||
        project.members?.some(m => m.id === auth.user.id && m.pivot?.role === 'admin') || false;

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const deleteBoard = () => {
        router.delete(route('projects.boards.destroy', [project.id, board.id]), {
            onSuccess: () => {
                toast.success('Board deleted');
            },
        });
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const taskId = active.id;

        for (const column of columns) {
            const task = column.tasks?.find(t => t.id === taskId);
            if (task) {
                setActiveTask(task);
                break;
            }
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Check if dropping on a column droppable (for empty columns)
        const isColumnDroppable = String(overId).startsWith('column-');
        const columnIdFromDroppable = isColumnDroppable
            ? parseInt(String(overId).replace('column-', ''), 10)
            : null;

        let sourceColumn: Column | undefined;
        let destColumn: Column | undefined;
        let activeTaskFound: Task | undefined;

        for (const col of columns) {
            const task = col.tasks?.find(t => t.id === activeId);
            if (task) {
                sourceColumn = col;
                activeTaskFound = task;
            }
            // Check if over a task in this column or the column itself
            if (col.id === columnIdFromDroppable || col.tasks?.some(t => t.id === overId)) {
                destColumn = col;
            }
        }

        if (!sourceColumn || !destColumn || !activeTaskFound) return;
        if (sourceColumn.id === destColumn.id) return;

        setColumns(prevColumns => {
            const newColumns = prevColumns.map(col => ({
                ...col,
                tasks: col.tasks ? [...col.tasks] : [],
            }));

            const sourceColIndex = newColumns.findIndex(c => c.id === sourceColumn!.id);
            const destColIndex = newColumns.findIndex(c => c.id === destColumn!.id);

            const taskIndex = newColumns[sourceColIndex].tasks!.findIndex(t => t.id === activeId);
            const [movedTask] = newColumns[sourceColIndex].tasks!.splice(taskIndex, 1);

            newColumns[destColIndex].tasks!.push(movedTask);

            return newColumns;
        });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Check if dropped on a column droppable (for empty columns)
        const isColumnDroppable = String(overId).startsWith('column-');
        const columnIdFromDroppable = isColumnDroppable
            ? parseInt(String(overId).replace('column-', ''), 10)
            : null;

        let currentColumn: Column | undefined;
        let task: Task | undefined;

        for (const col of columns) {
            const found = col.tasks?.find(t => t.id === activeId);
            if (found) {
                currentColumn = col;
                task = found;
                break;
            }
        }

        if (!currentColumn || !task) return;

        // If dropped on a column droppable (empty column or column area)
        if (columnIdFromDroppable) {
            const targetColumn = columns.find(c => c.id === columnIdFromDroppable);
            if (targetColumn) {
                const columnName = targetColumn.name;
                const newPosition = targetColumn.tasks?.length || 0;
                router.post(route('tasks.move', task.id), {
                    column_id: columnIdFromDroppable,
                    position: newPosition,
                }, {
                    preserveScroll: true,
                    preserveState: true,
                    onSuccess: () => {
                        toast.success(`Task moved to ${columnName}`);
                    },
                    onError: () => {
                        toast.error('Failed to move task');
                    },
                });
                return;
            }
        }

        const tasksInColumn = currentColumn.tasks || [];
        const overIndex = tasksInColumn.findIndex(t => t.id === overId);
        const activeIndex = tasksInColumn.findIndex(t => t.id === activeId);

        let newPosition = activeIndex;
        if (overIndex !== -1 && activeIndex !== overIndex) {
            setColumns(prevColumns => {
                return prevColumns.map(col => {
                    if (col.id !== currentColumn!.id) return col;
                    const newTasks = arrayMove(col.tasks || [], activeIndex, overIndex);
                    return { ...col, tasks: newTasks };
                });
            });
            newPosition = overIndex;
        }

        const columnName = currentColumn.name;
        router.post(route('tasks.move', task.id), {
            column_id: currentColumn.id,
            position: newPosition,
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                toast.success(`Task moved to ${columnName}`);
            },
            onError: () => {
                toast.error('Failed to move task');
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={route('projects.show', project.id)}>
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <div
                            className="h-6 w-6 rounded"
                            style={{ backgroundColor: project.color }}
                        />
                        <div>
                            <h2 className="text-xl font-semibold leading-tight text-foreground">
                                {board.name}
                            </h2>
                            <p className="text-sm text-muted-foreground">{project.name}</p>
                        </div>
                    </div>
                    {isOwnerOrAdmin && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant={showActivity ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setShowActivity(!showActivity)}
                            >
                                <History className="h-4 w-4" />
                                Activity
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href={route('projects.boards.edit', [project.id, board.id])}>
                                    <Settings className="h-4 w-4" />
                                    Settings
                                </Link>
                            </Button>
                            {!board.is_default && (
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => setConfirmingDeletion(true)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            }
        >
            <Head title={`${board.name} - ${project.name}`} />

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="flex h-[calc(100vh-180px)]">
                    <div className={`flex-1 overflow-x-auto p-6 ${showActivity ? 'pr-0' : ''}`}>
                        <div className="flex h-full gap-4">
                            <SortableContext
                                items={columns.map(c => c.id)}
                                strategy={horizontalListSortingStrategy}
                            >
                                {columns.map((column) => (
                                    <ColumnComponent
                                        key={column.id}
                                        column={column}
                                        boardId={board.id}
                                        isOwnerOrAdmin={isOwnerOrAdmin}
                                        addingTask={addingTaskToColumn === column.id}
                                        onStartAddTask={() => setAddingTaskToColumn(column.id)}
                                        onCancelAddTask={() => setAddingTaskToColumn(null)}
                                    />
                                ))}
                            </SortableContext>
                            <div className="w-72 flex-shrink-0">
                                {addingColumn ? (
                                    <AddColumnForm
                                        boardId={board.id}
                                        onCancel={() => setAddingColumn(false)}
                                    />
                                ) : (
                                    <Button
                                        variant="outline"
                                        className="h-12 w-full border-dashed"
                                        onClick={() => setAddingColumn(true)}
                                    >
                                        <Plus className="mr-1 h-4 w-4" />
                                        Add Column
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {showActivity && (
                        <div className="w-80 flex-shrink-0 border-l bg-background p-4 overflow-y-auto">
                            <ActivityFeed
                                activities={recentActivity}
                                columns={columns.map(c => ({ id: c.id, name: c.name }))}
                            />
                        </div>
                    )}
                </div>

                <DragOverlay>
                    {activeTask && <TaskCardOverlay task={activeTask} />}
                </DragOverlay>
            </DndContext>

            <Dialog open={confirmingDeletion} onOpenChange={setConfirmingDeletion}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Board</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{board.name}"? All columns and tasks
                            in this board will be permanently removed.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmingDeletion(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={deleteBoard}>
                            Delete Board
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}

function AddColumnForm({ boardId, onCancel }: { boardId: number; onCancel: () => void }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        color: '#94a3b8',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('boards.columns.store', boardId), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onCancel();
            },
        });
    };

    return (
        <form onSubmit={submit} className="w-72 rounded-lg bg-muted p-3">
            <Input
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                placeholder="Column name"
                className="mb-2 w-full"
                autoFocus
            />
            {errors.name && (
                <p className="mb-2 text-sm text-destructive">{errors.name}</p>
            )}
            <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={processing}>
                    Add
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}

function ColumnComponent({
    column,
    boardId,
    isOwnerOrAdmin,
    addingTask,
    onStartAddTask,
    onCancelAddTask,
}: {
    column: Column;
    boardId: number;
    isOwnerOrAdmin: boolean;
    addingTask: boolean;
    onStartAddTask: () => void;
    onCancelAddTask: () => void;
}) {
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [editing, setEditing] = useState(false);

    const { data, setData, patch, processing, errors, reset } = useForm({
        name: column.name,
        color: column.color,
    });

    const deleteColumn = () => {
        router.delete(route('columns.destroy', column.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Column "${column.name}" deleted`);
            },
        });
    };

    const updateColumn = (e: FormEvent) => {
        e.preventDefault();
        patch(route('columns.update', column.id), {
            preserveScroll: true,
            onSuccess: () => setEditing(false),
        });
    };

    const tasks = column.tasks || [];

    // Make the column droppable even when empty
    const { setNodeRef: setDroppableRef, isOver } = useDroppable({
        id: `column-${column.id}`,
        data: { columnId: column.id },
    });

    return (
        <div className="flex h-full w-72 flex-shrink-0 flex-col rounded-lg bg-muted">
            <div
                className="flex items-center justify-between rounded-t-lg px-4 py-3"
                style={{ borderTop: `3px solid ${column.color}` }}
            >
                {editing ? (
                    <form onSubmit={updateColumn} className="flex flex-1 items-center gap-2">
                        <Input
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="flex-1 text-sm"
                            autoFocus
                        />
                        <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700">
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                                reset();
                                setEditing(false);
                            }}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </form>
                ) : (
                    <>
                        <div className="flex items-center gap-2">
                            <h3 className="font-medium text-foreground">{column.name}</h3>
                            <Badge variant="secondary" className="rounded-full">
                                {tasks.length}
                            </Badge>
                        </div>
                        {isOwnerOrAdmin && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setEditing(true)}>
                                        Edit Column
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => setConfirmingDeletion(true)}
                                        className="text-destructive"
                                    >
                                        Delete Column
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </>
                )}
            </div>
            <div
                ref={setDroppableRef}
                className={`flex-1 space-y-2 overflow-y-auto p-2 min-h-[100px] ${isOver ? 'bg-primary/5 rounded-lg' : ''}`}
            >
                <SortableContext
                    items={tasks.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {tasks.map((task) => (
                        <SortableTaskCard key={task.id} task={task} />
                    ))}
                </SortableContext>
                {addingTask ? (
                    <AddTaskForm
                        columnId={column.id}
                        onCancel={onCancelAddTask}
                    />
                ) : (
                    <Button
                        variant="ghost"
                        className="w-full"
                        onClick={onStartAddTask}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <Dialog open={confirmingDeletion} onOpenChange={setConfirmingDeletion}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Column</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{column.name}"?
                            {tasks.length > 0 && (
                                <span className="text-destructive">
                                    {' '}This column has {tasks.length} task(s) that will also be deleted.
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmingDeletion(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={deleteColumn}>
                            Delete Column
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function AddTaskForm({ columnId, onCancel }: { columnId: number; onCancel: () => void }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        priority: 'medium',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('columns.tasks.store', columnId), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Task created');
                reset();
                onCancel();
            },
            onError: () => {
                toast.error('Failed to create task');
            },
        });
    };

    return (
        <form onSubmit={submit} className="rounded-md bg-card p-3 shadow-sm border">
            <Input
                value={data.title}
                onChange={(e) => setData('title', e.target.value)}
                placeholder="Task title"
                className="mb-2 w-full text-sm"
                autoFocus
            />
            {errors.title && (
                <p className="mb-2 text-sm text-destructive">{errors.title}</p>
            )}
            <div className="flex items-center justify-between">
                <Select value={data.priority} onValueChange={(value) => setData('priority', value)}>
                    <SelectTrigger className="w-24 h-8 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                </Select>
                <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={processing}>
                        Add
                    </Button>
                </div>
            </div>
        </form>
    );
}

function SortableTaskCard({ task }: { task: Task }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <TaskCard task={task} />
        </div>
    );
}

function TaskCard({ task }: { task: Task }) {
    return (
        <Link
            href={route('tasks.show', task.id)}
            className="block cursor-pointer rounded-md bg-card p-3 shadow-sm border transition hover:shadow-md"
        >
            <p className="text-sm font-medium text-foreground">{task.title}</p>
            {task.labels && task.labels.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                    {task.labels.map((label) => (
                        <Badge
                            key={label.id}
                            style={{ backgroundColor: label.color }}
                            className="text-white"
                        >
                            {label.name}
                        </Badge>
                    ))}
                </div>
            )}
            <div className="mt-2 flex items-center justify-between text-xs">
                <Badge variant={
                    task.priority === 'urgent' ? 'destructive' :
                    task.priority === 'high' ? 'default' :
                    'secondary'
                }>
                    {task.priority}
                </Badge>
                {task.assignees && task.assignees.length > 0 && (
                    <div className="flex -space-x-1">
                        {task.assignees.slice(0, 3).map((assignee) => (
                            <div
                                key={assignee.id}
                                className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary ring-1 ring-background"
                                title={assignee.name}
                            >
                                {assignee.name.charAt(0).toUpperCase()}
                            </div>
                        ))}
                        {task.assignees.length > 3 && (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground ring-1 ring-background">
                                +{task.assignees.length - 3}
                            </div>
                        )}
                    </div>
                )}
            </div>
            {task.due_date && (
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(task.due_date).toLocaleDateString()}
                </div>
            )}
        </Link>
    );
}

function TaskCardOverlay({ task }: { task: Task }) {
    return (
        <div className="cursor-grabbing rounded-md bg-card p-3 shadow-lg border">
            <p className="text-sm font-medium text-foreground">{task.title}</p>
            <div className="mt-2 text-xs">
                <Badge variant={
                    task.priority === 'urgent' ? 'destructive' :
                    task.priority === 'high' ? 'default' :
                    'secondary'
                }>
                    {task.priority}
                </Badge>
            </div>
        </div>
    );
}
