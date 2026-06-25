import React from 'react';
import { Outlet } from 'react-router';
import { BottomNav } from './BottomNav';
import { SidebarNav } from './SidebarNav';
import { useStore } from '../context/StoreContext';
import { UpdatePrompt } from './UpdatePrompt';

export function Layout() {
  const { uiLayout } = useStore();

  if (uiLayout === 'pc') {
    return (
      <div className="pc-mode flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300 w-full overflow-hidden">
        <SidebarNav />
        <main className="flex-1 overflow-y-auto w-full relative">
          <div className="max-w-7xl mx-auto w-full p-6">
            <Outlet />
          </div>
        </main>
        <UpdatePrompt />
      </div>
    );
  }

  // Determine adaptive width constraints based on layout preference
  let containerClass = "flex flex-col w-full bg-white dark:bg-slate-900 font-sans relative shadow-2xl overflow-hidden h-full transition-colors duration-300 print:max-w-none print:shadow-none print:h-auto print:overflow-visible ";
  
  if (uiLayout === 'tablet') {
    // Tablet Mode: Much wider on portrait, extremely wide on landscape
    containerClass += "sm:max-w-2xl md:max-w-3xl lg:max-w-4xl landscape:max-w-5xl";
  } else {
    // HP Mode: Standard phone width strictly maintained
    containerClass += "sm:max-w-md";
  }

  return (
    <div className="fixed inset-0 flex justify-center bg-slate-100 dark:bg-slate-950 transition-colors duration-300 print:relative print:inset-auto print:bg-white text-slate-800 dark:text-slate-100">
      <div className={containerClass}>
        <main className="flex-1 overflow-y-auto w-full print:pb-0 print:overflow-visible">
          <Outlet />
        </main>

        <div className="print:hidden w-full shrink-0">
          <BottomNav />
        </div>
      </div>
      <UpdatePrompt />
    </div>
  );
}
