const mongoose = require("mongoose");

const connectDatabase = () => {
  mongoose
    .connect(process.env.DB_URL, {
 

      serverSelectionTimeoutMS: 5000, // Time to wait for server selection
      maxPoolSize: 10, // Maximum number of connections in the pool
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      autoIndex: true, // Build indexes
      retryWrites: true, // Retry failed writes
      connectTimeoutMS: 10000, // Give up initial connection after 10 seconds

   
    })
    .then((data) => {
      console.log(`MongoDB connected successfully to: ${data.connection.host}`);
    })
    .catch((error) => {
      console.error('MongoDB connection error:', error);
      // Retry logic or graceful shutdown
      process.exit(1);
    });

  // Add error handlers
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. Attempting to reconnect...');
  });

  // Handle process termination
  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    } catch (err) {
      console.error('Error during MongoDB connection closure:', err);
      process.exit(1);
    }
  });
};

module.exports = connectDatabase;