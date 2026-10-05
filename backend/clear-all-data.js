const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

const Stock = require('./src/models/Stock');
const Customer = require('./src/models/Customer');
const Bill = require('./src/models/Bill');
const LedgerTransaction = require('./src/models/LedgerTransaction');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb+srv://nirmanam:nirmanam6464@cluster0.whzwve7.mongodb.net/stock_management?retryWrites=true&w=majority';

async function clearAllDatabaseData() {
  try {
    console.log('⏳ Connecting to MongoDB Database...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB.');

    console.log('🧹 Wiping all website database records...');
    
    const stockRes = await Stock.deleteMany({});
    console.log(`  ✓ Cleared ${stockRes.deletedCount} Stock products.`);

    const custRes = await Customer.deleteMany({});
    console.log(`  ✓ Cleared ${custRes.deletedCount} Customer accounts.`);

    const billRes = await Bill.deleteMany({});
    console.log(`  ✓ Cleared ${billRes.deletedCount} Bills.`);

    const ledgerRes = await LedgerTransaction.deleteMany({});
    console.log(`  ✓ Cleared ${ledgerRes.deletedCount} Ledger transactions.`);

    console.log('\n==================================================');
    console.log('✨ ALL WEBSITE DATA CLEARED SUCCESSFULLY! (DATABASE IS EMPTY)');
    console.log('==================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error wiping database data:', err);
    process.exit(1);
  }
}

clearAllDatabaseData();
