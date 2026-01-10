import React, { useState, useCallback } from 'react';
import authenticatedAxios from '../utils/api';

import FormattedNumberInput from '../components/OldComponents/FormattedNumberInput';
import ExpiredDateInput from '../components/OldComponents/ExpiredDateInput';
import { type DocumentData } from 'firebase/firestore';
import { Trash, X } from 'lucide-react';
import { type StockDetail } from '../interfaces/stock';

interface AddStockPanelProps {
  selectedProducts: DocumentData[];
  stockDetails: Record<string, StockDetail>;
  onStockDetailChange: (productId: string, field: keyof StockDetail, value: any) => void;
  onStockAdded: () => void;
  onCancel: () => void;
  onClearSelection: () => void;
  onRemoveProduct: (productId: string) => void;
}

const AddStockPanel: React.FC<AddStockPanelProps> = ({ 
  selectedProducts, 
  stockDetails,
  onStockDetailChange,
  onStockAdded, 
  onCancel, 
  onClearSelection, 
  onRemoveProduct 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddStock = useCallback(async () => {
    const stockEntries = Object.entries(stockDetails)
      .map(([productId, details]) => ({
        productId,
        quantity: details.quantity,
        purchasePrice: details.purchasePrice,
        expiredDate: details.expiredDate,
      }))
      .filter(entry => entry.quantity > 0 && entry.purchasePrice > 0);

    if (stockEntries.length === 0) {
      setError('Please enter a valid quantity and purchase price for at least one product.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await authenticatedAxios.post(`/products/bulk-add-stock`, {
        stockEntries,
      });
      onStockAdded();
    } catch (err: any) {
      console.error('Error adding stock:', err);
      setError(err.response?.data?.message || 'Failed to add stock.');
    } finally {
      setLoading(false);
    }
  }, [stockDetails, onStockAdded]);

  const renderContent = () => (
    <div className="flex flex-col h-full">
      <div className='flex flex-col border-b mb-4'>
        <div className="flex justify-between items-center  pb-2">
          <h3 className="text-xl font-semibold">Add Stock</h3>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <button 
            onClick={onClearSelection}
            className="w-full mb-4 px-4 py-2 text-sm font-semibold text-white rounded-md bg-red-500 hover:bg-red-600"
        >
            Clear Selection
        </button>
      </div>
      {selectedProducts.length === 0 ? (
        <p className="text-center text-gray-500 mt-4">Select products from the list to add stock.</p>
      ) : (
        <div className="flex-grow overflow-y-auto pr-2">
          <div className="space-y-4">
            {selectedProducts.map(product => (
              <div key={product.id} className="p-4 border rounded-lg relative">
                <p className="font-semibold text-gray-800 pr-8">{product.name}</p>
                <button onClick={() => onRemoveProduct(product.id)} className="absolute top-2 right-2 text-red-400 hover:text-red-600">
                    <Trash size={20} />
                </button>
                <div className="mt-2 flex flex-col gap-4">
                  <div className='flex gap-x-2'>
                    <div className='w-2/12'>
                      <label htmlFor={`quantity-${product.id}`} className="block text-sm font-medium text-gray-700">Qty</label>
                      <FormattedNumberInput
                        id={`quantity-${product.id}`}
                        value={stockDetails[product.id]?.quantity || 0}
                        onChange={(value) => onStockDetailChange(product.id, 'quantity', value)}
                      />
                    </div>
                    <div className='w-10/12'>
                      <label htmlFor={`price-${product.id}`} className="block text-sm font-medium text-gray-700">Purchase Price</label>
                      <FormattedNumberInput
                        id={`price-${product.id}`}
                        value={stockDetails[product.id]?.purchasePrice || 0}
                        onChange={(value) => onStockDetailChange(product.id, 'purchasePrice', value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Expired Date</label>
                    <ExpiredDateInput 
                      initialDate={stockDetails[product.id]?.expiredDate}
                      onChange={(date) => onStockDetailChange(product.id, 'expiredDate', date)} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="mt-auto pt-4 border-t">
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
        <button
          onClick={handleAddStock}
          disabled={loading || selectedProducts.length === 0}
          className="w-full px-4 py-2 font-semibold text-white rounded-md bg-primary hover:bg-primary-dark disabled:bg-gray-400"
        >
          {loading ? 'Adding Stock...' : 'Save Stock'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Panel is wider now (w-128) which is 32rem or 512px */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-xl p-6 transform transition-transform duration-300 ease-in-out z-20 ${'translate-x-0'}`}>
        {renderContent()}
      </div>
    </>
  );
};

export default AddStockPanel;
