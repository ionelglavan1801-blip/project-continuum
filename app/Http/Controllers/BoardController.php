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

        return Inertia::render('Boards/Show', [
            'board' => $board,
            'project' => $project,
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
