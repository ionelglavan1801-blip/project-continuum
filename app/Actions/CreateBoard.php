<?php

namespace App\Actions;

use App\Models\Board;
use App\Models\Project;
use Illuminate\Support\Facades\DB;

class CreateBoard
{
    /**
     * Create a new board with default columns.
     *
     * @param  array{name: string, description?: string|null}  $data
     */
    public function execute(Project $project, array $data): Board
    {
        return DB::transaction(function () use ($project, $data) {
            $maxPosition = $project->boards()->max('position') ?? -1;

            $board = Board::create([
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'project_id' => $project->id,
                'position' => $maxPosition + 1,
            ]);

            // Create default columns
            $defaultColumns = [
                ['name' => 'To Do', 'position' => 0, 'color' => '#3b82f6'],
                ['name' => 'In Progress', 'position' => 1, 'color' => '#f59e0b'],
                ['name' => 'Done', 'position' => 2, 'color' => '#22c55e'],
            ];

            foreach ($defaultColumns as $columnData) {
                $board->columns()->create($columnData);
            }

            return $board->load('columns');
        });
    }
}
