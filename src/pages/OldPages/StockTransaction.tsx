import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, type DocumentData } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { getFormattedDate, getFormattedCurrency, getFormattedNumber } from '../../utils/formatting';
import EditStockTransactionModal from '../../components/OldComponents/EditStockTransactionModal';
import { type StockTransaction as IStockTransaction } from '../../interfaces/stock';

const StockTransaction: React.FC = () => {
  const [transactions, setTransactions] = useState<IStockTransaction[]>([]);
  const [products, setProducts] = useState<Record<string, DocumentData>>({});
  const [categories, setCategories] = useState<Record<string, DocumentData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<IStockTransaction | null>(null);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<DocumentData | null>(null);

  useEffect(() => {
    // Fetch products and categories first to map them to transactions
    const fetchProductsAndCategories = async () => {
      try {
        const productsCollection = collection(db, 'products');
        const categoriesCollection = collection(db, 'product_categories');

        const productsSnapshot = onSnapshot(productsCollection, (snapshot) => {
          const prods: Record<string, DocumentData> = {};
          snapshot.forEach(doc => {
            prods[doc.id] = { id: doc.id, ...doc.data() };
          });
          setProducts(prods);
        });

        const categoriesSnapshot = onSnapshot(categoriesCollection, (snapshot) => {
          const cats: Record<string, DocumentData> = {};
          snapshot.forEach(doc => {
            cats[doc.id] = { id: doc.id, ...doc.data() };
          });
          setCategories(cats);
        });

        return () => {
          productsSnapshot();
          categoriesSnapshot();
        };
      } catch (err) {
        console.error(err);
        setError('Failed to fetch initial data.');
      }
    };

    const unsubscribeInitialData = fetchProductsAndCategories();

    const transactionsQuery = query(collection(db, 'stockTransactions'), orderBy('createdAt', 'desc'));
    const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IStockTransaction));
      setTransactions(txs);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setError('Failed to fetch stock transactions.');
      setLoading(false);
    });

    return () => {
      unsubscribeInitialData.then(unsub => unsub && unsub());
      unsubscribeTransactions();
    };
  }, []);

  const combinedData = transactions.map(tx => {
    const product = products[tx.productId];
    const category = product ? categories[product.categoryId] : null;
    return {
      ...tx,
      productName: product?.name || 'N/A',
      categoryName: category?.name || 'N/A',
      product: product || null, // Pass full product object for editing
    } as IStockTransaction;
  });

  const handleEditClick = (transaction: IStockTransaction) => {
    setSelectedTransaction(transaction);
    setSelectedProductForEdit(products[transaction.productId] || null);
    setIsEditModalOpen(true);
  };

  const handleModalClose = () => {
    setIsEditModalOpen(false);
    setSelectedTransaction(null);
    setSelectedProductForEdit(null);
  };

  const handleSaveSuccess = () => {
    // Data is real-time, so it should update automatically. Just close modal.
    handleModalClose();
  };

  if (loading) {
    return <div className="p-8">Loading transactions...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Stock Transactions</h1>
        {/* Responsive table container */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date In</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Price</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expired Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {combinedData.map((tx) => (
                <tr key={tx.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getFormattedDate(tx.createdAt)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tx.productName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.categoryName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getFormattedNumber(tx.quantity)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getFormattedCurrency(tx.purchasePrice)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getFormattedDate(tx.expiredDate)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.isInitialStock ? 'Initial' : 'Added'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleEditClick(tx)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isEditModalOpen && selectedTransaction && selectedProductForEdit && (
        <EditStockTransactionModal
          transaction={selectedTransaction}
          product={selectedProductForEdit}
          onClose={handleModalClose}
          onSave={handleSaveSuccess}
        />
      )}
    </div>
  );
};

export default StockTransaction;
