<?php

namespace Tests\Feature;

use App\Models\Board;
use App\Models\Column;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ColumnControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    private User $admin;

    private User $member;

    private User $stranger;

    private Project $project;

    private Board $board;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create();
        $this->admin = User::factory()->create();
        $this->member = User::factory()->create();
        $this->stranger = User::factory()->create();

        $this->project = Project::factory()->create(['owner_id' => $this->owner->id]);
        $this->project->members()->attach($this->admin->id, ['role' => 'admin']);
        $this->project->members()->attach($this->member->id, ['role' => 'member']);

        $this->board = Board::factory()->create(['project_id' => $this->project->id]);
    }

    public function test_guest_cannot_create_column(): void
    {
        $response = $this->post(route('boards.columns.store', $this->board), [
            'name' => 'Test Column',
        ]);

        $response->assertRedirect(route('login'));
    }

    public function test_owner_can_create_column(): void
    {
        $response = $this->actingAs($this->owner)->post(route('boards.columns.store', $this->board), [
            'name' => 'New Column',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertDatabaseHas('columns', [
            'board_id' => $this->board->id,
            'name' => 'New Column',
            'position' => 0,
        ]);
    }

    public function test_admin_can_create_column(): void
    {
        $response = $this->actingAs($this->admin)->post(route('boards.columns.store', $this->board), [
            'name' => 'Admin Column',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertDatabaseHas('columns', [
            'board_id' => $this->board->id,
            'name' => 'Admin Column',
        ]);
    }

    public function test_member_can_create_column(): void
    {
        $response = $this->actingAs($this->member)->post(route('boards.columns.store', $this->board), [
            'name' => 'Member Column',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertDatabaseHas('columns', [
            'board_id' => $this->board->id,
            'name' => 'Member Column',
        ]);
    }

    public function test_stranger_cannot_create_column(): void
    {
        $response = $this->actingAs($this->stranger)->post(route('boards.columns.store', $this->board), [
            'name' => 'Stranger Column',
        ]);

        $response->assertForbidden();
        $this->assertDatabaseMissing('columns', ['name' => 'Stranger Column']);
    }

    public function test_column_position_auto_increments(): void
    {
        Column::factory()->create(['board_id' => $this->board->id, 'position' => 0]);
        Column::factory()->create(['board_id' => $this->board->id, 'position' => 1]);

        $response = $this->actingAs($this->owner)->post(route('boards.columns.store', $this->board), [
            'name' => 'Third Column',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('columns', [
            'board_id' => $this->board->id,
            'name' => 'Third Column',
            'position' => 2,
        ]);
    }

    public function test_create_column_validation_requires_name(): void
    {
        $response = $this->actingAs($this->owner)->post(route('boards.columns.store', $this->board), [
            'name' => '',
        ]);

        $response->assertSessionHasErrors('name');
    }

    public function test_owner_can_update_column(): void
    {
        $column = Column::factory()->create([
            'board_id' => $this->board->id,
            'name' => 'Original Name',
        ]);

        $response = $this->actingAs($this->owner)->patch(route('columns.update', $column), [
            'name' => 'Updated Name',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertDatabaseHas('columns', [
            'id' => $column->id,
            'name' => 'Updated Name',
        ]);
    }

    public function test_admin_can_update_column(): void
    {
        $column = Column::factory()->create([
            'board_id' => $this->board->id,
            'name' => 'Original Name',
        ]);

        $response = $this->actingAs($this->admin)->patch(route('columns.update', $column), [
            'name' => 'Admin Updated',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertDatabaseHas('columns', [
            'id' => $column->id,
            'name' => 'Admin Updated',
        ]);
    }

    public function test_member_cannot_update_column(): void
    {
        $column = Column::factory()->create([
            'board_id' => $this->board->id,
            'name' => 'Original Name',
        ]);

        $response = $this->actingAs($this->member)->patch(route('columns.update', $column), [
            'name' => 'Member Updated',
        ]);

        $response->assertForbidden();
        $this->assertDatabaseHas('columns', [
            'id' => $column->id,
            'name' => 'Original Name',
        ]);
    }

    public function test_owner_can_delete_empty_column(): void
    {
        $column = Column::factory()->create(['board_id' => $this->board->id]);

        $response = $this->actingAs($this->owner)->delete(route('columns.destroy', $column));

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertDatabaseMissing('columns', ['id' => $column->id]);
    }

    public function test_cannot_delete_column_with_tasks(): void
    {
        $column = Column::factory()->create(['board_id' => $this->board->id]);
        Task::factory()->create(['column_id' => $column->id]);

        $response = $this->actingAs($this->owner)->delete(route('columns.destroy', $column));

        $response->assertForbidden();
        $this->assertDatabaseHas('columns', ['id' => $column->id]);
    }

    public function test_stranger_cannot_delete_column(): void
    {
        $column = Column::factory()->create(['board_id' => $this->board->id]);

        $response = $this->actingAs($this->stranger)->delete(route('columns.destroy', $column));

        $response->assertForbidden();
        $this->assertDatabaseHas('columns', ['id' => $column->id]);
    }

    public function test_owner_can_reorder_columns(): void
    {
        $column1 = Column::factory()->create(['board_id' => $this->board->id, 'position' => 0]);
        $column2 = Column::factory()->create(['board_id' => $this->board->id, 'position' => 1]);
        $column3 = Column::factory()->create(['board_id' => $this->board->id, 'position' => 2]);

        $response = $this->actingAs($this->owner)->post(route('boards.columns.reorder', $this->board), [
            'columns' => [
                ['id' => $column3->id, 'position' => 0],
                ['id' => $column1->id, 'position' => 1],
                ['id' => $column2->id, 'position' => 2],
            ],
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertEquals(1, $column1->fresh()->position);
        $this->assertEquals(2, $column2->fresh()->position);
        $this->assertEquals(0, $column3->fresh()->position);
    }

    public function test_member_cannot_reorder_columns(): void
    {
        $column1 = Column::factory()->create(['board_id' => $this->board->id, 'position' => 0]);
        $column2 = Column::factory()->create(['board_id' => $this->board->id, 'position' => 1]);

        $response = $this->actingAs($this->member)->post(route('boards.columns.reorder', $this->board), [
            'columns' => [
                ['id' => $column2->id, 'position' => 0],
                ['id' => $column1->id, 'position' => 1],
            ],
        ]);

        $response->assertForbidden();
    }

    public function test_reorder_validation_requires_columns_array(): void
    {
        $response = $this->actingAs($this->owner)->post(route('boards.columns.reorder', $this->board), [
            'columns' => 'invalid',
        ]);

        $response->assertSessionHasErrors('columns');
    }

    public function test_reorder_ignores_columns_from_other_boards(): void
    {
        $otherBoard = Board::factory()->create(['project_id' => $this->project->id]);
        $column1 = Column::factory()->create(['board_id' => $this->board->id, 'position' => 0]);
        $foreignColumn = Column::factory()->create(['board_id' => $otherBoard->id, 'position' => 0]);

        $response = $this->actingAs($this->owner)->post(route('boards.columns.reorder', $this->board), [
            'columns' => [
                ['id' => $column1->id, 'position' => 5],
                ['id' => $foreignColumn->id, 'position' => 10],
            ],
        ]);

        $response->assertRedirect();
        $this->assertEquals(5, $column1->fresh()->position);
        $this->assertEquals(0, $foreignColumn->fresh()->position); // unchanged
    }
}
