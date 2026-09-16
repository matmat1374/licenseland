require('./scripts/deploy-env.cjs');
const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

ssh.connect({
  host: '109.122.254.151',
  username: 'root',
  password: process.env.DEPLOY_PASS
}).then(() => {
  console.log('Connected to server!');
  return ssh.execCommand('git fetch origin && git clean -fd && git reset --hard origin/main && export NODE_OPTIONS=--max-old-space-size=1536 && npm run build && pm2 reload licenseland && node scripts/check-364.js && node scripts/verify-all-links.mjs', { cwd: '/var/www/licenseland' });
}).then((result) => {
  console.log('STDOUT:\n' + result.stdout);
  if (result.stderr) console.log('STDERR:\n' + result.stderr);
  ssh.dispose();
}).catch((err) => {
  console.error('Error:', err);
  ssh.dispose();
});
