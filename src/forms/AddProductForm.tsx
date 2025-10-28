import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, QueryDocumentSnapshot, type DocumentData } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import SearchableDropdown from '../components/SearchableDropdown';
import FormattedNumberInput from '../components/FormattedNumberInput';
import ExpiredDateInput from '../components/ExpiredDateInput';
import authenticatedAxios from '../utils/api';
import { API_BASE_URL } from '../apiConfig';

interface AddProductFormProps {
  onClose: () => void;
  onProductAdded: () => void;
}

const AddProductForm: React.FC<AddProductFormProps> = ({ onClose, onProductAdded }) => {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sellingPrice, setSellingPrice] = useState(0);
  const [initialStock, setInitialStock] = useState(0);
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [expiredDate, setExpiredDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  });
  const [categories, setCategories] = useState<{ value: string; label: string; }[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = fetchCategories();
    return () => unsubscribe && unsubscribe();
  }, []);

  const fetchCategories = () => {
    const categoriesCollection = collection(db, 'product_categories');

    const unsubscribe = onSnapshot(categoriesCollection, (snapshot) => {
        const categoriesData = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
            value: doc.id,
            label: doc.data().name
        }));
        setCategories(categoriesData);
    }, (err) => {
        console.error('Error fetching categories:', err);
        setError('Failed to fetch categories.');
    });

    return unsubscribe;
  }

  const handleAddCategory = async (categoryName: string) => {
    try {
      const response = await authenticatedAxios.post(`${API_BASE_URL}/api/product-categories`, { name: categoryName });
      const newCategory = { value: response.data.id, label: response.data.name };
      setCategories([...categories, newCategory]);
      setCategoryId(newCategory.value);
    } catch (err) {
      console.error('Error adding category:', err);
      setError('Failed to add category.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const productData: any = {
      name,
      categoryId,
      price: sellingPrice,
      initialStock,
    };

    if (initialStock > 0) {
      productData.purchasePrice = purchasePrice;
      productData.expiredDate = expiredDate;
    }

    try {
      await authenticatedAxios.post(`${API_BASE_URL}/api/products`, productData);
      onProductAdded();
      onClose();
    } catch (err: any) {  
      console.error('Error adding product:', err);
      setError(err.response?.data?.message || 'Failed to add product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center p-4 z-20">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Add New Product</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Product Name</label>
                <input
                  type="text"
                  id="name"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                <SearchableDropdown
                  options={categories}
                  value={categoryId}
                  onChange={setCategoryId}
                  placeholder="Select or add a category"
                  onAddNew={handleAddCategory}
                />
              </div>
              <div>
                <label htmlFor="sellingPrice" className="block text-sm font-medium text-gray-700">Selling Price</label>
                <FormattedNumberInput
                  id="sellingPrice"
                  value={sellingPrice}
                  onChange={setSellingPrice}
                  required
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label htmlFor="initialStock" className="block text-sm font-medium text-gray-700">Initial Stock</label>
                <FormattedNumberInput
                  id="initialStock"
                  value={initialStock}
                  onChange={setInitialStock}
                />
              </div>

              {initialStock > 0 && (
                <div className="p-4 border rounded-lg space-y-4">
                  <p className="text-sm font-medium text-gray-800">Initial Stock Details</p>
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
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-center text-red-600 mt-4">{error}</p>}
          
          <div className="flex justify-end space-x-2 pt-6 border-t mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 font-semibold text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 bg-primary hover:bg-primary-dark disabled:bg-gray-400"
            >
              {loading ? 'Adding...' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductForm;
