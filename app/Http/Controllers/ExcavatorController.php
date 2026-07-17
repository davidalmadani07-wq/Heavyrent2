<?php

namespace App\Http\Controllers;

use App\Models\Excavator;
use Illuminate\Http\Request;

class ExcavatorController extends Controller
{
    public function index()
    {
        return Excavator::orderBy('id')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'model_name' => 'required|string|max:150',
            'type' => 'required|string|max:100',
            'capacity' => 'nullable|string|max:50',
            'price_per_day' => 'required|numeric|min:0',
            'status' => 'required|in:available,rented,maintenance',
        ]);

        return Excavator::create($data);
    }

    public function update(Request $request, Excavator $excavator)
    {
        $data = $request->validate([
            'model_name' => 'required|string|max:150',
            'type' => 'required|string|max:100',
            'capacity' => 'nullable|string|max:50',
            'price_per_day' => 'required|numeric|min:0',
            'status' => 'required|in:available,rented,maintenance',
        ]);

        $excavator->update($data);

        return $excavator;
    }

    public function destroy(Excavator $excavator)
    {
        $excavator->delete();

        return response()->json(['ok' => true]);
    }
}
