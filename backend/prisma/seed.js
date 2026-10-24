const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for SnackStore POS...');

  // 1. Seed Settings
  const settings = [
    { key: 'store_name', value: 'SnackStore Berkah Renyah', description: 'Nama Toko Camilan' },
    { key: 'store_address', value: 'Jl. Camilan Gurih No. 88, Kopo, Bandung', description: 'Alamat Toko' },
    { key: 'store_phone', value: '0812-3456-7890', description: 'Nomor Telepon Toko' },
    { key: 'store_receipt_footer', value: 'Terima kasih telah berbelanja camilan renyah kami!\nSimpan struk ini sebagai bukti pembayaran yang sah.', description: 'Catatan Kaki Struk' },
    { key: 'receipt_paper_width', value: '58mm', description: 'Ukuran kertas printer thermal default (58mm / 80mm)' }
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: s
    });
  }
  console.log('✅ Settings seeded');

  // 2. Seed Users
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123456', salt);
  const cashierPassword = await bcrypt.hash('kasir123456', salt);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      name: 'Budi Santoso (Owner/Admin)',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true
    }
  });

  const cashier = await prisma.user.upsert({
    where: { username: 'kasir1' },
    update: {},
    create: {
      username: 'kasir1',
      name: 'Siti Rahmawati (Kasir)',
      password: cashierPassword,
      role: 'CASHIER',
      isActive: true
    }
  });
  console.log('✅ Users seeded (admin: admin123456, kasir1: kasir123456)');

  // 3. Seed Categories
  const categoriesData = [
    { name: 'Makaroni & Basreng', slug: 'makaroni-basreng', description: 'Makaroni goreng renyah dan basreng daun jeruk pedas' },
    { name: 'Keripik & Kerupuk', slug: 'keripik-kerupuk', description: 'Aneka keripik kaca, singkong, tempe, dan seblak pedas' },
    { name: 'Usus & Kulit Crispy', slug: 'usus-kulit-crispy', description: 'Camilan usus ayam crispy renyah gurih' },
    { name: 'Stik & Kue Kering Gurih', slug: 'stik-kue-kering', description: 'Stik keju, pilus kencur, dan aneka camilan renyah' }
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

  // 4. Seed Suppliers
  const supplier1 = await prisma.supplier.create({
    data: {
      name: 'Sentra Keripik Kopo Bandung',
      phone: '08122334455',
      address: 'Sentra Industri Kopo No. 12, Bandung',
      notes: 'Supplier utama makaroni dan basreng pedas daun jeruk'
    }
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      name: 'Gudang Camilan Renyah Nusantara',
      phone: '08139988776',
      address: 'Kawasan Industri Leuwi Panjang, Bandung',
      notes: 'Supplier keripik kaca, usus crispy, dan stik keju'
    }
  });
  console.log('✅ Suppliers seeded');

  // 5. Seed Products
  const productsData = [
    {
      sku: 'MKR-P1-100',
      name: 'Makaroni Pedas Level 1 (100g)',
      categorySlug: 'makaroni-basreng',
      costPrice: 6000,
      sellingPrice: 10000,
      stock: 65,
      unit: 'bungkus',
      minStock: 10
    },
    {
      sku: 'MKR-P3-100',
      name: 'Makaroni Pedas Level 3 (100g)',
      categorySlug: 'makaroni-basreng',
      costPrice: 6000,
      sellingPrice: 10000,
      stock: 80,
      unit: 'bungkus',
      minStock: 10
    },
    {
      sku: 'MKR-P5-100',
      name: 'Makaroni Pedas Level 5 Ekstra Daun Jeruk (100g)',
      categorySlug: 'makaroni-basreng',
      costPrice: 6500,
      sellingPrice: 11000,
      stock: 50,
      unit: 'bungkus',
      minStock: 10
    },
    {
      sku: 'MKR-DJ-250',
      name: 'Makaroni Pedas Daun Jeruk (250g)',
      categorySlug: 'makaroni-basreng',
      costPrice: 14000,
      sellingPrice: 24000,
      stock: 35,
      unit: 'bungkus',
      minStock: 8
    },
    {
      sku: 'BSR-DJ-100',
      name: 'Basreng Pedas Daun Jeruk (100g)',
      categorySlug: 'makaroni-basreng',
      costPrice: 6000,
      sellingPrice: 10000,
      stock: 90,
      unit: 'bungkus',
      minStock: 15
    },
    {
      sku: 'BSR-DJ-250',
      name: 'Basreng Pedas Daun Jeruk (250g)',
      categorySlug: 'makaroni-basreng',
      costPrice: 13500,
      sellingPrice: 23000,
      stock: 40,
      unit: 'bungkus',
      minStock: 8
    },
    {
      sku: 'KPK-KACA-100',
      name: 'Keripik Kaca Pedas Jeruk (100g)',
      categorySlug: 'keripik-kerupuk',
      costPrice: 5500,
      sellingPrice: 9000,
      stock: 45,
      unit: 'bungkus',
      minStock: 10
    },
    {
      sku: 'KPK-SBL-100',
      name: 'Kerupuk Seblak Kencur Pedas (100g)',
      categorySlug: 'keripik-kerupuk',
      costPrice: 6000,
      sellingPrice: 10000,
      stock: 55,
      unit: 'bungkus',
      minStock: 10
    },
    {
      sku: 'USS-CRP-100',
      name: 'Usus Crispy Pedas Gurih (100g)',
      categorySlug: 'usus-kulit-crispy',
      costPrice: 8500,
      sellingPrice: 14000,
      stock: 42,
      unit: 'bungkus',
      minStock: 10
    },
    {
      sku: 'USS-ORG-100',
      name: 'Usus Crispy Original Gurih (100g)',
      categorySlug: 'usus-kulit-crispy',
      costPrice: 8500,
      sellingPrice: 14000,
      stock: 35,
      unit: 'bungkus',
      minStock: 8
    },
    {
      sku: 'STK-KJU-150',
      name: 'Stik Keju Crispy Renyah (150g)',
      categorySlug: 'stik-kue-kering',
      costPrice: 11000,
      sellingPrice: 18000,
      stock: 30,
      unit: 'bungkus',
      minStock: 5
    },
    {
      sku: 'KPK-SKG-200',
      name: 'Keripik Singkong Balado Manis Pedas (200g)',
      categorySlug: 'keripik-kerupuk',
      costPrice: 9000,
      sellingPrice: 15000,
      stock: 28,
      unit: 'bungkus',
      minStock: 8
    },
    {
      sku: 'PLS-CKR-100',
      name: 'Pilus Cikur Kencur Gurih (100g)',
      categorySlug: 'stik-kue-kering',
      costPrice: 4500,
      sellingPrice: 7500,
      stock: 6, // Low stock demo!
      unit: 'bungkus',
      minStock: 10
    },
    {
      sku: 'CML-KRG-100',
      name: 'Cimol Kering Pedas Bumbu Basah (100g)',
      categorySlug: 'makaroni-basreng',
      costPrice: 5000,
      sellingPrice: 8500,
      stock: 2, // Critical low stock demo!
      unit: 'bungkus',
      minStock: 10
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

      // Stock Movement for initial stock
      await prisma.stockMovement.create({
        data: {
          productId: createdProd.id,
          type: 'INITIAL',
          qtyBefore: 0,
          qtyChange: prod.stock,
          qtyAfter: prod.stock,
          reason: 'Stok awal pembukaan toko',
          userId: admin.id,
          refType: 'SETUP'
        }
      });
    }
  }
  console.log('✅ Products & Initial Stock movements seeded');

  // 6. Seed an Initial Cash Session
  const todaySession = await prisma.cashSession.create({
    data: {
      cashierId: cashier.id,
      openingCash: 200000, // Rp 200.000 modal awal laci kasir
      totalCashSales: 0,
      totalCashIn: 0,
      totalCashOut: 0,
      expectedCash: 200000,
      status: 'OPEN',
      notes: 'Shift Pagi Kasir Toko Camilan'
    }
  });

  // 7. Seed Initial Operational Expense
  await prisma.expense.create({
    data: {
      expenseNumber: 'EXP-' + Date.now().toString().slice(-6),
      category: 'KEMASAN_PLASTIK',
      amount: 45000,
      paymentMethod: 'CASH',
      description: 'Pembelian kantong kresek HD dan plastik klip ziplock 100 pcs',
      userId: admin.id,
      cashSessionId: todaySession.id
    }
  });
  console.log('✅ Cash Session & Sample Operational Expense seeded');

  // 8. Seed Initial Audit Log
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'SYSTEM_SETUP',
      entity: 'DATABASE',
      details: 'Sistem SnackStore POS berhasil diinisialisasi dengan data awal toko camilan.',
      ipAddress: '127.0.0.1'
    }
  });

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
