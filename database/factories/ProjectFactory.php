<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Project>
 */
class ProjectFactory extends Factory
{
    private const COLORS = [
        '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
        '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
    ];

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->words(3, true),
            'description' => fake()->optional()->paragraph(),
            'color' => fake()->randomElement(self::COLORS),
            'owner_id' => User::factory(),
        ];
    }
}
