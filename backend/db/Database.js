
const mongoose = require("mongoose");

const connectDatabase = () => {
  const dbUrl = process.env.DB_URL;
  
  if (!dbUrl) {
    console.error('DB_URL is not defined in environment variables');
    process.exit(1);
  }

  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: true,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 5000,
    family: 4
  };

  console.log('Attempting to connect to MongoDB...');
  
  mongoose
    .connect(dbUrl, options)
    .then((data) => {
      console.log(`MongoDB connected with server: ${data.connection.host}`);
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
        setTimeout(connectDatabase, 5000);
      });
    })
    .catch((error) => {
      console.error("Database connection error:", error);
      process.exit(1);
    });
};

module.exports = connectDatabase;