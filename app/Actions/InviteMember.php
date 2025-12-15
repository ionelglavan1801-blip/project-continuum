<?php

namespace App\Actions;

use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class InviteMember
{
    /**
     * Invite a user to a project by email.
     *
     * @param  array{email: string, role?: string}  $data
     *
     * @throws ModelNotFoundException If user not found
     */
    public function execute(Project $project, array $data): User
    {
        $user = User::where('email', $data['email'])->firstOrFail();
        $role = $data['role'] ?? 'member';

        // Check if already a member
        if ($project->members()->where('user_id', $user->id)->exists()) {
            throw new \InvalidArgumentException('User is already a member of this project.');
        }

        // Owner cannot be invited
        if ($project->owner_id === $user->id) {
            throw new \InvalidArgumentException('Owner cannot be invited as a member.');
        }

        $project->members()->attach($user->id, [
            'role' => $role,
            'created_at' => now(),
        ]);

        return $user;
    }
}
