const fs = require('fs');

const css = fs.readFileSync('backend/src/modules/proposal/dashboard.css', 'utf-8');
console.log(css.substring(0, 50));
