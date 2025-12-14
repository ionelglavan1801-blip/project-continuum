<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    /** @use HasFactory<\Database\Factories\TaskFactory> */
    use HasFactory;

    protected $fillable = [
        'column_id',
        'parent_id',
        'title',
        'description',
        'position',
        'priority',
        'due_date',
        'estimated_hours',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'estimated_hours' => 'decimal:2',
        ];
    }

    /**
     * Get the column that contains the task.
     */
    public function column(): BelongsTo
    {
        return $this->belongsTo(Column::class);
    }

    /**
     * Get the parent task (for subtasks).
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Task::class, 'parent_id');
    }

    /**
     * Get all subtasks.
     */
    public function subtasks(): HasMany
    {
        return $this->hasMany(Task::class, 'parent_id')->orderBy('position');
    }

    /**
     * Get the user who created the task.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get all assignees of the task.
     */
    public function assignees(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'task_assignees')
            ->withPivot('assigned_at');
    }

    /**
     * Get all labels attached to the task.
     */
    public function labels(): BelongsToMany
    {
        return $this->belongsToMany(Label::class, 'task_labels');
    }

    /**
     * Get all time entries for the task.
     */
    public function timeEntries(): HasMany
    {
        return $this->hasMany(TimeEntry::class);
    }

    /**
     * Get all comments on the task.
     */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class)->latest();
    }

    /**
     * Get total tracked time in minutes.
     */
    public function getTotalTimeMinutesAttribute(): int
    {
        return $this->timeEntries()->sum('duration_minutes') ?? 0;
    }

    /**
     * Check if the task is a subtask.
     */
    public function isSubtask(): bool
    {
        return $this->parent_id !== null;
    }

    /**
     * Get the project through board and column.
     */
    public function getProjectAttribute(): ?Project
    {
        return $this->column?->board?->project;
    }
}
