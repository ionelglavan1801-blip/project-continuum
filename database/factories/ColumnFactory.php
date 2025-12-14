<?php

namespace Database\Factories;

use App\Models\Board;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Column>
 */
class ColumnFactory extends Factory
{
    private const COLORS = [
        '#94a3b8', '#3b82f6', '#f59e0b', '#22c55e', '#ef4444',
    ];

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        static $position = 0;

        return [
            'board_id' => Board::factory(),
            'name' => fake()->randomElement(['To Do', 'In Progress', 'Review', 'Done']),
            'color' => fake()->randomElement(self::COLORS),
            'position' => $position++,
        ];
    }
}
