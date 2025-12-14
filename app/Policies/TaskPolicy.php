<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;

class TaskPolicy
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
    public function view(User $user, Task $task): bool
    {
        $project = $task->column->board->project;

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
    public function update(User $user, Task $task): bool
    {
        $project = $task->column->board->project;

        return $project->owner_id === $user->id || $project->hasMember($user);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Task $task): bool
    {
        $project = $task->column->board->project;

        if ($project->owner_id === $user->id) {
            return true;
        }

        $role = $project->getUserRole($user);

        // Admin or creator can delete
        return $role === 'admin' || $task->created_by === $user->id;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Task $task): bool
    {
        return $this->delete($user, $task);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Task $task): bool
    {
        return $this->delete($user, $task);
    }

    /**
     * Determine whether the user can move the task.
     */
    public function move(User $user, Task $task): bool
    {
        return $this->update($user, $task);
    }
}
