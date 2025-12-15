<?php

namespace Database\Seeders;

use App\Models\Board;
use App\Models\Column;
use App\Models\Comment;
use App\Models\Label;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create main test user
        $mainUser = User::factory()->create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => bcrypt('password'),
        ]);

        // Create additional users
        $users = User::factory(4)->create();
        $allUsers = collect([$mainUser])->merge($users);

        // Create 2 projects for the main user
        $projects = collect();

        // Project 1: Web Application
        $project1 = Project::factory()->create([
            'name' => 'Web Application',
            'description' => 'A modern web application built with Laravel and React',
            'color' => '#6366f1',
            'owner_id' => $mainUser->id,
        ]);
        $projects->push($project1);

        // Project 2: Mobile App
        $project2 = Project::factory()->create([
            'name' => 'Mobile App',
            'description' => 'Cross-platform mobile application',
            'color' => '#22c55e',
            'owner_id' => $mainUser->id,
        ]);
        $projects->push($project2);

        // Add members to projects
        $project1->members()->attach($users->take(2)->pluck('id'), ['role' => 'member', 'created_at' => now()]);
        $project2->members()->attach($users->skip(2)->take(2)->pluck('id'), ['role' => 'member', 'created_at' => now()]);

        // Create labels for each project
        $labelNames = ['Bug', 'Feature', 'Enhancement', 'Documentation', 'Design'];
        $labelColors = ['#ef4444', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

        foreach ($projects as $project) {
            foreach ($labelNames as $index => $name) {
                Label::factory()->create([
                    'project_id' => $project->id,
                    'name' => $name,
                    'color' => $labelColors[$index],
                ]);
            }
        }

        // Create boards and columns for each project
        foreach ($projects as $project) {
            $board = Board::factory()->create([
                'project_id' => $project->id,
                'name' => 'Main Board',
                'is_default' => true,
            ]);

            $columns = collect([
                ['name' => 'To Do', 'color' => '#94a3b8', 'position' => 0],
                ['name' => 'In Progress', 'color' => '#3b82f6', 'position' => 1],
                ['name' => 'Review', 'color' => '#f59e0b', 'position' => 2],
                ['name' => 'Done', 'color' => '#22c55e', 'position' => 3],
            ])->map(fn ($data) => Column::factory()->create([
                'board_id' => $board->id,
                ...$data,
            ]));

            // Create tasks in each column
            $projectLabels = $project->labels;
            $projectMembers = collect([$project->owner])->merge($project->members);

            foreach ($columns as $column) {
                $taskCount = fake()->numberBetween(2, 5);

                for ($i = 0; $i < $taskCount; $i++) {
                    $task = Task::factory()->create([
                        'column_id' => $column->id,
                        'position' => $i,
                        'created_by' => $projectMembers->random()->id,
                    ]);

                    // Assign random labels (0-2)
                    $task->labels()->attach(
                        $projectLabels->random(fake()->numberBetween(0, 2))->pluck('id')
                    );

                    // Assign random users (0-2)
                    $task->assignees()->attach(
                        $projectMembers->random(fake()->numberBetween(0, 2))->pluck('id'),
                        ['assigned_at' => now()]
                    );

                    // Add some comments
                    if (fake()->boolean(30)) {
                        Comment::factory(fake()->numberBetween(1, 3))->create([
                            'task_id' => $task->id,
                            'user_id' => $projectMembers->random()->id,
                        ]);
                    }
                }
            }
        }

        $this->command->info('Seeded: 1 main user (john@example.com / password)');
        $this->command->info('Seeded: 4 additional users');
        $this->command->info('Seeded: 2 projects with boards, columns, tasks, and labels');
    }
}
