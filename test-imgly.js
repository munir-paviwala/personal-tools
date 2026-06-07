const fs = require('fs');
fetch('https://unpkg.com/@imgly/background-removal@1.4.5/dist/index.mjs')
  .then(res => res.text())
  .then(text => console.log(text.substring(0, 300)));
