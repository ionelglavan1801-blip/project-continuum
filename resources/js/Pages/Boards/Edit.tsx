import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link, router } from '@inertiajs/react';
import { Board, Project, PageProps } from '@/types';
import { FormEventHandler, useState } from 'react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import { ArrowLeft, Trash2 } from 'lucide-react';

interface Props extends PageProps {
    board: Board;
    project: Project;
}

export default function Edit({ board, project }: Props) {
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);

    const { data, setData, patch, processing, errors } = useForm({
        name: board.name,
        description: board.description ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('projects.boards.update', [project.id, board.id]));
    };

    const deleteBoard = () => {
        router.delete(route('projects.boards.destroy', [project.id, board.id]));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Link
                        href={route('projects.boards.show', [project.id, board.id])}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div
                        className="h-6 w-6 rounded"
                        style={{ backgroundColor: project.color }}
                    />
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Edit Board
                    </h2>
                </div>
            }
        >
            <Head title={`Edit ${board.name}`} />

            <div className="py-12">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <form onSubmit={submit} className="p-6">
                            <div>
                                <InputLabel htmlFor="name" value="Board Name" />
                                <TextInput
                                    id="name"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    isFocused
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            <div className="mt-4">
                                <InputLabel htmlFor="description" value="Description (optional)" />
                                <textarea
                                    id="description"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                />
                                <InputError message={errors.description} className="mt-2" />
                            </div>

                            <div className="mt-6 flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => setConfirmingDeletion(true)}
                                    className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-500"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete Board
                                </button>
                                <div className="flex items-center gap-4">
                                    <Link href={route('projects.boards.show', [project.id, board.id])}>
                                        <SecondaryButton type="button">
                                            Cancel
                                        </SecondaryButton>
                                    </Link>
                                    <PrimaryButton disabled={processing}>
                                        Save Changes
                                    </PrimaryButton>
                                </div>
                            </div>
                        </form>
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
