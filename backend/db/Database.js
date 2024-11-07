const mongoose = require("mongoose");

const connectDatabase = async () => {
  try {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      family: 4,
      keepAlive: true,
      keepAliveInitialDelay: 300000,
      dbName: 'podokan'
    };

    const connection = await mongoose.connect(process.env.DB_URL, options);

    console.log(`MongoDB connected with host: ${connection.connection.host}`);

    // Add event listeners for connection
    mongoose.connection.on('error', err => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

    // Handle errors after initial connection
    connection.connection.on('error', err => {
      console.error('MongoDB runtime error:', err);
    });

    return connection;

  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

module.exports = connectDatabase;