<?php

namespace App\Events;

use App\Models\Task;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TaskMoved implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public Task $task,
        public int $boardId,
        public int $fromColumnId,
        public int $toColumnId,
        public int $newPosition,
        public int $movedByUserId
    ) {}

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('board.'.$this->boardId),
        ];
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'task' => [
                'id' => $this->task->id,
                'title' => $this->task->title,
                'column_id' => $this->task->column_id,
                'position' => $this->task->position,
            ],
            'from_column_id' => $this->fromColumnId,
            'to_column_id' => $this->toColumnId,
            'new_position' => $this->newPosition,
            'moved_by_user_id' => $this->movedByUserId,
        ];
    }
}
