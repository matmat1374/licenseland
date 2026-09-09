const { Client } = require('ssh2');

const config = {
  host: '109.122.254.151',
  port: 22,
  username: 'root',
  password: 'Licenseland@2026!',
};

const conn = new Client();
conn.on('ready', () => {
  console.log('Testing live site from server...');
  conn.exec(
    'curl -s -k https://liceno.ir > /tmp/liceno.html && ' +
    'node -e "const fs = require(\'fs\'); const html = fs.readFileSync(\'/tmp/liceno.html\', \'utf8\'); ' +
    'console.log(\'Home HTML Length:\', html.length); ' +
    'console.log(\'Has Hero Campaign:\', html.includes(\'Claude Pro\') || html.includes(\'ChatGPT Plus\')); ' +
    'console.log(\'Has ItemList Schema:\', html.includes(\'ItemList\'));" && ' +
    'curl -s -k -I https://liceno.ir/admin/content | head -n 5',
    (err, stream) => {
      if (err) throw err;
      stream.on('data', (d) => process.stdout.write(d));
      stream.on('close', () => {
        conn.end();
      });
    }
  );
});

conn.connect(config);
