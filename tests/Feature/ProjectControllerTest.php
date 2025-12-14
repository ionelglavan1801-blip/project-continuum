<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_access_projects(): void
    {
        $response = $this->get(route('projects.index'));

        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_view_projects_index(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('projects.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Projects/Index'));
    }

    public function test_users_see_only_their_projects(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $ownedProject = Project::factory()->create(['owner_id' => $user->id]);
        $otherProject = Project::factory()->create(['owner_id' => $otherUser->id]);

        $response = $this->actingAs($user)->get(route('projects.index'));

        $response->assertInertia(fn ($page) => $page
            ->component('Projects/Index')
            ->has('projects', 1)
            ->where('projects.0.id', $ownedProject->id)
        );
    }

    public function test_users_can_view_create_project_form(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('projects.create'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Projects/Create'));
    }

    public function test_users_can_create_project(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->from(route('projects.create'))
            ->post(route('projects.store'), [
                'name' => 'Test Project',
                'description' => 'Test description',
                'color' => '#6366f1',
            ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('projects', [
            'name' => 'Test Project',
            'description' => 'Test description',
            'color' => '#6366f1',
            'owner_id' => $user->id,
        ]);

        // Check default board was created
        $project = Project::where('owner_id', $user->id)->first();
        $this->assertCount(1, $project->boards);
        $this->assertEquals('Main Board', $project->boards->first()->name);

        // Check default columns were created
        $this->assertCount(5, $project->boards->first()->columns);
    }

    public function test_project_creation_validates_name(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->from(route('projects.create'))
            ->post(route('projects.store'), [
                'name' => '',
                'description' => 'Test description',
            ]);

        $response->assertSessionHasErrors('name');
    }

    public function test_project_owner_can_view_project(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);

        $response = $this->actingAs($user)->get(route('projects.show', $project));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Projects/Show')
            ->where('project.id', $project->id)
        );
    }

    public function test_non_member_cannot_view_project(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $otherUser->id]);

        $response = $this->actingAs($user)->get(route('projects.show', $project));

        $response->assertForbidden();
    }

    public function test_project_member_can_view_project(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $project->members()->attach($member->id, ['role' => 'member']);

        $response = $this->actingAs($member)->get(route('projects.show', $project));

        $response->assertStatus(200);
    }

    public function test_project_owner_can_update_project(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);

        $response = $this->actingAs($user)
            ->from(route('projects.edit', $project))
            ->patch(route('projects.update', $project), [
                'name' => 'Updated Name',
                'description' => 'Updated description',
                'color' => '#ef4444',
            ]);

        $response->assertRedirect(route('projects.show', $project));

        $this->assertDatabaseHas('projects', [
            'id' => $project->id,
            'name' => 'Updated Name',
            'description' => 'Updated description',
            'color' => '#ef4444',
        ]);
    }

    public function test_project_admin_can_update_project(): void
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $project->members()->attach($admin->id, ['role' => 'admin']);

        $response = $this->actingAs($admin)
            ->from(route('projects.edit', $project))
            ->patch(route('projects.update', $project), [
                'name' => 'Admin Updated',
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('projects', ['id' => $project->id, 'name' => 'Admin Updated']);
    }

    public function test_project_member_cannot_update_project(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $project->members()->attach($member->id, ['role' => 'member']);

        $response = $this->actingAs($member)
            ->from(route('projects.edit', $project))
            ->patch(route('projects.update', $project), [
                'name' => 'Member Update Attempt',
            ]);

        $response->assertForbidden();
    }

    public function test_project_owner_can_delete_project(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);

        $response = $this->actingAs($user)
            ->from(route('projects.show', $project))
            ->delete(route('projects.destroy', $project));

        $response->assertRedirect(route('projects.index'));
        $this->assertDatabaseMissing('projects', ['id' => $project->id]);
    }

    public function test_non_owner_cannot_delete_project(): void
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $project->members()->attach($admin->id, ['role' => 'admin']);

        $response = $this->actingAs($admin)
            ->from(route('projects.show', $project))
            ->delete(route('projects.destroy', $project));

        $response->assertForbidden();
        $this->assertDatabaseHas('projects', ['id' => $project->id]);
    }

    public function test_user_sees_projects_where_they_are_member(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $project->members()->attach($member->id, ['role' => 'member']);

        $response = $this->actingAs($member)->get(route('projects.index'));

        $response->assertInertia(fn ($page) => $page
            ->has('projects', 1)
            ->where('projects.0.id', $project->id)
        );
    }

    public function test_owner_can_invite_member(): void
    {
        $owner = User::factory()->create();
        $newMember = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);

        $response = $this->actingAs($owner)
            ->post(route('projects.members.store', $project), [
                'email' => $newMember->email,
                'role' => 'member',
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('project_members', [
            'project_id' => $project->id,
            'user_id' => $newMember->id,
            'role' => 'member',
        ]);
    }

    public function test_admin_can_invite_member(): void
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create();
        $newMember = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $project->members()->attach($admin->id, ['role' => 'admin']);

        $response = $this->actingAs($admin)
            ->post(route('projects.members.store', $project), [
                'email' => $newMember->email,
                'role' => 'member',
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('project_members', [
            'project_id' => $project->id,
            'user_id' => $newMember->id,
        ]);
    }

    public function test_regular_member_cannot_invite(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $newMember = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $project->members()->attach($member->id, ['role' => 'member']);

        $response = $this->actingAs($member)
            ->post(route('projects.members.store', $project), [
                'email' => $newMember->email,
            ]);

        $response->assertForbidden();
    }

    public function test_cannot_invite_nonexistent_user(): void
    {
        $owner = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);

        $response = $this->actingAs($owner)
            ->post(route('projects.members.store', $project), [
                'email' => 'nonexistent@example.com',
            ]);

        $response->assertSessionHasErrors('email');
    }

    public function test_owner_can_remove_member(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $project->members()->attach($member->id, ['role' => 'member']);

        $response = $this->actingAs($owner)
            ->delete(route('projects.members.destroy', [$project, $member->id]));

        $response->assertRedirect();
        $this->assertDatabaseMissing('project_members', [
            'project_id' => $project->id,
            'user_id' => $member->id,
        ]);
    }
}
