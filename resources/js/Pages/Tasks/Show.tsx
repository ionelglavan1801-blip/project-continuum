import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Task, PageProps } from '@/types';
import { ArrowLeft, Calendar, Clock, Flag, Trash2, Edit2, X, Check, MessageSquare, User } from 'lucide-react';
import { useState, FormEvent } from 'react';
import Modal from '@/Components/Modal';
import DangerButton from '@/Components/DangerButton';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';

interface Props extends PageProps {
    task: Task;
}

export default function Show({ task, auth }: Props) {
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [editing, setEditing] = useState(false);

    const project = task.column?.board?.project;
    const isOwnerOrAdmin = project?.owner_id === auth.user.id ||
        project?.members?.some(m => m.id === auth.user.id && (m as any).pivot?.role === 'admin');
    const canEdit = isOwnerOrAdmin || task.created_by === auth.user.id ||
        project?.members?.some(m => m.id === auth.user.id);

    const deleteTask = () => {
        router.delete(route('tasks.destroy', task.id), {
            onSuccess: () => {
                if (task.column?.board?.project?.id && task.column?.board?.id) {
                    router.visit(route('projects.boards.show', [task.column.board.project.id, task.column.board.id]));
                }
            },
        });
    };

    const priorityColors: Record<string, string> = {
        low: 'bg-gray-100 text-gray-700',
        medium: 'bg-yellow-100 text-yellow-700',
        high: 'bg-orange-100 text-orange-700',
        urgent: 'bg-red-100 text-red-700',
        critical: 'bg-red-100 text-red-700',
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {task.column?.board?.project && (
                            <Link
                                href={route('projects.boards.show', [task.column.board.project.id, task.column.board.id])}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        )}
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            Task Details
                        </h2>
                    </div>
                    {canEdit && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setEditing(!editing)}
                                className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                            >
                                <Edit2 className="h-4 w-4" />
                                Edit
                            </button>
                            <button
                                onClick={() => setConfirmingDeletion(true)}
                                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            }
        >
            <Head title={task.title} />

            <div className="py-8">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        {editing ? (
                            <TaskEditForm task={task} onCancel={() => setEditing(false)} />
                        ) : (
                            <div className="p-6">
                                {/* Header */}
                                <div className="mb-6">
                                    <div className="flex items-start justify-between">
                                        <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
                                        <span className={`rounded-full px-3 py-1 text-sm font-medium ${priorityColors[task.priority]}`}>
                                            {task.priority}
                                        </span>
                                    </div>
                                    {task.column && (
                                        <p className="mt-1 text-sm text-gray-500">
                                            in <span className="font-medium">{task.column.name}</span>
                                            {task.column.board && (
                                                <> on <span className="font-medium">{task.column.board.name}</span></>
                                            )}
                                        </p>
                                    )}
                                </div>

                                {/* Description */}
                                {task.description && (
                                    <div className="mb-6">
                                        <h3 className="mb-2 text-sm font-medium text-gray-700">Description</h3>
                                        <p className="whitespace-pre-wrap text-gray-600">{task.description}</p>
                                    </div>
                                )}

                                {/* Meta info */}
                                <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                                    {task.due_date && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                    {task.estimated_hours && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Clock className="h-4 w-4 text-gray-400" />
                                            <span>Est: {task.estimated_hours}h</span>
                                        </div>
                                    )}
                                    {task.creator && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <User className="h-4 w-4 text-gray-400" />
                                            <span>By: {task.creator.name}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Labels */}
                                {task.labels && task.labels.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="mb-2 text-sm font-medium text-gray-700">Labels</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {task.labels.map((label) => (
                                                <span
                                                    key={label.id}
                                                    className="rounded-full px-3 py-1 text-sm font-medium text-white"
                                                    style={{ backgroundColor: label.color }}
                                                >
                                                    {label.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Assignees */}
                                {task.assignees && task.assignees.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="mb-2 text-sm font-medium text-gray-700">Assignees</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {task.assignees.map((assignee) => (
                                                <div
                                                    key={assignee.id}
                                                    className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1"
                                                >
                                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700">
                                                        {assignee.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-sm text-gray-700">{assignee.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Subtasks */}
                                {task.subtasks && task.subtasks.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="mb-2 text-sm font-medium text-gray-700">Subtasks</h3>
                                        <ul className="space-y-2">
                                            {task.subtasks.map((subtask) => (
                                                <li key={subtask.id} className="flex items-center gap-2">
                                                    <input type="checkbox" className="rounded" />
                                                    <span className="text-sm text-gray-600">{subtask.title}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Comments */}
                                {task.comments && task.comments.length > 0 && (
                                    <div>
                                        <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <MessageSquare className="h-4 w-4" />
                                            Comments ({task.comments.length})
                                        </h3>
                                        <div className="space-y-4">
                                            {task.comments.map((comment) => (
                                                <div key={comment.id} className="flex gap-3">
                                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-medium text-indigo-700">
                                                        {comment.user?.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium text-gray-900">
                                                                {comment.user?.name}
                                                            </span>
                                                            <span className="text-xs text-gray-400">
                                                                {new Date(comment.created_at).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <p className="mt-1 text-sm text-gray-600">{comment.content}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal show={confirmingDeletion} onClose={() => setConfirmingDeletion(false)}>
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">
                        Delete Task
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Are you sure you want to delete "{task.title}"? This action cannot be undone.
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={() => setConfirmingDeletion(false)}>
                            Cancel
                        </SecondaryButton>
                        <DangerButton onClick={deleteTask}>
                            Delete Task
                        </DangerButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}

function TaskEditForm({ task, onCancel }: { task: Task; onCancel: () => void }) {
    const { data, setData, patch, processing, errors } = useForm({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        due_date: task.due_date || '',
        estimated_hours: task.estimated_hours?.toString() || '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        patch(route('tasks.update', task.id), {
            preserveScroll: true,
            onSuccess: () => onCancel(),
        });
    };

    return (
        <form onSubmit={submit} className="p-6">
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <TextInput
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    className="mt-1 w-full"
                />
                <InputError message={errors.title} className="mt-1" />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    rows={4}
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <InputError message={errors.description} className="mt-1" />
            </div>

            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                    <select
                        value={data.priority}
                        onChange={(e) => setData('priority', e.target.value as any)}
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Due Date</label>
                    <input
                        type="date"
                        value={data.due_date}
                        onChange={(e) => setData('due_date', e.target.value)}
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Estimated Hours</label>
                    <input
                        type="number"
                        step="0.5"
                        value={data.estimated_hours}
                        onChange={(e) => setData('estimated_hours', e.target.value)}
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3">
                <SecondaryButton type="button" onClick={onCancel}>
                    Cancel
                </SecondaryButton>
                <PrimaryButton type="submit" disabled={processing}>
                    Save Changes
                </PrimaryButton>
            </div>
        </form>
    );
}
