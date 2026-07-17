<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Excavator;
use App\Models\Operator;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BookingController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = Booking::query()->orderByDesc('id');

        if ($user->role !== 'admin') {
            $query->where('user_id', $user->id);
        }

        return $query->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'excavator_id' => 'required|exists:excavators,id',
            'operator_id' => 'required|exists:operators,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $excavator = Excavator::findOrFail($data['excavator_id']);
        $operator = Operator::findOrFail($data['operator_id']);

        $days = Carbon::parse($data['start_date'])->diffInDays(Carbon::parse($data['end_date'])) + 1;
        $total = ($excavator->price_per_day + $operator->price_per_day) * $days;

        $booking = Booking::create([
            'user_id' => Auth::id(),
            'excavator_id' => $excavator->id,
            'operator_id' => $operator->id,
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'total_price' => $total,
            'status' => 'pending',
        ]);

        return $booking;
    }

    public function updateStatus(Request $request, Booking $booking)
    {
        $data = $request->validate([
            'status' => 'required|in:approved,rejected,on_progress,completed',
        ]);

        $booking->status = $data['status'];
        $booking->save();

        if ($data['status'] === 'approved') {
            Excavator::where('id', $booking->excavator_id)->update(['status' => 'rented']);
            Operator::where('id', $booking->operator_id)->update(['status' => 'assigned']);
        } elseif (in_array($data['status'], ['completed', 'rejected'])) {
            Excavator::where('id', $booking->excavator_id)->update(['status' => 'available']);
            Operator::where('id', $booking->operator_id)->update(['status' => 'available']);
        }

        return $booking;
    }
}
