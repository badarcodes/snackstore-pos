# 🍿 SnackStore POS - Sistem Kasir & Administrasi Toko Camilan

Aplikasi web full-stack Point of Sale (POS) dan administrasi untuk toko makanan ringan atau camilan kering (makaroni pedas daun jeruk, basreng pedas, keripik singkong balado, keripik kaca, kerupuk seblak, usus crispy, stik keju, dan produk sejenis).

Aplikasi ini dibangun secara transaksional dengan database MySQL, ORM Prisma, backend Node.js/Express, dan frontend React.js dengan Tailwind CSS serta grafik Recharts.

---

## 🌟 Fitur Utama

### 1. Autentikasi & Keamanan (Multi-Role)
- **Role Pemilik (ADMIN)**: Akses menyeluruh ke semua fitur, laporan keuangan, pembatalan transaksi, stok, penyesuaian kas, dan kelola pengguna.
- **Role Kasir (CASHIER)**: Akses cepat ke halaman kasir (POS), pencatatan transaksi, cek stok produk, riwayat shift, dan cetak struk pembayaran.
- **Keamanan**:
  - Password di-hash menggunakan **Bcrypt**.
  - Sesi berbasis token tersimpan dalam **HttpOnly Cookie** dan Authorization Header.
  - **Rate Limiting** untuk mencegah brute-force login.
  - **Audit Logs** mencatat seluruh aktivitas penting (login, transaksi, pembatalan, perubahan stok, pengeluaran).
  - Soft-deactivate akun pengguna (riwayat penjualan tidak terhapus).

### 2. Dashboard Real-Time
- **Omzet Penjualan Hari Ini** (total uang penjualan selesai).
- **Estimasi Laba Kotor** (berdasarkan selisih harga jual dan Harga Pokok Penjualan / HPP barang yang terjual).
- **Pengeluaran Toko Hari Ini** (biaya kemasan plastik, operasional, transportasi).
- **Saldo Kas di Laci Kasir** (sesuai shift kasir yang aktif).
- **Grafik Tren Penjualan 7 Hari Terakhir** menggunakan **Recharts**.
- **Top 5 Camilan Paling Laris**.
- **Peringatan Stok Menipis & Stok Habis**.
- **Transaksi Terbaru**.

### 3. Kasir (Point of Sale)
- Pencarian cepat produk berdasarkan nama atau SKU (misal: `MKR-P1-100`, `BSR-DJ-100`).
- Filter kategori camilan (Makaroni & Basreng, Keripik & Kerupuk, Usus & Kulit, Stik & Kue Kering).
- Keranjang belanja interaktif dengan tombol tambah/kurang dan hapus item.
- Kalkulasi otomatis subtotal dan diskon.
- **Perhitungan Kembalian Otomatis**:
  - Contoh: Total belanja Rp24.000, uang diterima Rp50.000, kembalian Rp26.000.
  - Contoh: 2 bungkus basreng @ Rp10.000 = Rp20.000, dibayar Rp50.000, kembalian Rp30.000.
- Tombol cepat nominal uang (Uang pas, Rp20.000, Rp50.000, Rp100.000).
- Metode pembayaran: **Tunai (Cash)**, **QRIS**, dan **Transfer Bank**.
- **Integritas Transaksional (ACID)**:
  - Backend memvalidasi ketersediaan stok, mengunci stok, memotong stok, membuat struk penjualan, mencatat pembayaran, dan menambah kas secara atomik (`prisma.$transaction`).
  - Pencegahan transaksi ganda akibat klik berulang.

### 4. Cetak Struk Pembelian (Thermal Receipt)
- Kompatibel dengan printer kasir thermal **58 mm** dan **80 mm** serta print browser.
- Menampilkan nama toko, alamat, kontak, nomor transaksi, kasir, rincian barang, diskon, total, uang diterima, kembalian, dan ucapan terima kasih.

### 5. Manajemen Produk & Kategori
- CRUD lengkap produk camilan.
- Data meliputi: SKU unik, nama produk, kategori, foto produk, harga modal (HPP), harga jual, stok, satuan (`bungkus`, `pcs`, `gram`), batas minimum stok, dan status aktif.
- Soft-delete (penonaktifan) agar riwayat transaksi masa lalu tetap utuh.
- Validasi harga dan stok tidak boleh bernilai negatif.

### 6. Manajemen Stok & Logistik
- Monitoring stok semua produk camilan.
- **Barang Masuk / Pembelian**: Tambah stok dari pembelian supplier dengan pencatatan harga beli terbaru.
- **Penyesuaian Stok Manual**: Wajib menyertakan alasan (rusak, hilang, kedaluwarsa, stock opname).
- **Riwayat Mutasi Stok (Audit Trail)**: Mencatat jenis mutasi (`INITIAL`, `PURCHASE`, `SALE`, `ADJUSTMENT`, `DAMAGE`, `EXPIRED`, `RETURN`), jumlah sebelum, perubahan, jumlah sesudah, alasan, dan petugas.
- Pencegahan stok negatif.

### 7. Riwayat Transaksi & Pembatalan (Void)
- Riwayat transaksi lengkap dengan filter tanggal, kasir, metode pembayaran, dan status.
- Modal rincian belanja dan cetak ulang struk.
- **Pembatalan Transaksi (Void)** oleh Admin:
  - Mengembalikan stok barang yang dibeli secara otomatis ke persediaan gudang.
  - Mengoreksi saldo kas laci kasir jika dibayar tunai.
  - Menyimpan alasan pembatalan dan pengguna yang membatalkan.

### 8. Pengelolaan Shift & Laci Kasir (Cash Session)
- **Buka Shift**: Input modal awal uang tunai laci kasir (contoh: Rp200.000).
- **Kalkulasi Saldo Kas Otomatis**:
  $$\text{Saldo Akhir yang Diharapkan} = \text{Modal Awal} + \text{Penjualan Tunai} + \text{Kas Masuk} - \text{Kas Keluar}$$
- **Tutup Shift**: Input hasil hitungan uang fisik, sistem otomatis menghitung **selisih kas** (Pas, Lebih, atau Kurang).
- Catat pergerakan kas masuk dan kas keluar darurat (misal: beli lakban/kantong kresek).

### 9. Modul Keuangan (Pemasukan & Pengeluaran)
- Kategori pengeluaran: Bahan & Stok, Kemasan Plastik/Zipper, Transportasi, Listrik & Utilitas, Gaji, Operasional Lainnya.
- Kategori pemasukan lain: Suntikan Modal Pemilik, Pendapatan Non-POS, Bonus Supplier.
- Ringkasan Arus Kas: Total Inflow, Total Outflow, Net Cash Flow, dan Estimasi Laba Bersih.

### 10. Laporan Keuangan & Ekspor
- Laporan Penjualan harian, mingguan, bulanan.
- Laporan Analisis Laba Kotor (Omzet vs HPP vs Gross Profit vs Margin %).
- Laporan Valuasi Aset Stok (Total modal stok, total nilai eceran, potensi laba persediaan).
- Laporan Log Audit Aktivitas Pengguna.
- **Ekspor Data ke CSV (Excel)** & Cetak Laporan.

### 11. Pengaturan Toko
- Nama toko, alamat, kontak WhatsApp/telepon, catatan kaki struk, dan pilihan ukuran kertas thermal printer (58mm / 80mm).

---

## 🛠️ Teknologi yang Digunakan

| Komponen | Teknologi |
|---|---|
| **Frontend** | React.js 19, Vite, Tailwind CSS, Lucide React, Recharts, Axios |
| **Backend** | Node.js, Express.js, JWT, Bcrypt.js, Zod, Cookie-Parser, Multer |
| **Database** | MySQL (didukung XAMPP / MariaDB) |
| **ORM** | Prisma ORM |

---

## 🚀 Panduan Menjalankan Aplikasi di Windows (XAMPP MySQL)

### 1. Menjalankan MySQL melalui XAMPP
1. Buka aplikasi **XAMPP Control Panel** di Windows.
2. Klik tombol **Start** pada baris **MySQL** (pastikan status berwarna hijau dan port `3306` aktif).

### 2. Setup Database & Backend
Buka terminal PowerShell atau Command Prompt di folder project:
```powershell
cd "d:\Badar Project\snackstore-pos\backend"

# Install dependensi backend
npm install

# Push skema database ke MySQL
npx prisma db push

# Jalankan seeder data awal (produk, kategori, akun admin & kasir)
node prisma/seed.js

# Jalankan server backend
npm run dev
```
Backend akan berjalan di: **`http://localhost:5000`**

### 3. Setup Frontend
Buka terminal baru untuk frontend:
```powershell
cd "d:\Badar Project\snackstore-pos\frontend"

# Install dependensi frontend
npm install --legacy-peer-deps

# Jalankan server frontend Vite
npm run dev
```
Frontend akan berjalan di: **`http://localhost:5173`** (atau `http://localhost:5174`)

---

## 🔑 Kredensial Login Bawaan (Default Accounts)

| Role | Username | Password | Keterangan |
|---|---|---|---|
| **Admin / Pemilik** | `admin` | `admin123456` | Akses penuh ke semua fitur, laporan keuangan, stok, transaksi, & pengguna |
| **Kasir Toko** | `kasir1` | `kasir123456` | Akses kasir (POS), pencatatan transaksi, cek stok, & cetak struk |

---

## 📁 Struktur Folder Proyek

```
snackstore-pos/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma         # Skema database MySQL (14 tabel)
│   │   └── seed.js               # Data awal produk camilan, kategori, user, pengaturan
│   ├── public/
│   │   └── uploads/products/     # Penyimpanan foto produk
│   ├── src/
│   │   ├── config/               # Koneksi Prisma Client
│   │   ├── controllers/          # Logika bisnis (auth, pos, produk, stok, kas, keuangan, laporan)
│   │   ├── middlewares/          # Autentikasi JWT, role-check, Zod validator, error handling
│   │   ├── routes/               # REST API endpoints
│   │   ├── utils/                # Audit logger, generator invoice, formatter rupiah
│   │   └── app.js                # Inisialisasi Express & CORS
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/           # Navbar, Sidebar, Layout, Modal, ThermalReceipt, Toast, ShiftModal
│   │   ├── context/              # AuthContext (user, cash session, store settings, toasts)
│   │   ├── pages/
│   │   │   ├── Login.jsx         # Halaman login modern toko camilan
│   │   │   ├── Dashboard.jsx     # Statistik omzet, grafik Recharts, top camilan, stok menipis
│   │   │   ├── POS.jsx           # Kasir, keranjang, kembalian otomatis, cetak struk
│   │   │   ├── Products.jsx      # Data produk camilan & HPP modal
│   │   │   ├── StockManagement.jsx # Stok masuk, penyesuaian rusak/kedaluwarsa, audit mutasi
│   │   │   ├── Transactions.jsx  # Riwayat struk & void pembatalan
│   │   │   ├── Finance.jsx       # Catatan pengeluaran & pemasukan lain
│   │   │   ├── CashSessions.jsx  # Rekonsiliasi laci kasir & selisih fisik
│   │   │   ├── Reports.jsx       # Laba kotor vs HPP, valuasi persediaan, ekspor CSV
│   │   │   ├── Users.jsx         # Kelola akun pegawai kasir & admin
│   │   │   └── Settings.jsx      # Pengaturan toko & printer struk
│   │   ├── services/
│   │   │   └── api.js            # Axios client terhubung ke backend
│   │   ├── App.jsx               # Router aplikasi
│   │   ├── index.css             # Desain Tailwind & cetak printer thermal (@media print)
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── package.json                  # Runner script root
└── README.md
```

---

## 🧾 Contoh Produk Camilan di Database
1. **Makaroni Pedas Level 1 (100g)** - SKU: `MKR-P1-100` (Modal: Rp6.000 / Jual: Rp10.000)
2. **Makaroni Pedas Level 3 (100g)** - SKU: `MKR-P3-100` (Modal: Rp6.000 / Jual: Rp10.000)
3. **Makaroni Pedas Level 5 Ekstra Daun Jeruk (100g)** - SKU: `MKR-P5-100` (Modal: Rp6.500 / Jual: Rp11.000)
4. **Makaroni Pedas Daun Jeruk (250g)** - SKU: `MKR-DJ-250` (Modal: Rp14.000 / Jual: Rp24.000)
5. **Basreng Pedas Daun Jeruk (100g)** - SKU: `BSR-DJ-100` (Modal: Rp6.000 / Jual: Rp10.000)
6. **Basreng Pedas Daun Jeruk (250g)** - SKU: `BSR-DJ-250` (Modal: Rp13.500 / Jual: Rp23.000)
7. **Keripik Kaca Pedas Jeruk (100g)** - SKU: `KPK-KACA-100` (Modal: Rp5.500 / Jual: Rp9.000)
8. **Kerupuk Seblak Kencur Pedas (100g)** - SKU: `KPK-SBL-100` (Modal: Rp6.000 / Jual: Rp10.000)
9. **Usus Crispy Pedas Gurih (100g)** - SKU: `USS-CRP-100` (Modal: Rp8.500 / Jual: Rp14.000)
10. **Usus Crispy Original Gurih (100g)** - SKU: `USS-ORG-100` (Modal: Rp8.500 / Jual: Rp14.000)
11. **Stik Keju Crispy Renyah (150g)** - SKU: `STK-KJU-150` (Modal: Rp11.000 / Jual: Rp18.000)
12. **Keripik Singkong Balado (200g)** - SKU: `KPK-SKG-200` (Modal: Rp9.000 / Jual: Rp15.000)
13. **Pilus Cikur Kencur Gurih (100g)** - SKU: `PLS-CKR-100` (Stok Menipis - Demo Alert)
14. **Cimol Kering Pedas Bumbu Basah (100g)** - SKU: `CML-KRG-100` (Stok Kritis - Demo Alert)
