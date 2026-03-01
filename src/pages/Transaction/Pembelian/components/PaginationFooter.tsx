// src/pages/Transaction/Pembelian/components/PaginationFooter.tsx

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationFooterProps {
  startIndex: number;
  endIndex: number;
  totalItems: number;
  currentPage: number;
  onPageChange: (direction: "prev" | "next") => void;
  canGoNext?: boolean;
}

export const PaginationFooter: React.FC<PaginationFooterProps> = ({
  startIndex,
  endIndex,
  totalItems,
  currentPage,
  onPageChange,
  canGoNext = true,
}) => {
  return (
    <div className="bg-white border-t border-gray-200 p-4 flex justify-between 
                    items-center sticky bottom-0 z-20 shadow-2xl">
      <div className="text-gray-800 font-medium">
        Menampilkan <span className="font-bold">{startIndex} - {endIndex}</span>{" "}
        dari <span className="font-bold">{totalItems}</span> Produk (Halaman{" "}
        {currentPage})
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={() => onPageChange("prev")}
          disabled={currentPage === 1}
          className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 
                     text-gray-700 font-medium disabled:opacity-50 
                     disabled:cursor-not-allowed flex items-center gap-1 
                     transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Balik
        </button>

        <button
          onClick={() => onPageChange("next")}
          disabled={!canGoNext}
          className="px-4 py-2 rounded bg-[#BEDFFF] hover:bg-blue-300 
                     text-blue-900 font-medium disabled:opacity-50 
                     disabled:cursor-not-allowed flex items-center gap-1 
                     transition-colors"
        >
          Lanjut <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};