// src/pages/Transaction/Pembelian/components/POModal.tsx

import React from "react";
import { Calendar, Calculator } from "lucide-react";

interface POModalProps {
  isOpen: boolean;
  jatuhTempoDate: string;
  onJatuhTempoDateChange: (date: string) => void;
  dpAmount: number;
  subTotal: number;
  onOpenDpNumpad: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  formatRupiah: (num: number) => string;
}

export const POModal: React.FC<POModalProps> = ({
  isOpen,
  jatuhTempoDate,
  onJatuhTempoDateChange,
  dpAmount,
  subTotal,
  onOpenDpNumpad,
  onConfirm,
  onCancel,
  formatRupiah,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 bg-black/50 backdrop-blur-sm flex items-center justify-center animate-in fade-in zoom-in duration-200 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[400px] p-6 border border-gray-200">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
            <Calendar className="w-6 h-6 text-yellow-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">Set Jatuh Tempo</h3>
          <p className="text-sm text-gray-500 mt-1">
            Masukkan tanggal batas pembayaran untuk faktur kredit ini.
          </p>
        </div>

        {/* Jatuh Tempo Input */}
        <div className="mb-4">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Tanggal Jatuh Tempo
          </label>
          <input
            type="date"
            value={jatuhTempoDate}
            onChange={(e) => onJatuhTempoDateChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>

        {/* DP Input */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Down Payment (DP) - Opsional
          </label>
          <button
            onClick={onOpenDpNumpad}
            className={`w-full border border-gray-400 rounded-lg px-4 py-3 font-bold text-gray-800 focus:outline-none focus:border-blue-500 flex items-center justify-center gap-2 ${
              dpAmount > 0
                ? "bg-blue-50 border-blue-500"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            {dpAmount > 0 ? (
              formatRupiah(dpAmount)
            ) : (
              <>
                <Calculator className="w-5 h-5" /> Input DP (Opsional)
              </>
            )}
          </button>
          {dpAmount > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              Total: {formatRupiah(subTotal)} | DP: {formatRupiah(dpAmount)} |
              Sisa: {formatRupiah(subTotal - dpAmount)}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="py-3 rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
};