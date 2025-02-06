const mongoose = require("mongoose");
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from config folder
dotenv.config({ path: path.join(__dirname, '..', 'config', '.env') });

const connectDatabase = async () => {
  try {
    // Debug connection attempt
    console.log('Attempting database connection...', {
      dbUrlExists: !!process.env.DB_URL,
      nodeEnv: process.env.NODE_ENV
    });

    const connectionParams = {
      maxPoolSize: 50,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4,
      autoIndex: false,
      retryWrites: true,
      connectTimeoutMS: 30000
    };

    mongoose.connection.on('connecting', () => {
      console.log(`MongoDB: Attempting connection to ${process.env.NODE_ENV} database...`);
    });

    mongoose.connection.on('connected', () => {
      console.log(`MongoDB: Connected successfully to ${process.env.NODE_ENV} database`);
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    // Initial connection
    const connection = await mongoose.connect(process.env.DB_URL, connectionParams);
    console.log(`MongoDB connected to ${connection.connection.host}`);

    return connection;

  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDatabase;