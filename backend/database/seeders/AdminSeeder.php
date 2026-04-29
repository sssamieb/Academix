<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name'                 => 'Administrador',
            'email'                => 'samieuwu@gmail.com',
            'password'             => Hash::make('12345678'),
            'role'                 => 'admin',
            'is_active'            => true,
            'must_change_password' => false,
            'email_verified_at'    => now(),
        ]);
    }
}