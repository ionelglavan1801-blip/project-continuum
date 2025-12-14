import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link, router } from '@inertiajs/react';
import { Project, PageProps } from '@/types';
import { FormEventHandler, useState } from 'react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import { PROJECT_COLORS } from '@/lib/constants';
import { Trash2 } from 'lucide-react';

interface Props extends PageProps {
    project: Project;
}

export default function Edit({ project, auth }: Props) {
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const isOwner = project.owner_id === auth.user.id;

    const { data, setData, patch, processing, errors } = useForm({
        name: project.name,
        description: project.description ?? '',
        color: project.color,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('projects.update', project.id));
    };

    const deleteProject = () => {
        router.delete(route('projects.destroy', project.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <div
                        className="h-6 w-6 rounded"
                        style={{ backgroundColor: project.color }}
                    />
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Edit Project
                    </h2>
                </div>
            }
        >
            <Head title={`Edit ${project.name}`} />

            <div className="py-12">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <form onSubmit={submit} className="p-6">
                            <div>
                                <InputLabel htmlFor="name" value="Project Name" />
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
                                    rows={4}
                                />
                                <InputError message={errors.description} className="mt-2" />
                            </div>

                            <div className="mt-4">
                                <InputLabel value="Project Color" />
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {PROJECT_COLORS.map((color) => (
                                        <button
                                            key={color.value}
                                            type="button"
                                            onClick={() => setData('color', color.value)}
                                            className={`h-8 w-8 rounded-full transition-all ${
                                                data.color === color.value
                                                    ? 'ring-2 ring-offset-2 ring-gray-800'
                                                    : 'hover:scale-110'
                                            }`}
                                            style={{ backgroundColor: color.value }}
                                            title={color.name}
                                        />
                                    ))}
                                </div>
                                <InputError message={errors.color} className="mt-2" />
                            </div>

                            <div className="mt-6 flex items-center justify-between">
                                {isOwner && (
                                    <button
                                        type="button"
                                        onClick={() => setConfirmingDeletion(true)}
                                        className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-500"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete Project
                                    </button>
                                )}
                                <div className="flex items-center gap-4 ml-auto">
                                    <Link href={route('projects.show', project.id)}>
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

                    {/* Project Members Section */}
                    <div className="mt-6 overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="border-b border-gray-200 p-6">
                            <h3 className="text-lg font-medium text-gray-900">Team Members</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Manage who has access to this project.
                            </p>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {/* Owner */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 text-sm font-medium text-white">
                                            {project.owner?.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {project.owner?.name}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {project.owner?.email}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                                        Owner
                                    </span>
                                </div>

                                {/* Other Members */}
                                {project.members
                                    ?.filter((m) => m.id !== project.owner_id)
                                    .map((member) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-700">
                                                    {member.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {member.name}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {member.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                member.pivot?.role === 'admin'
                                                    ? 'bg-purple-100 text-purple-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {member.pivot?.role}
                                            </span>
                                        </div>
                                    ))}
                            </div>

                            <button
                                type="button"
                                className="mt-6 w-full rounded-md border-2 border-dashed border-gray-300 py-3 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600"
                            >
                                + Add Team Member
                            </button>
                        </div>
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
                        Are you sure you want to delete "{project.name}"? All boards, tasks, and
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
