<?php

namespace Tests\Feature;

use App\Models\Board;
use App\Models\Column;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Notifications\TaskAssignedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class NotificationControllerTest extends TestCase
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

    public function test_guest_cannot_access_notifications(): void
    {
        $this->getJson(route('notifications.index'))
            ->assertUnauthorized();
    }

    public function test_user_can_fetch_notifications(): void
    {
        $this->actingAs($this->member)
            ->getJson(route('notifications.index'))
            ->assertOk()
            ->assertJsonStructure(['notifications', 'unread_count']);
    }

    public function test_assigning_task_sends_notification(): void
    {
        Notification::fake();

        $this->actingAs($this->owner)
            ->post(route('tasks.assign', $this->task), [
                'user_id' => $this->member->id,
            ])
            ->assertRedirect();

        Notification::assertSentTo($this->member, TaskAssignedNotification::class);
    }

    public function test_self_assign_does_not_send_notification(): void
    {
        Notification::fake();

        $this->actingAs($this->owner)
            ->post(route('tasks.assign', $this->task), [
                'user_id' => $this->owner->id,
            ])
            ->assertRedirect();

        Notification::assertNotSentTo($this->owner, TaskAssignedNotification::class);
    }

    public function test_user_can_mark_notification_as_read(): void
    {
        // Create a real notification
        $this->member->notify(new TaskAssignedNotification($this->task, $this->owner));
        $notification = $this->member->notifications()->first();

        $this->assertNull($notification->read_at);

        $this->actingAs($this->member)
            ->postJson(route('notifications.read', $notification->id))
            ->assertOk();

        $this->assertNotNull($notification->fresh()->read_at);
    }

    public function test_user_can_mark_all_notifications_as_read(): void
    {
        $this->member->notify(new TaskAssignedNotification($this->task, $this->owner));
        $this->member->notify(new TaskAssignedNotification($this->task, $this->owner));

        $this->assertEquals(2, $this->member->unreadNotifications()->count());

        $this->actingAs($this->member)
            ->postJson(route('notifications.read-all'))
            ->assertOk();

        $this->assertEquals(0, $this->member->unreadNotifications()->count());
    }

    public function test_user_can_delete_notification(): void
    {
        $this->member->notify(new TaskAssignedNotification($this->task, $this->owner));
        $notification = $this->member->notifications()->first();

        $this->actingAs($this->member)
            ->deleteJson(route('notifications.destroy', $notification->id))
            ->assertOk();

        $this->assertNull($this->member->notifications()->find($notification->id));
    }

    public function test_user_cannot_access_other_users_notifications(): void
    {
        $this->member->notify(new TaskAssignedNotification($this->task, $this->owner));
        $notification = $this->member->notifications()->first();

        $this->actingAs($this->owner)
            ->postJson(route('notifications.read', $notification->id))
            ->assertNotFound();
    }
}
