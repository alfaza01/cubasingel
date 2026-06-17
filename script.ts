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

  // Backgrounds
  content = content.replace(/bg-white([^/A-Za-z0-9_-]|$)/g, 'bg-white dark:bg-slate-800$1');
  content = content.replace(/bg-slate-50([^/A-Za-z0-9_-]|$)/g, 'bg-slate-50 dark:bg-slate-900$1');
  content = content.replace(/bg-slate-100([^/A-Za-z0-9_-]|$)/g, 'bg-slate-100 dark:bg-slate-800$1');
  
  // Texts
  content = content.replace(/text-slate-800([^/A-Za-z0-9_-]|$)/g, 'text-slate-800 dark:text-slate-100$1');
  content = content.replace(/text-slate-900([^/A-Za-z0-9_-]|$)/g, 'text-slate-900 dark:text-slate-50$1');
  content = content.replace(/text-slate-700([^/A-Za-z0-9_-]|$)/g, 'text-slate-700 dark:text-slate-200$1');
  content = content.replace(/text-slate-600([^/A-Za-z0-9_-]|$)/g, 'text-slate-600 dark:text-slate-300$1');
  content = content.replace(/text-slate-500([^/A-Za-z0-9_-]|$)/g, 'text-slate-500 dark:text-slate-400$1');

  // Borders
  content = content.replace(/border-slate-100([^/A-Za-z0-9_-]|$)/g, 'border-slate-100 dark:border-slate-800$1');
  content = content.replace(/border-slate-200([^/A-Za-z0-9_-]|$)/g, 'border-slate-200 dark:border-slate-700$1');
  content = content.replace(/border-slate-300([^/A-Za-z0-9_-]|$)/g, 'border-slate-300 dark:border-slate-600$1');

  // Cleanup duplicates that might have happened
  content = content.replace(/dark:bg-slate-800 dark:bg-slate-800/g, 'dark:bg-slate-800');
  content = content.replace(/dark:bg-slate-900 dark:bg-slate-900/g, 'dark:bg-slate-900');
  content = content.replace(/dark:text-slate-100 dark:text-slate-100/g, 'dark:text-slate-100');
  content = content.replace(/dark:text-slate-50 dark:text-slate-50/g, 'dark:text-slate-50');
  content = content.replace(/dark:text-slate-200 dark:text-slate-200/g, 'dark:text-slate-200');
  content = content.replace(/dark:text-slate-300 dark:text-slate-300/g, 'dark:text-slate-300');
  content = content.replace(/dark:text-slate-400 dark:text-slate-400/g, 'dark:text-slate-400');
  content = content.replace(/dark:border-slate-800 dark:border-slate-800/g, 'dark:border-slate-800');
  content = content.replace(/dark:border-slate-700 dark:border-slate-700/g, 'dark:border-slate-700');
  content = content.replace(/dark:border-slate-600 dark:border-slate-600/g, 'dark:border-slate-600');

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
  }
});

console.log('DarkMode styling applied.');
