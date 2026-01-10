import React, { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { X } from 'lucide-react';
import { getFormattedCurrency } from '../../utils/formatting';
import authenticatedAxios from '../../utils/api';

interface SalesPaymentModalProps {
  totalBill: number;
  cartItems: any[]; // Detailed cart items needed for sale creation
  onClose: () => void;
  onSaleSuccess: () => void;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
} 

const SalesPaymentModal: React.FC<SalesPaymentModalProps> = ({ totalBill, cartItems, onClose, onSaleSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch customers based on search term
  useEffect(() => {
    if (!customerSearchTerm) {
      setCustomers([]);
      return;
    }

    const q = query(
      collection(db, 'customers'),
      where('name', '>=', customerSearchTerm),
      where('name', '<=', customerSearchTerm + '\uf8ff')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedCustomers: Customer[] = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        phone: doc.data().phone,
      }));
      setCustomers(fetchedCustomers);
    }, (err) => {
      console.error('Error fetching customers:', err);
      setError('Failed to search customers.');
    });

    return () => unsubscribe();
  }, [customerSearchTerm]);

  const handleAddCustomer = useCallback(async () => {
    setError('');
    if (!newCustomerName || !newCustomerPhone) {
      setError('New customer name and phone are required.');
      return;
    }

    setLoading(true);
    try {
      const response = await authenticatedAxios.post('/customers', {
        name: newCustomerName,
        phone: newCustomerPhone,
      });
      const newCust = response.data;
      setSelectedCustomer(newCust);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setCustomerSearchTerm(''); // Clear search to hide results
    } catch (err: any) {
      console.error('Error adding new customer:', err);
      setError(err.response?.data?.message || 'Failed to add new customer.');
    } finally {
      setLoading(false);
    }
  }, [newCustomerName, newCustomerPhone]);

  const handleConfirmSale = useCallback(async () => {
    setError('');
    setLoading(true);

    try {
      const saleData = {
        customerId: selectedCustomer?.id || null,
        paymentMethod,
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      await authenticatedAxios.post('/sales', saleData);
      onSaleSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error confirming sale:', err);
      setError(err.response?.data?.message || 'Failed to confirm sale.');
    } finally {
      setLoading(false);
    }
  }, [paymentMethod, selectedCustomer, cartItems, onSaleSuccess, onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex justify-center items-center p-4 z-40" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center border-b pb-3 mb-4 p-6">
          <h2 className="text-2xl font-bold text-gray-900">Confirm Sale & Payment</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <p className="text-xl font-semibold text-gray-800">Total Bill: {getFormattedCurrency(totalBill)}</p>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`px-4 py-2 rounded-md ${paymentMethod === 'cash' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                className={`px-4 py-2 rounded-md ${paymentMethod === 'transfer' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Transfer
              </button>
            </div>
          </div>

          {/* Customer Section */}
          <div>
            <label htmlFor="customerSearch" className="block text-sm font-medium text-gray-700">Customer (Optional)</label>
            {selectedCustomer ? (
              <div className="mt-1 p-3 border rounded-md bg-gray-50 flex justify-between items-center">
                <span>{selectedCustomer.name} ({selectedCustomer.phone})</span>
                <button onClick={() => setSelectedCustomer(null)} className="text-red-500 hover:text-red-700 text-sm">Change</button>
              </div>
            ) : (
              <div className="mt-1">
                <input
                  type="text"
                  id="customerSearch"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="Search by name or phone..."
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                />
                {customerSearchTerm && customers.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                    {customers.map(cust => (
                      <li
                        key={cust.id}
                        className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          setSelectedCustomer(cust);
                          setCustomerSearchTerm('');
                        }}
                      >
                        {cust.name} ({cust.phone})
                      </li>
                    ))}
                  </ul>
                )}

                {/* Add New Customer */}
                {customerSearchTerm && customers.length === 0 && (
                  <div className="mt-4 p-3 border rounded-md bg-gray-50">
                    <p className="text-sm font-medium text-gray-700 mb-2">No customer found. Add new?</p>
                    <input
                      type="text"
                      placeholder="New Customer Name"
                      className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-md shadow-sm"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="New Customer Phone"
                      className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-md shadow-sm"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                    />
                    <button
                      onClick={handleAddCustomer}
                      disabled={loading || !newCustomerName || !newCustomerPhone}
                      className="w-full px-4 py-2 text-sm font-semibold text-white rounded-md bg-green-500 hover:bg-green-600 disabled:bg-gray-400"
                    >
                      {loading ? 'Adding...' : 'Add New Customer'}
                    </button>
                  </div>
                )}
              </div>
            )}
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
              onClick={handleConfirmSale}
              disabled={loading || cartItems.length === 0}
              className="px-4 py-2 font-semibold text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 bg-primary hover:bg-primary-dark disabled:bg-gray-400"
            >
              {loading ? 'Confirming...' : 'Confirm Sale'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesPaymentModal;
