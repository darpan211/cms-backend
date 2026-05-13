import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
  try {
     await mongoose.connect(process.env['MONGO_URI'] || '');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.warn('⚠️  MongoDB connection failed:', (error as Error).message);
    console.warn('   Continuing without database connection for development...');
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected');
  } catch (error) {
    console.error('❌ MongoDB disconnection failed:', error);
  }
};
