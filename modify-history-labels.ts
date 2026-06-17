import fs from 'fs';

let content = fs.readFileSync('src/pages/History.tsx', 'utf8');

// The original representation in Expanded details view (around line 725)
// It shows: {isMoneyIn ? '+' : '-'} Rp {tx.total.toLocaleString('id-ID')}
// and Adm : {tx.adminFee.toLocaleString('id-ID')}

content = content.replace(
  "Adm : {tx.adminFee.toLocaleString('id-ID')}",
  "Laba/Adm : {tx.adminFee.toLocaleString('id-ID')}"
);

content = content.replace(
  "Total: <span className=\\\"font-semibold text-slate-800 dark:text-slate-100\\\">Rp {tx.total.toLocaleString('id-ID')}</span>",
  "Total (Modal): <span className=\\\"font-semibold text-slate-800 dark:text-slate-100\\\">Rp {tx.total.toLocaleString('id-ID')}</span>"
);

content = content.replace(
  "Biaya Admin: <span className=\\\"font-semibold text-rose-500\\\">Rp {tx.adminFee.toLocaleString('id-ID')}</span>",
  "Laba/Adm: <span className=\\\"font-semibold text-blue-500\\\">Rp {tx.adminFee.toLocaleString('id-ID')}</span>"
);


fs.writeFileSync('src/pages/History.tsx', content);
console.log('Modified History.tsx labels successfully');
