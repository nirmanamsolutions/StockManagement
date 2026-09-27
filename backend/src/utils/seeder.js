const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '../../.env' });

const Stock = require('../models/Stock');
const Customer = require('../models/Customer');
const LedgerTransaction = require('../models/LedgerTransaction');
const Bill = require('../models/Bill');

const marathiStockCatalog = [
  // १. धान्य व डाळी (Grains & Pulses)
  { name: 'लोकवन गहू', costPrice: 31, sellingPrice: 38, quantity: 150, unit: 'kg', category: 'Grains & Pulses', minStockAlert: 20 },
  { name: 'बासमती तांदूळ', costPrice: 85, sellingPrice: 110, quantity: 95, unit: 'kg', category: 'Grains & Pulses', minStockAlert: 15 },
  { name: 'इंद्रायणी तांदूळ', costPrice: 55, sellingPrice: 72, quantity: 150, unit: 'kg', category: 'Grains & Pulses', minStockAlert: 25 },
  { name: 'कोलम तांदूळ', costPrice: 48, sellingPrice: 62, quantity: 110, unit: 'kg', category: 'Grains & Pulses', minStockAlert: 20 },
  { name: 'गावरान तूर डाळ', costPrice: 145, sellingPrice: 175, quantity: 80, unit: 'kg', category: 'Grains & Pulses', minStockAlert: 15 },
  { name: 'हरभरा डाळ', costPrice: 68, sellingPrice: 88, quantity: 70, unit: 'kg', category: 'Grains & Pulses', minStockAlert: 10 },
  { name: 'मसूर डाळ', costPrice: 72, sellingPrice: 92, quantity: 65, unit: 'kg', category: 'Grains & Pulses', minStockAlert: 10 },
  { name: 'मूग डाळ', costPrice: 95, sellingPrice: 120, quantity: 50, unit: 'kg', category: 'Grains & Pulses', minStockAlert: 10 },
  { name: 'उडीद डाळ', costPrice: 105, sellingPrice: 132, quantity: 45, unit: 'kg', category: 'Grains & Pulses', minStockAlert: 8 },
  { name: 'मटकी', costPrice: 80, sellingPrice: 105, quantity: 40, unit: 'kg', category: 'Grains & Pulses', minStockAlert: 8 },
  { name: 'काळा चणा', costPrice: 60, sellingPrice: 78, quantity: 55, unit: 'kg', category: 'Grains & Pulses', minStockAlert: 10 },
  { name: 'पांढरा काबुली चणा', costPrice: 110, sellingPrice: 140, quantity: 35, unit: 'kg', category: 'Grains & Pulses', minStockAlert: 8 },
  { name: 'ज्वारी (गावरान)', costPrice: 42, sellingPrice: 56, quantity: 130, unit: 'kg', category: 'Grains & Pulses', minStockAlert: 20 },
  { name: 'बाजरी', costPrice: 32, sellingPrice: 44, quantity: 90, unit: 'kg', category: 'Grains & Pulses', minStockAlert: 15 },
  { name: 'गव्हाचे पीठ ५किलो', costPrice: 170, sellingPrice: 215, quantity: 45, unit: 'unit', category: 'Grains & Pulses', minStockAlert: 10 },

  // २. तेल आणि तूप (Oils & Ghee)
  { name: 'शेंगदाणा शुद्ध तेल १लिटर', costPrice: 145, sellingPrice: 175, quantity: 60, unit: 'liter', category: 'Oils & Ghee', minStockAlert: 12 },
  { name: 'सोयाबीन तेल १लिटर', costPrice: 115, sellingPrice: 138, quantity: 85, unit: 'liter', category: 'Oils & Ghee', minStockAlert: 15 },
  { name: 'सूर्यफूल तेल १लिटर', costPrice: 125, sellingPrice: 148, quantity: 50, unit: 'liter', category: 'Oils & Ghee', minStockAlert: 10 },
  { name: 'मोहरीचे तेल १लिटर', costPrice: 135, sellingPrice: 165, quantity: 30, unit: 'liter', category: 'Oils & Ghee', minStockAlert: 8 },
  { name: 'शेंगदाणा तेल डबा १५लिटर', costPrice: 2200, sellingPrice: 2550, quantity: 14, unit: 'unit', category: 'Oils & Ghee', minStockAlert: 3 },
  { name: 'अमूल शुद्ध तूप ५००ग्रॅम', costPrice: 295, sellingPrice: 345, quantity: 25, unit: 'unit', category: 'Oils & Ghee', minStockAlert: 5 },
  { name: 'गोवर्धन साजूक तूप १किलो', costPrice: 580, sellingPrice: 670, quantity: 18, unit: 'unit', category: 'Oils & Ghee', minStockAlert: 4 },

  // ३. मसाले व ड्रायफ्रूट्स (Spices & Dryfruits)
  { name: 'सुहाना गरम मसाला ५०ग्रॅम', costPrice: 32, sellingPrice: 42, quantity: 60, unit: 'unit', category: 'Spices & Dryfruits', minStockAlert: 10 },
  { name: 'एव्हरेस्ट लाल तिखट १००ग्रॅम', costPrice: 48, sellingPrice: 60, quantity: 45, unit: 'unit', category: 'Spices & Dryfruits', minStockAlert: 8 },
  { name: 'हळद पूड २५०ग्रॅम', costPrice: 55, sellingPrice: 72, quantity: 40, unit: 'unit', category: 'Spices & Dryfruits', minStockAlert: 8 },
  { name: 'धना जिरा पूड २००ग्रॅम', costPrice: 60, sellingPrice: 78, quantity: 35, unit: 'unit', category: 'Spices & Dryfruits', minStockAlert: 6 },
  { name: 'कांदा लसूण मसाला ५००ग्रॅम', costPrice: 110, sellingPrice: 145, quantity: 30, unit: 'unit', category: 'Spices & Dryfruits', minStockAlert: 5 },
  { name: 'काजू तुकडा २५०ग्रॅम', costPrice: 185, sellingPrice: 245, quantity: 20, unit: 'unit', category: 'Spices & Dryfruits', minStockAlert: 5 },
  { name: 'बदाम अमरी ५००ग्रॅम', costPrice: 370, sellingPrice: 460, quantity: 15, unit: 'unit', category: 'Spices & Dryfruits', minStockAlert: 4 },
  { name: 'बेदाणे / मनुके २५०ग्रॅम', costPrice: 75, sellingPrice: 105, quantity: 25, unit: 'unit', category: 'Spices & Dryfruits', minStockAlert: 5 },
  { name: 'पिस्ता २००ग्रॅम', costPrice: 220, sellingPrice: 290, quantity: 12, unit: 'unit', category: 'Spices & Dryfruits', minStockAlert: 3 },

  // ४. चहा, पेये व बिस्किटे (Beverages & Snacks)
  { name: 'विक्रम चहा २५०ग्रॅम', costPrice: 85, sellingPrice: 105, quantity: 90, unit: 'unit', category: 'Beverages & Snacks', minStockAlert: 15 },
  { name: 'रेड लेबल चहा ५००ग्रॅम', costPrice: 215, sellingPrice: 265, quantity: 40, unit: 'unit', category: 'Beverages & Snacks', minStockAlert: 8 },
  { name: 'सोसायटी चहा ५००ग्रॅम', costPrice: 230, sellingPrice: 280, quantity: 35, unit: 'unit', category: 'Beverages & Snacks', minStockAlert: 6 },
  { name: 'कॉफी ५०ग्रॅम', costPrice: 130, sellingPrice: 160, quantity: 25, unit: 'unit', category: 'Beverages & Snacks', minStockAlert: 5 },
  { name: 'पारले-जी बिस्किट', costPrice: 8.5, sellingPrice: 10, quantity: 150, unit: 'unit', category: 'Beverages & Snacks', minStockAlert: 30 },
  { name: 'गुड डे बटर बिस्किट', costPrice: 16, sellingPrice: 20, quantity: 100, unit: 'unit', category: 'Beverages & Snacks', minStockAlert: 20 },
  { name: 'मारी गोल्ड बिस्किट', costPrice: 24, sellingPrice: 30, quantity: 80, unit: 'unit', category: 'Beverages & Snacks', minStockAlert: 15 },

  // ५. साबण व स्वच्छता (Soaps & Cleaning)
  { name: 'लक्स साबण १००ग्रॅम', costPrice: 28, sellingPrice: 35, quantity: 75, unit: 'unit', category: 'Soaps & Cleaning', minStockAlert: 15 },
  { name: 'संतूर साबण ४ संच', costPrice: 120, sellingPrice: 148, quantity: 40, unit: 'unit', category: 'Soaps & Cleaning', minStockAlert: 8 },
  { name: 'व्हिल डिटर्जंट पावडर १किलो', costPrice: 62, sellingPrice: 78, quantity: 60, unit: 'unit', category: 'Soaps & Cleaning', minStockAlert: 12 },
  { name: 'सरफ एक्सेल पावडर १किलो', costPrice: 125, sellingPrice: 155, quantity: 45, unit: 'unit', category: 'Soaps & Cleaning', minStockAlert: 10 },
  { name: 'विम लिक्विड २५०मिली', costPrice: 42, sellingPrice: 55, quantity: 50, unit: 'unit', category: 'Soaps & Cleaning', minStockAlert: 10 },
  { name: 'विम बार साबण', costPrice: 8, sellingPrice: 10, quantity: 110, unit: 'unit', category: 'Soaps & Cleaning', minStockAlert: 25 },
  { name: 'टॉयलेट क्लिनर ५००मिली', costPrice: 82, sellingPrice: 102, quantity: 30, unit: 'unit', category: 'Soaps & Cleaning', minStockAlert: 6 },

  // ६. जनरल किराणा (General Kirana)
  { name: 'साखर उत्तम दर्जा', costPrice: 38, sellingPrice: 44, quantity: 200, unit: 'kg', category: 'General Kirana', minStockAlert: 30 },
  { name: 'मीठ १किलो', costPrice: 22, sellingPrice: 28, quantity: 120, unit: 'unit', category: 'General Kirana', minStockAlert: 25 },
  { name: 'कोल्हापुरी गूळ १किलो', costPrice: 48, sellingPrice: 65, quantity: 85, unit: 'kg', category: 'General Kirana', minStockAlert: 15 },
  { name: 'जाड पोहे', costPrice: 42, sellingPrice: 58, quantity: 70, unit: 'kg', category: 'General Kirana', minStockAlert: 12 },
  { name: 'रवा १किलो', costPrice: 36, sellingPrice: 48, quantity: 60, unit: 'kg', category: 'General Kirana', minStockAlert: 10 },
  { name: 'मैदा १किलो', costPrice: 34, sellingPrice: 46, quantity: 50, unit: 'kg', category: 'General Kirana', minStockAlert: 10 },
  { name: 'साबुदाणा', costPrice: 78, sellingPrice: 102, quantity: 65, unit: 'kg', category: 'General Kirana', minStockAlert: 12 },
  { name: 'शेंगदाणे मोठे', costPrice: 115, sellingPrice: 142, quantity: 90, unit: 'kg', category: 'General Kirana', minStockAlert: 15 },
];

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://nirmanam:nirmanam6464@cluster0.whzwve7.mongodb.net/stock_management?retryWrites=true&w=majority';
    await mongoose.connect(mongoUri);
    console.log('[Seeder] Connected to MongoDB...');

    await Stock.deleteMany();
    await Customer.deleteMany();
    await LedgerTransaction.deleteMany();
    await Bill.deleteMany();

    console.log('[Seeder] Cleaned existing collection data...');

    const createdStock = await Stock.insertMany(marathiStockCatalog);
    console.log(`[Seeder] Created ${createdStock.length} Marathi stock items.`);

    const sampleCustomer = await Customer.create({
      name: 'रमेश मारुती पाटील',
      phone: '9876543210',
      totalDue: 1850,
    });

    await LedgerTransaction.create({
      customerId: sampleCustomer._id,
      type: 'DUE',
      amount: 1850,
      note: 'जुनी उधारी बाकी',
      date: new Date(),
    });

    console.log('[Seeder] Marathi Katha customer created successfully!');
    process.exit();
  } catch (error) {
    console.error('[Seeder Error]', error);
    process.exit(1);
  }
};

seedData();
