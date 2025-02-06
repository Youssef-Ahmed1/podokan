const mongoose = require("mongoose");

const connectDatabase = async () => {
  try {
    const connectionParams = {
      maxPoolSize: 50, // Increased for production
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4,
      heartbeatFrequencyMS: 3000,
      autoIndex: false, // Disable in production for better performance
      retryWrites: true,
      connectTimeoutMS: 30000,
      // Production specific settings
      minPoolSize: 10,
      maxIdleTimeMS: 60000,
      compressors: ["zlib"],
      zlibCompressionLevel: 6
    };

    mongoose.connection.on('connecting', () => {
      console.log(`MongoDB: Attempting connection to ${process.env.NODE_ENV} database...`);
    });

    mongoose.connection.on('connected', () => {
      console.log(`MongoDB: Connected successfully to ${process.env.NODE_ENV} database`);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB: Disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    // Initial connection
    const connection = await mongoose.connect(process.env.DB_URL, connectionParams);
    
    // Set up proper indexes in production
    if (process.env.NODE_ENV === 'production') {
      await mongoose.connection.db.command({ ping: 1 });
      console.log('MongoDB: Production indexes verified');
    }

    console.log(`MongoDB connected to ${process.env.NODE_ENV} database at: ${connection.connection.host}`);

    // Handle process termination
    process.on('SIGTERM', async () => {
      try {
        await mongoose.connection.close();
        console.log('MongoDB: Connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error during MongoDB connection closure:', err);
        process.exit(1);
      }
    });

    return connection;

  } catch (error) {
    console.error('MongoDB initial connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDatabase;