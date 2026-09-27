const http = require('http');

const sampleStocks = [
  { name: 'लोकवन गहू', costPrice: 31, sellingPrice: 38, quantity: 150, unit: 'kg', category: 'Grains & Pulses', minStockAlert: 20 },
  { name: 'बासमती तांदूळ', costPrice: 85, sellingPrice: 110, quantity: 95, unit: 'kg', category: 'Grains & Pulses', minStockAlert: 15 },
  { name: 'इंद्रायणी तांदूळ', costPrice: 55, sellingPrice: 72, quantity: 150, unit: 'kg', category: 'Grains & Pulses', minStockAlert: 25 },
  { name: 'कोलम तांदूळ', costPrice: 48, sellingPrice: 62, quantity: 110, unit: 'kg', category: 'Grains & Pulses', minStockAlert: 20 },
  { name: 'गावरान तूर डाळ', costPrice: 145, sellingPrice: 175, quantity: 80, unit: 'kg', category: 'Grains & Pulses', minStockAlert: 15 },
  { name: 'हरभरा डाळ', costPrice: 68, sellingPrice: 88, quantity: 70, unit: 'kg', category: 'Grains & Pulses', minStockAlert: 10 },
  { name: 'मसूर डाळ', costPrice: 72, sellingPrice: 92, quantity: 65, unit: 'kg', category: 'Grains & Pulses', minStockAlert: 10 },
  { name: 'मूग डाळ', costPrice: 95, sellingPrice: 120, quantity: 50, unit: 'kg', category: 'Grains & Pulses', minStockAlert: 10 },
  { name: 'उडीद डाळ', costPrice: 105, sellingPrice: 132, quantity: 45, unit: 'kg', category: 'Grains & Pulses', minStockAlert: 8 },

  { name: 'शेंगदाणा शुद्ध तेल १लिटर', costPrice: 145, sellingPrice: 175, quantity: 60, unit: 'liter', category: 'Oils & Ghee', minStockAlert: 12 },
  { name: 'सोयाबीन तेल १लिटर', costPrice: 115, sellingPrice: 138, quantity: 85, unit: 'liter', category: 'Oils & Ghee', minStockAlert: 15 },
  { name: 'सूर्यफूल तेल १लिटर', costPrice: 125, sellingPrice: 148, quantity: 50, unit: 'liter', category: 'Oils & Ghee', minStockAlert: 10 },
  { name: 'अमूल शुद्ध तूप ५००ग्रॅम', costPrice: 295, sellingPrice: 345, quantity: 25, unit: 'unit', category: 'Oils & Ghee', minStockAlert: 5 },

  { name: 'सुहाना गरम मसाला ५०ग्रॅम', costPrice: 32, sellingPrice: 42, quantity: 60, unit: 'unit', category: 'Spices & Dryfruits', minStockAlert: 10 },
  { name: 'एव्हरेस्ट लाल तिखट १००ग्रॅम', costPrice: 48, sellingPrice: 60, quantity: 45, unit: 'unit', category: 'Spices & Dryfruits', minStockAlert: 8 },
  { name: 'काजू तुकडा २५०ग्रॅम', costPrice: 185, sellingPrice: 245, quantity: 20, unit: 'unit', category: 'Spices & Dryfruits', minStockAlert: 5 },
  { name: 'बदाम अमरी ५००ग्रॅम', costPrice: 370, sellingPrice: 460, quantity: 15, unit: 'unit', category: 'Spices & Dryfruits', minStockAlert: 4 },

  { name: 'विक्रम चहा २५०ग्रॅम', costPrice: 85, sellingPrice: 105, quantity: 90, unit: 'unit', category: 'Beverages & Snacks', minStockAlert: 15 },
  { name: 'पारले-जी बिस्किट', costPrice: 8.5, sellingPrice: 10, quantity: 150, unit: 'unit', category: 'Beverages & Snacks', minStockAlert: 30 },

  { name: 'लक्स साबण १००ग्रॅम', costPrice: 28, sellingPrice: 35, quantity: 75, unit: 'unit', category: 'Soaps & Cleaning', minStockAlert: 15 },
  { name: 'व्हिल डिटर्जंट पावडर १किलो', costPrice: 62, sellingPrice: 78, quantity: 60, unit: 'unit', category: 'Soaps & Cleaning', minStockAlert: 12 },

  { name: 'साखर उत्तम दर्जा', costPrice: 38, sellingPrice: 44, quantity: 200, unit: 'kg', category: 'General Kirana', minStockAlert: 30 },
  { name: 'कोल्हापुरी गूळ १किलो', costPrice: 48, sellingPrice: 65, quantity: 85, unit: 'kg', category: 'General Kirana', minStockAlert: 15 },
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
    console.log('\n📦 Seeding Marathi Stock Products...');
    for (const item of sampleStocks) {
      const res = await postJSON('/stock', item);
      if (res.data) {
        createdStockItems.push(res.data);
        console.log(`  ✓ Added: ${res.data.name} (${res.data.quantity} ${res.data.unit})`);
      }
    }

    console.log('\n👥 Seeding Katha Customers & Ledger Entries...');
    const cust1 = await postJSON('/ledger/customers', { name: 'शामराव ज्ञानदेव शिंदे', phone: '9822114455' });
    const cust2 = await postJSON('/ledger/customers', { name: 'सचिन रामचंद्र कदम', phone: '9921979797' });
    const cust3 = await postJSON('/ledger/customers', { name: 'गणेश बापूराव देशमुख', phone: '9423556677' });
    console.log('  ✓ Created Customer Katha Profiles.');

    console.log('\n==================================================');
    console.log('🎉 DATABASE POPULATED VIA API WITH PURE MARATHI DATA!');
    console.log('==================================================\n');
  } catch (err) {
    console.error('❌ Seeding via API error:', err);
  }
}

seedViaAPI();
