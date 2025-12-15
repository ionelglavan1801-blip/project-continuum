import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Task, PageProps } from '@/types';
import { ArrowLeft, Calendar, Clock, Trash2, Edit2, X, MessageSquare, User as UserIcon, UserPlus, Send } from 'lucide-react';
import { useState, FormEvent } from 'react';
import TimeTracker from '@/Components/TimeTracker';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Badge } from '@/Components/ui/badge';
import { Card, CardContent } from '@/Components/ui/card';
import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { Checkbox } from '@/Components/ui/checkbox';

interface Props extends PageProps {
    task: Task;
}

export default function Show({ task, auth }: Props) {
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [editing, setEditing] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);

    const project = task.column?.board?.project;
    const isOwnerOrAdmin = project?.owner_id === auth.user.id ||
        project?.members?.some(m => m.id === auth.user.id && (m as any).pivot?.role === 'admin');
    const canEdit = isOwnerOrAdmin || task.created_by === auth.user.id ||
        project?.members?.some(m => m.id === auth.user.id);

    // Get project members who are not yet assigned
    const availableMembers = [
        ...(project?.owner_id ? [{ id: project.owner_id, name: (project as any).owner?.name || 'Owner' }] : []),
        ...(project?.members || []),
    ].filter(m => !task.assignees?.some(a => a.id === m.id));

    const deleteTask = () => {
        router.delete(route('tasks.destroy', task.id), {
            onSuccess: () => {
                if (task.column?.board?.project?.id && task.column?.board?.id) {
                    router.visit(route('projects.boards.show', [task.column.board.project.id, task.column.board.id]));
                }
            },
        });
    };

    const assignUser = (userId: number) => {
        router.post(route('tasks.assign', task.id), { user_id: userId }, {
            preserveScroll: true,
        });
    };

    const unassignUser = (userId: number) => {
        router.post(route('tasks.unassign', task.id), { user_id: userId }, {
            preserveScroll: true,
        });
    };

    const priorityVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
        low: 'secondary',
        medium: 'outline',
        high: 'default',
        urgent: 'destructive',
        critical: 'destructive',
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {task.column?.board?.project && (
                            <Link
                                href={route('projects.boards.show', [task.column.board.project.id, task.column.board.id])}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        )}
                        <h2 className="text-xl font-semibold leading-tight">
                            Task Details
                        </h2>
                    </div>
                    {canEdit && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditing(!editing)}
                            >
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setConfirmingDeletion(true)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            }
        >
            <Head title={task.title} />

            <div className="py-8">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <Card>
                        {editing ? (
                            <TaskEditForm task={task} onCancel={() => setEditing(false)} />
                        ) : (
                            <CardContent className="p-6">
                                {/* Header */}
                                <div className="mb-6">
                                    <div className="flex items-start justify-between">
                                        <h1 className="text-2xl font-bold">{task.title}</h1>
                                        <Badge variant={priorityVariants[task.priority]}>
                                            {task.priority}
                                        </Badge>
                                    </div>
                                    {task.column && (
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            in <span className="font-medium">{task.column.name}</span>
                                            {task.column.board && (
                                                <> on <span className="font-medium">{task.column.board.name}</span></>
                                            )}
                                        </p>
                                    )}
                                </div>

                                {/* Description */}
                                {task.description && (
                                    <div className="mb-6">
                                        <h3 className="mb-2 text-sm font-medium">Description</h3>
                                        <p className="whitespace-pre-wrap text-muted-foreground">{task.description}</p>
                                    </div>
                                )}

                                {/* Meta info */}
                                <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                                    {task.due_date && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                    {task.estimated_hours && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            <span>Est: {task.estimated_hours}h</span>
                                        </div>
                                    )}
                                    {task.creator && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <UserIcon className="h-4 w-4" />
                                            <span>By: {task.creator.name}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Labels */}
                                {task.labels && task.labels.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="mb-2 text-sm font-medium">Labels</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {task.labels.map((label) => (
                                                <Badge
                                                    key={label.id}
                                                    style={{ backgroundColor: label.color }}
                                                    className="text-white"
                                                >
                                                    {label.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Assignees */}
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-medium">Assignees</h3>
                                        {canEdit && availableMembers.length > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setShowAssignModal(true)}
                                            >
                                                <UserPlus className="h-4 w-4 mr-1" />
                                                Add
                                            </Button>
                                        )}
                                    </div>
                                    {task.assignees && task.assignees.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {task.assignees.map((assignee) => (
                                                <div
                                                    key={assignee.id}
                                                    className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1 group"
                                                >
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarFallback className="text-xs">
                                                            {assignee.name.charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm">{assignee.name}</span>
                                                    {canEdit && (
                                                        <button
                                                            onClick={() => unassignUser(assignee.id)}
                                                            className="hidden group-hover:block text-muted-foreground hover:text-destructive"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No assignees yet</p>
                                    )}
                                </div>

                                {/* Subtasks */}
                                {task.subtasks && task.subtasks.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="mb-2 text-sm font-medium">Subtasks</h3>
                                        <ul className="space-y-2">
                                            {task.subtasks.map((subtask) => (
                                                <li key={subtask.id} className="flex items-center gap-2">
                                                    <Checkbox />
                                                    <span className="text-sm text-muted-foreground">{subtask.title}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Comments */}
                                <div className="border-t pt-6">
                                    <h3 className="mb-4 flex items-center gap-2 text-sm font-medium">
                                        <MessageSquare className="h-4 w-4" />
                                        Comments ({task.comments?.length || 0})
                                    </h3>

                                    {/* Add Comment Form */}
                                    {canEdit && (
                                        <CommentForm taskId={task.id} />
                                    )}

                                    {/* Comments List */}
                                    {task.comments && task.comments.length > 0 && (
                                        <div className="mt-4 space-y-4">
                                            {task.comments.map((comment) => (
                                                <CommentItem
                                                    key={comment.id}
                                                    comment={comment}
                                                    currentUserId={auth.user.id}
                                                    canDelete={
                                                        comment.user_id === auth.user.id ||
                                                        isOwnerOrAdmin === true
                                                    }
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Time Tracking */}
                                <TimeTracker taskId={task.id} canEdit={canEdit ?? false} />
                            </CardContent>
                        )}
                    </Card>
                </div>
            </div>

            {/* Assign User Dialog */}
            <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign User</DialogTitle>
                        <DialogDescription>
                            Select a team member to assign to this task.
                        </DialogDescription>
                    </DialogHeader>
                    {availableMembers.length > 0 ? (
                        <div className="space-y-2">
                            {availableMembers.map((member) => (
                                <button
                                    key={member.id}
                                    onClick={() => {
                                        assignUser(member.id);
                                        setShowAssignModal(false);
                                    }}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary text-left transition-colors"
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>
                                            {member.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">{member.name}</span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">All project members are already assigned.</p>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAssignModal(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={confirmingDeletion} onOpenChange={setConfirmingDeletion}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Task</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{task.title}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmingDeletion(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={deleteTask}>
                            Delete Task
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}

// Comment Form Component
function CommentForm({ taskId }: { taskId: number }) {
    const { data, setData, post, processing, reset } = useForm({
        content: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('tasks.comments.store', taskId), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <form onSubmit={submit} className="flex gap-2">
            <Textarea
                value={data.content}
                onChange={(e) => setData('content', e.target.value)}
                placeholder="Add a comment..."
                rows={2}
                className="flex-1"
            />
            <Button
                type="submit"
                disabled={processing || !data.content.trim()}
                className="self-end"
            >
                <Send className="h-4 w-4" />
            </Button>
        </form>
    );
}

// Comment Item Component
function CommentItem({ comment, currentUserId, canDelete }: { comment: any; currentUserId: number; canDelete: boolean }) {
    const [editing, setEditing] = useState(false);
    const { data, setData, patch, processing } = useForm({
        content: comment.content,
    });

    const handleUpdate = (e: FormEvent) => {
        e.preventDefault();
        patch(route('comments.update', comment.id), {
            preserveScroll: true,
            onSuccess: () => setEditing(false),
        });
    };

    const handleDelete = () => {
        if (confirm('Delete this comment?')) {
            router.delete(route('comments.destroy', comment.id), {
                preserveScroll: true,
            });
        }
    };

    return (
        <div className="flex gap-3">
            <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback>
                    {comment.user?.name.charAt(0).toUpperCase()}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                        {comment.user?.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleString()}
                    </span>
                    {comment.user_id === currentUserId && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => setEditing(!editing)}
                        >
                            Edit
                        </Button>
                    )}
                    {canDelete && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs text-muted-foreground hover:text-destructive"
                            onClick={handleDelete}
                        >
                            Delete
                        </Button>
                    )}
                </div>
                {editing ? (
                    <form onSubmit={handleUpdate} className="mt-1">
                        <Textarea
                            value={data.content}
                            onChange={(e) => setData('content', e.target.value)}
                            rows={2}
                        />
                        <div className="mt-2 flex gap-2">
                            <Button
                                type="submit"
                                size="sm"
                                disabled={processing}
                            >
                                Save
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setEditing(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                ) : (
                    <p className="mt-1 text-sm text-muted-foreground">{comment.content}</p>
                )}
            </div>
        </div>
    );
}

function TaskEditForm({ task, onCancel }: { task: Task; onCancel: () => void }) {
    const { data, setData, patch, processing, errors } = useForm({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        due_date: task.due_date || '',
        estimated_hours: task.estimated_hours?.toString() || '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        patch(route('tasks.update', task.id), {
            preserveScroll: true,
            onSuccess: () => onCancel(),
        });
    };

    return (
        <form onSubmit={submit} className="p-6">
            <div className="mb-4">
                <Label htmlFor="title">Title</Label>
                <Input
                    id="title"
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    className="mt-1"
                />
                {errors.title && <p className="mt-1 text-sm text-destructive">{errors.title}</p>}
            </div>

            <div className="mb-4">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    rows={4}
                    className="mt-1"
                />
                {errors.description && <p className="mt-1 text-sm text-destructive">{errors.description}</p>}
            </div>

            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                        value={data.priority}
                        onValueChange={(value) => setData('priority', value as any)}
                    >
                        <SelectTrigger className="mt-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                        id="due_date"
                        type="date"
                        value={data.due_date}
                        onChange={(e) => setData('due_date', e.target.value)}
                        className="mt-1"
                    />
                </div>

                <div>
                    <Label htmlFor="estimated_hours">Estimated Hours</Label>
                    <Input
                        id="estimated_hours"
                        type="number"
                        step="0.5"
                        value={data.estimated_hours}
                        onChange={(e) => setData('estimated_hours', e.target.value)}
                        className="mt-1"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={processing}>
                    Save Changes
                </Button>
            </div>
        </form>
    );
}
