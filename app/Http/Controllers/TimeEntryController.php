<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TimeEntry;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TimeEntryController extends Controller
{
    use AuthorizesRequests;

    /**
     * Get time entries for a task.
     */
    public function index(Task $task): JsonResponse
    {
        $this->authorize('view', $task);

        $entries = $task->timeEntries()
            ->with('user:id,name')
            ->latest('started_at')
            ->get()
            ->map(fn (TimeEntry $entry) => [
                'id' => $entry->id,
                'user' => $entry->user,
                'description' => $entry->description,
                'started_at' => $entry->started_at->format('Y-m-d H:i'),
                'ended_at' => $entry->ended_at?->format('Y-m-d H:i'),
                'duration_minutes' => $entry->duration_minutes,
                'is_running' => $entry->isRunning(),
            ]);

        $totalMinutes = $task->timeEntries()->sum('duration_minutes');

        return response()->json([
            'entries' => $entries,
            'total_minutes' => $totalMinutes,
        ]);
    }

    /**
     * Start a timer for a task.
     */
    public function start(Request $request, Task $task): JsonResponse
    {
        $this->authorize('update', $task);

        // Check if user already has a running timer on any task
        $runningEntry = TimeEntry::where('user_id', auth()->id())
            ->whereNull('ended_at')
            ->first();

        if ($runningEntry) {
            return response()->json([
                'error' => 'You already have a running timer.',
                'running_task_id' => $runningEntry->task_id,
            ], 422);
        }

        $entry = TimeEntry::create([
            'task_id' => $task->id,
            'user_id' => auth()->id(),
            'description' => $request->input('description'),
            'started_at' => now(),
        ]);

        return response()->json([
            'id' => $entry->id,
            'started_at' => $entry->started_at->format('Y-m-d H:i:s'),
            'message' => 'Timer started.',
        ]);
    }

    /**
     * Stop a running timer.
     */
    public function stop(TimeEntry $timeEntry): JsonResponse
    {
        if ($timeEntry->user_id !== auth()->id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if (! $timeEntry->isRunning()) {
            return response()->json(['error' => 'Timer is not running.'], 422);
        }

        $timeEntry->stop();

        return response()->json([
            'id' => $timeEntry->id,
            'duration_minutes' => $timeEntry->duration_minutes,
            'message' => 'Timer stopped.',
        ]);
    }

    /**
     * Add a manual time entry.
     */
    public function store(Request $request, Task $task): RedirectResponse
    {
        $this->authorize('update', $task);

        $validated = $request->validate([
            'description' => ['nullable', 'string', 'max:255'],
            'duration_minutes' => ['required', 'integer', 'min:1'],
            'started_at' => ['required', 'date'],
        ]);

        TimeEntry::create([
            'task_id' => $task->id,
            'user_id' => auth()->id(),
            'description' => $validated['description'],
            'started_at' => $validated['started_at'],
            'ended_at' => now(),
            'duration_minutes' => $validated['duration_minutes'],
        ]);

        return back()->with('success', 'Time entry added.');
    }

    /**
     * Update a time entry.
     */
    public function update(Request $request, TimeEntry $timeEntry): RedirectResponse
    {
        if ($timeEntry->user_id !== auth()->id()) {
            abort(403);
        }

        $validated = $request->validate([
            'description' => ['nullable', 'string', 'max:255'],
            'duration_minutes' => ['required', 'integer', 'min:1'],
        ]);

        $timeEntry->update($validated);

        return back()->with('success', 'Time entry updated.');
    }

    /**
     * Delete a time entry.
     */
    public function destroy(TimeEntry $timeEntry): RedirectResponse
    {
        if ($timeEntry->user_id !== auth()->id()) {
            abort(403);
        }

        $timeEntry->delete();

        return back()->with('success', 'Time entry deleted.');
    }

    /**
     * Get user's currently running timer.
     */
    public function current(): JsonResponse
    {
        $entry = TimeEntry::where('user_id', auth()->id())
            ->whereNull('ended_at')
            ->with('task:id,title')
            ->first();

        if (! $entry) {
            return response()->json(['running' => false]);
        }

        return response()->json([
            'running' => true,
            'id' => $entry->id,
            'task_id' => $entry->task_id,
            'task_title' => $entry->task->title,
            'started_at' => $entry->started_at->toIso8601String(),
            'elapsed_seconds' => (int) $entry->started_at->diffInSeconds(now()),
        ]);
    }
}
