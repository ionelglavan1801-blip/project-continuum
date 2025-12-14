<?php

use App\Http\Controllers\BoardController;
use App\Http\Controllers\ColumnController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Projects
    Route::resource('projects', ProjectController::class);
    Route::post('projects/{project}/members', [ProjectController::class, 'inviteMember'])->name('projects.members.store');
    Route::delete('projects/{project}/members/{user}', [ProjectController::class, 'removeMember'])->name('projects.members.destroy');

    // Boards
    Route::resource('projects.boards', BoardController::class)->except(['index']);

    // Columns
    Route::post('boards/{board}/columns', [ColumnController::class, 'store'])->name('boards.columns.store');
    Route::patch('columns/{column}', [ColumnController::class, 'update'])->name('columns.update');
    Route::delete('columns/{column}', [ColumnController::class, 'destroy'])->name('columns.destroy');
    Route::post('boards/{board}/columns/reorder', [ColumnController::class, 'reorder'])->name('boards.columns.reorder');

    // Tasks
    Route::post('columns/{column}/tasks', [TaskController::class, 'store'])->name('columns.tasks.store');
    Route::get('tasks/{task}', [TaskController::class, 'show'])->name('tasks.show');
    Route::patch('tasks/{task}', [TaskController::class, 'update'])->name('tasks.update');
    Route::delete('tasks/{task}', [TaskController::class, 'destroy'])->name('tasks.destroy');
    Route::post('tasks/{task}/move', [TaskController::class, 'move'])->name('tasks.move');
    Route::post('tasks/batch-move', [TaskController::class, 'batchMove'])->name('tasks.batch-move');

    // Task Assignees
    Route::post('tasks/{task}/assign', [TaskController::class, 'assign'])->name('tasks.assign');
    Route::post('tasks/{task}/unassign', [TaskController::class, 'unassign'])->name('tasks.unassign');

    // Comments
    Route::post('tasks/{task}/comments', [CommentController::class, 'store'])->name('tasks.comments.store');
    Route::patch('comments/{comment}', [CommentController::class, 'update'])->name('comments.update');
    Route::delete('comments/{comment}', [CommentController::class, 'destroy'])->name('comments.destroy');
});

require __DIR__.'/auth.php';
