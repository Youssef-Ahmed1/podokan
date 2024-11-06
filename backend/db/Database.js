// db/Database.js
const mongoose = require("mongoose");

const connectDatabase = async () => {
  try {
    if (!process.env.DB_URL) {
      console.error('DB_URL is not defined');
      process.exit(1);
    }

    console.log('Attempting to connect to MongoDB...');

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: true,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 10000,
      family: 4,
      retryWrites: true,
      w: 'majority',
      wtimeoutMS: 10000
    };

    const conn = await mongoose.connect(process.env.DB_URL, options);

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    console.log(`MongoDB connected with server: ${conn.connection.host}`);
    return conn;

  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDatabase;