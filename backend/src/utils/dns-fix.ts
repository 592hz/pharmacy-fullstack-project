import dns from 'dns';
import dotenv from 'dotenv';

// Ensure env vars are loaded as early as possible
dotenv.config();

/**
 * Fix for MongoDB querySrv ECONNREFUSED on Windows.
 * This forces Node.js to use Google DNS (8.8.8.8) which reliably resolves SRV records.
 */
export const applyDnsFix = () => {
    const mongodbUri = process.env.MONGODB_URI || '';
    
    // Only apply if using SRV and likely on a network that has DNS issues with it
    if (mongodbUri.includes('mongodb+srv://')) {
        console.log('🔧 [System] DNS Fix: Forcing Node.js to use Google DNS for SRV resolution...');
        dns.setServers(['8.8.8.8', '8.8.4.4']);
    } else {
        console.log('ℹ️ [System] DNS Fix: Skipping (not using mongodb+srv://)');
    }
};

// Auto-execute if imported
applyDnsFix();
