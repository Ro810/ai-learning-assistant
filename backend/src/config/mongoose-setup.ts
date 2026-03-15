import dotenv from 'dotenv';

// Load env vars FIRST before any other imports
dotenv.config();

// Disable mongoose buffering in mock mode
if (process.env.MONGODB_URI === 'mock') {
  import('mongoose').then(mongoose => {
    mongoose.set('bufferCommands', false);
    console.log('🔧 Mongoose buffering disabled for mock mode');
  });
}
