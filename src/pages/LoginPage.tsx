import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Delete, Edit2, Check } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [storeName, setStoreName] = useState(() => localStorage.getItem('storeName') || 'TOKO PLASTIK JAYA');
  const [isEditing, setIsEditing] = useState(false);

  const CORRECT_PIN = "123456"; 

  useEffect(() => {
    if (localStorage.getItem('isLoggedIn') === 'true') {
      navigate('/kasir');
    }
  }, [navigate]);

  const handleNumClick = (num: string) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      setError('');
      if (newPin.length === 6) handleLogin(newPin);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const handleLogin = (inputPin: string) => {
    setLoading(true);
    setTimeout(() => {
      if (inputPin === CORRECT_PIN) {
        // --- SUKSES LOGIN ---
        localStorage.setItem('isLoggedIn', 'true');
        window.dispatchEvent(new Event('auth-change')); // <--- PENTING: Kabari App.tsx
        onLoginSuccess(); // Panggil prop
        navigate('/kasir');
      } else {
        setError('PIN Salah!');
        setPin('');
        setLoading(false);
      }
    }, 500);
  };

  const saveStoreName = () => {
    setIsEditing(false);
    localStorage.setItem('storeName', storeName);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8 w-full max-w-md">
        <div className="bg-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <Store className="text-white w-10 h-10" />
        </div>
        <div className="relative flex justify-center items-center h-12">
            {isEditing ? (
                <div className="flex gap-2">
                    <input className="border-2 border-blue-500 rounded px-2 py-1 text-xl font-bold text-center w-64 outline-none" value={storeName} onChange={(e) => setStoreName(e.target.value)} autoFocus />
                    <button onClick={saveStoreName} className="bg-green-500 text-white p-2 rounded"><Check size={20}/></button>
                </div>
            ) : (
                <div onClick={() => setIsEditing(true)} className="flex items-center gap-2 cursor-pointer hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors">
                    <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-wide">{storeName}</h1>
                    <Edit2 size={16} className="text-slate-400" />
                </div>
            )}
        </div>
        <p className="text-slate-500 text-sm mt-1">Masukkan PIN Kasir</p>
      </div>

      <div className="mb-10">
        <div className="flex gap-3 justify-center">
            {[...Array(6)].map((_, i) => (
                <div key={i} className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${i < pin.length ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-105' : 'bg-white border-slate-300'} ${error ? 'border-red-500 bg-red-50 shake' : ''}`}>
                    {i < pin.length && <div className="w-3 h-3 bg-white rounded-full" />}
                </div>
            ))}
        </div>
        {error && <p className="text-red-500 text-center mt-4 font-medium animate-pulse">{error}</p>}
        {loading && <p className="text-blue-600 text-center mt-4 font-medium">Memverifikasi...</p>}
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button key={num} onClick={() => handleNumClick(num.toString())} className="h-20 bg-white rounded-xl shadow-sm border border-slate-200 text-3xl font-bold text-slate-700 hover:bg-blue-50 active:bg-blue-100 active:scale-95 transition-all">{num}</button>
        ))}
        <button onClick={handleClear} className="h-20 bg-red-50 rounded-xl border border-red-100 text-red-600 font-bold hover:bg-red-100 active:scale-95 transition-all flex items-center justify-center">C</button>
        <button onClick={() => handleNumClick('0')} className="h-20 bg-white rounded-xl shadow-sm border border-slate-200 text-3xl font-bold text-slate-700 hover:bg-blue-50 active:scale-95 transition-all">0</button>
        <button onClick={handleBackspace} className="h-20 bg-slate-100 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center"><Delete size={32} /></button>
      </div>
      <div className="mt-8 text-slate-400 text-xs">Default PIN: <b>123456</b></div>
    </div>
  );
};

export default LoginPage;