// src/components/ConfirmationDialog.tsx
import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title = "Konfirmasi",
  message = "Apakah Anda yakin ingin melanjutkan?",
  confirmText = "Ya, Simpan",
  cancelText = "Batal",
  type = 'warning'
}) => {
  // Sound effect logic
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Play sound when dialog opens
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log("Autoplay blocked or audio error", e));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-full ${type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
              <AlertTriangle className="w-8 h-8" />
            </div>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-800 mb-2">{title}</h3>
          <p className="text-gray-600 leading-relaxed">{message}</p>
        </div>
        
        <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 px-6 py-3 rounded-full border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-all"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 px-6 py-3 rounded-full bg-[#BEDFFF] hover:bg-[#A5CEF2] text-black font-bold shadow-md transition-all active:scale-95"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;