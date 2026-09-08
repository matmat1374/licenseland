const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const config = {
  host: '109.122.254.151',
  port: 22,
  username: 'root',
  password: 'Licenseland@2026!'
};

const localPath = 'next-build.tar.gz';
const remotePath = '/var/www/licenseland/next-build.tar.gz';

const commands = [
  'cd /var/www/licenseland',
  'rm -rf .next',
  'tar -xzf next-build.tar.gz',
  'rm -f next-build.tar.gz',
  'pm2 delete licenseland 2>/dev/null || true',
  'pm2 start npm --name "licenseland" -- start',
  'pm2 save',
  'systemctl restart nginx',
  'sleep 3',
  'curl -I https://liceno.ir'
];

conn.on('ready', () => {
  console.log('Client :: ready');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    console.log('SFTP :: ready');
    sftp.fastPut(localPath, remotePath, (err) => {
      if (err) throw err;
      console.log('SFTP :: upload done');
      
      conn.exec(commands.join(' && '), (err, stream) => {
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
    });
  });
}).connect(config);
