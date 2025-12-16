<?php

namespace App\Actions;

use App\Models\Project;
use App\Models\ProjectInvitation;
use App\Models\User;
use App\Notifications\ProjectInvitationNotification;
use Illuminate\Support\Facades\Notification;

class InviteMember
{
    /**
     * Invite a user to a project by email.
     * If the user exists, add them directly. Otherwise, send an invitation email.
     *
     * @param  array{email: string, role?: string}  $data
     * @return array{type: string, user?: User, invitation?: ProjectInvitation}
     */
    public function execute(Project $project, array $data): array
    {
        $email = $data['email'];
        $role = $data['role'] ?? 'member';

        // Check if there's already a pending invitation
        $existingInvitation = ProjectInvitation::where('project_id', $project->id)
            ->where('email', $email)
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->first();

        if ($existingInvitation) {
            throw new \InvalidArgumentException('An invitation has already been sent to this email address.');
        }

        // Check if user already exists
        $user = User::where('email', $email)->first();

        if ($user) {
            // Check if already a member
            if ($project->members()->where('user_id', $user->id)->exists()) {
                throw new \InvalidArgumentException('User is already a member of this project.');
            }

            // Owner cannot be invited
            if ($project->owner_id === $user->id) {
                throw new \InvalidArgumentException('Owner cannot be invited as a member.');
            }

            // Add user directly as a member
            $project->members()->attach($user->id, [
                'role' => $role,
                'created_at' => now(),
            ]);

            return ['type' => 'added', 'user' => $user];
        }

        // User doesn't exist - create invitation and send email
        $invitation = ProjectInvitation::create([
            'project_id' => $project->id,
            'invited_by' => auth()->id(),
            'email' => $email,
            'role' => $role,
            'token' => ProjectInvitation::generateToken(),
            'expires_at' => now()->addDays(7),
        ]);

        // Send invitation email
        Notification::route('mail', $email)
            ->notify(new ProjectInvitationNotification($invitation));

        return ['type' => 'invited', 'invitation' => $invitation];
    }
}
