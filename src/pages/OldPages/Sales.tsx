import { getFormattedCurrency, getFormattedNumber } from '../../utils/formatting';
import SalesPaymentModal from '../../components/SalesPaymentModal';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, type DocumentData } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { CircleMinus, CirclePlus, Trash } from 'lucide-react';
import FormattedNumberInput from '../../components/FormattedNumberInput';

interface CartItem {
  productId: string;
  name: string;
  price: number; // Selling price
  quantity: number;
  totalStock: number; // For validation
}

const Sales: React.FC = () => {
  const [products, setProducts] = useState<DocumentData[]>([]);
  const [categories, setCategories] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribeProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(prods);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching products:', err);
      setError('Failed to fetch products.');
      setLoading(false);
    });

    const unsubscribeCategories = onSnapshot(collection(db, 'product_categories'), (snapshot) => {
      const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(cats);
    }, (err) => {
      console.error('Error fetching categories:', err);
      setError('Failed to fetch categories.');
    });

    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
    };
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory ? product.categoryId === selectedCategory : true;
      const matchesSearchTerm = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearchTerm;
    });
  }, [products, searchTerm, selectedCategory]);

  const productsByCategory = useMemo(() => {
    const grouped: Record<string, DocumentData[]> = {};
    filteredProducts.forEach(product => {
      const category = categories.find(cat => cat.id === product.categoryId);
      const categoryName = category ? category.name : 'Uncategorized';
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push(product);
    });
    return grouped;
  }, [filteredProducts, categories]);

  const handleAddToCart = useCallback((product: DocumentData) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.productId === product.id);
      if (existingItem) {
        // Increment quantity if item already in cart, up to totalStock
        if (existingItem.quantity < product.totalStock) {
          return prevItems.map(item =>
            item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        } else {
          // Optionally show a message that max stock is reached
          return prevItems;
        }
      } else {
        // Add new item to cart
        return [
          ...prevItems,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            totalStock: product.totalStock,
          },
        ];
      }
    });
  }, []);

  const handleUpdateCartItemQuantity = useCallback((productId: string, newQuantity: number) => {
    setCartItems(prevItems => {
      return prevItems.map(item => {
        if (item.productId === productId) {
          const quantityToSet = Math.max(0, Math.min(newQuantity, item.totalStock));
          return { ...item, quantity: quantityToSet };
        }
        return item;
      });
    });
  }, []);

  const handleRemoveFromCart = useCallback((productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.productId !== productId));
  }, []);

  const totalBill = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  const handleProceedToPayment = () => {
    setIsPaymentModalOpen(true);
  };

  const handleSaleSuccess = () => {
    setCartItems([]); // Clear cart
    setIsPaymentModalOpen(false);
    // Optionally show a success message
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-100"><p className="text-lg">Loading products...</p></div>;
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-100"><p className="text-lg text-red-600">Error: {error}</p></div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Left Panel: Product List */}
      <div className="w-2/3 p-4 sm:p-6 lg:p-8 border-r border-gray-200">
        <div className="max-w-full mx-auto bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Sales</h1>

          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
            <div className="w-full sm:w-1/2">
              <input
                type="text"
                placeholder="Search products by name..."
                className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-1/2">
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-6">
            {Object.entries(productsByCategory).map(([categoryName, prods]) => (
              <div key={categoryName}>
                <h2 className="text-xl font-bold text-gray-800 mb-4">{categoryName}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {prods.map(product => (
                    <div
                      key={product.id}
                      className="bg-white border border-gray-200 rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow duration-200"
                      onClick={() => handleAddToCart(product)}
                    >
                      <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
                      <p className="text-gray-600">{getFormattedCurrency(product.price)}</p>
                      <p className="text-sm text-gray-500">Stock: {getFormattedNumber(product.totalStock)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel: Sales Cart / Struk */}
      <div className="w-1/3 p-4 sm:p-6 lg:p-8 bg-white shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Sales Cart</h2>
        {cartItems.length === 0 ? (
          <p className="text-gray-500">Click on a product to add it to the cart.</p>
        ) : (
          <div className="space-y-4">
            {cartItems.map(item => (
              <div key={item.productId} className="border-b pb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-800">{item.name}</h3>
                  <button 
                    onClick={() => handleRemoveFromCart(item.productId)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    <Trash size={20}/>
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">{getFormattedCurrency(item.price)}</p>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleUpdateCartItemQuantity(item.productId, item.quantity - 1)}
                      className="text-primary hover:text-primary-dark"
                    >
                      <CircleMinus size={30}/>
                    </button>
                    <FormattedNumberInput
                      onChange={(val: number) => handleUpdateCartItemQuantity(item.productId, val)}
                      value={item.quantity}
                      className='w-16 text-center border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary'
                    />
                    <button 
                      onClick={() => handleUpdateCartItemQuantity(item.productId, item.quantity + 1)}
                      className="text-primary hover:text-primary-dark"
                    >
                      <CirclePlus size={30}/>
                    </button>
                  </div>
                </div>
                <p className="text-gray-700 text-right mt-1">Subtotal: {getFormattedCurrency(item.price * item.quantity)}</p>
              </div>
            ))}
            <div className="pt-4 mt-4">
              <h3 className="text-xl font-bold text-gray-900 text-right">Total: {getFormattedCurrency(totalBill)}</h3>
            </div>
            <button
              onClick={handleProceedToPayment}
              className="w-full px-4 py-2 mt-4 font-semibold text-white rounded-md bg-primary hover:bg-primary-dark disabled:bg-gray-400"
              disabled={cartItems.length === 0}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {isPaymentModalOpen && (
        <SalesPaymentModal
          totalBill={totalBill}
          cartItems={cartItems}
          onClose={() => setIsPaymentModalOpen(false)}
          onSaleSuccess={handleSaleSuccess}
        />
      )}
    </div>
  );
};

export default Sales;
