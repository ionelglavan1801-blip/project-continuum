<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Label extends Model
{
    /** @use HasFactory<\Database\Factories\LabelFactory> */
    use HasFactory;

    protected $fillable = [
        'project_id',
        'name',
        'color',
    ];

    /**
     * Get the project that owns the label.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get all tasks with this label.
     */
    public function tasks(): BelongsToMany
    {
        return $this->belongsToMany(Task::class, 'task_labels');
    }
}
