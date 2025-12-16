<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the dashboard.
     */
    public function __invoke(): Response
    {
        $user = auth()->user();

        // Get projects the user owns or is a member of
        $projectIds = Project::where('owner_id', $user->id)
            ->orWhereHas('members', fn ($q) => $q->where('user_id', $user->id))
            ->pluck('id');

        // Get recent projects with counts
        $recentProjects = Project::whereIn('id', $projectIds)
            ->withCount('boards')
            ->latest('updated_at')
            ->take(6)
            ->get()
            ->map(function ($project) {
                // Count tasks through the board->column->task path
                $tasksCount = Task::whereHas('column.board', function ($query) use ($project) {
                    $query->where('project_id', $project->id);
                })->count();
                $project->tasks_count = $tasksCount;

                return $project;
            });

        // Calculate stats
        $totalProjects = $projectIds->count();

        // Get all tasks from user's projects by querying through the proper path
        $tasks = Task::with('column')
            ->whereHas('column.board.project', function ($query) use ($projectIds) {
                $query->whereIn('projects.id', $projectIds);
            })
            ->get();

        $totalTasks = $tasks->count();

        // Completed tasks are in columns named "Done" or similar
        $completedTasks = $tasks->filter(function ($task) {
            $columnName = strtolower($task->column->name ?? '');

            return str_contains($columnName, 'done') || str_contains($columnName, 'complete');
        })->count();

        $pendingTasks = $totalTasks - $completedTasks;

        return Inertia::render('Dashboard', [
            'recentProjects' => $recentProjects,
            'stats' => [
                'totalProjects' => $totalProjects,
                'totalTasks' => $totalTasks,
                'completedTasks' => $completedTasks,
                'pendingTasks' => $pendingTasks,
            ],
        ]);
    }
}
