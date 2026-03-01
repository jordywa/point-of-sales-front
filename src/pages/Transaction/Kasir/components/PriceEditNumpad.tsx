// src/pages/Transaction/Kasir/components/PriceEditNumpad.tsx

import React from 'react';

interface PriceEditNumpadProps {
  isOpen: boolean;
  currentValue: string;
  onAppendDigit: (digit: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  formatRupiah: (num: number) => string;
}

export const PriceEditNumpad: React.FC<PriceEditNumpadProps> = ({
  isOpen,
  currentValue,
  onAppendDigit,
  onBackspace,
  onClear,
  onConfirm,
  onCancel,
  formatRupiah,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onCancel} />
      <div className="relative bg-white rounded-lg shadow-lg w-80 p-4 z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">Edit Harga Satuan</h3>
          <button onClick={onCancel} className="text-gray-600">Batal</button>
        </div>

        {/* Display */}
        <div className="mb-3">
          <div className="text-sm text-gray-500">Harga sekarang</div>
          <div className="text-2xl font-bold">
            {formatRupiah(Number(currentValue || 0))}
          </div>
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
            <button
              key={d}
              onClick={() => onAppendDigit(d)}
              className="bg-gray-100 py-3 rounded text-lg hover:bg-gray-200
                         active:bg-gray-300 transition-colors"
            >
              {d}
            </button>
          ))}
          <button
            onClick={onBackspace}
            className="bg-gray-100 py-3 rounded text-lg hover:bg-gray-200
                       active:bg-gray-300 transition-colors"
          >
            ⌫
          </button>
          <button
            onClick={() => onAppendDigit('0')}
            className="bg-gray-100 py-3 rounded text-lg hover:bg-gray-200
                       active:bg-gray-300 transition-colors"
          >
            0
          </button>
          <button
            onClick={onClear}
            className="bg-gray-100 py-3 rounded text-lg hover:bg-gray-200
                       active:bg-gray-300 transition-colors"
          >
            C
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded bg-gray-200 hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded bg-green-600 text-white font-bold
                       hover:bg-green-700 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
