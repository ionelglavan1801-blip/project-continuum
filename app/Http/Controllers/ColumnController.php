<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreColumnRequest;
use App\Http\Requests\UpdateColumnRequest;
use App\Models\Board;
use App\Models\Column;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ColumnController extends Controller
{
    /**
     * Store a newly created column.
     */
    public function store(StoreColumnRequest $request, Board $board): RedirectResponse
    {
        $maxPosition = $board->columns()->max('position') ?? -1;

        $board->columns()->create([
            ...$request->validated(),
            'position' => $maxPosition + 1,
        ]);

        return back()->with('success', 'Column created successfully.');
    }

    /**
     * Update the specified column.
     */
    public function update(UpdateColumnRequest $request, Column $column): RedirectResponse
    {
        $column->update($request->validated());

        return back()->with('success', 'Column updated successfully.');
    }

    /**
     * Remove the specified column.
     */
    public function destroy(Column $column): RedirectResponse
    {
        $this->authorize('delete', $column);

        $column->delete();

        return back()->with('success', 'Column deleted successfully.');
    }

    /**
     * Reorder columns within a board.
     */
    public function reorder(Request $request, Board $board): RedirectResponse
    {
        $this->authorize('update', $board);

        $request->validate([
            'columns' => ['required', 'array'],
            'columns.*.id' => ['required', 'exists:columns,id'],
            'columns.*.position' => ['required', 'integer', 'min:0'],
        ]);

        foreach ($request->columns as $columnData) {
            Column::where('id', $columnData['id'])
                ->where('board_id', $board->id)
                ->update(['position' => $columnData['position']]);
        }

        return back()->with('success', 'Columns reordered successfully.');
    }
}
