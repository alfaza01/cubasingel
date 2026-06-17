import React from 'react';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { loginWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-8 text-center border border-slate-100 dark:border-slate-800">
        <div className="w-24 h-24 mx-auto mb-6 bg-white rounded-3xl p-3 shadow-lg border border-slate-100 flex items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-blue-50/50 group-hover:bg-blue-100/50 transition-colors"></div>
          <img 
            src={localStorage.getItem('store_logo') || '/icons/icon-192x192.png'} 
            alt={localStorage.getItem('store_name') || 'Kasir Cuba'} 
            className="w-full h-full object-contain relative z-10 drop-shadow-sm rounded-xl"
            onError={(e) => {
              e.currentTarget.src = '/icons/icon-192x192.png';
            }}
          />
        </div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">{localStorage.getItem('store_name') || 'KASIR CUBA'}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 font-medium">{localStorage.getItem('store_subname') || 'Aplikasi Kasir Toko'}</p>
        
        <button 
          onClick={loginWithGoogle}
          className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-3"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo" className="w-5 h-5" />
          Login dengan Google
        </button>
        
        <p className="mt-6 text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
          Login digunakan untuk mensinkronisasi data toko Anda ke cloud, sehingga bisa diakses dari perangkat lain dengan akun yang sama.
        </p>
      </div>
    </div>
  );
}
