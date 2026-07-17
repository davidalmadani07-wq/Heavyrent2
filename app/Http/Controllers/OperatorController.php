<?php

namespace App\Http\Controllers;

use App\Models\Operator;
use Illuminate\Http\Request;

class OperatorController extends Controller
{
    public function index()
    {
        return Operator::orderBy('id')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:150',
            'phone' => 'required|string|max:30',
            'certification' => 'nullable|string|max:150',
            'price_per_day' => 'required|numeric|min:0',
            'status' => 'required|in:available,assigned',
        ]);

        return Operator::create($data);
    }

    public function update(Request $request, Operator $operator)
    {
        $data = $request->validate([
            'name' => 'required|string|max:150',
            'phone' => 'required|string|max:30',
            'certification' => 'nullable|string|max:150',
            'price_per_day' => 'required|numeric|min:0',
            'status' => 'required|in:available,assigned',
        ]);

        $operator->update($data);

        return $operator;
    }

    public function destroy(Operator $operator)
    {
        $operator->delete();

        return response()->json(['ok' => true]);
    }
}
