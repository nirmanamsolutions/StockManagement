const mongoose = require('mongoose');

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
  } catch (error) {
    console.log(`⚠️ [MongoDB Atlas Warning] ${error.message}`);
    console.log(`⚡ Launching In-Memory MongoDB Server for offline/local development...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const memUri = mongoServer.getUri();
      const conn = await mongoose.connect(memUri);
      console.log(`[MongoDB In-Memory] Connected: ${conn.connection.host}`);
    } catch (memErr) {
      console.error(`[MongoDB Error] ${memErr.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
