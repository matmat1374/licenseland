require('./scripts/deploy-env.cjs');
﻿const { Client } = require('ssh2');
const conn = new Client();
const config = { host: '109.122.254.151', port: 22, username: 'root', password: process.env.DEPLOY_PASS };
conn.on('ready', () => {
  conn.exec("top -b -n 1 | head -n 20", (err, stream) => {
    stream.on('data', data => process.stdout.write(data)).on('close', () => conn.end());
  });
}).connect(config);
