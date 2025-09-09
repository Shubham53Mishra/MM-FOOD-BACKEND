const mongoose = require('mongoose');
const User = require('../models/User');

async function createTestUser() {
  const user = new User({
    fullName: 'Test Vendor',
    email: 'testvendor@example.com',
    mobile: '9876543210',
    password: 'testpassword',
    city: 'Test City',
    state: 'Test State',
    company: 'Test Company'
  });
  await user.save();
  console.log('Test user created:', user);
}

createTestUser().catch(console.error);
