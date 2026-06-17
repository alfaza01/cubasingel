import fs from 'fs';

let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

content = content.replace(
  "const parsedAdmin = admin ? Number(admin) : 0;",
  "const parsedAdmin = inputMode === 'MODAL_JUAL' ? Math.max(0, (Number(admin) || 0) - parsedNominal) : (Number(admin) || 0);"
);

fs.writeFileSync('src/pages/Dashboard.tsx', content);
console.log('Fixed handleAutoDescription admin parsing');
