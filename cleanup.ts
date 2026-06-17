import fs from 'fs';
import path from 'path';

const walkSync = function(dir: string, filelist: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  files.forEach(function(file) {
    if (fs.statSync(dir + '/' + file).isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist') {
        filelist = walkSync(dir + '/' + file, filelist);
      }
    }
    else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        filelist.push(dir + '/' + file);
      }
    }
  });
  return filelist;
};

const allFiles = walkSync('./src');

allFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // clean duplicates
  content = content.replace(/dark:bg-slate-800 dark:bg-slate-800/g, 'dark:bg-slate-800');
  content = content.replace(/dark:bg-slate-900 dark:bg-slate-900/g, 'dark:bg-slate-900');
  content = content.replace(/dark:bg-slate-800 dark:bg-slate-900/g, 'dark:bg-slate-900');
  content = content.replace(/dark:text-slate-100 dark:text-slate-100/g, 'dark:text-slate-100');
  content = content.replace(/dark:text-slate-50 dark:text-slate-50/g, 'dark:text-slate-50');

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
  }
});
console.log('Cleanup done')
