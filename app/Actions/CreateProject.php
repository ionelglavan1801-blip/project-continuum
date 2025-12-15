<?php

namespace App\Actions;

use App\Models\Board;
use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CreateProject
{
    /**
     * Create a new project with default board and columns.
     *
     * @param  array{name: string, description?: string|null, color?: string|null}  $data
     */
    public function execute(User $user, array $data): Project
    {
        return DB::transaction(function () use ($user, $data) {
            $project = Project::create([
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'color' => $data['color'] ?? '#6366f1',
                'owner_id' => $user->id,
            ]);

            // Add owner as a member with admin role
            $project->members()->attach($user->id, ['role' => 'admin']);

            // Create default board
            $board = Board::create([
                'name' => 'Main Board',
                'project_id' => $project->id,
                'position' => 0,
            ]);

            // Create default columns
            $defaultColumns = [
                ['name' => 'Backlog', 'position' => 0, 'color' => '#6b7280'],
                ['name' => 'To Do', 'position' => 1, 'color' => '#3b82f6'],
                ['name' => 'In Progress', 'position' => 2, 'color' => '#f59e0b'],
                ['name' => 'Review', 'position' => 3, 'color' => '#8b5cf6'],
                ['name' => 'Done', 'position' => 4, 'color' => '#22c55e'],
            ];

            foreach ($defaultColumns as $columnData) {
                $board->columns()->create($columnData);
            }

            return $project->load(['owner', 'members', 'boards.columns']);
        });
    }
}
