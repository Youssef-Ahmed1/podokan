// db/Database.js
const mongoose = require("mongoose");

const connectDatabase = async () => {
  try {
    const conn = await mongoose.connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      // Remove deprecated options
      // keepAlive: true,
      // keepAliveInitialDelay: 300000
    });

    console.log(`MongoDB connected successfully`);
    return conn;
  } catch (error) {
    console.error('Database connection failed:', error);
    setTimeout(connectDatabase, 5000);
  }
};

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  setTimeout(connectDatabase, 5000);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected - attempting reconnection');
  setTimeout(connectDatabase, 5000);
});

module.exports = connectDatabase;