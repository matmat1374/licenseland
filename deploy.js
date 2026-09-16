require('./scripts/deploy-env.cjs');
const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const config = {
  host: '109.122.254.151',
  port: 22,
  username: 'root',
  password: process.env.DEPLOY_PASS
};

const files = [
  'src/lib/constants.ts',
  'src/components/site/unified-trust-section.tsx',
  'src/app/contact/page.tsx'
];

conn.on('ready', () => {
  console.log('Client :: ready');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    let index = 0;
    
    function uploadNext() {
      if (index >= files.length) {
        console.log('All files uploaded. Running build command...');
        conn.exec('cd /var/www/licenseland && NODE_OPTIONS=--max-old-space-size=1536 npm run build && pm2 reload licenseland', (err, stream) => {
          if (err) throw err;
          stream.on('close', (code, signal) => {
            console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
            conn.end();
          }).on('data', (data) => {
            console.log('STDOUT: ' + data);
          }).stderr.on('data', (data) => {
            console.error('STDERR: ' + data);
          });
        });
        return;
      }
      
      const file = files[index];
      console.log('Uploading: ' + file);
      const localFile = __dirname + '/' + file;
      const remoteFile = '/var/www/licenseland/' + file;
      
      sftp.fastPut(localFile, remoteFile, (err) => {
        if (err) throw err;
        console.log('Uploaded: ' + file);
        index++;
        uploadNext();
      });
    }
    
    uploadNext();
  });
}).connect(config);
