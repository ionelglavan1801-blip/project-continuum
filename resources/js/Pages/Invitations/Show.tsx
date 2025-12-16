import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { PageProps } from '@/types';

interface InvitationData {
    token: string;
    email: string;
    role: string;
    project: {
        id: number;
        name: string;
    };
    inviter: {
        name: string;
    };
    expires_at: string;
}

interface Props extends PageProps {
    invitation: InvitationData;
}

export default function Show({ invitation, auth }: Props) {
    const handleAccept = () => {
        router.post(route('invitations.accept', invitation.token));
    };

    const isLoggedIn = !!auth?.user;
    const emailMatches = auth?.user?.email === invitation.email;

    return (
        <>
            <Head title="Project Invitation" />

            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">You're Invited!</CardTitle>
                        <CardDescription>
                            {invitation.inviter.name} has invited you to join a project
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="rounded-lg bg-muted p-4 space-y-2">
                            <div>
                                <span className="text-sm text-muted-foreground">Project</span>
                                <p className="font-medium">{invitation.project.name}</p>
                            </div>
                            <div>
                                <span className="text-sm text-muted-foreground">Your Role</span>
                                <p className="font-medium capitalize">{invitation.role}</p>
                            </div>
                            <div>
                                <span className="text-sm text-muted-foreground">Invited Email</span>
                                <p className="font-medium">{invitation.email}</p>
                            </div>
                        </div>

                        {!isLoggedIn ? (
                            <div className="space-y-4">
                                <p className="text-sm text-center text-muted-foreground">
                                    Please log in or create an account to accept this invitation.
                                </p>
                                <div className="flex gap-2">
                                    <Button asChild className="flex-1">
                                        <Link href={route('login', { redirect: route('invitations.show', invitation.token) })}>
                                            Log In
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" className="flex-1">
                                        <Link href={route('register', { redirect: route('invitations.show', invitation.token) })}>
                                            Register
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ) : !emailMatches ? (
                            <div className="space-y-4">
                                <p className="text-sm text-center text-destructive">
                                    You're logged in as {auth.user.email}, but this invitation was sent to {invitation.email}.
                                </p>
                                <p className="text-sm text-center text-muted-foreground">
                                    Please log in with the correct account to accept this invitation.
                                </p>
                                <Button
                                    variant="default"
                                    className="w-full"
                                    onClick={() => {
                                        router.post(route('logout'), {}, {
                                            onSuccess: () => {
                                                window.location.href = route('login') + '?redirect=' + encodeURIComponent(window.location.pathname);
                                            }
                                        });
                                    }}
                                >
                                    Switch Account
                                </Button>
                                <Button asChild variant="outline" className="w-full">
                                    <Link href={route('dashboard')}>
                                        Continue as {auth.user.name}
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <Button onClick={handleAccept} className="w-full">
                                    Accept Invitation
                                </Button>
                                <Button asChild variant="outline" className="w-full">
                                    <Link href={route('dashboard')}>
                                        Decline
                                    </Link>
                                </Button>
                            </div>
                        )}

                        <p className="text-xs text-center text-muted-foreground">
                            This invitation expires on {new Date(invitation.expires_at).toLocaleDateString()}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
