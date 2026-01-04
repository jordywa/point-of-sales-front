import React from 'react';
import { type DocumentData } from 'firebase/firestore';
import { getFormattedCurrency, getFormattedNumber, getFormattedDate } from '../utils/formatting';
import { X } from 'lucide-react';

interface ProductDetailModalProps {
  product: DocumentData;
  onClose: () => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex justify-center items-center z-30" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-gray-600"><span className="font-semibold">Price:</span> {getFormattedCurrency(product.price)}</p>
            <p className="text-gray-600"><span className="font-semibold">Total Stock:</span> {getFormattedNumber(product.totalStock)}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 border-t pt-4 mt-4">Stock History</h3>
            {product.stockSequence && product.stockSequence.length > 0 ? (
              <div className="mt-2 space-y-3">
                
                <div className="bg-gray-200 p-3 rounded-lg">
                  <div className="grid grid-cols-4 gap-2 text-sm">
                      <p className="font-semibold">Date In</p>
                      <p className="font-semibold">Qty</p>
                      <p className="font-semibold">Purchase Price</p>
                      <p className="font-semibold">Expired At</p>
                  </div>
                </div>
                {product.stockSequence.slice().reverse().map((entry: any, index: number) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <div className="grid grid-cols-4 gap-2 text-sm">
                        <p className="text-gray-700">{getFormattedDate(entry.addedAt)}</p>
                        <p className="text-gray-700">{getFormattedNumber(entry.quantity)}</p>
                        <p className="text-gray-700">{getFormattedCurrency(entry.purchasePrice)}</p>
                        <p className="text-gray-700">{getFormattedDate(entry.expiredDate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-2">No stock history for this product.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;