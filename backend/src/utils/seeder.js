const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '../../.env' });

const Stock = require('../models/Stock');
const Customer = require('../models/Customer');
const LedgerTransaction = require('../models/LedgerTransaction');
const Bill = require('../models/Bill');

const sampleStock = [
  {
    name: 'तांदूळ (Kolam Rice)',
    costPrice: 45,
    sellingPrice: 55,
    quantity: 100,
    unit: 'kg',
    category: 'Grains & Pulses',
    minStockAlert: 10,
  },
  {
    name: 'गहू (Wheat Lokwan)',
    costPrice: 30,
    sellingPrice: 38,
    quantity: 150,
    unit: 'kg',
    category: 'Grains & Pulses',
    minStockAlert: 15,
  },
  {
    name: 'साखर (Sugar)',
    costPrice: 38,
    sellingPrice: 42,
    quantity: 80,
    unit: 'kg',
    category: 'Grocery',
    minStockAlert: 10,
  },
  {
    name: 'शिंगाडा पीठ (Singada Flour)',
    costPrice: 90,
    sellingPrice: 120,
    quantity: 25,
    unit: 'pkt',
    category: 'Flour',
    minStockAlert: 5,
  },
  {
    name: 'सोयाबीन तेल 1L (Soyabean Oil)',
    costPrice: 110,
    sellingPrice: 130,
    quantity: 40,
    unit: 'liter',
    category: 'Oils',
    minStockAlert: 8,
  },
  {
    name: 'चहा पावडर (Society Tea 250g)',
    costPrice: 125,
    sellingPrice: 140,
    quantity: 30,
    unit: 'pcs',
    category: 'Beverages',
    minStockAlert: 5,
  },
];

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://admin:nirmanam6464@cluster0.whzwve7.mongodb.net/stock_management?retryWrites=true&w=majority';
    await mongoose.connect(mongoUri);
    console.log('[Seeder] Connected to MongoDB...');

    await Stock.deleteMany();
    await Customer.deleteMany();
    await LedgerTransaction.deleteMany();
    await Bill.deleteMany();

    console.log('[Seeder] Cleaned existing collection data...');

    const createdStock = await Stock.insertMany(sampleStock);
    console.log(`[Seeder] Created ${createdStock.length} sample stock items.`);

    // Sample Customer for Katha
    const sampleCustomer = await Customer.create({
      name: 'रमेश पाटील (Ramesh Patil)',
      phone: '9876543210',
      totalDue: 450,
    });

    await LedgerTransaction.create({
      customerId: sampleCustomer._id,
      type: 'DUE',
      amount: 450,
      note: 'Initial Katha Due (उधारी)',
      date: new Date(),
    });

    console.log('[Seeder] Sample Katha customer created successfully!');
    process.exit();
  } catch (error) {
    console.error('[Seeder Error]', error);
    process.exit(1);
  }
};

seedData();
