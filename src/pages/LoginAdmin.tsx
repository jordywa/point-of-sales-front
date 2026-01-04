import React, { useEffect, useState } from 'react';

import loginIcon from '../assets/login-icon.jpeg';
import { useAuth } from '../context/AuthContext';

// Interface for component props
interface LoginProps {
}

const LoginAdmin: React.FC<LoginProps> = ({}) => {
    const {login} = useAuth();

    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');

    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const autoLogin = async () =>{
        setError('');
        setLoading(true);

        try {
            await login( import.meta.env.VITE_MASTER_USERNAME, import.meta.env.VITE_MASTER_PASSWORD);
            // 4. Notify parent component of success

        } catch (err: any) {
            console.error('Login failed:', err);
            const errorMessage = err.response?.data?.message || 'Failed to login. API Issue';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }

    }

    useEffect(() => {
        autoLogin();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(username, password);
            // 4. Notify parent component of success
        } catch (err: any) {
            console.error('Login failed:', err);
            const errorMessage = err.response?.data?.message || 'Failed to login. API Issue';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-4xl p-8 mx-4 bg-white rounded-lg shadow-lg md:flex md:items-center md:space-x-8">
                {/* Left side - Image or Branding */}
                <div className="hidden h-full md:block md:w-1/2">
                    {/* Replace with your image or branding */}
                    <div className="flex items-center justify-center h-full bg-cover bg-center rounded-lg" style={{backgroundImage: `url(${loginIcon})`}}>
                         <h1 className="text-4xl font-bold text-white">Point of Sales</h1>
                    </div>
                </div>

                {/* Right side - Login Form */}
                <div className="md:w-1/2">
                    <h2 className="mb-6 text-3xl font-bold text-center text-gray-900">Login</h2>
                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                            <input
className="w-full px-4 py-3 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
        className="w-full px-4 py-3 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        {error && <p className="text-sm text-center text-red-600">{error}</p>}
                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full px-6 py-3 font-semibold text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 bg-primary"
                            >
                                {loading ? 'Logging in...' : 'Login'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginAdmin;