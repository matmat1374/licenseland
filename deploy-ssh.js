const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

ssh.connect({
  host: '109.122.254.151',
  username: 'root',
  password: 'Licenseland@2026!'
}).then(() => {
  console.log('Connected to server!');
  return ssh.execCommand('git pull origin main && export NODE_OPTIONS=--max-old-space-size=1536 && npm run build && pm2 reload licenseland', { cwd: '/var/www/licenseland' });
}).then((result) => {
  console.log('STDOUT: ' + result.stdout);
  console.log('STDERR: ' + result.stderr);
  ssh.dispose();
}).catch((err) => {
  console.error('Error:', err);
  ssh.dispose();
});
