<?php

namespace App\Notifications;

use App\Models\ProjectInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ProjectInvitationNotification extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public ProjectInvitation $invitation
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $project = $this->invitation->project;
        $inviter = $this->invitation->inviter;
        $acceptUrl = url("/invitations/{$this->invitation->token}");

        return (new MailMessage)
            ->subject("You've been invited to join {$project->name}")
            ->greeting('Hello!')
            ->line("{$inviter->name} has invited you to join the project \"{$project->name}\" on Continuum Platform.")
            ->line("You've been invited as a {$this->invitation->role}.")
            ->action('Accept Invitation', $acceptUrl)
            ->line('This invitation will expire in 7 days.')
            ->line('If you did not expect this invitation, you can ignore this email.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'invitation_id' => $this->invitation->id,
            'project_id' => $this->invitation->project_id,
            'project_name' => $this->invitation->project->name,
        ];
    }
}
