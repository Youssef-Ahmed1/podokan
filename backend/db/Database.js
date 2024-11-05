// db/Database.js
const mongoose = require("mongoose");

const connectDatabase = () => {
  const dbUrl = process.env.DB_URL || process.env.MONGO_URI;
  
  if (!dbUrl) {
    console.error('Database URL is not defined in environment variables');
    process.exit(1);
  }

  console.log('Attempting to connect to MongoDB...');
  
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 30000,
    family: 4,
    retryWrites: true,
    w: 'majority'
  };

  return mongoose
    .connect(dbUrl, options)
    .then((data) => {
      console.log(`MongoDB connected with server: ${data.connection.host}`);
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
      });

      return data;
    })
    .catch((error) => {
      console.error("Database connection error:", error);
      throw error; // Let the server handle the error
    });
};

module.exports = connectDatabase;