import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Use MONGODB_URI from .env
const directUri = process.env.MONGODB_URI;

// Wait, I don't know the exact replicaSet name, usually it's atlas-<something>-shard-0
// I'll try without replicaSet first or try to guess it.
// Actually, Atlas usually provides this in the "Connect" -> "Drivers" -> "Node.js" -> "2.2.12 or earlier" section.

const test = async () => {
    try {
        console.log('Testing direct connection (non-SRV)...');
        // I'll use the URI from .env
        const simpleUri = process.env.MONGODB_URI;
        await mongoose.connect(simpleUri);
        console.log('✅ Success! Direct connection worked.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Direct connection failed:', err.message);
        process.exit(1);
    }
};

test();
