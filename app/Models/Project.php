<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    /** @use HasFactory<\Database\Factories\ProjectFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'color',
        'owner_id',
    ];

    /**
     * Get the owner of the project.
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Get all members of the project.
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_members')
            ->withPivot('role', 'created_at');
    }

    /**
     * Get all boards in the project.
     */
    public function boards(): HasMany
    {
        return $this->hasMany(Board::class);
    }

    /**
     * Get all labels in the project.
     */
    public function labels(): HasMany
    {
        return $this->hasMany(Label::class);
    }

    /**
     * Get all pending invitations for the project.
     */
    public function invitations(): HasMany
    {
        return $this->hasMany(ProjectInvitation::class);
    }

    /**
     * Get the count of tasks in this project through boards and columns.
     */
    public function getTasksCountAttribute(): int
    {
        return Task::whereHas('column.board', function ($query) {
            $query->where('project_id', $this->id);
        })->count();
    }

    /**
     * Check if user is a member of the project.
     */
    public function hasMember(User $user): bool
    {
        return $this->members()->where('user_id', $user->id)->exists()
            || $this->owner_id === $user->id;
    }

    /**
     * Get user's role in the project.
     */
    public function getUserRole(User $user): ?string
    {
        if ($this->owner_id === $user->id) {
            return 'owner';
        }

        $member = $this->members()->where('user_id', $user->id)->first();

        return $member?->pivot->role;
    }
}
