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
      retryWrites: true,
      w: 'majority'
    };

    const conn = await mongoose.connect(process.env.DB_URL, options);
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
    throw error;
  }
};

module.exports = connectDatabase;