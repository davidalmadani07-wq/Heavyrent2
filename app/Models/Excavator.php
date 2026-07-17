<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Excavator extends Model
{
    protected $fillable = ['model_name', 'type', 'capacity', 'price_per_day', 'status'];
}
