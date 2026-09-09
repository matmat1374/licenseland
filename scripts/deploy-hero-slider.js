const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const config = {
  host: '109.122.254.151',
  port: 22,
  username: 'root',
  password: 'Licenseland@2026!',
  keepaliveInterval: 10000,
};

const filesToUpload = [
  'src/lib/content.ts',
  'src/components/site/hero-campaign-slider.tsx',
  'src/app/page.tsx',
  'src/components/admin/hero-slider-manager.tsx',
  'src/app/admin/content/page.tsx',
  'src/app/api/admin/content/route.ts',
];

const remoteBase = '/var/www/licenseland';

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH :: Ready to deploy Hero Campaign Slider...');

  conn.sftp((err, sftp) => {
    if (err) {
      console.error('SFTP error:', err);
      conn.end();
      process.exit(1);
    }

    let uploaded = 0;

    function uploadNext(index) {
      if (index >= filesToUpload.length) {
        console.log(`All ${uploaded} files uploaded successfully via SFTP!`);
        runBuildAndRestart();
        return;
      }

      const relPath = filesToUpload[index];
      const localFile = path.resolve(__dirname, '..', relPath);
      const remoteFile = `${remoteBase}/${relPath.replace(/\\/g, '/')}`;

      console.log(`Uploading [${index + 1}/${filesToUpload.length}]: ${relPath} -> ${remoteFile}`);

      // Ensure directory exists or upload directly
      sftp.fastPut(localFile, remoteFile, (uploadErr) => {
        if (uploadErr) {
          console.error(`Failed to upload ${relPath}:`, uploadErr);
          conn.end();
          process.exit(1);
        }
        uploaded++;
        uploadNext(index + 1);
      });
    }

    uploadNext(0);
  });
});

function runBuildAndRestart() {
  const remoteCommand = [
    'cd /var/www/licenseland',
    'export NODE_OPTIONS=--max-old-space-size=1536',
    'npm run build',
    'pm2 reload licenseland || pm2 restart all',
    'sleep 3',
    'curl -I -k https://liceno.ir',
  ].join(' && ');

  console.log('Executing build on server...');
  conn.exec(remoteCommand, { pty: true }, (err, stream) => {
    if (err) {
      console.error('Command execution failed:', err);
      conn.end();
      process.exit(1);
    }

    stream.on('close', (code, signal) => {
      console.log(`Build & restart finished with code: ${code}`);
      conn.end();
      if (code === 0) {
        console.log('DEPLOYMENT SUCCESSFUL!');
      } else {
        console.error('Deployment failed with exit code ' + code);
        process.exit(code || 1);
      }
    });

    stream.on('data', (data) => {
      process.stdout.write(data);
    });

    stream.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}

conn.on('error', (err) => {
  console.error('SSH connection error:', err);
  process.exit(1);
});

conn.connect(config);
