<?php

namespace App\Policies;

use App\Models\Column;
use App\Models\User;

class ColumnPolicy
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
    public function view(User $user, Column $column): bool
    {
        $project = $column->board->project;

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
    public function update(User $user, Column $column): bool
    {
        $project = $column->board->project;

        if ($project->owner_id === $user->id) {
            return true;
        }

        $role = $project->getUserRole($user);

        return $role === 'admin';
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Column $column): bool
    {
        // Cannot delete if column has tasks
        if ($column->tasks()->exists()) {
            return false;
        }

        $project = $column->board->project;

        if ($project->owner_id === $user->id) {
            return true;
        }

        $role = $project->getUserRole($user);

        return $role === 'admin';
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Column $column): bool
    {
        return $this->delete($user, $column);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Column $column): bool
    {
        return $this->delete($user, $column);
    }
}
