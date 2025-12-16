<?php

namespace App\Http\Controllers;

use App\Actions\CreateProject;
use App\Actions\InviteMember;
use App\Http\Requests\InviteMemberRequest;
use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Models\Project;
use App\Models\ProjectInvitation;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $this->authorize('viewAny', Project::class);

        $user = auth()->user();

        $projects = Project::query()
            ->where('owner_id', $user->id)
            ->orWhereHas('members', fn ($query) => $query->where('user_id', $user->id))
            ->with(['owner', 'members', 'boards'])
            ->withCount('boards')
            ->latest()
            ->get();

        return Inertia::render('Projects/Index', [
            'projects' => $projects,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $this->authorize('create', Project::class);

        return Inertia::render('Projects/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreProjectRequest $request, CreateProject $createProject): RedirectResponse
    {
        $project = $createProject->execute(
            $request->user(),
            $request->validated()
        );

        return redirect()
            ->route('projects.show', $project)
            ->with('success', 'Project created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Project $project): Response
    {
        $this->authorize('view', $project);

        $project->load([
            'owner',
            'members',
            'boards.columns.tasks' => fn ($query) => $query->orderBy('position'),
            'boards.columns' => fn ($query) => $query->orderBy('position'),
            'labels',
        ]);

        // Get pending invitations for this project
        $pendingInvitations = $project->invitations()
            ->with('inviter')
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->get();

        return Inertia::render('Projects/Show', [
            'project' => $project,
            'pendingInvitations' => $pendingInvitations,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Project $project): Response
    {
        $this->authorize('update', $project);

        $project->load(['owner', 'members']);

        return Inertia::render('Projects/Edit', [
            'project' => $project,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateProjectRequest $request, Project $project): RedirectResponse
    {
        $project->update($request->validated());

        return redirect()
            ->route('projects.show', $project)
            ->with('success', 'Project updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Project $project): RedirectResponse
    {
        $this->authorize('delete', $project);

        $project->delete();

        return redirect()
            ->route('projects.index')
            ->with('success', 'Project deleted successfully.');
    }

    /**
     * Invite a member to the project.
     */
    public function inviteMember(InviteMemberRequest $request, Project $project, InviteMember $inviteMember): RedirectResponse
    {
        try {
            $result = $inviteMember->execute($project, $request->validated());

            $message = $result['type'] === 'added'
                ? 'Member added successfully.'
                : 'Invitation sent successfully.';

            return redirect()
                ->back()
                ->with('success', $message);
        } catch (\InvalidArgumentException $e) {
            return redirect()
                ->back()
                ->withErrors(['email' => $e->getMessage()]);
        }
    }

    /**
     * Remove a member from the project.
     */
    public function removeMember(Project $project, int $userId): RedirectResponse
    {
        $this->authorize('update', $project);

        // Cannot remove owner
        if ($project->owner_id === $userId) {
            return redirect()
                ->back()
                ->withErrors(['member' => 'Cannot remove the project owner.']);
        }

        $project->members()->detach($userId);

        return redirect()
            ->back()
            ->with('success', 'Member removed successfully.');
    }

    /**
     * Cancel a pending invitation.
     */
    public function cancelInvitation(Project $project, ProjectInvitation $invitation): RedirectResponse
    {
        $this->authorize('update', $project);

        // Make sure the invitation belongs to this project
        if ($invitation->project_id !== $project->id) {
            abort(404);
        }

        $invitation->delete();

        return redirect()
            ->back()
            ->with('success', 'Invitation cancelled.');
    }
}
