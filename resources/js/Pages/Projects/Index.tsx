import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Project, PageProps } from '@/types';
import { Plus, FolderKanban, Users, Calendar } from 'lucide-react';
import { formatRelativeDate } from '@/lib/utils';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';

interface Props extends PageProps {
    projects: (Project & { boards_count: number })[];
}

export default function Index({ projects }: Props) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-foreground">
                        Projects
                    </h2>
                    <Button asChild>
                        <Link href={route('projects.create')}>
                            <Plus className="h-4 w-4" />
                            New Project
                        </Link>
                    </Button>
                </div>
            }
        >
            <Head title="Projects" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {projects.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                <FolderKanban className="h-16 w-16 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-medium">
                                    No projects yet
                                </h3>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Get started by creating your first project.
                                </p>
                                <Button className="mt-6" asChild>
                                    <Link href={route('projects.create')}>
                                        <Plus className="h-4 w-4" />
                                        Create Project
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
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
            className="group block"
        >
            <Card className="transition hover:shadow-md hover:border-primary">
                <div
                    className="h-2 rounded-t-xl"
                    style={{ backgroundColor: project.color }}
                />
                <CardHeader>
                    <CardTitle className="group-hover:text-primary">
                        {project.name}
                    </CardTitle>
                    {project.description && (
                        <CardDescription className="line-clamp-2">
                            {project.description}
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                    <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Created {formatRelativeDate(project.created_at)}</span>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
