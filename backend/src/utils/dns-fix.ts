import dns from 'dns';
import dotenv from 'dotenv';

console.log('📦 [System] dns-fix.ts is being loaded...');
dotenv.config();

/**
 * Fix for MongoDB querySrv ECONNREFUSED on Windows.
 * This forces Node.js to use Google & Cloudflare DNS.
 */
export const applyDnsFix = () => {
    const mongodbUri = process.env.MONGODB_URI || '';
    
    if (mongodbUri.includes('mongodb+srv://')) {
        console.log('🔧 [System] DNS Fix: Forcing Google/Cloudflare DNS for SRV resolution...');
        
        // 1. Set global servers
        dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

        // 2. Monkey-patch resolveSrv as a fallback
        const originalResolveSrv = dns.resolveSrv;
        // @ts-ignore - Patching internal DNS resolution
        dns.resolveSrv = function(this: any, hostname: string, callback: (err: Error | null, addresses: dns.SrvRecord[]) => void) {
            if (hostname.includes('mongodb.net')) {
                const resolver = new dns.Resolver();
                resolver.setServers(['8.8.8.8', '8.8.4.4']);
                return resolver.resolveSrv(hostname, callback);
            }
            return originalResolveSrv.apply(this, [hostname, callback]);
        };
        
        console.log('✅ [System] DNS patch applied.');
    }
};

applyDnsFix();
