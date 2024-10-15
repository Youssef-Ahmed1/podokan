const mongoose = require("mongoose");

const connectDatabase = () => {
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
    });
};

module.exports = connectDatabase;