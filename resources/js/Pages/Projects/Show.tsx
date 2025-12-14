import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Project, PageProps, Board } from '@/types';
import { Settings, Users, Plus, Trash2, LayoutGrid, ExternalLink } from 'lucide-react';
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
    const isOwnerOrAdmin = isOwner ||
        project.members?.some(m => m.user_id === auth.user.id && m.role === 'admin');

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

                    {/* Boards Section */}
                    <div className="mb-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">Boards</h3>
                            {isOwnerOrAdmin && (
                                <Link
                                    href={route('projects.boards.create', project.id)}
                                    className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-500"
                                >
                                    <Plus className="h-4 w-4" />
                                    New Board
                                </Link>
                            )}
                        </div>

                        {project.boards && project.boards.length > 0 ? (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {project.boards.map((board) => (
                                    <BoardCard key={board.id} board={board} />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center rounded-lg bg-white p-12 text-center shadow-sm">
                                <LayoutGrid className="h-12 w-12 text-gray-400" />
                                <h3 className="mt-4 text-lg font-medium text-gray-900">
                                    No boards yet
                                </h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Create your first board to start organizing tasks.
                                </p>
                                {isOwnerOrAdmin && (
                                    <Link
                                        href={route('projects.boards.create', project.id)}
                                        className="mt-6 inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Create Board
                                    </Link>
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

function BoardCard({ board }: { board: Board }) {
    const taskCount = board.columns?.reduce((acc, col) => acc + (col.tasks?.length ?? 0), 0) ?? 0;
    const columnCount = board.columns?.length ?? 0;

    return (
        <Link
            href={route('projects.boards.show', [board.project_id, board.id])}
            className="group block rounded-lg bg-white p-4 shadow-sm transition hover:shadow-md"
        >
            <div className="flex items-start justify-between">
                <div>
                    <h4 className="font-medium text-gray-900 group-hover:text-indigo-600">
                        {board.name}
                    </h4>
                    {board.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                            {board.description}
                        </p>
                    )}
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400 opacity-0 transition group-hover:opacity-100" />
            </div>
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                <span>{columnCount} columns</span>
                <span>{taskCount} tasks</span>
            </div>
        </Link>
    );
}
