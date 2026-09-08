const { Client } = require('ssh2');

const conn = new Client();
const config = {
  host: '109.122.254.151',
  port: 22,
  username: 'root',
  password: 'Licenseland@2026!'
};

const commands = [
  'pm2 stop licenseland || true',
  'pkill -9 -f "next build" || true',
  'pkill -9 -f "processChild" || true'
];

conn.on('ready', () => {
  console.log('Client :: ready');
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
}).connect(config);
