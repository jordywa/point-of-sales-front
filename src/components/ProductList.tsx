import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, QueryDocumentSnapshot, type DocumentData } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { colors } from '../colors';

const ProductList: React.FC = () => {
    const [products, setProducts] = useState<DocumentData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');

    useEffect(() => {
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

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (err) {
            console.error('Failed to logout:', err);
        }
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-100"><p className="text-lg">Loading products...</p></div>;
    }

    if (error) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-100"><p className="text-lg text-red-600">{error}</p></div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-4 sm:space-y-0">
                    <h1 className="text-3xl font-bold text-gray-900">Product List</h1>
                    <button 
                        onClick={handleLogout}
                        className="px-6 py-2 font-semibold text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
                        style={{ backgroundColor: colors.primary }}
                    >
                        Logout
                    </button>
                </div>

                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search products by name..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map(product => (
                            <div key={product.id} className="p-6 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200">
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">{product.name}</h3>
                                <p className="text-gray-600 mb-1">Price: <span className="font-medium text-gray-800">${product.price.toFixed(2)}</span></p>
                                <p className="text-gray-600">Stock: <span className="font-medium text-gray-800">{product.stock}</span></p>
                            </div>
                        ))
                    ) : (
                        <p className="col-span-full text-center text-gray-600">No products found matching your search. Make sure you have a 'products' collection in Firestore.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductList;