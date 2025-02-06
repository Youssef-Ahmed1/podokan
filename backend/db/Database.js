// db/Database.js
const mongoose = require("mongoose");
const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000; // 5 seconds

const connectDatabase = async (retryCount = 0) => {
  try {
    console.log('Attempting database connection...', {
      attempt: retryCount + 1,
      maxRetries: MAX_RETRIES
    });

    const connectionParams = {
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      serverSelectionTimeoutMS: 30000,
      family: 4,
      retryWrites: true,
      maxIdleTimeMS: 60000,
      compressors: 'zlib'
    };

    mongoose.connection.on('connecting', () => {
      console.log('MongoDB: Connecting...');
    });

    mongoose.connection.on('connected', () => {
      console.log('MongoDB: Connected successfully');
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB: Disconnected');
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          connectDatabase(retryCount + 1);
        }, RETRY_INTERVAL);
      }
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          connectDatabase(retryCount + 1);
        }, RETRY_INTERVAL);
      }
    });

    await mongoose.connect(process.env.DB_URL, connectionParams);
    return mongoose.connection;

  } catch (error) {
    console.error('Database connection error:', error);
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying connection in ${RETRY_INTERVAL/1000} seconds... (${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
      return connectDatabase(retryCount + 1);
    }
    throw error;
  }
};

module.exports = connectDatabase;