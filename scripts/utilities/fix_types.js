const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'frontend/src/pages/resource-center');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(/const formatMonth = \(m: number\) =>/g, 'const formatMonth = (m: any) =>');
  content = content.replace(/const formatNum = \(v: number \| null\) =>/g, 'const formatNum = (v: any) =>');
  content = content.replace(/const formatNum = \(v: number \| string \| null\) =>/g, 'const formatNum = (v: any) =>');

  fs.writeFileSync(filePath, content, 'utf8');
}

console.log("Types fixed.");
