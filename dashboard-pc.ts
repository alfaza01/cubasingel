import fs from 'fs';

let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// 1. Root container
content = content.replace(
  '<div className="bg-slate-50 dark:bg-slate-900 min-h-full pb-20 transition-colors duration-300">',
  '<div className="bg-slate-50 dark:bg-slate-900 min-h-full pb-20 transition-colors duration-300 [.pc-mode_&]:pb-6 [.pc-mode_&]:bg-transparent">'
);

// 2. Header
content = content.replace(
  '<div className="bg-[#1e3a8a] text-white pt-10 pb-[4.5rem] px-4 rounded-b-[2.5rem] relative">',
  '<div className="bg-[#1e3a8a] text-white pt-10 pb-[4.5rem] px-4 rounded-b-[2.5rem] relative [.pc-mode_&]:rounded-2xl [.pc-mode_&]:pb-8 [.pc-mode_&]:pt-6">'
);

// Hide More menu button in PC (since we have Sidebar and account settings)
content = content.replace(
  '<button onClick={() => setShowSidePanel(true)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors mb-1 cursor-pointer">',
  '<button onClick={() => setShowSidePanel(true)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors mb-1 cursor-pointer [.pc-mode_&]:hidden">'
);

// 3. Balance Card overlaps
content = content.replace(
  '<div className="px-4 -mt-12 relative z-10">',
  '<div className="px-4 -mt-12 relative z-10 [.pc-mode_&]:mt-[-2rem] [.pc-mode_&]:px-0">'
);
content = content.replace(
  '<div className="bg-white dark:bg-slate-800 rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 dark:border-slate-800">',
  '<div className="bg-white dark:bg-slate-800 rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 dark:border-slate-800 [.pc-mode_&]:rounded-2xl">'
);

// Split the rest into a grid for PC layout. We will wrap the running marquee and form inside a col-span-8, and the history / other things in col-span-4.
// But doing it via pure regex replace without breaking the tree could be risky.
// Let's rely on finding specific comments.
content = content.replace(
  '<div className="px-5 mt-4 space-y-2">',
  '<div className="px-5 mt-4 space-y-2 [.pc-mode_&]:px-0">'
);
// Teks Promo
content = content.replace(
  '<div className="w-full h-9 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-inner flex items-center overflow-hidden px-4 relative">',
  '<div className="w-full h-9 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-inner flex items-center overflow-hidden px-4 relative [.pc-mode_&]:rounded-xl">'
);

// Main Layout wrap
content = content.replace(
  '{/* MENU ICON GRID */}',
  '<div className="[.pc-mode_&]:grid [.pc-mode_&]:grid-cols-12 [.pc-mode_&]:gap-6 [.pc-mode_&]:mt-6">\n<div className="[.pc-mode_&]:col-span-7 flex flex-col">\n{/* MENU ICON GRID */}'
);

// Find the Quick History section and inject the split
content = content.replace(
  '{/* QUICK HISTORY (Latest 3) */}',
  '</div>\n<div className="[.pc-mode_&]:col-span-5 flex flex-col gap-6">\n{/* QUICK HISTORY (Latest 3) */}'
);

// Close the PC split before the Bottom Modals
content = content.replace(
  '{/* MODAL: DETAIL LABA */}',
  '</div>\n</div>\n{/* MODAL: DETAIL LABA */}'
);

// Styling the forms
content = content.replace(
  '<div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 relative">',
  '<div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 relative [.pc-mode_&]:rounded-2xl">'
);

fs.writeFileSync('src/pages/Dashboard.tsx', content);
console.log('Dashboard updated for PC mode.');
