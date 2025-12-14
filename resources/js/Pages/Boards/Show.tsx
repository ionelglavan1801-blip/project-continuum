import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Board, Project, PageProps, Column, Task } from '@/types';
import { Settings, Plus, ArrowLeft, Trash2, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import Modal from '@/Components/Modal';
import DangerButton from '@/Components/DangerButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Dropdown from '@/Components/Dropdown';

interface Props extends PageProps {
    board: Board;
    project: Project;
}

export default function Show({ board, project, auth }: Props) {
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const isOwnerOrAdmin = project.owner_id === auth.user.id ||
        project.members?.some(m => m.id === auth.user.id && m.pivot?.role === 'admin');

    const deleteBoard = () => {
        router.delete(route('projects.boards.destroy', [project.id, board.id]));
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
            <Head title={`${board.name} - ${project.name}`} />

            <div className="h-[calc(100vh-180px)] overflow-x-auto p-6">
                <div className="flex h-full gap-4">
                    {board.columns?.map((column) => (
                        <ColumnComponent
                            key={column.id}
                            column={column}
                            projectLabels={project.labels || []}
                        />
                    ))}
                    <div className="w-72 flex-shrink-0">
                        <button className="flex h-12 w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600">
                            <Plus className="mr-1 h-4 w-4" />
                            Add Column
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal show={confirmingDeletion} onClose={() => setConfirmingDeletion(false)}>
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">
                        Delete Board
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Are you sure you want to delete "{board.name}"? All columns and tasks
                        in this board will be permanently removed. This action cannot be undone.
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

function ColumnComponent({ column, projectLabels }: { column: Column; projectLabels: any[] }) {
    return (
        <div className="flex h-full w-72 flex-shrink-0 flex-col rounded-lg bg-gray-100">
            <div
                className="flex items-center justify-between rounded-t-lg px-4 py-3"
                style={{ borderTop: `3px solid ${column.color}` }}
            >
                <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-700">{column.name}</h3>
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                        {column.tasks?.length ?? 0}
                    </span>
                </div>
                <Dropdown>
                    <Dropdown.Trigger>
                        <button className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600">
                            <MoreVertical className="h-4 w-4" />
                        </button>
                    </Dropdown.Trigger>
                    <Dropdown.Content>
                        <Dropdown.Link href="#" as="button">Edit Column</Dropdown.Link>
                        <Dropdown.Link href="#" as="button">Delete Column</Dropdown.Link>
                    </Dropdown.Content>
                </Dropdown>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-2">
                {column.tasks?.map((task) => (
                    <TaskCard key={task.id} task={task} />
                ))}
                <button className="w-full rounded-md p-2 text-sm text-gray-500 hover:bg-gray-200">
                    <Plus className="mx-auto h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

function TaskCard({ task }: { task: Task }) {
    return (
        <div className="cursor-pointer rounded-md bg-white p-3 shadow-sm ring-1 ring-gray-200 transition hover:shadow-md">
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
                    task.priority === 'critical' ? 'bg-red-100 text-red-700' :
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
                <div className="mt-2 text-xs text-gray-400">
                    Due: {new Date(task.due_date).toLocaleDateString()}
                </div>
            )}
        </div>
    );
}
