import fs from 'fs';

let content = fs.readFileSync('src/pages/History.tsx', 'utf8');

content = content.replace(
  "OPERASIONAL ADMIN FEE",
  "LABA / ADMIN FEE"
);

fs.writeFileSync('src/pages/History.tsx', content);
console.log('Modified History labels details');
