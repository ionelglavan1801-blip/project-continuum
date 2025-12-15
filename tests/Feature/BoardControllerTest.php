<?php

namespace Tests\Feature;

use App\Models\Board;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BoardControllerTest extends TestCase
{
    use RefreshDatabase;

    private function createProjectWithOwner(User $user): Project
    {
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $project->members()->attach($user->id, ['role' => 'owner']);

        return $project;
    }

    public function test_guests_cannot_access_boards(): void
    {
        $user = User::factory()->create();
        $project = $this->createProjectWithOwner($user);

        $response = $this->get(route('projects.boards.create', $project));

        $response->assertRedirect(route('login'));
    }

    public function test_project_owner_can_view_create_board_form(): void
    {
        $user = User::factory()->create();
        $project = $this->createProjectWithOwner($user);

        $response = $this->actingAs($user)->get(route('projects.boards.create', $project));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Boards/Create')
            ->where('project.id', $project->id)
        );
    }

    public function test_project_member_can_view_create_board_form(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $project = $this->createProjectWithOwner($owner);
        $project->members()->attach($member->id, ['role' => 'member']);

        $response = $this->actingAs($member)->get(route('projects.boards.create', $project));

        $response->assertStatus(200);
    }

    public function test_non_member_cannot_view_create_board_form(): void
    {
        $owner = User::factory()->create();
        $nonMember = User::factory()->create();
        $project = $this->createProjectWithOwner($owner);

        $response = $this->actingAs($nonMember)->get(route('projects.boards.create', $project));

        $response->assertForbidden();
    }

    public function test_project_owner_can_create_board(): void
    {
        $user = User::factory()->create();
        $project = $this->createProjectWithOwner($user);

        $response = $this->actingAs($user)
            ->from(route('projects.boards.create', $project))
            ->post(route('projects.boards.store', $project), [
                'name' => 'Test Board',
                'description' => 'Test description',
            ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('boards', [
            'name' => 'Test Board',
            'description' => 'Test description',
            'project_id' => $project->id,
        ]);

        // Check default columns were created
        $board = Board::where('project_id', $project->id)->where('name', 'Test Board')->first();
        $this->assertNotNull($board);
        $this->assertCount(3, $board->columns);
    }

    public function test_board_creation_validates_name(): void
    {
        $user = User::factory()->create();
        $project = $this->createProjectWithOwner($user);

        $response = $this->actingAs($user)
            ->from(route('projects.boards.create', $project))
            ->post(route('projects.boards.store', $project), [
                'name' => '',
                'description' => 'Test description',
            ]);

        $response->assertSessionHasErrors('name');
    }

    public function test_non_member_cannot_create_board(): void
    {
        $owner = User::factory()->create();
        $nonMember = User::factory()->create();
        $project = $this->createProjectWithOwner($owner);

        $response = $this->actingAs($nonMember)
            ->from(route('projects.boards.create', $project))
            ->post(route('projects.boards.store', $project), [
                'name' => 'Test Board',
            ]);

        $response->assertForbidden();
    }

    public function test_project_member_can_view_board(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $project = $this->createProjectWithOwner($owner);
        $project->members()->attach($member->id, ['role' => 'member']);
        $board = Board::factory()->create(['project_id' => $project->id]);

        $response = $this->actingAs($member)->get(route('projects.boards.show', [$project, $board]));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Boards/Show')
            ->where('board.id', $board->id)
        );
    }

    public function test_non_member_cannot_view_board(): void
    {
        $owner = User::factory()->create();
        $nonMember = User::factory()->create();
        $project = $this->createProjectWithOwner($owner);
        $board = Board::factory()->create(['project_id' => $project->id]);

        $response = $this->actingAs($nonMember)->get(route('projects.boards.show', [$project, $board]));

        $response->assertForbidden();
    }

    public function test_project_owner_can_view_edit_board_form(): void
    {
        $user = User::factory()->create();
        $project = $this->createProjectWithOwner($user);
        $board = Board::factory()->create(['project_id' => $project->id]);

        $response = $this->actingAs($user)->get(route('projects.boards.edit', [$project, $board]));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Boards/Edit')
            ->where('board.id', $board->id)
        );
    }

    public function test_project_admin_can_view_edit_board_form(): void
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create();
        $project = $this->createProjectWithOwner($owner);
        $project->members()->attach($admin->id, ['role' => 'admin']);
        $board = Board::factory()->create(['project_id' => $project->id]);

        $response = $this->actingAs($admin)->get(route('projects.boards.edit', [$project, $board]));

        $response->assertStatus(200);
    }

    public function test_project_member_cannot_view_edit_board_form(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $project = $this->createProjectWithOwner($owner);
        $project->members()->attach($member->id, ['role' => 'member']);
        $board = Board::factory()->create(['project_id' => $project->id]);

        $response = $this->actingAs($member)->get(route('projects.boards.edit', [$project, $board]));

        $response->assertForbidden();
    }

    public function test_project_owner_can_update_board(): void
    {
        $user = User::factory()->create();
        $project = $this->createProjectWithOwner($user);
        $board = Board::factory()->create(['project_id' => $project->id]);

        $response = $this->actingAs($user)
            ->from(route('projects.boards.edit', [$project, $board]))
            ->patch(route('projects.boards.update', [$project, $board]), [
                'name' => 'Updated Board Name',
                'description' => 'Updated description',
            ]);

        $response->assertRedirect(route('projects.boards.show', [$project, $board]));

        $this->assertDatabaseHas('boards', [
            'id' => $board->id,
            'name' => 'Updated Board Name',
            'description' => 'Updated description',
        ]);
    }

    public function test_project_admin_can_update_board(): void
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create();
        $project = $this->createProjectWithOwner($owner);
        $project->members()->attach($admin->id, ['role' => 'admin']);
        $board = Board::factory()->create(['project_id' => $project->id]);

        $response = $this->actingAs($admin)
            ->from(route('projects.boards.edit', [$project, $board]))
            ->patch(route('projects.boards.update', [$project, $board]), [
                'name' => 'Admin Updated Board',
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('boards', ['id' => $board->id, 'name' => 'Admin Updated Board']);
    }

    public function test_project_member_cannot_update_board(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $project = $this->createProjectWithOwner($owner);
        $project->members()->attach($member->id, ['role' => 'member']);
        $board = Board::factory()->create(['project_id' => $project->id]);

        $response = $this->actingAs($member)
            ->from(route('projects.boards.edit', [$project, $board]))
            ->patch(route('projects.boards.update', [$project, $board]), [
                'name' => 'Member Update Attempt',
            ]);

        $response->assertForbidden();
    }

    public function test_non_member_cannot_update_board(): void
    {
        $owner = User::factory()->create();
        $nonMember = User::factory()->create();
        $project = $this->createProjectWithOwner($owner);
        $board = Board::factory()->create(['project_id' => $project->id]);

        $response = $this->actingAs($nonMember)
            ->patch(route('projects.boards.update', [$project, $board]), [
                'name' => 'Non-member Update Attempt',
            ]);

        $response->assertForbidden();
    }

    public function test_project_owner_can_delete_board(): void
    {
        $user = User::factory()->create();
        $project = $this->createProjectWithOwner($user);
        $board = Board::factory()->create(['project_id' => $project->id, 'is_default' => false]);

        $response = $this->actingAs($user)
            ->from(route('projects.boards.show', [$project, $board]))
            ->delete(route('projects.boards.destroy', [$project, $board]));

        $response->assertRedirect(route('projects.show', $project));
        $this->assertDatabaseMissing('boards', ['id' => $board->id]);
    }

    public function test_project_admin_cannot_delete_board(): void
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create();
        $project = $this->createProjectWithOwner($owner);
        $project->members()->attach($admin->id, ['role' => 'admin']);
        $board = Board::factory()->create(['project_id' => $project->id]);

        $response = $this->actingAs($admin)
            ->from(route('projects.boards.show', [$project, $board]))
            ->delete(route('projects.boards.destroy', [$project, $board]));

        $response->assertForbidden();
        $this->assertDatabaseHas('boards', ['id' => $board->id]);
    }

    public function test_project_member_cannot_delete_board(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $project = $this->createProjectWithOwner($owner);
        $project->members()->attach($member->id, ['role' => 'member']);
        $board = Board::factory()->create(['project_id' => $project->id]);

        $response = $this->actingAs($member)
            ->delete(route('projects.boards.destroy', [$project, $board]));

        $response->assertForbidden();
    }

    public function test_cannot_delete_default_board(): void
    {
        $user = User::factory()->create();
        $project = $this->createProjectWithOwner($user);
        $board = Board::factory()->create(['project_id' => $project->id, 'is_default' => true]);

        $response = $this->actingAs($user)
            ->from(route('projects.boards.show', [$project, $board]))
            ->delete(route('projects.boards.destroy', [$project, $board]));

        $response->assertForbidden();
        $this->assertDatabaseHas('boards', ['id' => $board->id]);
    }

    public function test_board_positions_are_sequential(): void
    {
        $user = User::factory()->create();
        $project = $this->createProjectWithOwner($user);

        // Create first board
        $this->actingAs($user)
            ->post(route('projects.boards.store', $project), ['name' => 'Board 1']);

        // Create second board
        $this->actingAs($user)
            ->post(route('projects.boards.store', $project), ['name' => 'Board 2']);

        $boards = $project->boards()->orderBy('position')->get();
        $this->assertEquals(0, $boards[0]->position);
        $this->assertEquals(1, $boards[1]->position);
    }
}
