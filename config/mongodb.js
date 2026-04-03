require('dotenv').config();

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.warn('⚠️ MONGODB_URI is not defined. Skipping MongoDB connection.');
  module.exports = null;
} else {
  const mongoose = require('mongoose');
  console.log('🔌 Attempting MongoDB connection...');

  mongoose.connect(mongoUri)
    .then(() => {
      console.log('✅ MongoDB connected successfully');
    })
    .catch((err) => {
      console.error('❌ MongoDB connection error:', err.message);
      console.error('⚠️ Server will continue but database operations will fail');
      // DON'T exit - let server continue
    });

  // Handle MongoDB disconnection warnings
  mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB error:', err.message);
  });

  module.exports = mongoose.connection;
}
