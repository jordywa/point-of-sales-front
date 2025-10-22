import React, { useState, useEffect } from 'react';
import { auth } from './firebaseConfig';
import Login from './components/Login';
import ProductList from './components/ProductList';
import BranchManagement from './components/BranchManagement';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { colors } from './colors';

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    const handleLoginSuccess = () => {
        // The onAuthStateChanged listener will handle the user state update
        console.log('Login successful, auth state should update.');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl font-semibold">Loading...</div>
            </div>
        );
    }

    return (
        <Router>
            <div className="App">
                {user ? (
                    <div className="flex flex-col min-h-screen">
                        <nav className="bg-white shadow-md p-4 flex justify-between items-center">
                            <div className="flex space-x-4">
                                <Link to="/products" className="text-gray-700 hover:text-gray-900 font-medium">Products</Link>
                                <Link to="/branch-management" className="text-gray-700 hover:text-gray-900 font-medium">Branch Management</Link>
                            </div>
                            <button
                                onClick={() => auth.signOut()}
                                className="px-4 py-2 font-semibold text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
                                style={{ backgroundColor: colors.primary }}
                            >
                                Logout
                            </button>
                        </nav>
                        <main className="flex-grow">
                            <Routes>
                                <Route path="/products" element={<ProductList />} />
                                <Route path="/branch-management" element={<BranchManagement />} />
                                <Route path="*" element={<ProductList />} /> {/* Default route after login */}
                            </Routes>
                        </main>
                    </div>
                ) : (
                    <Login onLoginSuccess={handleLoginSuccess} />
                )}
            </div>
        </Router>
    );
};

export default App;