const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec(`cat << 'EOF' > /var/www/licenseland/public/google838a39fcd6d96c2f.html
google-site-verification: google838a39fcd6d96c2f.html
EOF
chmod 644 /var/www/licenseland/public/google838a39fcd6d96c2f.html

if ! grep -q "google838a39fcd6d96c2f.html" /etc/nginx/sites-available/default; then
  sed -i '/location \\/ {/i \\    location = /google838a39fcd6d96c2f.html {\\n        alias /var/www/licenseland/public/google838a39fcd6d96c2f.html;\\n    }\\n' /etc/nginx/sites-available/default
fi
nginx -t && systemctl reload nginx
curl -s https://liceno.ir/google838a39fcd6d96c2f.html
`, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).connect({
  host: '109.122.254.151',
  port: 22,
  username: 'root',
  password: 'Licenseland@2026!'
});
