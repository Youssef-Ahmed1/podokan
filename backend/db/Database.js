const mongoose = require("mongoose");

const connectDatabase = () => {
  // Debug log
  console.log('Attempting to connect to MongoDB...');
  console.log('DB URL:', process.env.DB_URL);
  
  mongoose
    .connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then((data) => {
      console.log(`MongoDB connected with server: ${data.connection.host}`);
      // Log the available collections
      mongoose.connection.db.listCollections().toArray((err, collections) => {
        if (err) {
          console.log('Error getting collections:', err);
        } else {
          console.log('Available collections:', collections.map(c => c.name));
        }
      });
    })
    .catch((error) => {
      console.error("Database connection error:", error);
      console.error("Error stack:", error.stack);
      // Don't exit process here, let the error propagate
      throw error;
    });
};

module.exports = connectDatabase;