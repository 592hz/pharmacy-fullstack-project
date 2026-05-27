const { spawn } = require('child_process');
const path = require('path');

const services = [
  { name: 'Backend ', command: 'npm', args: ['run', 'dev'], cwd: path.join(__dirname, 'backend'), color: '\x1b[36m' }, // Cyan
  { name: 'Frontend', command: 'npm', args: ['run', 'dev'], cwd: path.join(__dirname, 'frontend'), color: '\x1b[32m' }, // Green
  { name: 'Gateway ', command: 'node', args: ['gateway.js'], cwd: __dirname, color: '\x1b[35m' } // Magenta
];

const children = [];

console.log('\x1b[1m\x1b[34m%s\x1b[0m', '🚀 Starting Pharmacy Fullstack System dev environment...');

services.forEach(service => {
  const child = spawn(service.command, service.args, {
    cwd: service.cwd,
    shell: true,
    env: { ...process.env, FORCE_COLOR: 'true' }
  });
  
  children.push(child);
  
  const printData = (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line) {
        console.log(`${service.color}[${service.name}]\x1b[0m ${line}`);
      }
    });
  };
  
  child.stdout.on('data', printData);
  child.stderr.on('data', printData);
  
  child.on('close', (code) => {
    console.log(`${service.color}[${service.name}]\x1b[0m Exited with code ${code}`);
    cleanup();
  });
});

let isCleaningUp = false;
function cleanup() {
  if (isCleaningUp) return;
  isCleaningUp = true;
  console.log('\n\x1b[33mStopping all services...\x1b[0m');
  children.forEach(child => {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', child.pid, '/f', '/t']);
      } else {
        child.kill();
      }
    } catch (e) {
      // ignore
    }
  });
  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
