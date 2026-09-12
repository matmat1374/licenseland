fetch('https://liceno.ir/google838a39fcd6d96c2f.html').then(async r => {
  console.log('Status:', r.status);
  console.log('Content:', await r.text());
});
