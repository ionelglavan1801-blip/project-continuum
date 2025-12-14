<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Board extends Model
{
    /** @use HasFactory<\Database\Factories\BoardFactory> */
    use HasFactory;

    protected $fillable = [
        'project_id',
        'name',
        'description',
        'is_default',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
        ];
    }

    /**
     * Get the project that owns the board.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get all columns in the board.
     */
    public function columns(): HasMany
    {
        return $this->hasMany(Column::class)->orderBy('position');
    }

    /**
     * Get all tasks in the board through columns.
     */
    public function tasks(): HasManyThrough
    {
        return $this->hasManyThrough(Task::class, Column::class);
    }
}
