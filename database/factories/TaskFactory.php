<?php

namespace Database\Factories;

use App\Models\Column;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Task>
 */
class TaskFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'column_id' => Column::factory(),
            'parent_id' => null,
            'title' => fake()->sentence(4),
            'description' => fake()->optional()->paragraph(),
            'position' => fake()->numberBetween(0, 100),
            'priority' => fake()->randomElement(['low', 'medium', 'high', 'urgent']),
            'due_date' => fake()->optional()->dateTimeBetween('now', '+30 days'),
            'estimated_hours' => fake()->optional()->randomFloat(1, 0.5, 40),
            'created_by' => User::factory(),
        ];
    }

    /**
     * Indicate that this is a subtask.
     */
    public function subtask(): static
    {
        return $this->state(fn (array $attributes) => [
            'parent_id' => \App\Models\Task::factory(),
        ]);
    }

    /**
     * Set a specific priority.
     */
    public function priority(string $priority): static
    {
        return $this->state(fn (array $attributes) => [
            'priority' => $priority,
        ]);
    }
}
