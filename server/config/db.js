import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb+srv://nvt120205:thang1202@thangnguyen.8aiscbh.mongodb.net/';
        // Kết nối và CHỌN ĐÚNG DB "User"
        await mongoose.connect(mongoURI, { dbName: 'User' });
        console.log('Connected to MongoDB <User>');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    }
};

export default connectDB;
