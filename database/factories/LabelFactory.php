<?php

namespace Database\Factories;

use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Label>
 */
class LabelFactory extends Factory
{
    private const COLORS = [
        '#ef4444', '#f97316', '#eab308', '#22c55e',
        '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
    ];

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'name' => fake()->randomElement(['Bug', 'Feature', 'Enhancement', 'Documentation', 'Design', 'Research']),
            'color' => fake()->randomElement(self::COLORS),
        ];
    }
}
