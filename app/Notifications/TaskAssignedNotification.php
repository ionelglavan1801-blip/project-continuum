<?php

namespace App\Notifications;

use App\Models\Task;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TaskAssignedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public Task $task,
        public User $assignedBy
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $projectName = $this->task->column->board->project->name;

        return (new MailMessage)
            ->subject("You've been assigned to: {$this->task->title}")
            ->greeting("Hello {$notifiable->name}!")
            ->line("{$this->assignedBy->name} assigned you to a task.")
            ->line("**Task:** {$this->task->title}")
            ->line("**Project:** {$projectName}")
            ->action('View Task', route('tasks.show', $this->task))
            ->line('Good luck with your work!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'task_id' => $this->task->id,
            'task_title' => $this->task->title,
            'assigned_by_id' => $this->assignedBy->id,
            'assigned_by_name' => $this->assignedBy->name,
            'project_id' => $this->task->column->board->project->id,
            'project_name' => $this->task->column->board->project->name,
            'message' => "{$this->assignedBy->name} assigned you to \"{$this->task->title}\"",
        ];
    }
}
