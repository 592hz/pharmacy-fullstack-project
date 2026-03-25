import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Using one of the shard hostnames discovered via nslookup
const directUri = "mongodb://pharmacy_db:SkfFmN2UwENng8ca@ac-viwgar4-shard-00-00.qudx9s1.mongodb.net:27017,ac-viwgar4-shard-00-01.qudx9s1.mongodb.net:27017,ac-viwgar4-shard-00-02.qudx9s1.mongodb.net:27017/pharmacy_db?replicaSet=atlas-p9y96u-shard-0&ssl=true&authSource=admin";

// Wait, I don't know the exact replicaSet name, usually it's atlas-<something>-shard-0
// I'll try without replicaSet first or try to guess it.
// Actually, Atlas usually provides this in the "Connect" -> "Drivers" -> "Node.js" -> "2.2.12 or earlier" section.

const test = async () => {
    try {
        console.log('Testing direct connection (non-SRV)...');
        // I'll use the simplest version first
        const simpleUri = "mongodb://pharmacy_db:SkfFmN2UwENng8ca@ac-viwgar4-shard-00-00.qudx9s1.mongodb.net:27017/pharmacy_db?ssl=true&authSource=admin";
        await mongoose.connect(simpleUri);
        console.log('✅ Success! Direct connection worked.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Direct connection failed:', err.message);
        process.exit(1);
    }
};

test();
