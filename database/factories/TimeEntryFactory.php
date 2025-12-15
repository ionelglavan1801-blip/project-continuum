<?php

namespace Database\Factories;

use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TimeEntry>
 */
class TimeEntryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startedAt = fake()->dateTimeBetween('-7 days', 'now');
        $endedAt = fake()->dateTimeBetween($startedAt, 'now');
        $durationMinutes = (int) (($endedAt->getTimestamp() - $startedAt->getTimestamp()) / 60);

        return [
            'task_id' => Task::factory(),
            'user_id' => User::factory(),
            'description' => fake()->optional()->sentence(),
            'started_at' => $startedAt,
            'ended_at' => $endedAt,
            'duration_minutes' => $durationMinutes,
        ];
    }

    /**
     * Indicate that the timer is still running.
     */
    public function running(): static
    {
        return $this->state(fn (array $attributes) => [
            'ended_at' => null,
            'duration_minutes' => null,
        ]);
    }
}
