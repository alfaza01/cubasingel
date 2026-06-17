import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

export function SplashScreen() {
  const [dots, setDots] = useState('');

  // Subtle animated ellipsis for the checking process
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      id="splash-screen-container"
      className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden"
    >
      {/* Dynamic Keyframe Injection for the Modern Shimmer & Glow Effects */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulseGlow {
          0%, 100% { 
            filter: drop-shadow(0 0 12px rgba(99,102,241,0.3));
          }
          50% { 
            filter: drop-shadow(0 0 28px rgba(129,140,248,0.7)) drop-shadow(0 0 8px rgba(167,139,250,0.4));
          }
        }
        .glowing-shimmer-text {
          background: linear-gradient(
            to right, 
            #3b82f6 0%, 
            #818cf8 25%, 
            #ffffff 50%, 
            #818cf8 75%, 
            #3b82f6 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite, pulseGlow 3.5s ease-in-out infinite;
        }
      `}</style>

      {/* Futuristic Grid & Ambient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.12)_0%,transparent_65%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:30px_30px] opacity-30 pointer-events-none" />

      {/* Floating high-tech blurred light orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />

      <div className="flex flex-col items-center text-center z-10 px-6 max-w-sm w-full">
        
        {/* Animated Outer Glowing Frame (Without broken logo) */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 22, stiffness: 90 }}
          className="relative mb-8"
        >
          {/* Subtle modern vector halo/crest behind the name */}
          <div className="absolute -inset-8 bg-indigo-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '4s' }} />
          {/* Logo Icon */}
          <div className="relative w-28 h-28 mx-auto flex items-center justify-center rounded-3xl bg-white/10 border border-white/20 shadow-2xl shadow-indigo-500/20 backdrop-blur-sm overflow-hidden">
            <img
              src="/icons/icon-192x192.png"
              alt="Kasir Cuba Logo"
              className="w-full h-full object-contain p-2"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
        </motion.div>

        {/* Shiny & Glowing Store Title Section */}
        <motion.div
          initial={{ y: 25, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', damping: 20, stiffness: 100 }}
          className="space-y-3 mb-14"
        >
          <h1 className="glowing-shimmer-text font-black text-4xl sm:text-5xl tracking-widest uppercase py-1 leading-none select-none">
            {localStorage.getItem('store_name') || 'KASIR CUBA'}
          </h1>
          
          <div className="h-[2px] w-24 mx-auto bg-gradient-to-r from-transparent via-indigo-500/80 to-transparent rounded-full" />
          
          <p className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-[0.25em] select-none opacity-90">
            {localStorage.getItem('store_subname') || 'Aplikasi Kasir Toko'}
          </p>
        </motion.div>

        {/* Dynamic Loading Meter & Spinner */}
        <div className="flex flex-col items-center gap-3.5">
          {/* Customized high-tech smooth spinner */}
          <div className="relative w-8 h-8 flex items-center justify-center">
            {/* Background track */}
            <div className="absolute inset-0 rounded-full border-[2.5px] border-slate-900" />
            {/* Ambient shadow ring */}
            <div className="absolute inset-0 rounded-full border-[2.5px] border-indigo-500/10 blur-[1px]" />
            {/* Spinning indicator */}
            <div className="absolute inset-0 rounded-full border-[2.5px] border-transparent border-t-indigo-500 animate-spin" style={{ animationDuration: '0.8s' }} />
          </div>

          <span className="text-[11px] text-slate-400 font-medium tracking-wider">
            Menginisialisasi sistem{dots}
          </span>
        </div>
      </div>

      {/* Humble App Branding Footer */}
      <div className="absolute bottom-6 left-0 right-0 text-center text-[10px] text-slate-500/80 select-none tracking-widest uppercase font-bold">
        100% Aman &amp; Terlindungi Play Protect
      </div>
    </div>
  );
}
