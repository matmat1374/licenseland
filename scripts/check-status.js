const http = require('http');

setTimeout(() => {
  console.log("Checking server status...");
  http.get('http://localhost:3000', (res) => {
    console.log(`Server status code: ${res.statusCode}`);
    if (res.statusCode === 200) {
      console.log("Server is UP and returning 200 OK");
      process.exit(0);
    } else {
      console.log("Server returned non-200");
      process.exit(1);
    }
  }).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
    process.exit(1);
  });
}, 2000);
