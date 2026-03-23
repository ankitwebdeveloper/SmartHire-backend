const User = require('../models/User');

async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Admin';

  // Only seed if explicitly configured
  if (!email || !password) return;

  const existing = await User.findOne({ email });
  if (existing) return;

  await User.create({
    name,
    email,
    password,
    role: 'admin',
    authProvider: 'email',
    accountStatus: 'active',
  });

  // eslint-disable-next-line no-console
  console.log(`Seeded admin user: ${email}`);
}

module.exports = ensureAdmin;

