// src/pages/Transaction/Kasir/components/ProductGrid.tsx

import React from 'react';
import type { ProductDisplay } from '../../../../utils/salesHelpers';

interface ProductGridProps {
  currentProducts: ProductDisplay[];
  isLoading: boolean;
  onProductClick: (product: ProductDisplay) => void;
  formatRupiah: (num: number) => string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  currentProducts,
  isLoading,
  onProductClick,
  formatRupiah,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (currentProducts.length === 0) {
    return (
      <div className="col-span-full text-center text-gray-500 mt-10">
        Produk tidak ditemukan.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
      {currentProducts.map((product) => (
        <div
          key={product.id}
          onClick={() => onProductClick(product)}
          className="bg-white p-2 flex flex-col items-center hover:shadow-lg
                     transition-shadow cursor-pointer rounded-lg shadow-sm border border-gray-100"
        >
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-24 lg:h-32 object-contain mb-2"
          />
          <p className="text-green-600 font-bold text-sm">
            {formatRupiah(product.basePrice)}
          </p>
          <p className="text-xs text-center text-gray-700 mt-1 line-clamp-2">
            {product.name}
          </p>
        </div>
      ))}
    </div>
  );
};
