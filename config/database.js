const mongoose = require('mongoose');

async function connectDatabase(uri) {
  if (!uri) {
    throw new Error('MONGO_URI is not configured.');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    autoIndex: true,
    maxPoolSize: 10,
  });

  return mongoose.connection;
}

module.exports = {
  connectDatabase,
};
