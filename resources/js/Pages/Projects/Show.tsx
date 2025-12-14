import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Project, PageProps } from '@/types';
import { Settings, Users, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import Modal from '@/Components/Modal';
import DangerButton from '@/Components/DangerButton';
import SecondaryButton from '@/Components/SecondaryButton';

interface Props extends PageProps {
    project: Project;
}

export default function Show({ project, auth }: Props) {
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const isOwner = project.owner_id === auth.user.id;
    const firstBoard = project.boards?.[0];

    const deleteProject = () => {
        router.delete(route('projects.destroy', project.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="h-8 w-8 rounded-lg"
                            style={{ backgroundColor: project.color }}
                        />
                        <div>
                            <h2 className="text-xl font-semibold leading-tight text-gray-800">
                                {project.name}
                            </h2>
                            {project.description && (
                                <p className="text-sm text-gray-500">
                                    {project.description}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={route('projects.edit', project.id)}
                            className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                            <Settings className="h-4 w-4" />
                            Settings
                        </Link>
                        {isOwner && (
                            <button
                                onClick={() => setConfirmingDeletion(true)}
                                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </button>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={project.name} />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Project Members */}
                    <div className="mb-6 flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-gray-400" />
                                <span className="text-sm font-medium text-gray-700">Team:</span>
                            </div>
                            <div className="flex -space-x-2">
                                {project.members?.map((member) => (
                                    <div
                                        key={member.id}
                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-xs font-medium text-white ring-2 ring-white"
                                        title={member.user?.name}
                                    >
                                        {member.user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-500">
                            <Plus className="h-4 w-4" />
                            Add member
                        </button>
                    </div>

                    {/* Board Selection / Kanban Board */}
                    {firstBoard ? (
                        <div className="rounded-lg bg-gray-100 p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {firstBoard.name}
                                </h3>
                                <button className="text-sm text-indigo-600 hover:text-indigo-500">
                                    Board settings
                                </button>
                            </div>

                            {/* Columns */}
                            <div className="flex gap-4 overflow-x-auto pb-4">
                                {firstBoard.columns?.map((column) => (
                                    <div
                                        key={column.id}
                                        className="w-72 flex-shrink-0 rounded-lg bg-white shadow-sm"
                                    >
                                        <div
                                            className="flex items-center justify-between rounded-t-lg px-4 py-3"
                                            style={{ borderTop: `3px solid ${column.color}` }}
                                        >
                                            <h4 className="font-medium text-gray-700">
                                                {column.name}
                                            </h4>
                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                                                {column.tasks?.length ?? 0}
                                            </span>
                                        </div>
                                        <div className="space-y-2 p-2">
                                            {column.tasks?.map((task) => (
                                                <div
                                                    key={task.id}
                                                    className="cursor-pointer rounded-md bg-white p-3 shadow-sm ring-1 ring-gray-200 hover:shadow-md"
                                                >
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {task.title}
                                                    </p>
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
                                                                        className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[10px] font-medium ring-1 ring-white"
                                                                        title={assignee.name}
                                                                    >
                                                                        {assignee.name.charAt(0)}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            <button className="w-full rounded-md p-2 text-sm text-gray-500 hover:bg-gray-50">
                                                <Plus className="mx-auto h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <div className="w-72 flex-shrink-0">
                                    <button className="flex h-12 w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600">
                                        <Plus className="mr-1 h-4 w-4" />
                                        Add Column
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-lg bg-white p-12 text-center shadow-sm">
                            <h3 className="text-lg font-medium text-gray-900">
                                No boards yet
                            </h3>
                            <p className="mt-2 text-sm text-gray-500">
                                Create your first board to start organizing tasks.
                            </p>
                            <button className="mt-6 inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
                                <Plus className="h-4 w-4" />
                                Create Board
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal show={confirmingDeletion} onClose={() => setConfirmingDeletion(false)}>
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">
                        Delete Project
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Are you sure you want to delete this project? All boards, tasks, and
                        related data will be permanently removed. This action cannot be undone.
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={() => setConfirmingDeletion(false)}>
                            Cancel
                        </SecondaryButton>
                        <DangerButton onClick={deleteProject}>
                            Delete Project
                        </DangerButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
