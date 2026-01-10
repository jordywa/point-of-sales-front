// src/components/LoadingOverlay.tsx
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  show: boolean;
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ show, message = "Mohon tunggu..." }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/50 backdrop-blur-[2px] animate-in fade-in duration-300">
      <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          {/* Ring luar statis */}
          <div className="absolute h-12 w-12 rounded-full border-4 border-blue-50"></div>
          
          {/* Spinner utama */}
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 stroke-[1.5px]" />
        </div>
        
        {message && (
          <p className="mt-4 text-xs font-bold tracking-widest text-gray-500 uppercase animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingOverlay;