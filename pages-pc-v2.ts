import fs from 'fs';

let content: string;

// Kasbon.tsx
content = fs.readFileSync('src/pages/Kasbon.tsx', 'utf8');
content = content.replace(
  '<div className="px-4 mt-4 space-y-3.5">',
  '<div className="px-4 mt-4 space-y-3.5 [.pc-mode_&]:grid [.pc-mode_&]:grid-cols-1 [.pc-mode_&]:md:grid-cols-2 [.pc-mode_&]:lg:grid-cols-3 [.pc-mode_&]:gap-4 [.pc-mode_&]:space-y-0 [.pc-mode_&]:px-0">'
);
content = content.replace(
  '<div className="bg-slate-50 dark:bg-slate-900 min-h-screen pb-safe">',
  '<div className="bg-slate-50 dark:bg-slate-900 min-h-screen pb-safe [.pc-mode_&]:bg-transparent">'
);
fs.writeFileSync('src/pages/Kasbon.tsx', content);


// Contacts.tsx
content = fs.readFileSync('src/pages/Contacts.tsx', 'utf8');
content = content.replace(
  '<div className="px-4 pb-24 mt-4 space-y-3">',
  '<div className="px-4 pb-24 mt-4 space-y-3 [.pc-mode_&]:grid [.pc-mode_&]:grid-cols-1 [.pc-mode_&]:md:grid-cols-2 [.pc-mode_&]:lg:grid-cols-3 [.pc-mode_&]:gap-4 [.pc-mode_&]:space-y-0 [.pc-mode_&]:px-0">'
);
content = content.replace(
  '<div className="bg-slate-50 dark:bg-slate-900 min-h-screen">',
  '<div className="bg-slate-50 dark:bg-slate-900 min-h-screen [.pc-mode_&]:bg-transparent">'
);
fs.writeFileSync('src/pages/Contacts.tsx', content);


// Vouchers.tsx
content = fs.readFileSync('src/pages/Vouchers.tsx', 'utf8');
content = content.replace(
  '<div className="px-4 pb-24 mt-4 space-y-3">',
  '<div className="px-4 pb-24 mt-4 space-y-3 [.pc-mode_&]:grid [.pc-mode_&]:grid-cols-1 [.pc-mode_&]:md:grid-cols-2 [.pc-mode_&]:lg:grid-cols-3 [.pc-mode_&]:gap-4 [.pc-mode_&]:space-y-0 [.pc-mode_&]:px-0">'
);
content = content.replace(
  '<div className="bg-slate-50 dark:bg-slate-900 min-h-screen">',
  '<div className="bg-slate-50 dark:bg-slate-900 min-h-screen [.pc-mode_&]:bg-transparent">'
);
fs.writeFileSync('src/pages/Vouchers.tsx', content);


// Notes.tsx
content = fs.readFileSync('src/pages/Notes.tsx', 'utf8');
content = content.replace(
  '<div className="px-4 pb-24 mt-4 space-y-3">',
  '<div className="px-4 pb-24 mt-4 space-y-3 [.pc-mode_&]:grid [.pc-mode_&]:grid-cols-1 [.pc-mode_&]:md:grid-cols-2 [.pc-mode_&]:lg:grid-cols-3 [.pc-mode_&]:gap-4 [.pc-mode_&]:space-y-0 [.pc-mode_&]:px-0">'
);
content = content.replace(
  '<div className="bg-slate-50 dark:bg-slate-900 min-h-screen">',
  '<div className="bg-slate-50 dark:bg-slate-900 min-h-screen [.pc-mode_&]:bg-transparent">'
);
fs.writeFileSync('src/pages/Notes.tsx', content);

console.log('Fixed Kasbon, Contacts, Vouchers, Notes');
