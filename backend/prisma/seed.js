const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for Toko Kue Jaya Baru...');

  // 1. Seed Settings for Toko Kue Jaya Baru
  const settings = [
    { key: 'store_name', value: 'Toko Kue Jaya Baru', description: 'Nama Toko Kue' },
    { key: 'store_address', value: 'Jl. Surya Kencana No. 45, Kota Bandung', description: 'Alamat Toko' },
    { key: 'store_phone', value: '0812-9876-5432', description: 'Nomor Telepon Toko' },
    { key: 'store_receipt_footer', value: 'Terima kasih telah berbelanja di Toko Kue Jaya Baru!\nKue Segar & Berkualitas Setiap Hari.\nSimpan struk ini sebagai bukti pembelian yang sah.', description: 'Catatan Kaki Struk' },
    { key: 'receipt_paper_width', value: '58mm', description: 'Ukuran kertas printer thermal (58mm / 80mm)' }
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: s
    });
  }
  console.log('✅ Settings updated to Toko Kue Jaya Baru');

  // 2. Single User Account: ADMIN Only (Penghapusan akun kasir)
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123456', salt);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      name: 'Pemilik Toko (Admin)',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true
    },
    create: {
      username: 'admin',
      name: 'Pemilik Toko (Admin)',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true
    }
  });

  // Re-link any test sales to admin, then remove any cashier users
  await prisma.sale.updateMany({
    data: { cashierId: admin.id }
  });
  await prisma.stockMovement.updateMany({
    data: { userId: admin.id }
  });
  await prisma.expense.updateMany({
    data: { userId: admin.id }
  });
  await prisma.user.deleteMany({
    where: { username: { not: 'admin' } }
  });
  console.log('✅ Single user verified: Admin only (username: admin, pass: admin123456)');

  // 3. Seed Categories for Toko Kue Jaya Baru
  const categoriesData = [
    { name: 'Bolu & Roll Cake', slug: 'bolu-roll-cake', description: 'Aneka bolu gulung, bolu kukus, chiffon cake, dan brownies' },
    { name: 'Kue Tradisional & Basah', slug: 'kue-tradisional-basah', description: 'Lemper ayam, risoles ragout, pastel, dan jajanan pasar' },
    { name: 'Roti Manis & Gurih', slug: 'roti-manis-gurih', description: 'Roti cokelat, keju, abon, sosis, dan roti sisir mentega' },
    { name: 'Kue Kering & Hampers', slug: 'kue-kering-hampers', description: 'Nastar nanas butter, kastengel keju, putri salju, dan lidah kucing' }
  ];

  const categoryMap = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description },
      create: cat
    });
    categoryMap[cat.slug] = created.id;
  }
  console.log('✅ Categories seeded');

  // 4. Seed Suppliers for Bakery Ingredients
  const supplier1 = await prisma.supplier.create({
    data: {
      name: 'Distributor Tepung & Bahan Kue Mitra Boga',
      phone: '081299887711',
      address: 'Kawasan Pergudangan Pasir Kaliki, Bandung',
      notes: 'Supplier utama tepung terigu protein tinggi, butter wisman, dan telur ayam'
    }
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      name: 'Kemasan Cantik Prima Nusantara',
      phone: '081388776655',
      address: 'Sentra Kemasan Industri Cibaduyut, Bandung',
      notes: 'Supplier dus kue, box mika, cake board, dan kantong take-away'
    }
  });
  console.log('✅ Suppliers seeded');

  // 5. Seed Cake & Bakery Products
  const productsData = [
    {
      sku: 'KUE-BLG-KJ',
      name: 'Bolu Gulung Keju Spesial Premium',
      categorySlug: 'bolu-roll-cake',
      costPrice: 38000,
      sellingPrice: 58000,
      stock: 25,
      unit: 'kotak',
      minStock: 5
    },
    {
      sku: 'KUE-BRN-ALM',
      name: 'Fudgy Brownies Panggang Almond Chocochip',
      categorySlug: 'bolu-roll-cake',
      costPrice: 35000,
      sellingPrice: 55000,
      stock: 20,
      unit: 'kotak',
      minStock: 5
    },
    {
      sku: 'KUE-LPS-LGT',
      name: 'Lapis Legit Butter Original 20x20',
      categorySlug: 'bolu-roll-cake',
      costPrice: 95000,
      sellingPrice: 150000,
      stock: 12,
      unit: 'kotak',
      minStock: 3
    },
    {
      sku: 'KUE-CHF-PDN',
      name: 'Chiffon Cake Pandan Suji Segar',
      categorySlug: 'bolu-roll-cake',
      costPrice: 28000,
      sellingPrice: 45000,
      stock: 18,
      unit: 'loyang',
      minStock: 4
    },
    {
      sku: 'KUE-LMP-AYM',
      name: 'Lemper Ayam Kukus Spesial Daun Pisang (Isi 5 pcs)',
      categorySlug: 'kue-tradisional-basah',
      costPrice: 12000,
      sellingPrice: 20000,
      stock: 40,
      unit: 'mika',
      minStock: 10
    },
    {
      sku: 'KUE-RSL-RGT',
      name: 'Risoles Ragout Ayam Wortel Crispy (Isi 5 pcs)',
      categorySlug: 'kue-tradisional-basah',
      costPrice: 14000,
      sellingPrice: 22000,
      stock: 35,
      unit: 'mika',
      minStock: 8
    },
    {
      sku: 'KUE-PST-TLR',
      name: 'Pastel Goreng Renyah Isi Bihun Telur (Isi 5 pcs)',
      categorySlug: 'kue-tradisional-basah',
      costPrice: 12000,
      sellingPrice: 20000,
      stock: 30,
      unit: 'mika',
      minStock: 8
    },
    {
      sku: 'ROTI-CKL-LMR',
      name: 'Roti Manis Cokelat Belgia Lumer',
      categorySlug: 'roti-manis-gurih',
      costPrice: 5000,
      sellingPrice: 9000,
      stock: 45,
      unit: 'pcs',
      minStock: 10
    },
    {
      sku: 'ROTI-KJU-MELT',
      name: 'Roti Keju Melted Mozzarella Cheddar',
      categorySlug: 'roti-manis-gurih',
      costPrice: 5500,
      sellingPrice: 9500,
      stock: 40,
      unit: 'pcs',
      minStock: 10
    },
    {
      sku: 'ROTI-ABN-SAPI',
      name: 'Roti Gulung Abon Sapi Pedas Gurih',
      categorySlug: 'roti-manis-gurih',
      costPrice: 7000,
      sellingPrice: 12000,
      stock: 25,
      unit: 'pcs',
      minStock: 6
    },
    {
      sku: 'KUE-NST-BTR',
      name: 'Nastar Nanas Butter Wisman Toples 500g',
      categorySlug: 'kue-kering-hampers',
      costPrice: 55000,
      sellingPrice: 85000,
      stock: 28,
      unit: 'toples',
      minStock: 6
    },
    {
      sku: 'KUE-KST-EDM',
      name: 'Kastengel Keju Edam Asli Toples 500g',
      categorySlug: 'kue-kering-hampers',
      costPrice: 60000,
      sellingPrice: 95000,
      stock: 22,
      unit: 'toples',
      minStock: 5
    },
    {
      sku: 'KUE-PTR-SLJ',
      name: 'Putri Salju Mede Gula Dingin Toples 500g',
      categorySlug: 'kue-kering-hampers',
      costPrice: 50000,
      sellingPrice: 80000,
      stock: 6, // Low stock demo!
      unit: 'toples',
      minStock: 8
    },
    {
      sku: 'KUE-LDH-KCG',
      name: 'Lidah Kucing Vanilla Renyah Toples 350g',
      categorySlug: 'kue-kering-hampers',
      costPrice: 38000,
      sellingPrice: 60000,
      stock: 2, // Critical low stock demo!
      unit: 'toples',
      minStock: 8
    }
  ];

  for (const prod of productsData) {
    const existing = await prisma.product.findUnique({ where: { sku: prod.sku } });
    if (!existing) {
      const createdProd = await prisma.product.create({
        data: {
          sku: prod.sku,
          name: prod.name,
          categoryId: categoryMap[prod.categorySlug],
          costPrice: prod.costPrice,
          sellingPrice: prod.sellingPrice,
          stock: prod.stock,
          unit: prod.unit,
          minStock: prod.minStock,
          isActive: true
        }
      });

      await prisma.stockMovement.create({
        data: {
          productId: createdProd.id,
          type: 'INITIAL',
          qtyBefore: 0,
          qtyChange: prod.stock,
          qtyAfter: prod.stock,
          reason: 'Stok awal pembukaan toko kue',
          userId: admin.id,
          refType: 'SETUP'
        }
      });
    }
  }
  console.log('✅ Bakery products & stock initialized');

  // 6. Seed Employees for Toko Kue Jaya Baru (Data Karyawan)
  const employeesData = [
    {
      employeeCode: 'KUE-001',
      name: 'Siti Rahmawati',
      position: 'Kepala Baker & Pembuat Kue',
      phone: '0812-1111-2222',
      address: 'Jl. Babakan Ciamis No. 14, Bandung',
      salary: 4500000,
      isActive: true
    },
    {
      employeeCode: 'KUE-002',
      name: 'Bambang Haryanto',
      position: 'Baker Kue Basah & Roti',
      phone: '0812-3333-4444',
      address: 'Jl. Kopo Sayati No. 89, Bandung',
      salary: 3800000,
      isActive: true
    },
    {
      employeeCode: 'KUE-003',
      name: 'Dewi Lestari',
      position: 'Pelayan Toko & Display Kue',
      phone: '0812-5555-6666',
      address: 'Jl. Pagarsih No. 120, Bandung',
      salary: 3200000,
      isActive: true
    },
    {
      employeeCode: 'KUE-004',
      name: 'Ahmad Fauzi',
      position: 'Staff Packing & Pengiriman',
      phone: '0812-7777-8888',
      address: 'Jl. Sukajadi No. 56, Bandung',
      salary: 3000000,
      isActive: true
    },
    {
      employeeCode: 'KUE-005',
      name: 'Rina Kusuma',
      position: 'Kebersihan & Serabutan Toko',
      phone: '0812-9999-0000',
      address: 'Jl. Buah Batu No. 34, Bandung',
      salary: 2800000,
      isActive: true
    }
  ];

  const employeeMap = {};
  for (const emp of employeesData) {
    const createdEmp = await prisma.employee.upsert({
      where: { employeeCode: emp.employeeCode },
      update: emp,
      create: emp
    });
    employeeMap[emp.employeeCode] = createdEmp.id;
  }
  console.log('✅ Employees seeded');

  // 7. Seed Attendance for today and past 5 days
  const today = new Date();
  for (let i = 4; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);

    for (const [code, empId] of Object.entries(employeeMap)) {
      // Simulate realistic attendance
      let status = 'HADIR';
      let checkIn = '07:25';
      let checkOut = '16:30';
      let notes = 'Hadir tepat waktu';

      if (i === 1 && code === 'KUE-002') {
        status = 'SAKIT';
        checkIn = null;
        checkOut = null;
        notes = 'Izin sakit flu demam, surat dokter terlampir';
      } else if (i === 2 && code === 'KUE-004') {
        status = 'IZIN';
        checkIn = null;
        checkOut = null;
        notes = 'Izin mengurus KTP & SIM di Disdukcapil';
      }

      await prisma.attendance.upsert({
        where: {
          employeeId_date: {
            employeeId: empId,
            date: d
          }
        },
        update: {},
        create: {
          employeeId: empId,
          date: d,
          checkIn,
          checkOut,
          status,
          notes
        }
      });
    }
  }
  console.log('✅ Attendances seeded');

  // 8. Seed Leave Requests
  await prisma.leaveRequest.create({
    data: {
      employeeId: employeeMap['KUE-003'],
      type: 'CUTI_TAHUNAN',
      startDate: new Date(new Date().setDate(today.getDate() + 2)),
      endDate: new Date(new Date().setDate(today.getDate() + 4)),
      daysCount: 3,
      reason: 'Cuti tahunan keperluan acara keluarga di luar kota',
      status: 'APPROVED',
      adminNotes: 'Disetujui oleh Admin, tugas jaga display digantikan sementara.',
      approvedAt: new Date()
    }
  });

  await prisma.leaveRequest.create({
    data: {
      employeeId: employeeMap['KUE-001'],
      type: 'IZIN',
      startDate: new Date(new Date().setDate(today.getDate() + 7)),
      endDate: new Date(new Date().setDate(today.getDate() + 7)),
      daysCount: 1,
      reason: 'Izin mendampingi wisuda adik kandung',
      status: 'PENDING',
      adminNotes: null
    }
  });
  console.log('✅ Leave Requests seeded');

  // 9. Seed Daily Performance Evaluations (5 Indicators on scale 1-5)
  // Indicators:
  // 1. scoreDiscipline: Kedisiplinan & Ketepatan Waktu
  // 2. scoreQuality: Kualitas Resep, Pembuatan Kue & Kebersihan
  // 3. scoreService: Pelayanan Pelanggan & Keramahan
  // 4. scoreTeamwork: Kerja Sama Tim & Koordinasi Kerja
  // 5. scoreInitiative: Inisiatif & Tanggung Jawab
  for (let i = 4; i >= 0; i--) {
    const evalDate = new Date(today);
    evalDate.setDate(evalDate.getDate() - i);
    evalDate.setHours(0, 0, 0, 0);

    const scoresPool = [
      { code: 'KUE-001', d: 5, q: 5, s: 4, t: 5, in: 5, note: 'Hasil bolu gulung dan brownies sangat konsisten dan lezat.' },
      { code: 'KUE-002', d: 4, q: 4, s: 4, t: 4, in: 4, note: 'Produksi risoles dan lemper tepat waktu.' },
      { code: 'KUE-003', d: 5, q: 4, s: 5, t: 5, in: 4, note: 'Pelayanan ramah ke pelanggan, display etalase rapi.' },
      { code: 'KUE-004', d: 4, q: 4, s: 3, t: 4, in: 4, note: 'Packing pesanan rapi dan siap kirim tepat waktu.' },
      { code: 'KUE-005', d: 5, q: 5, s: 4, t: 4, in: 4, note: 'Dapur dan area display selalu higienis dan bersih.' }
    ];

    for (const s of scoresPool) {
      const empId = employeeMap[s.code];
      const avg = ((s.d + s.q + s.s + s.t + s.in) / 5).toFixed(2);

      await prisma.dailyEvaluation.upsert({
        where: {
          employeeId_date: {
            employeeId: empId,
            date: evalDate
          }
        },
        update: {},
        create: {
          employeeId: empId,
          date: evalDate,
          scoreDiscipline: s.d,
          scoreQuality: s.q,
          scoreService: s.s,
          scoreTeamwork: s.t,
          scoreInitiative: s.in,
          averageScore: parseFloat(avg),
          notes: s.note
        }
      });
    }
  }
  console.log('✅ Daily Evaluations seeded (5 indicators)');

  // 10. Sample initial operational expense
  await prisma.expense.create({
    data: {
      expenseNumber: 'EXP-' + Date.now().toString().slice(-6),
      category: 'KEMASAN_DUS_PLASTIK',
      amount: 150000,
      paymentMethod: 'CASH',
      description: 'Pembelian 100 pcs dus bolu gulung laminasi & cake board emas',
      userId: admin.id
    }
  });

  // 11. Initial Audit Log
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'SYSTEM_UPDATE',
      entity: 'STORE',
      details: 'Sistem Toko Kue Jaya Baru berhasil diperbarui: Akun kasir dihapus (Admin Only), Modul Karyawan, Presensi, Cuti, dan Penilaian Kinerja Harian 5 Indikator diaktifkan.',
      ipAddress: '127.0.0.1'
    }
  });

  console.log('🎉 Seeding Toko Kue Jaya Baru completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
