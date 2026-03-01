// src/pages/Transaction/Kasir/components/ProductList.tsx

import React from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import type { ProductDisplay } from '../../../../utils/salesHelpers';

interface ListSelection {
  variant: string;
  unit: string;
  qty: number;
  note: string;
}

interface ProductListProps {
  currentProducts: ProductDisplay[];
  isLoading: boolean;
  listSelections: Record<string, ListSelection>;
  onUpdateSelection: (productId: string, field: string, value: any) => void;
  onAddToCart: (product: ProductDisplay) => void;
  formatRupiah: (num: number) => string;
}

export const ProductList: React.FC<ProductListProps> = ({
  currentProducts,
  isLoading,
  listSelections,
  onUpdateSelection,
  onAddToCart,
  formatRupiah,
}) => {
  const getSelection = (productId: string): ListSelection => {
    return listSelections[productId] || { variant: '', unit: '', qty: 1, note: '' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
      {/* Header Tabel */}
      <div className="grid grid-cols-12 bg-gray-100 border-b border-gray-200 py-3 px-2
                      font-bold text-gray-700 text-xs uppercase tracking-wider text-center">
        <div className="col-span-5 lg:col-span-3 text-left pl-2">Nama Produk</div>
        <div className="col-span-1 hidden lg:block">Unit</div>
        <div className="col-span-2 lg:col-span-2 text-right pr-2 hidden lg:block">Harga</div>
        <div className="col-span-3 hidden lg:block text-left pl-2">Keterangan</div>
        <div className="col-span-4 lg:col-span-1">Aksi</div>
      </div>

      {/* Rows */}
      {currentProducts.map((product) => {
        const selection = getSelection(product.id);
        const currentUnitName = selection.unit || product.availableUnits[0].name;
        const currentNote = selection.note || '';
        const unitObj = product.availableUnits.find(u => u.name === currentUnitName) || product.availableUnits[0];
        const displayPrice = product.basePrice * unitObj.priceMultiplier;

        return (
          <div
            key={product.id}
            className="grid grid-cols-12 border-b border-gray-100 py-2 px-2
                       items-center hover:bg-blue-50/50 transition-colors text-sm"
          >
            {/* Nama Produk */}
            <div className="col-span-5 lg:col-span-3 pr-2 flex flex-col justify-center">
              <span className="font-medium text-gray-800 leading-tight whitespace-normal wrap-break-word">
                {product.name}
              </span>
              <span className="lg:hidden text-xs text-green-600 font-bold">
                {formatRupiah(displayPrice)}
              </span>
            </div>

            {/* Unit Selector */}
            <div className="col-span-1 pr-1 hidden lg:block">
              <div className="relative">
                <select
                  className="w-full appearance-none border border-gray-300 rounded-md py-1
                             pl-1 pr-5 text-xs bg-white focus:outline-none focus:border-blue-500
                             cursor-pointer text-center font-bold"
                  value={currentUnitName}
                  onChange={(e) => onUpdateSelection(product.id, 'unit', e.target.value)}
                >
                  {product.availableUnits.map(u => (
                    <option key={u.name} value={u.name}>{u.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-0.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Harga */}
            <div className="col-span-2 text-right pr-2 font-medium text-gray-700 hidden lg:block">
              {formatRupiah(displayPrice)}
            </div>

            {/* Keterangan */}
            <div className="col-span-3 pr-1 hidden lg:block">
              <input
                type="text"
                placeholder="Ket..."
                className="w-full border border-gray-300 rounded-md py-1 px-2 text-xs
                           focus:outline-none focus:border-blue-500 bg-gray-50
                           focus:bg-white transition-colors"
                value={currentNote}
                onChange={(e) => onUpdateSelection(product.id, 'note', e.target.value)}
              />
            </div>

            {/* Aksi */}
            <div className="col-span-4 lg:col-span-1 flex items-center justify-center">
              <button
                className="w-8 h-8 bg-[#3FA2F6] text-white rounded-full flex items-center
                           justify-center shadow-sm hover:bg-blue-600 hover:scale-110 transition-all"
                onClick={() => onAddToCart(product)}
                title="Tambah"
              >
                <Plus className="w-5 h-5 font-bold" strokeWidth={3} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
