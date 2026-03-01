// src/pages/Transaction/Pembelian/components/ProductGrid.tsx

import React from "react";
import { Loader2 } from "lucide-react";
import { getProductDisplayPrice, getProductImage } from "../../../../utils/productHelpers";
import type { Product } from "../../../../types";

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  onProductClick: (product: Product) => void;
  formatRupiah: (num: number) => string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading,
  onProductClick,
  formatRupiah,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="col-span-full text-center text-gray-500 mt-10">
        Produk tidak ditemukan.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
      {products.map((product) => {
        const displayPrice = getProductDisplayPrice(product.variants);
        const productImage = getProductImage(product.image);

        return (
          <div
            key={product.id}
            onClick={() => onProductClick(product)}
            className="bg-white p-2 flex flex-col items-center 
                       hover:shadow-lg transition-shadow cursor-pointer 
                       rounded-lg shadow-sm border border-gray-100"
          >
            <img
              src={productImage}
              alt={product.name}
              className="w-full h-24 lg:h-32 object-contain mb-2"
            />
            <p className="text-green-600 font-bold text-sm">
              {formatRupiah(displayPrice)}
            </p>
            <p className="text-xs text-center text-gray-700 mt-1 line-clamp-2">
              {product.name}
            </p>
          </div>
        );
      })}
    </div>
  );
};