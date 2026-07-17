<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    protected $fillable = [
        'user_id', 'excavator_id', 'operator_id',
        'start_date', 'end_date', 'total_price', 'status',
    ];

    public function excavator()
    {
        return $this->belongsTo(Excavator::class);
    }

    public function operator()
    {
        return $this->belongsTo(Operator::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
