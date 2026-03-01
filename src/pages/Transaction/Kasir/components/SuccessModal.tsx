// src/pages/Transaction/Kasir/components/SuccessModal.tsx

import React from 'react';
import { Check, Mail, Printer } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  subTotal: number;
  paymentAmount: number;
  kembalian: number;
  isSaving?: boolean;
  onFinish: () => void;
  formatRupiah: (num: number) => string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  subTotal,
  paymentAmount,
  kembalian,
  isSaving = false,
  onFinish,
  formatRupiah,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-90 bg-black/50 backdrop-blur-sm flex items-center
                 justify-center animate-in fade-in duration-200 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onFinish();
      }}
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-[400px] p-6
                      relative flex flex-col items-center">
        {/* Icon */}
        <div className="bg-black text-white p-3 rounded-full mb-4">
          <Check className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-medium mb-6 text-black text-center">
          Pembayaran Berhasil
        </h2>

        {/* Rincian */}
        <div className="w-full space-y-3 mb-8">
          <div className="flex justify-between text-gray-700">
            <span>Total Tagihan</span>
            <span>{formatRupiah(subTotal)}</span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span>Tunai</span>
            <span>{formatRupiah(paymentAmount)}</span>
          </div>
          <div className="flex justify-between text-black font-bold text-lg">
            <span>Kembalian</span>
            <span>{formatRupiah(kembalian)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            onClick={() => alert('Fitur Email...')}
            className="flex items-center justify-center gap-2 bg-gray-200
                       hover:bg-gray-300 text-black py-2 rounded text-sm font-bold"
          >
            <Mail className="w-4 h-4" /> EMAIL
          </button>
          <button
            onClick={() => alert('Mencetak...')}
            className="flex items-center justify-center gap-2 bg-gray-200
                       hover:bg-gray-300 text-black py-2 rounded text-sm font-bold"
          >
            <Printer className="w-4 h-4" /> CETAK
          </button>
          <button
            onClick={onFinish}
            disabled={isSaving}
            className="col-span-2 bg-[#87C3FE] hover:bg-blue-400 text-black py-3
                       rounded text-sm font-bold mt-2 disabled:opacity-50
                       disabled:cursor-not-allowed"
          >
            {isSaving ? 'Memproses...' : 'SELESAI >'}
          </button>
        </div>
      </div>
    </div>
  );
};
