const User = require('../models/User');

/**
 * Seed a default admin user if no users exist.
 * This helps prevent login 401 errors on fresh DBs.
 */
async function seedDefaultUser() {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      const admin = new User({
        name: 'Admin User',
        email: 'admin@nutritrack.app',
        password: 'Password123', // will be hashed by User model pre-save hook
        age: 30,
        weight: 70,
        height: 170,
        gender: 'Other',
        isVerified: true,
      });
      await admin.save();
      console.log('[Seed] Default admin user created (email: admin@nutritrack.app, password: Password123)');
    } else {
      console.log('[Seed] Users already exist, skipping default admin creation.');
    }
  } catch (err) {
    console.error('[Seed] Error creating default user:', err);
  }
}

module.exports = { seedDefaultUser };
