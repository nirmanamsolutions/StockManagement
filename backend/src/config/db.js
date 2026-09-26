const mongoose = require('mongoose');

const sampleStocks = [
  { name: 'बास्मती तांदूळ (Basmati Rice 1kg)', costPrice: 80, sellingPrice: 110, quantity: 50, unit: 'kg', category: 'Grains & Pulses', minStockAlert: 10 },
  { name: 'लोकवन गव्हाचे पीठ (Lokwan Wheat Flour 5kg)', costPrice: 160, sellingPrice: 210, quantity: 40, unit: 'pkt', category: 'Grains & Pulses', minStockAlert: 8 },
  { name: 'तुरीची डाळ (Toor Dal Premium)', costPrice: 140, sellingPrice: 175, quantity: 35, unit: 'kg', category: 'Grains & Pulses', minStockAlert: 10 },
  { name: 'हरभरा डाळ (Chana Dal)', costPrice: 65, sellingPrice: 85, quantity: 4, unit: 'kg', category: 'Grains & Pulses', minStockAlert: 5 },
  { name: 'मूग डाळ (Moong Dal)', costPrice: 90, sellingPrice: 115, quantity: 25, unit: 'kg', category: 'Grains & Pulses', minStockAlert: 5 },

  { name: 'सुप्रिम १ लिटर (Supreme 1L Oil)', costPrice: 135, sellingPrice: 163, quantity: 60, unit: 'box', category: 'Oils & Ghee', minStockAlert: 10 },
  { name: 'सुप्रिम १५ लिटर (Supreme 15L Oil)', costPrice: 2100, sellingPrice: 2470, quantity: 12, unit: 'box', category: 'Oils & Ghee', minStockAlert: 3 },
  { name: 'अमूल शुद्ध तूप ५००ग्रॅम (Amul Pure Ghee 500g)', costPrice: 290, sellingPrice: 340, quantity: 20, unit: 'pcs', category: 'Oils & Ghee', minStockAlert: 5 },
  { name: 'फॉर्च्यून सरसो तेल (Fortune Mustard Oil 1L)', costPrice: 140, sellingPrice: 170, quantity: 3, unit: 'liter', category: 'Oils & Ghee', minStockAlert: 5 },

  { name: 'काजू तुकडा २५०ग्रॅम (Cashew Nuts 250g)', costPrice: 180, sellingPrice: 240, quantity: 15, unit: 'pkt', category: 'Spices & Dryfruits', minStockAlert: 4 },
  { name: 'बदाम अमरी ५००ग्रॅम (Badam Almonds 500g)', costPrice: 380, sellingPrice: 460, quantity: 12, unit: 'pkt', category: 'Spices & Dryfruits', minStockAlert: 3 },
  { name: 'सुहाना गरम मसाला (Suhana Garam Masala)', costPrice: 30, sellingPrice: 40, quantity: 30, unit: 'pcs', category: 'Spices & Dryfruits', minStockAlert: 5 },
  { name: 'खारे शेगा (Khare Shega)', costPrice: 100, sellingPrice: 135, quantity: 18, unit: 'pcs', category: 'Spices & Dryfruits', minStockAlert: 4 },
  { name: 'मसाला वटणा (Masala Vatana)', costPrice: 75, sellingPrice: 100, quantity: 22, unit: 'pcs', category: 'Spices & Dryfruits', minStockAlert: 5 },

  { name: 'विक्रम चहा १०/- (Vikram Tea ₹10)', costPrice: 6.5, sellingPrice: 9.04, quantity: 100, unit: 'pkt', category: 'Beverages & Snacks', minStockAlert: 20 },
  { name: 'विक्रम चहा २०/- (Vikram Tea ₹20)', costPrice: 14, sellingPrice: 18, quantity: 80, unit: 'pkt', category: 'Beverages & Snacks', minStockAlert: 15 },
  { name: 'पारले-जी बिस्किट (Parle-G Biscuit Pkt)', costPrice: 8, sellingPrice: 10, quantity: 120, unit: 'pkt', category: 'Beverages & Snacks', minStockAlert: 25 },
  { name: 'रेड लेबल चहा ५००ग्रॅम (Red Label Tea 500g)', costPrice: 210, sellingPrice: 260, quantity: 25, unit: 'pcs', category: 'Beverages & Snacks', minStockAlert: 6 },

  { name: 'लक्स साबण १००ग्रॅम (Lux Soap 100g)', costPrice: 28, sellingPrice: 35, quantity: 45, unit: 'pcs', category: 'Soaps & Cleaning', minStockAlert: 10 },
  { name: 'व्हिल डिटर्जंट १किलो (Wheel Detergent 1kg)', costPrice: 60, sellingPrice: 75, quantity: 35, unit: 'pkt', category: 'Soaps & Cleaning', minStockAlert: 8 },
  { name: 'विम बार साबण (Vim Bar Soap)', costPrice: 8, sellingPrice: 10, quantity: 60, unit: 'pcs', category: 'Soaps & Cleaning', minStockAlert: 15 },

  { name: 'चुरा तंबाकू (Chura Tobacco)', costPrice: 180, sellingPrice: 220, quantity: 10, unit: 'box', category: 'General Kirana', minStockAlert: 2 },
  { name: 'गूळ कोल्हापुरी (Jaggery Kolhapuri 1kg)', costPrice: 45, sellingPrice: 60, quantity: 40, unit: 'kg', category: 'General Kirana', minStockAlert: 8 },
];

const autoSeedData = async () => {
  try {
    const Stock = require('../models/Stock');
    const Customer = require('../models/Customer');
    const Bill = require('../models/Bill');
    const LedgerTransaction = require('../models/LedgerTransaction');

    const count = await Stock.countDocuments();
    if (count === 0) {
      console.log('🌱 Populating initial Kirana Store sample data into Database...');
      const createdStocks = await Stock.insertMany(sampleStocks);
      
      const cust1 = await Customer.create({ name: 'शामराव शिंदे (Shamrao Shinde)', phone: '9822114455', totalDue: 2450 });
      const cust2 = await Customer.create({ name: 'सचिन पाटील (Sachin Patil)', phone: '9921979797', totalDue: 1200 });
      const cust3 = await Customer.create({ name: 'गणेश देशमुख (Ganesh Deshmukh)', phone: '9423556677', totalDue: 0 });

      const bill1 = await Bill.create({
        billId: `BILL-${Date.now().toString().slice(-6)}-1`,
        customerName: cust1.name,
        customerPhone: cust1.phone,
        items: [
          { productId: createdStocks[0]._id, name: createdStocks[0].name, quantity: 5, unit: createdStocks[0].unit, sellingPrice: createdStocks[0].sellingPrice, subtotal: 5 * createdStocks[0].sellingPrice },
          { productId: createdStocks[5]._id, name: createdStocks[5].name, quantity: 2, unit: createdStocks[5].unit, sellingPrice: createdStocks[5].sellingPrice, subtotal: 2 * createdStocks[5].sellingPrice },
        ],
        totalAmount: 2450,
        paymentStatus: 'UNPAID',
        paymentType: 'KATHA',
        amountPaid: 0,
        amountDue: 2450,
      });

      await LedgerTransaction.create({
        customerId: cust1._id,
        type: 'DUE',
        amount: 2450,
        paymentMethod: 'N/A',
        billId: bill1._id,
        billNumber: bill1.billId,
        note: 'Unpaid Store Katha Purchase',
        date: new Date(),
      });

      await LedgerTransaction.create({
        customerId: cust2._id,
        type: 'DUE',
        amount: 3200,
        paymentMethod: 'N/A',
        note: 'Previous Katha Purchase',
        date: new Date(Date.now() - 86400000 * 3),
      });

      await LedgerTransaction.create({
        customerId: cust2._id,
        type: 'PAYMENT',
        amount: 2000,
        paymentMethod: 'CASH',
        note: 'Partial cash payment received',
        date: new Date(Date.now() - 86400000 * 1),
      });

      console.log('🎉 Database successfully populated with 23 Kirana Stock Items, 3 Customer Katha Profiles & Sample Bills!');
    }
  } catch (err) {
    console.error('⚠️ Auto-seed warning:', err.message);
  }
};

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://nirmanam:nirmanam6464@cluster0.whzwve7.mongodb.net/stock_management?retryWrites=true&w=majority';
  try {
    const conn = await mongoose.connect(uri, { 
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4 // Force IPv4 to bypass Windows IPv6 DNS lookup latency
    });
    console.log(`[MongoDB Atlas] Connected: ${conn.connection.host}`);
    autoSeedData(); // Asynchronous non-blocking seed check
  } catch (error) {
    console.log(`⚠️ [MongoDB Atlas Warning] ${error.message}`);
    console.log(`⚡ Launching In-Memory MongoDB Server for offline/local development...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const memUri = mongoServer.getUri();
      const conn = await mongoose.connect(memUri);
      console.log(`[MongoDB In-Memory] Connected: ${conn.connection.host}`);
      autoSeedData();
    } catch (memErr) {
      console.error(`[MongoDB Error] ${memErr.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
