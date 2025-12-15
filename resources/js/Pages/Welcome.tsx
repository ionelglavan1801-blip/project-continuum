import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { CheckCircle, Kanban, Clock, Users } from 'lucide-react';

export default function Welcome({ auth }: PageProps) {
    return (
        <>
            <Head title="Welcome" />
            <div className="min-h-screen bg-background">
                {/* Header */}
                <header className="border-b">
                    <div className="container mx-auto flex h-16 items-center justify-between px-4">
                        <div className="flex items-center gap-2">
                            <Kanban className="h-6 w-6 text-primary" />
                            <span className="text-xl font-semibold">Continuum</span>
                        </div>
                        <nav className="flex items-center gap-2">
                            {auth.user ? (
                                <Button asChild>
                                    <Link href={route('dashboard')}>Dashboard</Link>
                                </Button>
                            ) : (
                                <>
                                    <Button variant="ghost" asChild>
                                        <Link href={route('login')}>Log in</Link>
                                    </Button>
                                    <Button asChild>
                                        <Link href={route('register')}>Get Started</Link>
                                    </Button>
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                {/* Hero Section */}
                <section className="container mx-auto px-4 py-24 text-center">
                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                        Project Management
                        <br />
                        <span className="text-muted-foreground">Made Simple</span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                        Organize your projects, track tasks with Kanban boards, and collaborate with your team.
                        Real-time updates keep everyone in sync.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-4">
                        {auth.user ? (
                            <Button size="lg" asChild>
                                <Link href={route('dashboard')}>Go to Dashboard</Link>
                            </Button>
                        ) : (
                            <>
                                <Button size="lg" asChild>
                                    <Link href={route('register')}>Start Free</Link>
                                </Button>
                                <Button size="lg" variant="outline" asChild>
                                    <Link href={route('login')}>Sign In</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </section>

                {/* Features Grid */}
                <section className="container mx-auto px-4 pb-24">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader>
                                <Kanban className="h-10 w-10 text-primary" />
                                <CardTitle className="mt-4">Kanban Boards</CardTitle>
                                <CardDescription>
                                    Drag and drop tasks between columns. Visualize your workflow at a glance.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CheckCircle className="h-10 w-10 text-primary" />
                                <CardTitle className="mt-4">Task Management</CardTitle>
                                <CardDescription>
                                    Create tasks, set priorities, add labels, and track progress effortlessly.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card>
                            <CardHeader>
                                <Clock className="h-10 w-10 text-primary" />
                                <CardTitle className="mt-4">Time Tracking</CardTitle>
                                <CardDescription>
                                    Built-in time tracker for each task. Know exactly where your time goes.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card>
                            <CardHeader>
                                <Users className="h-10 w-10 text-primary" />
                                <CardTitle className="mt-4">Team Collaboration</CardTitle>
                                <CardDescription>
                                    Real-time updates, comments, and notifications keep your team connected.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t py-8">
                    <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                        Built with Laravel, React & shadcn/ui
                    </div>
                </footer>
            </div>
        </>
    );
}
