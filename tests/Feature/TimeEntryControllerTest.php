<?php

namespace Tests\Feature;

use App\Models\Board;
use App\Models\Column;
use App\Models\Project;
use App\Models\Task;
use App\Models\TimeEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TimeEntryControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    private User $member;

    private Project $project;

    private Task $task;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create();
        $this->member = User::factory()->create();

        $this->project = Project::factory()->create(['owner_id' => $this->owner->id]);
        $this->project->members()->attach($this->member->id, ['role' => 'member']);

        $board = Board::factory()->create(['project_id' => $this->project->id]);
        $column = Column::factory()->create(['board_id' => $board->id]);
        $this->task = Task::factory()->create([
            'column_id' => $column->id,
            'created_by' => $this->owner->id,
        ]);
    }

    public function test_guest_cannot_access_time_entries(): void
    {
        $this->getJson(route('tasks.time-entries.index', $this->task))
            ->assertUnauthorized();
    }

    public function test_project_member_can_view_time_entries(): void
    {
        TimeEntry::factory()->create([
            'task_id' => $this->task->id,
            'user_id' => $this->member->id,
            'duration_minutes' => 30,
        ]);

        $this->actingAs($this->member)
            ->getJson(route('tasks.time-entries.index', $this->task))
            ->assertOk()
            ->assertJsonStructure(['entries', 'total_minutes']);
    }

    public function test_user_can_start_timer(): void
    {
        $this->actingAs($this->member)
            ->postJson(route('tasks.timer.start', $this->task), [
                'description' => 'Working on task',
            ])
            ->assertOk()
            ->assertJsonStructure(['id', 'started_at', 'message']);

        $this->assertDatabaseHas('time_entries', [
            'task_id' => $this->task->id,
            'user_id' => $this->member->id,
            'description' => 'Working on task',
            'ended_at' => null,
        ]);
    }

    public function test_cannot_start_second_timer(): void
    {
        // Create a running timer
        TimeEntry::factory()->create([
            'task_id' => $this->task->id,
            'user_id' => $this->member->id,
            'started_at' => now(),
            'ended_at' => null,
        ]);

        $this->actingAs($this->member)
            ->postJson(route('tasks.timer.start', $this->task))
            ->assertStatus(422)
            ->assertJsonPath('error', 'You already have a running timer.');
    }

    public function test_user_can_stop_timer(): void
    {
        $entry = TimeEntry::factory()->create([
            'task_id' => $this->task->id,
            'user_id' => $this->member->id,
            'started_at' => now()->subMinutes(30),
            'ended_at' => null,
        ]);

        $this->actingAs($this->member)
            ->postJson(route('time-entries.stop', $entry))
            ->assertOk()
            ->assertJsonStructure(['id', 'duration_minutes', 'message']);

        $entry->refresh();
        $this->assertNotNull($entry->ended_at);
        $this->assertGreaterThan(0, $entry->duration_minutes);
    }

    public function test_cannot_stop_already_stopped_timer(): void
    {
        $entry = TimeEntry::factory()->create([
            'task_id' => $this->task->id,
            'user_id' => $this->member->id,
            'started_at' => now()->subHour(),
            'ended_at' => now(),
            'duration_minutes' => 60,
        ]);

        $this->actingAs($this->member)
            ->postJson(route('time-entries.stop', $entry))
            ->assertStatus(422);
    }

    public function test_user_can_add_manual_time_entry(): void
    {
        $this->actingAs($this->member)
            ->post(route('tasks.time-entries.store', $this->task), [
                'duration_minutes' => 45,
                'description' => 'Manual entry',
                'started_at' => now()->toIso8601String(),
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('time_entries', [
            'task_id' => $this->task->id,
            'user_id' => $this->member->id,
            'duration_minutes' => 45,
            'description' => 'Manual entry',
        ]);
    }

    public function test_user_can_update_own_time_entry(): void
    {
        $entry = TimeEntry::factory()->create([
            'task_id' => $this->task->id,
            'user_id' => $this->member->id,
            'duration_minutes' => 30,
        ]);

        $this->actingAs($this->member)
            ->patch(route('time-entries.update', $entry), [
                'duration_minutes' => 60,
            ])
            ->assertRedirect();

        $this->assertEquals(60, $entry->fresh()->duration_minutes);
    }

    public function test_user_cannot_update_other_users_time_entry(): void
    {
        $entry = TimeEntry::factory()->create([
            'task_id' => $this->task->id,
            'user_id' => $this->owner->id,
            'duration_minutes' => 30,
        ]);

        $this->actingAs($this->member)
            ->patch(route('time-entries.update', $entry), [
                'duration_minutes' => 60,
            ])
            ->assertForbidden();
    }

    public function test_user_can_delete_own_time_entry(): void
    {
        $entry = TimeEntry::factory()->create([
            'task_id' => $this->task->id,
            'user_id' => $this->member->id,
        ]);

        $this->actingAs($this->member)
            ->delete(route('time-entries.destroy', $entry))
            ->assertRedirect();

        $this->assertDatabaseMissing('time_entries', ['id' => $entry->id]);
    }

    public function test_user_cannot_delete_other_users_time_entry(): void
    {
        $entry = TimeEntry::factory()->create([
            'task_id' => $this->task->id,
            'user_id' => $this->owner->id,
        ]);

        $this->actingAs($this->member)
            ->delete(route('time-entries.destroy', $entry))
            ->assertForbidden();
    }

    public function test_user_can_get_current_running_timer(): void
    {
        TimeEntry::factory()->create([
            'task_id' => $this->task->id,
            'user_id' => $this->member->id,
            'started_at' => now()->subMinutes(10),
            'ended_at' => null,
        ]);

        $response = $this->actingAs($this->member)
            ->getJson(route('timer.current'))
            ->assertOk();

        $response->assertJson(['running' => true]);
        $response->assertJsonStructure(['running', 'id', 'task_id', 'task_title', 'started_at', 'elapsed_seconds']);
    }

    public function test_returns_not_running_when_no_active_timer(): void
    {
        $this->actingAs($this->member)
            ->getJson(route('timer.current'))
            ->assertOk()
            ->assertJson(['running' => false]);
    }

    public function test_stranger_cannot_start_timer(): void
    {
        $stranger = User::factory()->create();

        $this->actingAs($stranger)
            ->postJson(route('tasks.timer.start', $this->task))
            ->assertForbidden();
    }
}
