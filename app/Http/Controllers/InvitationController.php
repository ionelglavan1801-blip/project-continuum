<?php

namespace App\Http\Controllers;

use App\Models\ProjectInvitation;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class InvitationController extends Controller
{
    /**
     * Show the invitation acceptance page.
     */
    public function show(string $token): Response|RedirectResponse
    {
        $invitation = ProjectInvitation::with('project', 'inviter')
            ->where('token', $token)
            ->first();

        if (! $invitation) {
            return redirect()->route('login')
                ->with('error', 'Invalid invitation link.');
        }

        if ($invitation->isAccepted()) {
            return redirect()->route('login')
                ->with('error', 'This invitation has already been accepted.');
        }

        if ($invitation->isExpired()) {
            return redirect()->route('login')
                ->with('error', 'This invitation has expired.');
        }

        return Inertia::render('Invitations/Show', [
            'invitation' => [
                'token' => $invitation->token,
                'email' => $invitation->email,
                'role' => $invitation->role,
                'project' => [
                    'id' => $invitation->project->id,
                    'name' => $invitation->project->name,
                ],
                'inviter' => [
                    'name' => $invitation->inviter->name,
                ],
                'expires_at' => $invitation->expires_at->toISOString(),
            ],
        ]);
    }

    /**
     * Accept the invitation.
     */
    public function accept(string $token): RedirectResponse
    {
        $invitation = ProjectInvitation::with('project')
            ->where('token', $token)
            ->first();

        if (! $invitation || ! $invitation->isValid()) {
            return redirect()->route('login')
                ->with('error', 'Invalid or expired invitation.');
        }

        $user = auth()->user();

        // Check if user's email matches the invitation
        if ($user->email !== $invitation->email) {
            return redirect()->back()
                ->with('error', 'This invitation was sent to a different email address.');
        }

        // Check if already a member
        if ($invitation->project->members()->where('user_id', $user->id)->exists()) {
            $invitation->update(['accepted_at' => now()]);

            return redirect()->route('projects.show', $invitation->project)
                ->with('info', 'You are already a member of this project.');
        }

        // Add user to project
        $invitation->project->members()->attach($user->id, [
            'role' => $invitation->role,
            'created_at' => now(),
        ]);

        $invitation->update(['accepted_at' => now()]);

        return redirect()->route('projects.show', $invitation->project)
            ->with('success', "You've joined the project successfully!");
    }
}
