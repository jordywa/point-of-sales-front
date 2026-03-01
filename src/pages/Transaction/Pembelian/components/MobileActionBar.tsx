// src/pages/Transaction/Pembelian/components/MobileActionBar.tsx

import React from "react";
import { ShoppingCart } from "lucide-react";

interface MobileActionBarProps {
  subTotal: number;
  cartCount: number;
  onOpenCart: () => void;
  formatRupiah: (num: number) => string;
}

export const MobileActionBar: React.FC<MobileActionBarProps> = ({
  subTotal,
  cartCount,
  onOpenCart,
  formatRupiah,
}) => {
  return (
    <div className="lg:hidden absolute bottom-0 left-0 right-0 bg-white 
                    border-t border-gray-200 p-3 flex items-center 
                    justify-between shadow-[0_-4px_10px_rgba(0,0,0,0.1)] z-20">
      <div className="flex flex-col">
        <span className="text-xs text-gray-500">Total Beli</span>
        <span className="text-lg font-bold text-blue-600">
          {formatRupiah(subTotal)}
        </span>
      </div>
      <button
        onClick={onOpenCart}
        className="bg-[#3FA2F6] text-white px-6 py-2 rounded-full 
                   font-bold flex items-center gap-2 shadow-lg 
                   active:scale-95 transition-transform"
      >
        <ShoppingCart className="w-5 h-5" />
        <span>Keranjang ({cartCount})</span>
      </button>
    </div>
  );
};