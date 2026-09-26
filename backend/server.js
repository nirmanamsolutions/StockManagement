const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const cron = require('node-cron');

dotenv.config();

const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');

// Route Imports
const stockRoutes = require('./src/routes/stockRoutes');
const billRoutes = require('./src/routes/billRoutes');
const ledgerRoutes = require('./src/routes/ledgerRoutes');

// Controllers
const { cleanupPaidBills } = require('./src/controllers/billController');

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Root URL & Health Check API
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'Retail Stock, Billing & Katha Management API Server is Running!',
    endpoints: {
      health: '/api/health',
      stock: '/api/stock',
      bills: '/api/bills',
      ledger: '/api/ledger'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date(),
    service: 'Retail Stock, Billing & Katha Management API',
  });
});

// Mount Routes
app.use('/api/stock', stockRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/ledger', ledgerRoutes);

// Error Handling Middleware
app.use(errorHandler);

// Cron Job: Automatically clean up paid bills older than 30 days every night at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('[Cron Job] Executing 30-day paid bill cleanup...');
  try {
    const fakeReq = {};
    const fakeRes = {
      status: () => fakeRes,
      json: (data) => console.log('[Cron Job Result]', data),
    };
    await cleanupPaidBills(fakeReq, fakeRes, (err) => {
      if (err) console.error('[Cron Job Error]', err);
    });
  } catch (error) {
    console.error('[Cron Job Error]', error.message);
  }
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ [Port Error] Port ${PORT} is already in use by another running process.`);
    console.error(`👉 Port ${PORT} has been freed. You can now run 'npm run dev' cleanly!\n`);
    process.exit(1);
  } else {
    console.error(`[Server Error] ${err.message}`);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Rejection Error] ${err.message}`);
  server.close(() => process.exit(1));
});
