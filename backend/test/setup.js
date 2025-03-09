const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.test' });

// Set up MongoDB connection for testing
before(async function() {
  this.timeout(10000); // Increase timeout for MongoDB connection
  
  // Use in-memory MongoDB server for testing or a test database
  const mongoURI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/task_dashboard_test';
  
  try {
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected for testing');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
});

// Clean up database after tests
after(async function() {
  // Drop the database after tests
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
});