<?php

use App\Models\Board;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

// Register broadcast authentication routes
Broadcast::routes(['middleware' => ['web', 'auth']]);

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

/**
 * Board channel - allows project members to receive real-time updates
 */
Broadcast::channel('board.{boardId}', function (User $user, int $boardId) {
    $board = Board::with('project')->find($boardId);

    if (! $board) {
        return false;
    }

    // Check if user is the project owner
    if ($board->project->owner_id === $user->id) {
        return true;
    }

    // Check if user is a member of the project that owns this board
    return $board->project->members()
        ->where('user_id', $user->id)
        ->exists();
});
