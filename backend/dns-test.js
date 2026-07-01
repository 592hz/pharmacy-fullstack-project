import dns from 'dns';

const hostname = '_mongodb._tcp.cluster0.qudx9s1.mongodb.net';

console.log('Setting DNS servers to [8.8.8.8, 8.8.4.4]...');
dns.setServers(['8.8.8.8', '8.8.4.4']);

console.log(`Resolving SRV for ${hostname}...`);

dns.resolveSrv(hostname, (err, addresses) => {
    if (err) {
        console.error('dns.resolveSrv error:', err);
    } else {
        console.log('dns.resolveSrv result:', JSON.stringify(addresses, null, 2));
    }
});
