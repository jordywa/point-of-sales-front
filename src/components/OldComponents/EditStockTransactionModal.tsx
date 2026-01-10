import React, { useState, useEffect } from 'react';
import { type DocumentData } from 'firebase/firestore';
import { X } from 'lucide-react';
import FormattedNumberInput from './FormattedNumberInput';
import ExpiredDateInput from './ExpiredDateInput';
import authenticatedAxios from '../../utils/api';
import { getFormattedNumber } from '../../utils/formatting';
import { type StockTransaction as IStockTransaction } from '../../interfaces/stock';

interface EditStockTransactionModalProps {
  transaction: IStockTransaction;
  product: DocumentData;
  onClose: () => void;
  onSave: (updatedData: any) => void;
}

const EditStockTransactionModal: React.FC<EditStockTransactionModalProps> = ({ transaction, product, onClose, onSave }) => {
  const [quantity, setQuantity] = useState(transaction.quantity);
  const [purchasePrice, setPurchasePrice] = useState(transaction.purchasePrice);
  const [expiredDate, setExpiredDate] = useState(new Date(transaction.expiredDate)); // Convert Firestore Timestamp to Date object
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQuantity(transaction.quantity);
    setPurchasePrice(transaction.purchasePrice);
    setExpiredDate(new Date(transaction.expiredDate));
  }, [transaction]);

  const handleSave = async () => {
    setError('');
    setLoading(true);

    // Frontend validation (basic checks)
    if (quantity <= 0) {
      setError('Quantity must be greater than 0.');
      setLoading(false);
      return;
    }
    if (purchasePrice <= 0) {
      setError('Purchase price must be greater than 0.');
      setLoading(false);
      return;
    }
    if (!expiredDate) {
      setError('Expired date is required.');
      setLoading(false);
      return;
    }

    // The complex validation logic will be handled by the backend
    // We just send the updated data
    const updatedData = {
      quantity,
      purchasePrice,
      expiredDate,
    };

    try {
      await authenticatedAxios.put(`/stock-transactions/${transaction.id}`, updatedData);
      onSave(updatedData); // Notify parent of successful save
      onClose();
    } catch (err: any) {
      console.error('Error updating stock transaction:', err);
      setError(err.response?.data?.message || 'Failed to update stock transaction.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex justify-center items-center p-4 z-30" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Edit Stock Transaction</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-gray-600"><span className="font-semibold">Product:</span> {product.name}</p>
            <p className="text-gray-600"><span className="font-semibold">Current Qty:</span> {getFormattedNumber(transaction.quantity)}</p>
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
            <FormattedNumberInput
              id="quantity"
              value={quantity}
              onChange={setQuantity}
              required
            />
          </div>
          <div>
            <label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-700">Purchase Price</label>
            <FormattedNumberInput
              id="purchasePrice"
              value={purchasePrice}
              onChange={setPurchasePrice}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Expired Date</label>
            <ExpiredDateInput 
              initialDate={expiredDate}
              onChange={setExpiredDate} 
              disableDaysMode={true}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

        <div className="flex justify-end space-x-2 pt-6 border-t mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 font-semibold text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 bg-primary hover:bg-primary-dark disabled:bg-gray-400"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditStockTransactionModal;
