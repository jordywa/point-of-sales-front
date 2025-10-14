import React, { useState, useEffect } from 'react';
import { auth } from './firebaseConfig';
import Login from './components/Login';
import ProductList from './components/ProductList';
import { onAuthStateChanged, type User } from 'firebase/auth';

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
        <div className="App">
            {user ? <ProductList /> : <Login onLoginSuccess={handleLoginSuccess} />}
        </div>
    );
};

export default App;
