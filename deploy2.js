const { Client } = require('ssh2');
const conn = new Client();
const config = { host: '109.122.254.151', port: 22, username: 'root', password: 'Licenseland@2026!', keepaliveInterval: 10000 };

const commands = [
  "cd /var/www/licenseland && git reset --hard && git pull origin main",
  "cd /var/www/licenseland && node setup-admin.js",
  "cd /var/www/licenseland && node remove-vpn.js",
  "cd /var/www/licenseland && if grep -q '^MELIPAYAMAK_API_KEY=' .env; then sed -i 's|^MELIPAYAMAK_API_KEY=.*|MELIPAYAMAK_API_KEY=38229d9d-6c72-40c6-8d87-2e95dc39cdf1|' .env; else echo 'MELIPAYAMAK_API_KEY=38229d9d-6c72-40c6-8d87-2e95dc39cdf1' >> .env; fi",
  "cd /var/www/licenseland && npm run build",
  "cd /var/www/licenseland && pm2 reload licenseland || pm2 restart all"
];

conn.on('ready', () => {
  console.log('SSH Client :: ready');
  let currentCmd = 0;
  function runNext() {
    if (currentCmd >= commands.length) {
      console.log('All commands executed successfully.');
      conn.end();
      return;
    }
    const cmd = commands[currentCmd];
    console.log('Executing:', cmd);
    conn.exec(cmd, { pty: true }, (err, stream) => {
      if (err) throw err;
      stream.on('close', (code, signal) => {
        console.log('Completed with code ' + code);
        currentCmd++;
        runNext();
      }).on('data', (data) => process.stdout.write(data)).stderr.on('data', (data) => process.stderr.write(data));
    });
  }
  runNext();
}).connect(config);
