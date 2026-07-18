# HeavyRent — Platform Sewa Excavator & Operator

Aplikasi web penyewaan **excavator dan operator bersertifikat**, dengan frontend
**React (JSX)** bertema industrial "plat unit alat berat", terhubung ke backend
**Laravel + MySQL** melalui REST API (`fetch`). Mendukung dua role pengguna:
**Customer** dan **Admin**, masing-masing dengan dashboard dan fitur berbeda.

## Struktur Project
```
heavyrent/
├── resources/js/
│   └── HeavyRentApp.jsx      <- root React component (single file)
└── routes/
<<<<<<< HEAD
    └── api.php                <- endpoint Laravel yang dikonsumsi frontend
=======
    └── web.php                <- endpoint Laravel yang dikonsumsi frontend
>>>>>>> 178fd3e28c32e2d30fd6e92ccbd85f44ba3dede2
```

## Tech Stack
- **Frontend**: React (hooks: `useState`, `useEffect`), Tailwind CSS, ikon dari `lucide-react`
- **Backend**: Laravel (REST API, autentikasi berbasis session + CSRF token)
- **Database**: MySQL

## Autentikasi
- `AuthScreen` menyediakan form **Masuk** dan **Daftar** dalam satu komponen (toggle tab).
- Saat daftar, user memilih role: **Pelanggan (customer)** atau **Admin**.
- CSRF token diambil otomatis dari meta tag `<meta name="csrf-token">` dan disertakan
  di setiap request (`apiFetch`) lewat header `X-CSRF-TOKEN`.
- Endpoint yang digunakan: `POST /login`, `POST /register`, `POST /logout`, `GET /me`.

## Alur Aplikasi
1. Saat pertama dimuat, aplikasi memanggil `/me`, `/excavators`, dan `/operators` secara paralel.
2. Jika user belum login, tampil `AuthScreen`.
3. Jika sudah login, `Sidebar` menampilkan menu navigasi sesuai role, dan konten utama
   dirender berdasarkan `view` yang aktif.

## Fitur per Role

### Customer
| View | Komponen | Deskripsi |
|---|---|---|
| Katalog | `CatalogView` | Menampilkan daftar excavator (dengan pencarian) dan operator yang tersedia, lengkap dengan status dan harga per hari |
| Sewa Baru | `BookingView` | Form pemesanan: pilih excavator + operator, tentukan tanggal mulai/selesai, total biaya dihitung otomatis (`(harga excavator + harga operator) × jumlah hari`) |
| Riwayat Pesanan | `HistoryView` | Menampilkan riwayat pesanan milik user beserta status terkini |

### Admin
| View | Komponen | Deskripsi |
|---|---|---|
| Ringkasan | `AdminOverview` | Dashboard ringkasan kondisi alat, operator, dan pesanan |
| Kelola Alat | `ExcavatorAdmin` | CRUD data excavator (Tambah/Edit/Hapus) |
| Kelola Operator | `OperatorAdmin` | CRUD data operator (Tambah/Edit/Hapus) |
| Pesanan Masuk | `OrdersAdmin` | Melihat semua pesanan masuk dan mengubah status (Setujui/Tolak/Selesaikan, dsb) |

## Status & Badge
Status ditampilkan menggunakan komponen `Badge`, dengan pemetaan label Bahasa Indonesia:

| Status (key) | Label | Tone |
|---|---|---|
| `available` | Tersedia | Hijau |
| `rented` / `assigned` | Disewa / Bertugas | Kuning |
| `maintenance` | Perawatan | Merah |
| `pending` | Menunggu Persetujuan | Kuning |
| `approved` | Disetujui | Biru |
| `on_progress` | Sedang Berjalan | Biru |
| `completed` | Selesai | Hijau |
| `rejected` | Ditolak | Merah |

Alur status pesanan berjalan mengikuti aksi admin di `OrdersAdmin` (`NEXT_STATUS`),
misalnya dari **Menunggu Persetujuan** → **Disetujui**/**Ditolak** → **Sedang Berjalan** → **Selesai**.

## Endpoint API yang Dikonsumsi
```
GET    /me
POST   /login
POST   /register
POST   /logout

GET    /excavators
POST   /excavators
PUT    /excavators/{id}
DELETE /excavators/{id}

GET    /operators
POST   /operators
PUT    /operators/{id}
DELETE /operators/{id}

GET    /bookings
POST   /bookings
PATCH  /bookings/{id}/status
```
Semua request dan response menggunakan format **JSON**, dan setiap error dari backend
diharapkan mengembalikan `message` atau `errors` (format validasi Laravel) agar dapat
ditampilkan langsung di form.

## Format Angka & Tanggal
- Mata uang ditampilkan dalam format Rupiah: `idr(n)` → `Rp 1.000.000`.
- Durasi sewa dihitung dengan `daysBetween(start, end)`, inklusif tanggal awal dan akhir.

## Tema Visual
Menggunakan palet warna kustom (`RootStyles`) bertema "plat nomor alat berat":
- `--hr-charcoal` (#1B1E23) — latar gelap sidebar & auth screen
- `--hr-yellow` (#F5B700) — aksen utama (safety yellow)
- `--hr-orange` (#E8590C) — tombol utama/aksi
- Font: **Oswald** (judul/tombol) dan **IBM Plex Mono** (kode serial/angka)

## Menjalankan Aplikasi
1. Pastikan backend Laravel sudah berjalan dan endpoint di atas tersedia.
2. Set meta tag CSRF di halaman Blade utama:
   ```html
   <meta name="csrf-token" content="{{ csrf_token() }}">
   ```
3. Import dan render `HeavyRentApp.jsx` sebagai root component React di halaman tersebut.
4. Pastikan Tailwind CSS sudah dikonfigurasi di project agar seluruh utility class tampil dengan benar.

## Catatan Penting
- Booking baru hanya bisa dibuat untuk excavator **dan** operator berstatus `available`.
- Setelah admin mengubah status pesanan, data excavator dan operator otomatis di-refresh
  agar status ketersediaannya konsisten dengan pesanan terbaru.
- Jika data awal (`/me`, `/excavators`, `/operators`) gagal dimuat sama sekali, aplikasi
  menampilkan halaman error dan menyarankan memastikan backend Laravel & database berjalan.
