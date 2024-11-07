const mongoose = require("mongoose");

const connectDatabase = async () => {
  try {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 60000,
      family: 4,
      dbName: 'podokan',
      // Remove deprecated options
      // keepAlive: true,
      // keepAliveInitialDelay: 300000
    };

    const connection = await mongoose.connect(process.env.DB_URL, options);
    console.log(`MongoDB connected with host: ${connection.connection.host}`);

    mongoose.connection.on('error', err => {
      console.error('MongoDB error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

module.exports = connectDatabase;