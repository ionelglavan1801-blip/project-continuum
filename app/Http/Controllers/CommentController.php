<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCommentRequest;
use App\Http\Requests\UpdateCommentRequest;
use App\Models\Comment;
use App\Models\Task;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;

class CommentController extends Controller
{
    use AuthorizesRequests;

    /**
     * Store a new comment for a task.
     */
    public function store(StoreCommentRequest $request, Task $task): RedirectResponse
    {
        $this->authorize('view', $task);

        $task->comments()->create([
            'user_id' => auth()->id(),
            'content' => $request->content,
        ]);

        return back()->with('success', 'Comment added.');
    }

    /**
     * Update the specified comment.
     */
    public function update(UpdateCommentRequest $request, Comment $comment): RedirectResponse
    {
        $this->authorize('update', $comment);

        $comment->update($request->validated());

        return back()->with('success', 'Comment updated.');
    }

    /**
     * Remove the specified comment.
     */
    public function destroy(Comment $comment): RedirectResponse
    {
        $this->authorize('delete', $comment);

        $comment->delete();

        return back()->with('success', 'Comment deleted.');
    }
}
