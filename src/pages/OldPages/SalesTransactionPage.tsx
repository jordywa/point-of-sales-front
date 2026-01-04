import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, type DocumentData } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { getFormattedDate, getFormattedCurrency } from '../../utils/formatting';
import authenticatedAxios from '../../utils/api';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { type SalesTransaction } from '../../interfaces/sales';
import ConfirmationModal from '../../components/ConfirmationModal';

const SalesTransactionPage: React.FC = () => {
  const [transactions, setTransactions] = useState<SalesTransaction[]>([]);
  const [customers, setCustomers] = useState<Record<string, DocumentData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [transactionToCancel, setTransactionToCancel] = useState<string | null>(null);

  useEffect(() => {
    const customersCollection = collection(db, 'customers');
    const unsubscribeCustomers = onSnapshot(customersCollection, (snapshot) => {
      const custs: Record<string, DocumentData> = {};
      snapshot.forEach(doc => {
        custs[doc.id] = doc.data();
      });
      setCustomers(custs);
    });

    const transactionsQuery = query(collection(db, 'salesTransactions'), orderBy('createdAt', 'desc'));
    const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SalesTransaction));
      setTransactions(txs);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setError('Failed to fetch sales transactions.');
      setLoading(false);
    });

    return () => {
      unsubscribeCustomers();
      unsubscribeTransactions();
    };
  }, []);

  const handleRowClick = (id: string) => {
    setExpandedRowId(prevId => (prevId === id ? null : id));
  };

  const openCancelModal = (id: string) => {
    setTransactionToCancel(id);
    setIsCancelModalOpen(true);
  };

  const executeCancelSale = async () => {
    if (!transactionToCancel) return;

    try {
      await authenticatedAxios.post(`/sales/${transactionToCancel}/cancel`);
      // UI will update automatically via onSnapshot
    } catch (err: any) {
      console.error('Error canceling sale:', err);
      setError(err.response?.data?.message || 'Failed to cancel sale.');
    }
  };

  const combinedData = transactions.map(tx => ({
    ...tx,
    customerName: tx.customerId ? customers[tx.customerId]?.name : 'Unknown',
  }));

  if (loading) {
    return <div className="p-8">Loading sales history...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Sales History</h1>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
            <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError('')}>
              <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
            </span>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Price</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {combinedData.map((tx) => (
                <React.Fragment key={tx.id}>
                  <tr 
                    className="hover:shadow-md cursor-pointer transition-shadow duration-200"
                    onClick={() => handleRowClick(tx.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getFormattedDate(tx.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tx.customerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getFormattedCurrency(tx.totalAmount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tx.status === 'canceled' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {tx.status === 'canceled' ? 'Canceled' : 'Completed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => { e.stopPropagation(); openCancelModal(tx.id); }}
                        disabled={tx.status === 'canceled'}
                        className="text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed mr-4"
                      >
                        Cancel
                      </button>
                      <button className="text-gray-400">
                        {expandedRowId === tx.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </td>
                  </tr>
                  {expandedRowId === tx.id && (
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="space-y-2">
                          <h4 className="font-bold">Transaction Details:</h4>
                          {tx.items.map((item: any, index: number) => (
                            <div key={index} className="p-2 border rounded-md">
                              <p className="font-semibold">{item.name} (Qty: {item.quantity})</p>
                              <p className="text-sm text-gray-600">Sold From Batches:</p>
                              <ul className="list-disc list-inside pl-4 text-sm text-gray-500">
                                {item.soldDetails.map((detail: any, i: number) => (
                                  <li key={i}>
                                    {detail.quantitySold} units @ {getFormattedCurrency(detail.purchasePrice)} (Expired: {getFormattedDate(detail.expiredDate)})
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={executeCancelSale}
        title="Cancel Sale"
        message="Are you sure you want to cancel this sale? This action will restore the stock and cannot be undone."
        confirmText="Yes, Cancel Sale"
      />
    </div>
  );
};

export default SalesTransactionPage;
