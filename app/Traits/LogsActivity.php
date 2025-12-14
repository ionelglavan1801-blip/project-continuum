<?php

namespace App\Traits;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Relations\MorphMany;

trait LogsActivity
{
    /**
     * Get all activity logs for this model.
     */
    public function activityLogs(): MorphMany
    {
        return $this->morphMany(ActivityLog::class, 'loggable');
    }

    /**
     * Log an activity for this model.
     */
    public function logActivity(string $action, ?array $changes = null): ActivityLog
    {
        return $this->activityLogs()->create([
            'user_id' => auth()->id(),
            'action' => $action,
            'changes' => $changes,
        ]);
    }

    /**
     * Boot the trait and register model events.
     */
    public static function bootLogsActivity(): void
    {
        static::created(function ($model) {
            if (auth()->check()) {
                $model->logActivity('created', $model->getAttributes());
            }
        });

        static::updated(function ($model) {
            if (auth()->check()) {
                $changes = $model->getChanges();
                unset($changes['updated_at']);

                if (! empty($changes)) {
                    $model->logActivity('updated', [
                        'old' => array_intersect_key($model->getOriginal(), $changes),
                        'new' => $changes,
                    ]);
                }
            }
        });

        static::deleted(function ($model) {
            if (auth()->check()) {
                $model->logActivity('deleted');
            }
        });
    }
}
