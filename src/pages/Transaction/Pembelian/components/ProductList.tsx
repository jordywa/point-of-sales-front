// src/pages/Transaction/Pembelian/components/ProductList.tsx

import React from "react";
import { Plus, ChevronDown, Loader2 } from "lucide-react";
import type { ListSelection } from "../../../../types/pembelian.types";
import {
  getAvailableUnits,
  getPurchasePrice,
  getFirstVariant,
} from "../../../../utils/productHelpers";
import type { Product } from "../../../../types/product.types";

interface ProductListProps {
  products: Product[];
  isLoading: boolean;
  listSelections: Record<string, ListSelection>;
  onUpdateSelection: (
    productId: string,
    field: keyof ListSelection,
    value: any
  ) => void;
  onAddToCart: (product: Product) => void;
  formatRupiah: (num: number) => string;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  isLoading,
  listSelections,
  onUpdateSelection,
  onAddToCart,
  formatRupiah,
}) => {
  const getSelection = (productId: string): ListSelection => {
    return listSelections[productId] || {
      variant: "",
      unit: "",
      qty: 1,
      note: "",
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-12 bg-gray-100 border-b border-gray-200 py-3 px-2 
                      font-bold text-gray-700 text-xs uppercase tracking-wider text-center">
        <div className="col-span-5 lg:col-span-3 text-left pl-2">
          Nama Produk
        </div>
        {/* <div className="col-span-3 lg:col-span-2 text-left">Varian</div> */}
        <div className="col-span-1 hidden lg:block">Unit</div>
        <div className="col-span-2 lg:col-span-2 text-right pr-2 hidden lg:block">
          Harga Beli
        </div>
        <div className="col-span-3 hidden lg:block text-left pl-2">
          Keterangan
        </div>
        <div className="col-span-4 lg:col-span-1">Aksi</div>
      </div>

      {/* Rows */}
      {products.map((product) => {
        if (product.variants.length === 0) return null;

        const selection = getSelection(product.id);
        const selectedVariantName =
          selection.variant || getFirstVariant(product.variants)?.name || "";
        const selectedVariant =
          product.variants.find((v) => v.name === selectedVariantName) ||
          product.variants[0];
        const availableUnits = getAvailableUnits(selectedVariant);
        const currentUnitName =
          selection.unit || (availableUnits.length > 0 ? availableUnits[0] : "");
        const currentNote = selection.note || "";
        const displayPrice = getPurchasePrice(selectedVariant, currentUnitName);

        return (
          <div
            key={product.id}
            className="grid grid-cols-12 border-b border-gray-100 py-2 px-2 
                       items-center hover:bg-blue-50/50 transition-colors text-sm"
          >
            {/* Product Name */}
            <div className="col-span-5 lg:col-span-3 pr-2 flex flex-col justify-center">
              <span className="font-medium text-gray-800 leading-tight 
                               whitespace-normal wrap-break-words">
                {product.name}
              </span>
              <span className="lg:hidden text-xs text-green-600 font-bold">
                {formatRupiah(displayPrice)}
              </span>
            </div>

            {/* Variant Selector */}
            {/* <div className="col-span-3 lg:col-span-2 pr-1">
              <div className="relative">
                <select
                  className="w-full appearance-none border border-gray-300 
                             rounded-md py-1 pl-2 pr-6 text-xs bg-white 
                             focus:outline-none focus:border-blue-500 cursor-pointer"
                  value={selectedVariantName}
                  onChange={(e) => {
                    onUpdateSelection(product.id, "variant", e.target.value);
                    const newVariant = product.variants.find(
                      (v) => v.name === e.target.value
                    );
                    if (newVariant) {
                      const newUnits = getAvailableUnits(newVariant);
                      if (newUnits.length > 0) {
                        onUpdateSelection(product.id, "unit", newUnits[0]);
                      }
                    }
                  }}
                >
                  {product.variants.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 
                                       w-3 h-3 text-gray-400 pointer-events-none" />
              </div>
            </div> */}

            {/* Unit Selector */}
            <div className="col-span-1 pr-1 hidden lg:block">
              <div className="relative">
                <select
                  className="w-full appearance-none border border-gray-300 
                             rounded-md py-1 pl-1 pr-5 text-xs bg-white 
                             focus:outline-none focus:border-blue-500 cursor-pointer 
                             text-center font-bold"
                  value={currentUnitName}
                  onChange={(e) =>
                    onUpdateSelection(product.id, "unit", e.target.value)
                  }
                >
                  {availableUnits.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-0.5 top-1/2 -translate-y-1/2 
                                       w-3 h-3 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Price */}
            <div className="col-span-2 text-right pr-2 font-medium 
                            text-gray-700 hidden lg:block">
              {formatRupiah(displayPrice)}
            </div>

            {/* Note Input */}
            <div className="col-span-3 pr-1 hidden lg:block">
              <input
                type="text"
                placeholder="Ket..."
                className="w-full border border-gray-300 rounded-md py-1 px-2 
                           text-xs focus:outline-none focus:border-blue-500 
                           bg-gray-50 focus:bg-white transition-colors"
                value={currentNote}
                onChange={(e) =>
                  onUpdateSelection(product.id, "note", e.target.value)
                }
              />
            </div>

            {/* Add Button */}
            <div className="col-span-4 lg:col-span-1 flex items-center justify-center">
              <button
                className="w-8 h-8 bg-[#3FA2F6] text-white rounded-full 
                           flex items-center justify-center shadow-sm 
                           hover:bg-blue-600 hover:scale-110 transition-all"
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