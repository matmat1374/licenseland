const http = require('http'); 
const fs = require('fs');
http.get('http://localhost:3000/product/3656-chatgpt-plus-1-month-full-warranty', res => { 
  let data = ''; 
  res.on('data', c => data += c); 
  res.on('end', () => { 
    fs.writeFileSync('out.html', data);
    console.log('Saved to out.html');
  }); 
});
