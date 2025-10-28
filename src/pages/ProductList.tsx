import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, QueryDocumentSnapshot, type DocumentData } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import AddProductForm from '../forms/AddProductForm';
import AddStockPanel from '../forms/AddStockPanel';
import ProductDetailModal from '../components/ProductDetailModal';
import { getFormattedCurrency, getFormattedNumber } from '../utils/formatting';

const ProductList: React.FC = () => {
    const [products, setProducts] = useState<DocumentData[]>([]);
    const [categories, setCategories] = useState<DocumentData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [showAddProductModal, setShowAddProductModal] = useState(false);
    const [addStockMode, setAddStockMode] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [viewingProduct, setViewingProduct] = useState<DocumentData | null>(null);

    useEffect(() => {
        const unsubscribeProducts = fetchProducts();
        const unsubscribeCategories = fetchCategories();

        return () => {
            unsubscribeProducts();
            unsubscribeCategories();
        };
    }, []);

    const fetchProducts = () => {
        const productsCollection = collection(db, 'products');

        const unsubscribe = onSnapshot(productsCollection, (snapshot) => {
            const productsData = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
                id: doc.id,
                ...doc.data()
            }));
            setProducts(productsData);
            setLoading(false);
        }, (err) => {
            console.error('Error fetching products:', err);
            setError('Failed to fetch products. You may not have permission.');
            setLoading(false);
        });

        return unsubscribe;
    }

    const fetchCategories = () => {
        const categoriesCollection = collection(db, 'product_categories');

        const unsubscribe = onSnapshot(categoriesCollection, (snapshot) => {
            const categoriesData = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
                id: doc.id,
                ...doc.data()
            }));
            setCategories(categoriesData);
        }, (err) => {
            console.error('Error fetching categories:', err);
            setError('Failed to fetch categories.');
        });

        return unsubscribe;
    }

    const handleSelectProduct = (productId: string) => {
        setSelectedProducts(prevSelected => {
            if (prevSelected.includes(productId)) {
                return prevSelected.filter(id => id !== productId);
            } else {
                return [...prevSelected, productId];
            }
        });
    };

    const handleCardClick = (product: DocumentData) => {
        if (addStockMode) {
            handleSelectProduct(product.id);
        } else {
            setViewingProduct(product);
        }
    };

    const handleSelectAll = () => {
        const visibleProductIds = filteredProducts.map(p => p.id);
        if (selectedProducts.length === visibleProductIds.length) {
            setSelectedProducts([]);
        } else {
            setSelectedProducts(visibleProductIds);
        }
    };

    const getCategoryName = (categoryId: string) => {
        const category = categories.find(cat => cat.id === categoryId);
        return category ? category.name : 'Uncategorized';
    };

    const filteredProducts = products.filter(product => {
        const matchesCategory = selectedCategory ? product.categoryId === selectedCategory : true;
        const matchesSearchTerm = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearchTerm;
    });

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-100"><p className="text-lg">Loading products...</p></div>;
    }

    if (error) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-100"><p className="text-lg text-red-600">{error}</p></div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
            <div className={`max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-6 transition-all duration-300 ease-in-out ${addStockMode ? 'md:mr-90' : ''}`}>
                <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-4 sm:space-y-0">
                    <h1 className="text-3xl font-bold text-gray-900">Product List</h1>
                    
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                        {!addStockMode && <button
                            onClick={() => setAddStockMode(true)}
                            className="w-full sm:w-auto px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 bg-primary flex-shrink-0"
                        >
                            Add Stock
                        </button>}
                        {!addStockMode && <button
                            onClick={() => setShowAddProductModal(true)}
                            className="w-full sm:w-auto px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 bg-insert text-primary-dark hover:bg-insert/70 flex-shrink-0"
                            disabled={addStockMode}
                        >
                            Add New Product
                        </button>}
                        
                        <button
                        onClick={() =>{
                            setSearchTerm("");
                            setSelectedCategory("")
                        }}
                        className={`w-full sm:w-auto px-4 py-2 text-sm font-semibold text-white rounded-md flex-shrink-0 ${`bg-gray-400 hover:bg-gray-500`}`}>
                            Clear Filter
                        </button>
                    </div>
                </div>

                {addStockMode && (
                    <div className="flex justify-between items-center mb-4">
                        <button
                            onClick={handleSelectAll}
                            className={`px-4 py-2 text-sm font-semibold text-white rounded-md ${selectedProducts.length === filteredProducts.length ? "bg-gray-400 hover:bg-gray-500": "bg-primary hover:bg-primary-dark"}`}
                        >
                            {selectedProducts.length === filteredProducts.length ? 'Deselect All' : 'Select All Visible'}
                        </button>
                    </div>
                )}

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

                <div className={`grid  sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${addStockMode ? 'md:grid-cols-1' : ''} gap-6`}>
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map(product => (
                            <div key={product.id} 
                                 onClick={() => handleCardClick(product)}
                                 className={`relative p-6 bg-white border rounded-lg shadow-md transition-all duration-200 cursor-pointer ${addStockMode ? 'hover:shadow-xl' : 'hover:shadow-lg'} ${selectedProducts.includes(product.id) ? 'ring-2 ring-primary border-transparent' : 'border-gray-200'}`}>
                                {addStockMode && (
                                    <input
                                        type="checkbox"
                                        className="absolute top-2 right-2 h-6 w-6 pointer-events-none"
                                        checked={selectedProducts.includes(product.id)}
                                        readOnly
                                    />
                                )}
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">{product.name}</h3>
                                <p className="text-sm text-gray-500 mb-2">{getCategoryName(product.categoryId)}</p>
                                <p className="text-gray-600 mb-1">Price: <span className="font-medium text-gray-800">{getFormattedCurrency(product.price)}</span></p>
                                <p className="text-gray-600">Stock: <span className="font-medium text-gray-800">{getFormattedNumber(product.totalStock)}</span></p>
                            </div>
                        ))
                    ) : (
                        <p className="col-span-full text-center text-gray-600">No products found matching your search. Make sure you have a 'products' collection in Firestore.</p>
                    )}
                </div>
            </div>
            {showAddProductModal && (
                <AddProductForm
                    onClose={() => setShowAddProductModal(false)}
                    onProductAdded={() => {
                        fetchProducts();
                    }}
                />
            )}
            {viewingProduct && (
                <ProductDetailModal 
                    product={viewingProduct} 
                    onClose={() => setViewingProduct(null)} 
                />
            )}
            {addStockMode && (
                <AddStockPanel
                    selectedProducts={products.filter(p => selectedProducts.includes(p.id))}
                    onStockAdded={() => {
                        fetchProducts();
                        setSelectedProducts([]);
                    }}
                    onCancel={() => { setAddStockMode(false); setSelectedProducts([]); }}
                    onClearSelection={() => setSelectedProducts([])}
                    onRemoveProduct={handleSelectProduct} // Reusing the toggle function
                />
            )}
        </div>
    );
}

export default ProductList;