import { useState, useEffect, useRef } from 'react';
import { Play, Square, Clock, Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import axios from 'axios';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';

interface TimeEntry {
    id: number;
    user: { id: number; name: string };
    description: string | null;
    started_at: string;
    ended_at: string | null;
    duration_minutes: number | null;
    is_running: boolean;
}

interface Props {
    taskId: number;
    canEdit: boolean;
}

export default function TimeTracker({ taskId, canEdit }: Props) {
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [totalMinutes, setTotalMinutes] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [runningEntryId, setRunningEntryId] = useState<number | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showManualForm, setShowManualForm] = useState(false);
    const [editingEntry, setEditingEntry] = useState<number | null>(null);
    
    const [manualMinutes, setManualMinutes] = useState('');
    const [description, setDescription] = useState('');
    
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchEntries = async () => {
        try {
            const response = await axios.get(route('tasks.time-entries.index', taskId));
            setEntries(response.data.entries);
            setTotalMinutes(response.data.total_minutes);
            
            // Check for running entry
            const running = response.data.entries.find((e: TimeEntry) => e.is_running);
            if (running) {
                setIsRunning(true);
                setRunningEntryId(running.id);
            }
        } catch (error) {
            console.error('Failed to fetch time entries:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkRunningTimer = async () => {
        try {
            const response = await axios.get(route('timer.current'));
            if (response.data.running && response.data.task_id === taskId) {
                setIsRunning(true);
                setRunningEntryId(response.data.id);
                setElapsedSeconds(response.data.elapsed_seconds);
            }
        } catch (error) {
            console.error('Failed to check timer:', error);
        }
    };

    useEffect(() => {
        fetchEntries();
        checkRunningTimer();
    }, [taskId]);

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setElapsedSeconds(s => s + 1);
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            setElapsedSeconds(0);
        }
        
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isRunning]);

    const startTimer = async () => {
        try {
            const response = await axios.post(route('tasks.timer.start', taskId), {
                description: description || null,
            });
            setIsRunning(true);
            setRunningEntryId(response.data.id);
            setElapsedSeconds(0);
            setDescription('');
        } catch (error: any) {
            if (error.response?.data?.error) {
                alert(error.response.data.error);
            }
        }
    };

    const stopTimer = async () => {
        if (!runningEntryId) return;
        
        try {
            await axios.post(route('time-entries.stop', runningEntryId));
            setIsRunning(false);
            setRunningEntryId(null);
            setElapsedSeconds(0);
            fetchEntries();
        } catch (error: any) {
            if (error.response?.data?.error) {
                alert(error.response.data.error);
            }
        }
    };

    const addManualEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            await axios.post(route('tasks.time-entries.store', taskId), {
                duration_minutes: parseInt(manualMinutes),
                description: description || null,
                started_at: new Date().toISOString(),
            });
            setManualMinutes('');
            setDescription('');
            setShowManualForm(false);
            fetchEntries();
        } catch (error) {
            console.error('Failed to add time entry:', error);
        }
    };

    const deleteEntry = async (entryId: number) => {
        if (!confirm('Delete this time entry?')) return;
        
        try {
            await axios.delete(route('time-entries.destroy', entryId));
            fetchEntries();
        } catch (error) {
            console.error('Failed to delete time entry:', error);
        }
    };

    const updateEntry = async (entryId: number, newMinutes: number) => {
        try {
            await axios.patch(route('time-entries.update', entryId), {
                duration_minutes: newMinutes,
            });
            setEditingEntry(null);
            fetchEntries();
        } catch (error) {
            console.error('Failed to update time entry:', error);
        }
    };

    const formatTime = (seconds: number): string => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDuration = (minutes: number): string => {
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hrs > 0) {
            return `${hrs}h ${mins}m`;
        }
        return `${mins}m`;
    };

    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-full"></div>
            </div>
        );
    }

    return (
        <div className="border-t border-gray-200 pt-6 mt-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time Tracking
                </h3>
                <span className="text-sm text-gray-500">
                    Total: <span className="font-medium">{formatDuration(totalMinutes)}</span>
                </span>
            </div>

            {/* Timer Controls */}
            {canEdit && (
                <div className="mb-4">
                    {isRunning ? (
                        <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="font-mono text-2xl text-green-700">
                                {formatTime(elapsedSeconds)}
                            </div>
                            <button
                                onClick={stopTimer}
                                className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
                            >
                                <Square className="h-4 w-4" />
                                Stop
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={startTimer}
                                className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500"
                            >
                                <Play className="h-4 w-4" />
                                Start Timer
                            </button>
                            <button
                                onClick={() => setShowManualForm(!showManualForm)}
                                className="flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                            >
                                <Plus className="h-4 w-4" />
                                Add Manual
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Manual Entry Form */}
            {showManualForm && (
                <form onSubmit={addManualEntry} className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Duration (minutes)</label>
                            <TextInput
                                type="number"
                                value={manualMinutes}
                                onChange={e => setManualMinutes(e.target.value)}
                                min="1"
                                required
                                className="w-full"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Description (optional)</label>
                            <TextInput
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full"
                            />
                        </div>
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                        <SecondaryButton type="button" onClick={() => setShowManualForm(false)}>
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton type="submit">
                            Add Entry
                        </PrimaryButton>
                    </div>
                </form>
            )}

            {/* Time Entries List */}
            {entries.length > 0 && (
                <div className="space-y-2">
                    {entries.map(entry => (
                        <div
                            key={entry.id}
                            className={`flex items-center justify-between p-3 rounded-lg ${
                                entry.is_running ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                            }`}
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-900">
                                        {entry.user.name}
                                    </span>
                                    {entry.is_running && (
                                        <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                                            Running
                                        </span>
                                    )}
                                </div>
                                {entry.description && (
                                    <p className="text-xs text-gray-500 mt-0.5">{entry.description}</p>
                                )}
                                <p className="text-xs text-gray-400 mt-0.5">{entry.started_at}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {editingEntry === entry.id ? (
                                    <div className="flex items-center gap-2">
                                        <TextInput
                                            type="number"
                                            defaultValue={entry.duration_minutes || 0}
                                            className="w-20 text-sm"
                                            id={`edit-${entry.id}`}
                                            min="1"
                                        />
                                        <button
                                            onClick={() => {
                                                const input = document.getElementById(`edit-${entry.id}`) as HTMLInputElement;
                                                updateEntry(entry.id, parseInt(input.value));
                                            }}
                                            className="text-green-600 hover:text-green-800"
                                        >
                                            <Check className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => setEditingEntry(null)}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="text-sm font-medium text-gray-700">
                                            {entry.is_running ? '...' : formatDuration(entry.duration_minutes || 0)}
                                        </span>
                                        {canEdit && !entry.is_running && (
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => setEditingEntry(entry.id)}
                                                    className="text-gray-400 hover:text-gray-600"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => deleteEntry(entry.id)}
                                                    className="text-gray-400 hover:text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {entries.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                    No time tracked yet
                </p>
            )}
        </div>
    );
}
