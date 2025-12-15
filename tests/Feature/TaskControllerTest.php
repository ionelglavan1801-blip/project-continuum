<?php

namespace Tests\Feature;

use App\Models\Board;
use App\Models\Column;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_access_tasks(): void
    {
        $task = Task::factory()->create();

        $this->get(route('tasks.show', $task))
            ->assertRedirect(route('login'));
    }

    public function test_project_member_can_create_task(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        $project->members()->attach($user, ['role' => 'member']);
        $board = Board::factory()->create(['project_id' => $project->id]);
        $column = Column::factory()->create(['board_id' => $board->id]);

        $this->actingAs($user)
            ->post(route('columns.tasks.store', $column), [
                'title' => 'Test Task',
                'priority' => 'medium',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('tasks', [
            'column_id' => $column->id,
            'title' => 'Test Task',
            'priority' => 'medium',
            'created_by' => $user->id,
        ]);
    }

    public function test_task_creation_validates_title(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $board = Board::factory()->create(['project_id' => $project->id]);
        $column = Column::factory()->create(['board_id' => $board->id]);

        $this->actingAs($user)
            ->post(route('columns.tasks.store', $column), [
                'title' => '',
            ])
            ->assertSessionHasErrors('title');
    }

    public function test_project_member_can_view_task(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        $project->members()->attach($user, ['role' => 'member']);
        $board = Board::factory()->create(['project_id' => $project->id]);
        $column = Column::factory()->create(['board_id' => $board->id]);
        $task = Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $user->id,
        ]);

        $this->actingAs($user)
            ->get(route('tasks.show', $task))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Tasks/Show')
                ->has('task')
            );
    }

    public function test_non_member_cannot_view_task(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        $board = Board::factory()->create(['project_id' => $project->id]);
        $column = Column::factory()->create(['board_id' => $board->id]);
        $task = Task::factory()->create(['column_id' => $column->id]);

        $this->actingAs($user)
            ->get(route('tasks.show', $task))
            ->assertForbidden();
    }

    public function test_project_member_can_update_task(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        $project->members()->attach($user, ['role' => 'member']);
        $board = Board::factory()->create(['project_id' => $project->id]);
        $column = Column::factory()->create(['board_id' => $board->id]);
        $task = Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $user->id,
        ]);

        $this->actingAs($user)
            ->patch(route('tasks.update', $task), [
                'title' => 'Updated Title',
                'priority' => 'high',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'title' => 'Updated Title',
            'priority' => 'high',
        ]);
    }

    public function test_project_owner_can_delete_task(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $board = Board::factory()->create(['project_id' => $project->id]);
        $column = Column::factory()->create(['board_id' => $board->id]);
        $task = Task::factory()->create(['column_id' => $column->id]);

        $this->actingAs($user)
            ->delete(route('tasks.destroy', $task))
            ->assertRedirect();

        $this->assertDatabaseMissing('tasks', ['id' => $task->id]);
    }

    public function test_task_creator_can_delete_task(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $project->members()->attach($member, ['role' => 'member']);
        $board = Board::factory()->create(['project_id' => $project->id]);
        $column = Column::factory()->create(['board_id' => $board->id]);
        $task = Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $member->id,
        ]);

        $this->actingAs($member)
            ->delete(route('tasks.destroy', $task))
            ->assertRedirect();

        $this->assertDatabaseMissing('tasks', ['id' => $task->id]);
    }

    public function test_member_can_move_task_within_column(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        $project->members()->attach($user, ['role' => 'member']);
        $board = Board::factory()->create(['project_id' => $project->id]);
        $column = Column::factory()->create(['board_id' => $board->id]);
        $task = Task::factory()->create([
            'column_id' => $column->id,
            'position' => 0,
            'created_by' => $user->id,
        ]);

        $this->actingAs($user)
            ->post(route('tasks.move', $task), [
                'column_id' => $column->id,
                'position' => 2,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'column_id' => $column->id,
            'position' => 2,
        ]);
    }

    public function test_member_can_move_task_to_different_column(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        $project->members()->attach($user, ['role' => 'member']);
        $board = Board::factory()->create(['project_id' => $project->id]);
        $column1 = Column::factory()->create(['board_id' => $board->id, 'position' => 0]);
        $column2 = Column::factory()->create(['board_id' => $board->id, 'position' => 1]);
        $task = Task::factory()->create([
            'column_id' => $column1->id,
            'position' => 0,
            'created_by' => $user->id,
        ]);

        $this->actingAs($user)
            ->post(route('tasks.move', $task), [
                'column_id' => $column2->id,
                'position' => 0,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'column_id' => $column2->id,
            'position' => 0,
        ]);
    }

    public function test_non_member_cannot_move_task(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        $board = Board::factory()->create(['project_id' => $project->id]);
        $column = Column::factory()->create(['board_id' => $board->id]);
        $task = Task::factory()->create(['column_id' => $column->id]);

        $this->actingAs($user)
            ->post(route('tasks.move', $task), [
                'column_id' => $column->id,
                'position' => 1,
            ])
            ->assertForbidden();
    }
}
