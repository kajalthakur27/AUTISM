import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/autism_screening';

export const connectDatabase = async (): Promise<void> => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    const conn = await mongoose.connect(MONGODB_URI, {
      // Remove deprecated options, mongoose 6+ handles these automatically
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📂 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.log('⚠️  Falling back to in-memory storage...');
    // Don't exit process, continue with in-memory storage
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('📤 MongoDB disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
  }
};
