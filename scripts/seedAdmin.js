const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('../models/User');
const Workshop = require('../models/Workshop');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingUser = await User.findOne({ email: 'admin@oficina.pt' });
    if (existingUser) {
      console.log('Admin already exists!');
      console.log('Email: admin@oficina.pt');
      console.log('Password: admin123');
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const user = await User.create({
      name: 'Admin Teste',
      email: 'admin@oficina.pt',
      password: hashedPassword,
      role: 'admin'
    });

    // Create workshop
    const workshop = await Workshop.create({
      name: 'Oficina Teste',
      address: 'Rua Principal, 100',
      city: 'Lisboa',
      postalCode: '1000-001',
      nif: '507667979',
      contact: '912345678',
      owner: user._id
    });

    // Link user to workshop
    user.workshop = workshop._id;
    await user.save();

    console.log('✅ Admin created successfully!');
    console.log('================================');
    console.log('Email: admin@oficina.pt');
    console.log('Password: admin123');
    console.log('================================');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

seedAdmin();
