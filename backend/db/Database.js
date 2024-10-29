const mongoose = require("mongoose");

const connectDatabase = () => {
  const dbUrl = process.env.DB_URL;
  
  if (!dbUrl) {
    console.error('DB_URL is not defined in environment variables');
    process.exit(1);
  }

  console.log('Attempting to connect to MongoDB...');
  
  mongoose
    .connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then((data) => {
      console.log(`MongoDB connected with server: ${data.connection.host}`);
    })
    .catch((error) => {
      console.error("Database connection error:", error);
      process.exit(1);
    });
};

module.exports = connectDatabase;