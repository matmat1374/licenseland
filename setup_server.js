const { Client } = require('ssh2');

const conn = new Client();
const config = {
  host: '109.122.254.151',
  port: 22,
  username: 'root',
  password: 'Licenseland@2026!'
};

const nginxConfig = `server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name liceno.ir www.liceno.ir _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}`;

const commands = [
  `cat << 'EOF' > /etc/nginx/sites-available/default\n${nginxConfig}\nEOF`,
  `nginx -t`,
  `systemctl restart nginx`,
  `if grep -q "^NEXTAUTH_URL=" /var/www/licenseland/.env; then sed -i 's|^NEXTAUTH_URL=.*|NEXTAUTH_URL=http://liceno.ir|' /var/www/licenseland/.env; else echo "NEXTAUTH_URL=http://liceno.ir" >> /var/www/licenseland/.env; fi`,
  `cd /var/www/licenseland && pm2 restart licenseland || pm2 restart all`
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
    console.log(`Executing: ${cmd.split('\n')[0]}...`);
    
    conn.exec(cmd, (err, stream) => {
      if (err) throw err;
      stream.on('close', (code, signal) => {
        console.log(`Stream :: close :: code: ${code}`);
        if (code !== 0) {
            console.error('Command failed, stopping.');
            conn.end();
            process.exit(1);
        }
        currentCmd++;
        runNext();
      }).on('data', (data) => {
        process.stdout.write(data);
      }).stderr.on('data', (data) => {
        process.stderr.write(data);
      });
    });
  }
  
  runNext();
}).connect(config);
