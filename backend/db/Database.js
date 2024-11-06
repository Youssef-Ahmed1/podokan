// db/Database.js
const mongoose = require("mongoose");

const connectDatabase = async () => {
  try {
    const conn = await mongoose.connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      keepAlive: true,
      keepAliveInitialDelay: 300000
    });

    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      // Don't exit - let the connection retry
      setTimeout(connectDatabase, 5000);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected - attempting reconnection');
      setTimeout(connectDatabase, 5000);
    });

    return conn;
  } catch (error) {
    console.error('Database connection failed:', error);
    // Don't exit - retry connection
    setTimeout(connectDatabase, 5000);
  }
};

module.exports = connectDatabase;