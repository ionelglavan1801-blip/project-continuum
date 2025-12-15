import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Kanban } from 'lucide-react';

interface GuestLayoutProps extends PropsWithChildren {
    title?: string;
    description?: string;
}

export default function Guest({ children, title, description }: GuestLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <div className="mb-8">
                <Link href="/" className="flex items-center gap-2 text-foreground">
                    <Kanban className="h-8 w-8" />
                    <span className="text-2xl font-semibold">Continuum</span>
                </Link>
            </div>

            <Card className="w-full max-w-md">
                {(title || description) && (
                    <CardHeader className="text-center">
                        {title && <CardTitle className="text-2xl">{title}</CardTitle>}
                        {description && <CardDescription>{description}</CardDescription>}
                    </CardHeader>
                )}
                <CardContent className={!title && !description ? 'pt-6' : ''}>
                    {children}
                </CardContent>
            </Card>
        </div>
    );
}
