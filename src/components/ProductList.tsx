import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, QueryDocumentSnapshot, type DocumentData } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { signOut } from 'firebase/auth';

const ProductList: React.FC = () => {
    const [products, setProducts] = useState<DocumentData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

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

    if (loading) {
        return <div className="text-center mt-10">Loading products...</div>;
    }

    if (error) {
        return <div className="text-center mt-10 text-red-600">{error}</div>;
    }

    return (
        <div className="container p-4 mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Products</h1>
                <button 
                    onClick={handleLogout}
                    className="px-4 py-2 font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                    Logout
                </button>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {products.length > 0 ? (
                    products.map(product => (
                        <div key={product.id} className="p-6 bg-white border border-gray-200 rounded-lg shadow-md">
                            <h3 className="text-xl font-semibold text-gray-800">{product.name}</h3>
                            <p className="mt-2 text-gray-600">Price: ${product.price.toFixed(2)}</p>
                            <p className="text-gray-600">Stock: {product.stock}</p>
                        </div>
                    ))
                ) : (
                    <p>No products found. Make sure you have a 'products' collection in Firestore.</p>
                )}
            </div>
        </div>
    );
};

export default ProductList;
