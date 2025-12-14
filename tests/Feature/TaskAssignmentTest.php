<?php

namespace Tests\Feature;

use App\Models\Board;
use App\Models\Column;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskAssignmentTest extends TestCase
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

    public function test_project_member_can_assign_user_to_task(): void
    {
        $response = $this->actingAs($this->member)->post(route('tasks.assign', $this->task), [
            'user_id' => $this->owner->id,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertTrue($this->task->assignees()->where('user_id', $this->owner->id)->exists());
    }

    public function test_cannot_assign_non_project_member(): void
    {
        $response = $this->actingAs($this->owner)->post(route('tasks.assign', $this->task), [
            'user_id' => $this->stranger->id,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertFalse($this->task->assignees()->where('user_id', $this->stranger->id)->exists());
    }

    public function test_cannot_assign_user_twice(): void
    {
        $this->task->assignees()->attach($this->member->id);

        $response = $this->actingAs($this->owner)->post(route('tasks.assign', $this->task), [
            'user_id' => $this->member->id,
        ]);

        $response->assertRedirect();
        // Should still have only one assignment
        $this->assertEquals(1, $this->task->assignees()->where('user_id', $this->member->id)->count());
    }

    public function test_project_member_can_unassign_user_from_task(): void
    {
        $this->task->assignees()->attach($this->member->id);

        $response = $this->actingAs($this->owner)->post(route('tasks.unassign', $this->task), [
            'user_id' => $this->member->id,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertFalse($this->task->assignees()->where('user_id', $this->member->id)->exists());
    }

    public function test_stranger_cannot_assign_user_to_task(): void
    {
        $response = $this->actingAs($this->stranger)->post(route('tasks.assign', $this->task), [
            'user_id' => $this->owner->id,
        ]);

        $response->assertForbidden();
    }

    public function test_stranger_cannot_unassign_user_from_task(): void
    {
        $this->task->assignees()->attach($this->member->id);

        $response = $this->actingAs($this->stranger)->post(route('tasks.unassign', $this->task), [
            'user_id' => $this->member->id,
        ]);

        $response->assertForbidden();
        $this->assertTrue($this->task->assignees()->where('user_id', $this->member->id)->exists());
    }

    public function test_assign_requires_valid_user_id(): void
    {
        $response = $this->actingAs($this->owner)->post(route('tasks.assign', $this->task), [
            'user_id' => 99999,
        ]);

        $response->assertSessionHasErrors('user_id');
    }
}
