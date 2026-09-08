const { Client } = require('ssh2');
const conn = new Client();
const config = { host: '109.122.254.151', port: 22, username: 'root', password: 'Licenseland@2026!', keepaliveInterval: 10000 };

const commands = [
  "if [ ! -f /swapfile ]; then dd if=/dev/zero of=/swapfile bs=1M count=2048 && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile; fi",
  "cd /var/www/licenseland && NODE_OPTIONS='--max-old-space-size=2048' npm run build",
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
