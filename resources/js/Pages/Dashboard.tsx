import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { PageProps, Project } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { FolderKanban, Plus, ArrowRight, CheckCircle, Clock, ListTodo } from 'lucide-react';

interface DashboardProps extends PageProps {
    recentProjects?: (Project & { boards_count: number; tasks_count: number })[];
    stats?: {
        totalProjects: number;
        totalTasks: number;
        completedTasks: number;
        pendingTasks: number;
    };
}

export default function Dashboard({ recentProjects = [], stats }: DashboardProps) {
    const defaultStats = stats || {
        totalProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-foreground">
                        Dashboard
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
            <Head title="Dashboard" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
                    {/* Stats Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Total Projects
                                </CardTitle>
                                <FolderKanban className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{defaultStats.totalProjects}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Total Tasks
                                </CardTitle>
                                <ListTodo className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{defaultStats.totalTasks}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Completed
                                </CardTitle>
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{defaultStats.completedTasks}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Pending
                                </CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-600">{defaultStats.pendingTasks}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Projects */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Recent Projects</CardTitle>
                                    <CardDescription>Your most recently updated projects</CardDescription>
                                </div>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={route('projects.index')}>
                                        View All
                                        <ArrowRight className="ml-1 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {recentProjects.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <FolderKanban className="h-12 w-12 text-muted-foreground" />
                                    <h3 className="mt-4 text-lg font-medium">No projects yet</h3>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Get started by creating your first project.
                                    </p>
                                    <Button className="mt-4" asChild>
                                        <Link href={route('projects.create')}>
                                            <Plus className="h-4 w-4" />
                                            Create Project
                                        </Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {recentProjects.map((project) => (
                                        <Link
                                            key={project.id}
                                            href={route('projects.show', project.id)}
                                            className="group block rounded-lg border p-4 transition hover:border-primary hover:shadow-sm"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="h-3 w-3 rounded-full"
                                                    style={{ backgroundColor: project.color }}
                                                />
                                                <h4 className="font-medium group-hover:text-primary">
                                                    {project.name}
                                                </h4>
                                            </div>
                                            {project.description && (
                                                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                                                    {project.description}
                                                </p>
                                            )}
                                            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                                                <span>{project.boards_count || 0} boards</span>
                                                <span>{project.tasks_count || 0} tasks</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
