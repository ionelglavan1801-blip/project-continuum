<?php

namespace App\Http\Controllers;

use App\Actions\CreateBoard;
use App\Http\Requests\StoreBoardRequest;
use App\Http\Requests\UpdateBoardRequest;
use App\Models\Board;
use App\Models\Project;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class BoardController extends Controller
{
    use AuthorizesRequests;

    /**
     * Show the form for creating a new resource.
     */
    public function create(Project $project): Response
    {
        $this->authorize('view', $project);

        return Inertia::render('Boards/Create', [
            'project' => $project,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreBoardRequest $request, Project $project, CreateBoard $createBoard): RedirectResponse
    {
        $this->authorize('view', $project);

        $board = $createBoard->execute($project, $request->validated());

        return redirect()
            ->route('projects.boards.show', [$project, $board])
            ->with('success', 'Board created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Project $project, Board $board): Response
    {
        $this->authorize('view', $board);

        $board->load([
            'project.owner',
            'project.members',
            'project.labels',
            'columns' => fn ($query) => $query->orderBy('position'),
            'columns.tasks' => fn ($query) => $query->orderBy('position'),
            'columns.tasks.assignees',
            'columns.tasks.labels',
        ]);

        // Get recent activity logs for tasks on this board
        $taskIds = $board->columns->flatMap(fn ($col) => $col->tasks->pluck('id'))->toArray();

        $recentActivity = \App\Models\ActivityLog::with('user')
            ->where('loggable_type', \App\Models\Task::class)
            ->whereIn('loggable_id', $taskIds)
            ->latest('created_at')
            ->take(20)
            ->get()
            ->map(fn ($log) => [
                'id' => $log->id,
                'action' => $log->action,
                'changes' => $log->changes,
                'created_at' => $log->created_at->toISOString(),
                'user' => $log->user ? [
                    'id' => $log->user->id,
                    'name' => $log->user->name,
                ] : null,
                'task_id' => $log->loggable_id,
            ]);

        return Inertia::render('Boards/Show', [
            'board' => $board,
            'project' => $project,
            'recentActivity' => $recentActivity,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Project $project, Board $board): Response
    {
        $this->authorize('update', $board);

        return Inertia::render('Boards/Edit', [
            'board' => $board,
            'project' => $project,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateBoardRequest $request, Project $project, Board $board): RedirectResponse
    {
        $board->update($request->validated());

        return redirect()
            ->route('projects.boards.show', [$project, $board])
            ->with('success', 'Board updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Project $project, Board $board): RedirectResponse
    {
        $this->authorize('delete', $board);

        $board->delete();

        return redirect()
            ->route('projects.show', $project)
            ->with('success', 'Board deleted successfully.');
    }
}
