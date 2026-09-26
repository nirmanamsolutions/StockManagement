const http = require('http');

const API_BASE = 'http://localhost:5000/api';

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

const postJSON = (path, body) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      `http://127.0.0.1:5000/api${path}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let respData = '';
        res.on('data', (chunk) => (respData += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(respData));
          } catch (e) {
            resolve(respData);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
};

async function seedViaAPI() {
  console.log('🚀 Populating database via Express API (http://localhost:5000)...');
  
  try {
    const createdStockItems = [];
    console.log('\n📦 Seeding Stock Products...');
    for (const item of sampleStocks) {
      const res = await postJSON('/stock', item);
      if (res.data) {
        createdStockItems.push(res.data);
        console.log(`  ✓ Added: ${res.data.name} (${res.data.quantity} ${res.data.unit})`);
      }
    }

    console.log('\n👥 Seeding Katha Customers & Ledger Entries...');
    const cust1 = await postJSON('/ledger/customers', { name: 'शामराव शिंदे (Shamrao Shinde)', phone: '9822114455' });
    const cust2 = await postJSON('/ledger/customers', { name: 'सचिन पाटील (Sachin Patil)', phone: '9921979797' });
    const cust3 = await postJSON('/ledger/customers', { name: 'गणेश देशमुख (Ganesh Deshmukh)', phone: '9423556677' });
    console.log('  ✓ Created 3 Customer Katha Profiles.');

    if (createdStockItems.length > 2) {
      console.log('\n🧾 Creating Sample Bills...');
      // 1. Unpaid Katha Bill
      await postJSON('/bills', {
        customerName: 'शामराव शिंदे (Shamrao Shinde)',
        customerPhone: '9822114455',
        items: [
          { productId: createdStockItems[0]._id, quantity: 2 },
          { productId: createdStockItems[5]._id, quantity: 1 }
        ],
        paymentStatus: 'UNPAID',
        paymentType: 'KATHA',
        amountPaid: 0
      });

      // 2. Paid Cash/UPI Bill
      await postJSON('/bills', {
        customerName: 'सचिन पाटील (Sachin Patil)',
        customerPhone: '9921979797',
        items: [
          { productId: createdStockItems[1]._id, quantity: 1 }
        ],
        paymentStatus: 'PAID',
        paymentType: 'UPI',
        amountPaid: 210
      });

      console.log('  ✓ Sample Bills & Katha Auto-Posting Completed!');
    }

    console.log('\n==================================================');
    console.log('🎉 DATABASE SUCCESSFULLY POPULATED WITH SAMPLE DATA!');
    console.log('==================================================\n');
  } catch (err) {
    console.error('❌ Seeding via API error:', err);
  }
}

seedViaAPI();
