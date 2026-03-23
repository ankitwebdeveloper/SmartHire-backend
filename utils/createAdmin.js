require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smarthire')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => { console.error(err); process.exit(1); });

const createAdmin = async () => {
  try {
    const email = 'ankit@smarthire.com';
    const password = 'ankit@smarthire';

    // Remove existing admin with this email if any (clean re-seed)
    await User.deleteOne({ email });

    const admin = await User.create({
      name: 'Ankit — SmartHire Admin',
      email,
      password, // Hashed automatically by User model pre-save hook
      role: 'admin',
      accountStatus: 'active',
    });

    console.log(`✅ Admin account created successfully!`);
    console.log(`   Email   : ${admin.email}`);
    console.log(`   Role    : ${admin.role}`);
    console.log(`   Password: ankit@smarthire  (store this securely)`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to create admin:', err.message);
    process.exit(1);
  }
};

createAdmin();
