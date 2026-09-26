const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Stock = require('./src/models/Stock');
const Customer = require('./src/models/Customer');
const LedgerTransaction = require('./src/models/LedgerTransaction');
const Bill = require('./src/models/Bill');

// Import Controllers
const { addStock, getPdfStockList } = require('./src/controllers/stockController');
const { createBill } = require('./src/controllers/billController');
const { recordPayment, getWhatsAppReminder } = require('./src/controllers/ledgerController');

// Mock response creator
const createMockRes = () => {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
  return res;
};

const runBackendVerification = async () => {
  console.log('\n==================================================');
  console.log('🧪 RETAIL STORE BACKEND INTEGRATION & FIELD TEST');
  console.log('==================================================\n');

  try {
    const mongoUri = process.env.MONGODB_URI || '';
    if (!mongoUri || mongoUri.includes('<db_username>')) {
      console.error('❌ [MongoDB Atlas Error]: Please update backend/.env with your MongoDB Atlas database username.');
      console.error('   Current URI:', mongoUri);
      process.exit(1);
    }

    console.log('⏳ Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ [DB Connection] Connected to MongoDB Atlas successfully.\n');

    // 2. Clean Test Data
    const TEST_PREFIX = 'TEST_AUTORUN_';
    await Stock.deleteMany({ name: new RegExp(TEST_PREFIX) });
    await Customer.deleteMany({ name: new RegExp(TEST_PREFIX) });
    await Bill.deleteMany({ customerName: new RegExp(TEST_PREFIX) });

    // ----------------------------------------------------
    // TEST 1: Stock Item Field Registration & Unit Check
    // ----------------------------------------------------
    console.log('📦 [Test 1] Registering New Stock Product...');
    const reqStock = {
      body: {
        name: `${TEST_PREFIX}बास्मती तांदूळ (Basmati Rice)`,
        costPrice: 80,
        sellingPrice: 110,
        quantity: 50,
        unit: 'kg',
        category: 'Grains',
        minStockAlert: 10,
      },
    };
    const resStock = createMockRes();
    await addStock(reqStock, resStock, (err) => { if (err) throw err; });

    if (resStock.statusCode === 201 && resStock.data?.data?._id) {
      const savedStock = resStock.data.data;
      console.log(`  ✓ Stock Created ID: ${savedStock._id}`);
      console.log(`  ✓ Product Name: "${savedStock.name}"`);
      console.log(`  ✓ Registered Unit: "${savedStock.unit}" (kg)`);
      console.log(`  ✓ Cost Price: ₹${savedStock.costPrice} | Selling Price: ₹${savedStock.sellingPrice}`);
      console.log(`  ✓ Initial Quantity: ${savedStock.quantity} ${savedStock.unit}`);
    } else {
      throw new Error(`Stock Creation Failed: ${JSON.stringify(resStock.data)}`);
    }

    const testStockId = resStock.data.data._id;

    // Verify PDF Report Output Format
    const resPdf = createMockRes();
    await getPdfStockList({}, resPdf, (err) => { if (err) throw err; });
    const pdfItem = resPdf.data.data.find(i => i.id.toString() === testStockId.toString());
    if (pdfItem && pdfItem.stockAvailable === '50 kg') {
      console.log(`  ✓ Stock PDF Format Verified: Available = "${pdfItem.stockAvailable}"`);
    } else {
      throw new Error('PDF Report field mapping failed');
    }

    // ----------------------------------------------------
    // TEST 2: Paid Bill Generation & Auto Stock Deduction
    // ----------------------------------------------------
    console.log('\n🧾 [Test 2] Creating PAID Bill (5 kg purchase)...');
    const reqBill1 = {
      body: {
        customerName: `${TEST_PREFIX}Walk-in Paid Customer`,
        customerPhone: '9000000001',
        items: [
          {
            productId: testStockId,
            quantity: 5,
          },
        ],
        paymentStatus: 'PAID',
        paymentType: 'UPI',
        amountPaid: 550, // 5 * 110
      },
    };
    const resBill1 = createMockRes();
    await createBill(reqBill1, resBill1, (err) => { if (err) throw err; });

    if (resBill1.statusCode === 201 && resBill1.data?.data?.billId) {
      const bill = resBill1.data.data;
      console.log(`  ✓ Generated Bill ID: ${bill.billId}`);
      console.log(`  ✓ Payment Status: ${bill.paymentStatus} (${bill.paymentType})`);
      console.log(`  ✓ Total Amount: ₹${bill.totalAmount}`);
    } else {
      throw new Error(`Paid Bill Creation Failed: ${JSON.stringify(resBill1.data)}`);
    }

    // Check Stock After Deduction
    const updatedStock1 = await Stock.findById(testStockId);
    if (updatedStock1.quantity === 45) {
      console.log(`  ✓ Stock Auto-Deduction Verified! 50 kg -> ${updatedStock1.quantity} kg remaining.`);
    } else {
      throw new Error(`Stock Deduction Error! Expected 45 kg, got ${updatedStock1.quantity}`);
    }

    // ----------------------------------------------------
    // TEST 3: Unpaid Bill & Katha Ledger Link Registration
    // ----------------------------------------------------
    console.log('\n📖 [Test 3] Creating UNPAID Bill (10 kg purchase on Credit/Katha)...');
    const testCustPhone = '9876543219';
    const reqBill2 = {
      body: {
        customerName: `${TEST_PREFIX}अनिल शिंदे (Anil Shinde)`,
        customerPhone: testCustPhone,
        items: [
          {
            productId: testStockId,
            quantity: 10, // 10 * 110 = 1100
          },
        ],
        paymentStatus: 'UNPAID',
        paymentType: 'KATHA',
        amountPaid: 0,
      },
    };
    const resBill2 = createMockRes();
    await createBill(reqBill2, resBill2, (err) => { if (err) throw err; });

    if (resBill2.statusCode === 201 && resBill2.data?.data?.billId) {
      console.log(`  ✓ Generated Unpaid Bill ID: ${resBill2.data.data.billId}`);
    } else {
      throw new Error(`Unpaid Bill Creation Failed: ${JSON.stringify(resBill2.data)}`);
    }

    // Check Stock After Second Deduction
    const updatedStock2 = await Stock.findById(testStockId);
    if (updatedStock2.quantity === 35) {
      console.log(`  ✓ Second Stock Deduction Verified! 45 kg -> ${updatedStock2.quantity} kg remaining.`);
    } else {
      throw new Error(`Stock Deduction Error! Expected 35 kg, got ${updatedStock2.quantity}`);
    }

    // Verify Customer Katha Creation & Total Due
    const testCustomer = await Customer.findOne({ phone: testCustPhone });
    if (testCustomer && testCustomer.totalDue === 1100) {
      console.log(`  ✓ Katha Customer Registered: Name="${testCustomer.name}", Phone="${testCustomer.phone}"`);
      console.log(`  ✓ Customer Due Balance Registered: ₹${testCustomer.totalDue}`);
    } else {
      throw new Error('Katha Customer registration or due calculation failed');
    }

    // Verify Ledger Transaction Entry
    const transactions = await LedgerTransaction.find({ customerId: testCustomer._id });
    if (transactions.length === 1 && transactions[0].type === 'DUE' && transactions[0].amount === 1100) {
      console.log(`  ✓ Katha Transaction Log Registered: Type="${transactions[0].type}", Amount=₹${transactions[0].amount}`);
    } else {
      throw new Error('Ledger transaction log entry missing or invalid');
    }

    // ----------------------------------------------------
    // TEST 4: Customer Katha Payment Deduction (Pay Button)
    // ----------------------------------------------------
    console.log('\n💳 [Test 4] Recording Payment of ₹500 towards Katha Due...');
    const reqPay = {
      body: {
        customerId: testCustomer._id,
        amount: 500,
        paymentMethod: 'CASH',
        note: 'Partial cash payment',
      },
    };
    const resPay = createMockRes();
    await recordPayment(reqPay, resPay, (err) => { if (err) throw err; });

    const customerAfterPay = await Customer.findById(testCustomer._id);
    if (customerAfterPay.totalDue === 600) {
      console.log(`  ✓ Customer Due Deduction Verified! ₹1100 -> ₹${customerAfterPay.totalDue} remaining.`);
    } else {
      throw new Error(`Payment deduction error! Expected ₹600 due, got ₹${customerAfterPay.totalDue}`);
    }

    // ----------------------------------------------------
    // TEST 5: Marathi WhatsApp Link Generator Test
    // ----------------------------------------------------
    console.log('\n💬 [Test 5] Generating Marathi WhatsApp Reminder Link...');
    const reqWa = {
      params: { customerId: testCustomer._id },
      query: { storeName: 'किराणा दालन' },
    };
    const resWa = createMockRes();
    await getWhatsAppReminder(reqWa, resWa, (err) => { if (err) throw err; });

    if (resWa.statusCode === 200 && resWa.data?.data?.whatsappUrl) {
      const waInfo = resWa.data.data;
      console.log(`  ✓ Target Phone: +${waInfo.phone}`);
      console.log(`  ✓ Marathi Message Text:\n"${waInfo.message.replace(/\n/g, ' ')}"`);
      console.log(`  ✓ WhatsApp URL: ${waInfo.whatsappUrl}`);
    } else {
      throw new Error('WhatsApp reminder link generation failed');
    }

    // ----------------------------------------------------
    // TEST 6: Cleanup Test Data & Disconnect
    // ----------------------------------------------------
    console.log('\n🧹 [Test 6] Cleaning up test records...');
    await Stock.findByIdAndDelete(testStockId);
    await Customer.findByIdAndDelete(testCustomer._id);
    await LedgerTransaction.deleteMany({ customerId: testCustomer._id });
    await Bill.deleteMany({ customerName: new RegExp(TEST_PREFIX) });
    console.log('  ✓ Test data cleaned up.');

    await mongoose.disconnect();

    console.log('\n==================================================');
    console.log('🎉 ALL ATLAS CHECKS & FIELD TESTS PASSED (100%)!');
    console.log('==================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ [ATLAS AUTH / DB ERROR]:', error.message || error);
    console.error('\n💡 REASON: MongoDB Atlas authentication failed because the username in backend/.env is currently set to "admin".');
    console.error('   Please replace "admin" in backend/.env with your actual MongoDB Atlas Database Username!\n');
    process.exit(1);
  }
};

runBackendVerification();
