import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  const mongoURI = process.env.MONGODB_URI;

  // Skip connection in mock mode
  if (mongoURI === 'mock') {
    console.log('🔧 Mock mode enabled - skipping MongoDB connection');
    return;
  }

  try {
    await mongoose.connect(mongoURI!);
    console.log('✅ MongoDB Connected Successfully');

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    console.warn('Server will continue without database connection');
  }
};

export default connectDB;
