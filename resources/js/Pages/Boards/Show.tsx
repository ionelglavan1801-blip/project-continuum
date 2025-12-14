import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Board, Project, PageProps, Column, Task, Label } from '@/types';
import { Settings, Plus, ArrowLeft, Trash2, MoreVertical, X, Calendar } from 'lucide-react';
import { useState, FormEvent, useRef } from 'react';
import Modal from '@/Components/Modal';
import DangerButton from '@/Components/DangerButton';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import Dropdown from '@/Components/Dropdown';
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

interface Props extends PageProps {
    board: Board;
    project: Project;
}

export default function Show({ board, project, auth }: Props) {
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [addingColumn, setAddingColumn] = useState(false);
    const [addingTaskToColumn, setAddingTaskToColumn] = useState<number | null>(null);
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [columns, setColumns] = useState(board.columns || []);

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
        router.delete(route('projects.boards.destroy', [project.id, board.id]));
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

        let sourceColumn: Column | undefined;
        let destColumn: Column | undefined;
        let activeTaskFound: Task | undefined;

        for (const col of columns) {
            const task = col.tasks?.find(t => t.id === activeId);
            if (task) {
                sourceColumn = col;
                activeTaskFound = task;
            }
            if (col.id === overId || col.tasks?.some(t => t.id === overId)) {
                destColumn = col.tasks?.some(t => t.id === overId)
                    ? col
                    : columns.find(c => c.id === overId);
            }
        }

        if (!destColumn) {
            destColumn = columns.find(c => c.id === overId);
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

        router.post(route('tasks.move', task.id), {
            column_id: currentColumn.id,
            position: newPosition,
        }, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('projects.show', project.id)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div
                            className="h-6 w-6 rounded"
                            style={{ backgroundColor: project.color }}
                        />
                        <div>
                            <h2 className="text-xl font-semibold leading-tight text-gray-800">
                                {board.name}
                            </h2>
                            <p className="text-sm text-gray-500">{project.name}</p>
                        </div>
                    </div>
                    {isOwnerOrAdmin && (
                        <div className="flex items-center gap-2">
                            <Link
                                href={route('projects.boards.edit', [project.id, board.id])}
                                className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                            >
                                <Settings className="h-4 w-4" />
                                Settings
                            </Link>
                            {!board.is_default && (
                                <button
                                    onClick={() => setConfirmingDeletion(true)}
                                    className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
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
                <div className="h-[calc(100vh-180px)] overflow-x-auto p-6">
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
                                <button
                                    onClick={() => setAddingColumn(true)}
                                    className="flex h-12 w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600"
                                >
                                    <Plus className="mr-1 h-4 w-4" />
                                    Add Column
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <DragOverlay>
                    {activeTask && <TaskCardOverlay task={activeTask} />}
                </DragOverlay>
            </DndContext>

            <Modal show={confirmingDeletion} onClose={() => setConfirmingDeletion(false)}>
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">
                        Delete Board
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Are you sure you want to delete "{board.name}"? All columns and tasks
                        in this board will be permanently removed.
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={() => setConfirmingDeletion(false)}>
                            Cancel
                        </SecondaryButton>
                        <DangerButton onClick={deleteBoard}>
                            Delete Board
                        </DangerButton>
                    </div>
                </div>
            </Modal>
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
        <form onSubmit={submit} className="w-72 rounded-lg bg-gray-100 p-3">
            <TextInput
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                placeholder="Column name"
                className="mb-2 w-full"
                autoFocus
            />
            <InputError message={errors.name} className="mb-2" />
            <div className="flex gap-2">
                <PrimaryButton type="submit" disabled={processing}>
                    Add
                </PrimaryButton>
                <SecondaryButton type="button" onClick={onCancel}>
                    Cancel
                </SecondaryButton>
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

    return (
        <div className="flex h-full w-72 flex-shrink-0 flex-col rounded-lg bg-gray-100">
            <div
                className="flex items-center justify-between rounded-t-lg px-4 py-3"
                style={{ borderTop: `3px solid ${column.color}` }}
            >
                {editing ? (
                    <form onSubmit={updateColumn} className="flex flex-1 items-center gap-2">
                        <TextInput
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="flex-1 text-sm"
                            autoFocus
                        />
                        <button type="submit" className="text-green-600 hover:text-green-700">
                            <Plus className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                reset();
                                setEditing(false);
                            }}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </form>
                ) : (
                    <>
                        <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-700">{column.name}</h3>
                            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                                {tasks.length}
                            </span>
                        </div>
                        {isOwnerOrAdmin && (
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600">
                                        <MoreVertical className="h-4 w-4" />
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content>
                                    <button
                                        onClick={() => setEditing(true)}
                                        className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        Edit Column
                                    </button>
                                    <button
                                        onClick={() => setConfirmingDeletion(true)}
                                        className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
                                    >
                                        Delete Column
                                    </button>
                                </Dropdown.Content>
                            </Dropdown>
                        )}
                    </>
                )}
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-2">
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
                    <button
                        onClick={onStartAddTask}
                        className="w-full rounded-md p-2 text-sm text-gray-500 hover:bg-gray-200"
                    >
                        <Plus className="mx-auto h-4 w-4" />
                    </button>
                )}
            </div>

            <Modal show={confirmingDeletion} onClose={() => setConfirmingDeletion(false)}>
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">
                        Delete Column
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Are you sure you want to delete "{column.name}"?
                        {tasks.length > 0 && (
                            <span className="text-red-600">
                                {' '}This column has {tasks.length} task(s) that will also be deleted.
                            </span>
                        )}
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={() => setConfirmingDeletion(false)}>
                            Cancel
                        </SecondaryButton>
                        <DangerButton onClick={deleteColumn}>
                            Delete Column
                        </DangerButton>
                    </div>
                </div>
            </Modal>
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
                reset();
                onCancel();
            },
        });
    };

    return (
        <form onSubmit={submit} className="rounded-md bg-white p-3 shadow-sm ring-1 ring-gray-200">
            <TextInput
                value={data.title}
                onChange={(e) => setData('title', e.target.value)}
                placeholder="Task title"
                className="mb-2 w-full text-sm"
                autoFocus
            />
            <InputError message={errors.title} className="mb-2" />
            <div className="flex items-center justify-between">
                <select
                    value={data.priority}
                    onChange={(e) => setData('priority', e.target.value)}
                    className="rounded-md border-gray-300 text-xs"
                >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                </select>
                <div className="flex gap-2">
                    <SecondaryButton type="button" onClick={onCancel} className="text-xs">
                        Cancel
                    </SecondaryButton>
                    <PrimaryButton type="submit" disabled={processing} className="text-xs">
                        Add
                    </PrimaryButton>
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
            className="block cursor-pointer rounded-md bg-white p-3 shadow-sm ring-1 ring-gray-200 transition hover:shadow-md"
        >
            <p className="text-sm font-medium text-gray-900">{task.title}</p>
            {task.labels && task.labels.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                    {task.labels.map((label) => (
                        <span
                            key={label.id}
                            className="rounded px-1.5 py-0.5 text-xs font-medium text-white"
                            style={{ backgroundColor: label.color }}
                        >
                            {label.name}
                        </span>
                    ))}
                </div>
            )}
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span className={`rounded px-1.5 py-0.5 ${
                    task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                    task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                }`}>
                    {task.priority}
                </span>
                {task.assignees && task.assignees.length > 0 && (
                    <div className="flex -space-x-1">
                        {task.assignees.slice(0, 3).map((assignee) => (
                            <div
                                key={assignee.id}
                                className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-medium text-indigo-700 ring-1 ring-white"
                                title={assignee.name}
                            >
                                {assignee.name.charAt(0).toUpperCase()}
                            </div>
                        ))}
                        {task.assignees.length > 3 && (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[10px] font-medium text-gray-600 ring-1 ring-white">
                                +{task.assignees.length - 3}
                            </div>
                        )}
                    </div>
                )}
            </div>
            {task.due_date && (
                <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                    <Calendar className="h-3 w-3" />
                    {new Date(task.due_date).toLocaleDateString()}
                </div>
            )}
        </Link>
    );
}

function TaskCardOverlay({ task }: { task: Task }) {
    return (
        <div className="cursor-grabbing rounded-md bg-white p-3 shadow-lg ring-1 ring-gray-200">
            <p className="text-sm font-medium text-gray-900">{task.title}</p>
            <div className="mt-2 text-xs">
                <span className={`rounded px-1.5 py-0.5 ${
                    task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                    task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                }`}>
                    {task.priority}
                </span>
            </div>
        </div>
    );
}
