<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Operator extends Model
{
    protected $fillable = ['name', 'phone', 'certification', 'price_per_day', 'status'];
}
