import fs from 'fs';
import path from 'path';

const filesToUpdate = [
  'src/pages/Inventory.tsx',
  'src/pages/Contacts.tsx',
  'src/pages/Kasbon.tsx',
  'src/pages/Notes.tsx',
  'src/pages/Vouchers.tsx',
  'src/pages/History.tsx'
];

filesToUpdate.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // Make space-y-x containers switch to multi-col grids in PC mode
    // We will find common patterns like `className="space-y-4..."` 
    // and append `[.pc-mode_&]:grid [.pc-mode_&]:grid-cols-2 [.pc-mode_&]:lg:grid-cols-3 [.pc-mode_&]:gap-4 [.pc-mode_&]:space-y-0`

    const listContainers = [
      'className="space-y-3 pb-6"',
      'className="space-y-3"',
      'className="space-y-4 pb-10"',
      'className="space-y-4"'
    ];

    listContainers.forEach(container => {
      if (content.includes(container)) {
        content = content.replace(
          container,
          container.replace(/"$/, ' [.pc-mode_&]:grid [.pc-mode_&]:md:grid-cols-2 [.pc-mode_&]:lg:grid-cols-3 [.pc-mode_&]:gap-4 [.pc-mode_&]:space-y-0"')
        );
      }
    });

    // Make header padding bigger in PC mode
    content = content.replace(
      'className="p-4 bg-slate-50 dark:bg-slate-900 min-h-full"',
      'className="p-4 bg-slate-50 dark:bg-slate-900 min-h-full [.pc-mode_&]:bg-transparent [.pc-mode_&]:py-6"'
    );
     content = content.replace(
      'className="bg-slate-50 dark:bg-slate-900 min-h-full pb-20"',
      'className="bg-slate-50 dark:bg-slate-900 min-h-full pb-20 [.pc-mode_&]:pb-6 [.pc-mode_&]:bg-transparent"'
    );

    fs.writeFileSync(file, content);
  }
});
console.log('Pages updated for PC layout grids.');
