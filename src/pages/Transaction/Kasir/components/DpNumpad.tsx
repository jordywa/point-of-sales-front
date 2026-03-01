// src/pages/Transaction/Kasir/components/DpNumpad.tsx

import React from 'react';

interface DpNumpadProps {
  isOpen: boolean;
  dpNumpadValue: string;
  subTotal: number;
  onAppendDigit: (digit: string) => void;
  onBackspace: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  formatRupiah: (num: number) => string;
}

export const DpNumpad: React.FC<DpNumpadProps> = ({
  isOpen,
  dpNumpadValue,
  subTotal,
  onAppendDigit,
  onBackspace,
  onConfirm,
  onCancel,
  formatRupiah,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-110 bg-white p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Input Down Payment (DP)</h3>
        <button onClick={onCancel} className="text-red-500 font-bold">Batal</button>
      </div>

      <div className="bg-gray-100 p-4 text-right text-3xl font-bold mb-4 rounded">
        {formatRupiah(parseInt(dpNumpadValue))}
      </div>

      <div className="mb-2 text-sm text-gray-600">
        Total Tagihan: {formatRupiah(subTotal)}
      </div>

      <div className="grid grid-cols-3 gap-3 flex-1">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
          <button
            key={d}
            onClick={() => onAppendDigit(d)}
            className="bg-white border border-gray-300 text-2xl font-bold rounded shadow-sm
                       hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            {d}
          </button>
        ))}
        <button
          onClick={onBackspace}
          className="bg-red-50 border border-red-200 text-2xl font-bold rounded
                     text-red-500 hover:bg-red-100 active:bg-red-200 transition-colors"
        >
          ⌫
        </button>
        <button
          onClick={() => onAppendDigit('0')}
          className="bg-white border border-gray-300 text-2xl font-bold rounded
                     hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          0
        </button>
        <button
          onClick={onConfirm}
          className="bg-green-500 text-white text-2xl font-bold rounded
                     hover:bg-green-600 active:bg-green-700 transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
};
