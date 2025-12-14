import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Project, PageProps } from '@/types';
import { Plus, FolderKanban, Users, Calendar } from 'lucide-react';
import { formatRelativeDate } from '@/lib/utils';

interface Props extends PageProps {
    projects: (Project & { boards_count: number })[];
}

export default function Index({ projects }: Props) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Projects
                    </h2>
                    <Link
                        href={route('projects.create')}
                        className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        <Plus className="h-4 w-4" />
                        New Project
                    </Link>
                </div>
            }
        >
            <Head title="Projects" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {projects.length === 0 ? (
                        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <FolderKanban className="h-16 w-16 text-gray-400" />
                                <h3 className="mt-4 text-lg font-medium text-gray-900">
                                    No projects yet
                                </h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Get started by creating your first project.
                                </p>
                                <Link
                                    href={route('projects.create')}
                                    className="mt-6 inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                                >
                                    <Plus className="h-4 w-4" />
                                    Create Project
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {projects.map((project) => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function ProjectCard({ project }: { project: Project & { boards_count: number } }) {
    return (
        <Link
            href={route('projects.show', project.id)}
            className="group block overflow-hidden rounded-lg bg-white shadow-sm transition hover:shadow-md"
        >
            <div
                className="h-2"
                style={{ backgroundColor: project.color }}
            />
            <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600">
                    {project.name}
                </h3>
                {project.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                        {project.description}
                    </p>
                )}
                <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                        <FolderKanban className="h-4 w-4" />
                        <span>{project.boards_count} boards</span>
                    </div>
                    {project.members && project.members.length > 0 && (
                        <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{project.members.length} members</span>
                        </div>
                    )}
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs text-gray-400">
                    <Calendar className="h-3 w-3" />
                    <span>Created {formatRelativeDate(project.created_at)}</span>
                </div>
            </div>
        </Link>
    );
}
