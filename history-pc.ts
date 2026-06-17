import fs from 'fs';

const file = 'src/pages/History.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the main transaction list container
content = content.replace(
  '<div className="space-y-2">',
  '<div className="space-y-2 [.pc-mode_&]:grid [.pc-mode_&]:grid-cols-1 [.pc-mode_&]:lg:grid-cols-2 [.pc-mode_&]:xl:grid-cols-3 [.pc-mode_&]:gap-4 [.pc-mode_&]:space-y-0">'
);
content = content.replace(
  '<div className="space-y-4">',
  '<div className="space-y-4 [.pc-mode_&]:grid [.pc-mode_&]:grid-cols-1 [.pc-mode_&]:lg:grid-cols-2 [.pc-mode_&]:xl:grid-cols-3 [.pc-mode_&]:gap-4 [.pc-mode_&]:space-y-0">'
);

// PC mode wide paddings
content = content.replace(
  'className="pt-12 px-4 pb-[8.5rem] bg-slate-50 dark:bg-slate-900 min-h-screen relative"',
  'className="pt-12 px-4 pb-[8.5rem] bg-slate-50 dark:bg-slate-900 min-h-screen relative [.pc-mode_&]:bg-transparent [.pc-mode_&]:pb-10 [.pc-mode_&]:px-0"'
);

fs.writeFileSync(file, content);
console.log('History updated for PC layout grids.');
