const mongoose = require("mongoose");

const connectDatabase = async () => {
  try {
    if (!process.env.DB_URL) {
      console.error('DB_URL is not defined');
      process.exit(1);
    }

    mongoose.set('maxTimeMS', 10000);
    
    const conn = await mongoose.connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 15000,
      family: 4,
      keepAlive: true,
      keepAliveInitialDelay: 300000
    });

    console.log(`MongoDB connected with server: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    return conn;
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDatabase;