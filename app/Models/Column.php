<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Column extends Model
{
    /** @use HasFactory<\Database\Factories\ColumnFactory> */
    use HasFactory;

    protected $fillable = [
        'board_id',
        'name',
        'color',
        'position',
    ];

    /**
     * Get the board that owns the column.
     */
    public function board(): BelongsTo
    {
        return $this->belongsTo(Board::class);
    }

    /**
     * Get all tasks in the column.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class)->orderBy('position');
    }
}
