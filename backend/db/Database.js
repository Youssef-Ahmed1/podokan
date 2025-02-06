const mongoose = require("mongoose");

const connectDatabase = async () => {
  try {
    const connectionParams = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      family: 4,
      keepAlive: true,
      keepAliveInitialDelay: 300000,
      autoIndex: true,
      retryWrites: true,
      connectTimeoutMS: 30000,
      maxIdleTimeMS: 60000
    };

    mongoose.connection.on('connecting', () => {
      console.log('MongoDB: Connecting...');
    });

    mongoose.connection.on('connected', () => {
      console.log('MongoDB: Connected successfully');
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB: Disconnected. Attempting to reconnect...');
      // Attempt to reconnect after 5 seconds
      setTimeout(async () => {
        try {
          await mongoose.connect(process.env.DB_URL, connectionParams);
        } catch (error) {
          console.error('MongoDB: Reconnection failed:', error);
        }
      }, 5000);
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    // Initial connection
    await mongoose.connect(process.env.DB_URL, connectionParams);
    console.log(`MongoDB connected successfully to: ${mongoose.connection.host}`);

    // Handle process termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('MongoDB: Connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error during MongoDB connection closure:', err);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Retry connection after 5 seconds
    setTimeout(() => connectDatabase(), 5000);
  }
};

module.exports = connectDatabase;