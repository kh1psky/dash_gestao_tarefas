const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Admin user configuration
const adminUser = {
    name: 'Admin',
    email: 'admin@admin.com',
    password: 'admin123',
    role: 'admin'
};

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/task_dashboard')
    .then(async () => {
        console.log('MongoDB connected');

        try {
            // Check if admin already exists
            const existingAdmin = await User.findOne({ email: adminUser.email });
            if (existingAdmin) {
                console.log('Admin user already exists!');
                process.exit(0);
            }

            // Create new admin user
            const user = new User(adminUser);
            await user.save();

            console.log('Admin user created successfully!');
            console.log('Email:', adminUser.email);
            console.log('Password:', adminUser.password);
        } catch (error) {
            console.error('Error creating admin user:', error);
        } finally {
            process.exit(0);
        }
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });