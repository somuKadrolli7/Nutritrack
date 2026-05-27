const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nutritrack';
console.log('Testing connection to MongoDB URI:', uri);

mongoose.connect(uri)
  .then(() => {
    console.log('SUCCESS: MongoDB is connected and running perfectly!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('FAILURE: Could not connect to MongoDB:', err.message);
    process.exit(1);
  });
