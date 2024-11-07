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
            dbName: 'podokan'
        };

        mongoose.connection.on('error', err => {
            console.error('MongoDB runtime error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected, attempting to reconnect...');
        });

        const connection = await mongoose.connect(process.env.DB_URL, options);
        console.log(`MongoDB connected with host: ${connection.connection.host}`);

        return connection;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

module.exports = connectDatabase;