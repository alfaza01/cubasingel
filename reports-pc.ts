import fs from 'fs';

let content = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

// The main layout wrapper for Reports is <div className="bg-slate-50 min-h-screen pb-[8.5rem] relative dark:bg-slate-900">
// We split the children.
content = content.replace(
  '<div className="bg-slate-50 dark:bg-slate-900 min-h-screen pb-[8.5rem] relative">',
  '<div className="bg-slate-50 dark:bg-slate-900 min-h-screen pb-[8.5rem] relative [.pc-mode_&]:bg-transparent [.pc-mode_&]:pb-10">'
);
content = content.replace(
  '{/* HEADER STYLED ALONE */}',
  '<div className="[.pc-mode_&]:grid [.pc-mode_&]:grid-cols-12 [.pc-mode_&]:gap-6 [.pc-mode_&]:mt-6">\n<div className="[.pc-mode_&]:col-span-8 flex flex-col gap-4">\n{/* HEADER STYLED ALONE */}'
);

content = content.replace(
  '{/* LABA VS TRANSAKSI (COMBO CHART) */}',
  '</div>\n<div className="[.pc-mode_&]:col-span-4 flex flex-col gap-4">\n{/* LABA VS TRANSAKSI (COMBO CHART) */}'
);

content = content.replace(
  '{/* KOMPOSISI SUMBER LABA */}',
  '{/* KOMPOSISI SUMBER LABA */}'
);

// We want to add a closing div after everything before the <button onClick={() => navigate('/full-report')}> at the bottom.
content = content.replace(
  '<div className="px-4 mt-6">',
  '</div>\n</div>\n<div className="px-4 mt-6">'
);

fs.writeFileSync('src/pages/Reports.tsx', content);
console.log('Fixed Reports PC Mode structure');
