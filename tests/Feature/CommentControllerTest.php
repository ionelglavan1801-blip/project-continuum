<?php

namespace Tests\Feature;

use App\Models\Board;
use App\Models\Column;
use App\Models\Comment;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommentControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    private User $member;

    private User $stranger;

    private Project $project;

    private Task $task;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create();
        $this->member = User::factory()->create();
        $this->stranger = User::factory()->create();

        $this->project = Project::factory()->create(['owner_id' => $this->owner->id]);
        $this->project->members()->attach($this->member->id, ['role' => 'member']);

        $board = Board::factory()->create(['project_id' => $this->project->id]);
        $column = Column::factory()->create(['board_id' => $board->id]);
        $this->task = Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $this->owner->id,
        ]);
    }

    public function test_guest_cannot_add_comment(): void
    {
        $response = $this->post(route('tasks.comments.store', $this->task), [
            'content' => 'Test comment',
        ]);

        $response->assertRedirect(route('login'));
    }

    public function test_project_member_can_add_comment(): void
    {
        $response = $this->actingAs($this->member)->post(route('tasks.comments.store', $this->task), [
            'content' => 'Great progress on this task!',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertDatabaseHas('comments', [
            'task_id' => $this->task->id,
            'user_id' => $this->member->id,
            'content' => 'Great progress on this task!',
        ]);
    }

    public function test_owner_can_add_comment(): void
    {
        $response = $this->actingAs($this->owner)->post(route('tasks.comments.store', $this->task), [
            'content' => 'Owner comment',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('comments', [
            'task_id' => $this->task->id,
            'user_id' => $this->owner->id,
        ]);
    }

    public function test_stranger_cannot_add_comment(): void
    {
        $response = $this->actingAs($this->stranger)->post(route('tasks.comments.store', $this->task), [
            'content' => 'Stranger comment',
        ]);

        $response->assertForbidden();
    }

    public function test_comment_requires_content(): void
    {
        $response = $this->actingAs($this->member)->post(route('tasks.comments.store', $this->task), [
            'content' => '',
        ]);

        $response->assertSessionHasErrors('content');
    }

    public function test_author_can_update_own_comment(): void
    {
        $comment = Comment::factory()->create([
            'task_id' => $this->task->id,
            'user_id' => $this->member->id,
            'content' => 'Original content',
        ]);

        $response = $this->actingAs($this->member)->patch(route('comments.update', $comment), [
            'content' => 'Updated content',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('comments', [
            'id' => $comment->id,
            'content' => 'Updated content',
        ]);
    }

    public function test_other_user_cannot_update_comment(): void
    {
        $comment = Comment::factory()->create([
            'task_id' => $this->task->id,
            'user_id' => $this->member->id,
            'content' => 'Original content',
        ]);

        $response = $this->actingAs($this->owner)->patch(route('comments.update', $comment), [
            'content' => 'Hacked content',
        ]);

        $response->assertForbidden();
        $this->assertDatabaseHas('comments', [
            'id' => $comment->id,
            'content' => 'Original content',
        ]);
    }

    public function test_author_can_delete_own_comment(): void
    {
        $comment = Comment::factory()->create([
            'task_id' => $this->task->id,
            'user_id' => $this->member->id,
        ]);

        $response = $this->actingAs($this->member)->delete(route('comments.destroy', $comment));

        $response->assertRedirect();
        $this->assertDatabaseMissing('comments', ['id' => $comment->id]);
    }

    public function test_project_owner_can_delete_any_comment(): void
    {
        $comment = Comment::factory()->create([
            'task_id' => $this->task->id,
            'user_id' => $this->member->id,
        ]);

        $response = $this->actingAs($this->owner)->delete(route('comments.destroy', $comment));

        $response->assertRedirect();
        $this->assertDatabaseMissing('comments', ['id' => $comment->id]);
    }

    public function test_stranger_cannot_delete_comment(): void
    {
        $comment = Comment::factory()->create([
            'task_id' => $this->task->id,
            'user_id' => $this->member->id,
        ]);

        $response = $this->actingAs($this->stranger)->delete(route('comments.destroy', $comment));

        $response->assertForbidden();
        $this->assertDatabaseHas('comments', ['id' => $comment->id]);
    }
}
