import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.error('❌ LỖI: MONGODB_URI không tồn tại trong file .env!');
            process.exit(1);
        }

        const conn = await mongoose.connect(uri);
        console.log(`--- KẾT NỐI MONGODB THÀNH CÔNG ---`);
        console.log(`- Host: ${conn.connection.host}`);
        console.log(`- Database: ${conn.connection.db?.databaseName}`);
    } catch (error) {
        console.error(`Error: ${(error as Error).message}`);
        process.exit(1);
    }
};

export default connectDB;
