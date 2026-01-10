import React, { createContext, useState, useEffect, useContext } from 'react';
import type { User } from '../types';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import { onIdTokenChanged, signInWithCustomToken } from 'firebase/auth';
import app, { auth, db } from '../firebaseConfig';
import { doc, Firestore, getFirestore, onSnapshot } from 'firebase/firestore';

type AuthContextType = {
  // Original variables (tidak diubah)
  user: User | null;
  token: string | null;

  // New additions for enhanced functionality
  loading: boolean;
  isAuthenticated: boolean;

  // Helper functions
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;

  userDb: Firestore | null;
};

// 1. Inisialisasi Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userDb, setUserDb] = useState<Firestore | null>(null); // Kita simpan instance DB di state

  onIdTokenChanged(auth, async (user) => {
    if (user) {
      setIsAuthenticated(true);
      // Firebase SDK di latar belakang akan selalu menjaga user.accessToken tetap fresh
      const token = await user.getIdToken();
      // console.log("Token baru siap digunakan untuk akses DB/API:", token);
      setToken(token);
      setUserId(user.uid);
      localStorage.setItem("authToken", token);
      localStorage.setItem("userId", user.uid);
    } else {
      setIsAuthenticated(false);
      // User logout
      setToken(null);
      setUser(null);
      setUserId("");
      setIsAuthenticated(false);
      // Hapus dari localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
    }
  });

  const fetchUser = () => {
    const userDocRef = doc(db, 'users', userId || '');
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData: User = {
          id: docSnap.id,
          username: docSnap.data().username,
          companyId: docSnap.data().companyId,
          role: docSnap.data().role,
          phone: docSnap.data().phone,
          status: docSnap.data().status,
          accessOutlets: docSnap.data().accessOutlets,
        }
        
        const firestoreInstance = getFirestore(app, userData.companyId);
        setUserDb(firestoreInstance);
        
        setUser(userData);
      } else {
        console.log("User tidak ditemukan di database");
        setUser(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching user:", error);
      setLoading(false);
    });

    return unsubscribe;
}

  // 2. Fungsi untuk mengecek status login saat aplikasi pertama kali dimuat (Refresh/Re-open)
  useEffect(() => {

    const loadStoredData = () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        const storedUserId = localStorage.getItem('userId');
        
        if (storedToken ) {
          setToken(storedToken);
          setIsAuthenticated(true);
        }
        if(storedUserId){
          setUserId(storedUserId);
        }
      } catch (error) {
        console.error("Gagal mengambil data dari localStorage", error);
      } finally {
        setLoading(false);
      }
    };

    loadStoredData();
  }, []);

  useEffect(() => {
    if (userId) {
      const unsubscribe = fetchUser();
      return () => unsubscribe();
    }
  }, [userId]);

  const setUpToken = async (token: string) =>{

    // 2. Sign in to Firebase with custom token and get user ID
    const userCred = await signInWithCustomToken(auth, token);
    setUserId(userCred.user.uid);
    localStorage.setItem('userId', userCred.user.uid);

    // // 3. Get Firebase ID Token and store it
    const idToken = await auth.currentUser?.getIdToken();
    if (idToken) {
        localStorage.setItem('authToken', idToken);
    } else {
        throw new Error('Failed to get Firebase ID Token.');
    }
    
    // Simpan ke State (biar UI langsung berubah)
    setToken(token);
  }
  // 3. Fungsi Login
  const login = async (username: string, password: string) => {
    // 1. Call backend to get custom token
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        username,
        password,
    });

    const { token } = response.data;

    if (!token) {
        throw new Error('No token received from server.');
    }
    await setUpToken(token);
  };

  // 4. Fungsi Logout
  const logout = async () => {
    // Hapus dari State
    setUser(null);
    setToken(null);

    auth.signOut();
  };

  // Value yang akan dibagikan ke seluruh aplikasi
  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated, // Helper untuk cek status login (true/false)
    loading,
    userDb
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Jangan render children sebelum loading selesai untuk menghindari flickering */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom Hook untuk memudahkan pemanggilan di komponen lain
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider");
  }
  return context;
};