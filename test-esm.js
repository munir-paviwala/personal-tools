const fs = require('fs');
fetch('https://esm.sh/@imgly/background-removal@1.4.5')
  .then(res => res.text())
  .then(text => console.log(text.substring(0, 300)));
