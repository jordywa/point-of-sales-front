// src/pages/Transaction/Pembelian/components/ProductModal.tsx

import React from "react";
import { X } from "lucide-react";
import {
  getAvailableUnits,
  getPurchasePrice,
  getProductImage,
} from "../../../../utils/productHelpers";
import type { Product, ProductVariant } from "../../../../types";

interface ProductModalProps {
  product: Product;
  modalQty: number;
  setModalQty: (qty: number) => void;
  modalUnit: string;
  setModalUnit: (unit: string) => void;
  modalVariant: ProductVariant | null;
  setModalVariant: (variant: ProductVariant) => void;
  modalNote: string;
  setModalNote: (note: string) => void;
  onClose: () => void;
  onSave: () => void;
  formatRupiah: (num: number) => string;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  modalQty,
  setModalQty,
  modalUnit,
  setModalUnit,
  modalVariant,
  setModalVariant,
  modalNote,
  setModalNote,
  onClose,
  onSave,
  formatRupiah,
}) => {
  const productImage = getProductImage(product.image);

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-[450px] p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200 border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Product Image & Name */}
        <div className="flex flex-col items-center mb-6">
          <img
            src={productImage}
            alt="Product"
            className="h-32 object-contain mb-3"
          />
          <h3 className="text-xl font-medium text-gray-800 text-center">
            {product.name}
          </h3>
        </div>

        {/* Variant Selection */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Varian
          </label>
          <div className="grid grid-cols-2 gap-2">
            {product.variants.map((v) => (
              <label
                key={v.name}
                className="flex items-center cursor-pointer gap-2"
              >
                <input
                  type="radio"
                  name="variant"
                  value={v.name}
                  checked={modalVariant?.name === v.name}
                  onChange={() => {
                    setModalVariant(v);
                    const availableUnits = getAvailableUnits(v);
                    if (availableUnits.length > 0) {
                      setModalUnit(availableUnits[0]);
                    }
                  }}
                  className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm">{v.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Unit Selection */}
        {modalVariant && (
          <>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Unit
              </label>
              <div className="grid grid-cols-3 gap-2">
                {getAvailableUnits(modalVariant).map((u) => (
                  <label
                    key={u}
                    className="flex items-center cursor-pointer gap-2"
                  >
                    <input
                      type="radio"
                      name="unit"
                      value={u}
                      checked={modalUnit === u}
                      onChange={() => setModalUnit(u)}
                      className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm font-bold">{u}</span>
                  </label>
                ))}
              </div>
              {modalUnit && (
                <div className="mt-2 text-sm text-gray-600">
                  Harga: {formatRupiah(getPurchasePrice(modalVariant, modalUnit))}
                </div>
              )}
            </div>

            {/* Note Input */}
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-1">
                Tambah deskripsi
              </label>
              <input
                type="text"
                value={modalNote}
                onChange={(e) => setModalNote(e.target.value)}
                className="w-full border-b border-gray-400 py-1 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>

            {/* Quantity Controls */}
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="flex items-center gap-4 mb-2">
                <button
                  onClick={() => setModalQty(Math.max(1, modalQty - 1))}
                  className="w-10 h-10 flex items-center justify-center text-[#87C3FE] text-3xl font-bold bg-transparent hover:bg-blue-50 rounded"
                >
                  −
                </button>
                <span className="text-2xl font-bold w-8 text-center">
                  {modalQty}
                </span>
                <button
                  onClick={() => setModalQty(modalQty + 1)}
                  className="w-10 h-10 flex items-center justify-center text-[#87C3FE] text-3xl font-bold bg-transparent hover:bg-blue-50 rounded"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex w-full gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 border border-red-300 text-red-400 font-bold text-base rounded hover:bg-red-50 transition-colors uppercase"
              >
                Batal
              </button>
              <button
                onClick={onSave}
                className="flex-1 py-3 bg-[#87C3FE] text-white font-bold text-base rounded hover:bg-blue-400 transition-colors shadow-md uppercase"
              >
                Simpan
              </button>
            </div>
          </>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};