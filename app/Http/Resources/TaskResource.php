<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'column_id' => $this->column_id,
            'parent_id' => $this->parent_id,
            'title' => $this->title,
            'description' => $this->description,
            'position' => $this->position,
            'priority' => $this->priority,
            'due_date' => $this->due_date?->toIso8601String(),
            'estimated_hours' => $this->estimated_hours,
            'created_by' => $this->created_by,
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
            'assignees' => $this->whenLoaded('assignees', fn () => $this->assignees->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'avatar' => $user->avatar,
            ])),
            'column' => $this->whenLoaded('column', fn () => [
                'id' => $this->column->id,
                'name' => $this->column->name,
                'board_id' => $this->column->board_id,
            ]),
        ];
    }
}
