<?php

namespace App\Http\Controllers;

use App\Http\Requests\MoveTaskRequest;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Models\Column;
use App\Models\Task;
use App\Models\User;
use App\Notifications\TaskAssignedNotification;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    use AuthorizesRequests;

    /**
     * Store a newly created task.
     */
    public function store(StoreTaskRequest $request, Column $column): RedirectResponse
    {
        $maxPosition = $column->tasks()->max('position') ?? -1;

        $column->tasks()->create([
            ...$request->validated(),
            'position' => $maxPosition + 1,
            'created_by' => auth()->id(),
        ]);

        return back()->with('success', 'Task created successfully.');
    }

    /**
     * Display the specified task.
     */
    public function show(Task $task): Response
    {
        $this->authorize('view', $task);

        $task->load([
            'column.board.project',
            'creator',
            'assignees',
            'labels',
            'subtasks',
            'comments.user',
        ]);

        return Inertia::render('Tasks/Show', [
            'task' => $task,
        ]);
    }

    /**
     * Update the specified task.
     */
    public function update(UpdateTaskRequest $request, Task $task): RedirectResponse
    {
        $task->update($request->validated());

        return back()->with('success', 'Task updated successfully.');
    }

    /**
     * Remove the specified task.
     */
    public function destroy(Task $task): RedirectResponse
    {
        $this->authorize('delete', $task);

        $task->delete();

        return back()->with('success', 'Task deleted successfully.');
    }

    /**
     * Move task to a different column or position.
     */
    public function move(MoveTaskRequest $request, Task $task): RedirectResponse
    {
        $newColumnId = $request->column_id;
        $newPosition = $request->position;

        // If moving to a different column
        if ($task->column_id !== $newColumnId) {
            // Reorder tasks in the old column
            Task::where('column_id', $task->column_id)
                ->where('position', '>', $task->position)
                ->decrement('position');

            // Make room in the new column
            Task::where('column_id', $newColumnId)
                ->where('position', '>=', $newPosition)
                ->increment('position');

            $task->update([
                'column_id' => $newColumnId,
                'position' => $newPosition,
            ]);
        } else {
            // Moving within the same column
            $oldPosition = $task->position;

            if ($oldPosition < $newPosition) {
                Task::where('column_id', $task->column_id)
                    ->whereBetween('position', [$oldPosition + 1, $newPosition])
                    ->decrement('position');
            } else {
                Task::where('column_id', $task->column_id)
                    ->whereBetween('position', [$newPosition, $oldPosition - 1])
                    ->increment('position');
            }

            $task->update(['position' => $newPosition]);
        }

        return back()->with('success', 'Task moved successfully.');
    }

    /**
     * Batch move multiple tasks (for drag & drop).
     */
    public function batchMove(Request $request): RedirectResponse
    {
        $request->validate([
            'tasks' => ['required', 'array'],
            'tasks.*.id' => ['required', 'exists:tasks,id'],
            'tasks.*.column_id' => ['required', 'exists:columns,id'],
            'tasks.*.position' => ['required', 'integer', 'min:0'],
        ]);

        foreach ($request->tasks as $taskData) {
            $task = Task::find($taskData['id']);

            if (auth()->user()->can('move', $task)) {
                $task->update([
                    'column_id' => $taskData['column_id'],
                    'position' => $taskData['position'],
                ]);
            }
        }

        return back()->with('success', 'Tasks updated successfully.');
    }

    /**
     * Assign a user to the task.
     */
    public function assign(Request $request, Task $task): RedirectResponse
    {
        $this->authorize('update', $task);

        $request->validate([
            'user_id' => ['required', 'exists:users,id'],
        ]);

        $project = $task->column->board->project;
        $userId = $request->user_id;

        // Check if user is a project member
        if ($project->owner_id !== $userId && ! $project->members()->where('user_id', $userId)->exists()) {
            return back()->with('error', 'User is not a project member.');
        }

        // Prevent duplicate assignments
        if (! $task->assignees()->where('user_id', $userId)->exists()) {
            $task->assignees()->attach($userId);

            // Send notification to the assigned user (if not self-assign)
            $assignedUser = User::find($userId);
            if ($assignedUser && $assignedUser->id !== auth()->id()) {
                $assignedUser->notify(new TaskAssignedNotification($task, auth()->user()));
            }
        }

        return back()->with('success', 'User assigned to task.');
    }

    /**
     * Unassign a user from the task.
     */
    public function unassign(Request $request, Task $task): RedirectResponse
    {
        $this->authorize('update', $task);

        $request->validate([
            'user_id' => ['required', 'exists:users,id'],
        ]);

        $task->assignees()->detach($request->user_id);

        return back()->with('success', 'User unassigned from task.');
    }
}
