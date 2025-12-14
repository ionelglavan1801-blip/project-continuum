<?php

namespace App\Policies;

use App\Models\Comment;
use App\Models\User;

class CommentPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Comment $comment): bool
    {
        $project = $comment->task->column->board->project;

        return $project->owner_id === $user->id || $project->hasMember($user);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Comment $comment): bool
    {
        // Only comment author can edit
        return $comment->user_id === $user->id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Comment $comment): bool
    {
        $project = $comment->task->column->board->project;

        // Author, project owner, or admin can delete
        if ($comment->user_id === $user->id) {
            return true;
        }

        if ($project->owner_id === $user->id) {
            return true;
        }

        return $project->getUserRole($user) === 'admin';
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Comment $comment): bool
    {
        return $this->delete($user, $comment);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Comment $comment): bool
    {
        return $this->delete($user, $comment);
    }
}
