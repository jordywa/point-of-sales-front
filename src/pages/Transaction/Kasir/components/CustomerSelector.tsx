// src/pages/Transaction/Kasir/components/CustomerSelector.tsx

import React, { useState, useEffect } from 'react';
import { User, X } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { and, collection, onSnapshot, query, QueryDocumentSnapshot, where, type DocumentData } from 'firebase/firestore';
import authenticatedAxios from '../../../../utils/api';
import { API_BASE_URL } from '../../../../apiConfig';
import type { Customer } from '../../../../types/index';
import { useToast } from '../../../../components/Toast';

interface CustomerData {
  id: string;
  name: string;
  category: string;
  phone: string;
  email: string;
  gender: 'L' | 'P' | '';
  dob: string;
  companyId?: string;
}

interface CustomerSelectorProps {
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  formatRupiah: (num: number) => string;
}

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  selectedCustomer,
  onSelectCustomer,
}) => {
  const { user, userDb } = useAuth();
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  // State Form New Customer
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustGender, setNewCustGender] = useState<'L' | 'P' | null>(null);
  const [newCustDob, setNewCustDob] = useState('');
  const [newCustNameError, setNewCustNameError] = useState(false);
  const [customerCategories, setCustomerCategories] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingAddCustomer, setIsLoadingAddCustomer] = useState(false);

  const { showToast, ToastComponent: ToastUI } = useToast();

  // Fetch Customer Categories from Firebase
  useEffect(() => {
    if (!userDb) return;

    const categoryCollection = collection(userDb, 'customer_categories');
    const q = query(
      categoryCollection,
      and(
        where('isDeleted', '==', false),
        where('companyId', '==', user?.companyId)
      )
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const categoryData = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        name: doc.data().name ?? '',
      }));
      setCustomerCategories(categoryData);
    }, (err) => {
      console.error('Error fetching customer categories:', err);
    });

    return () => unsubscribe();
  }, [userDb, user?.companyId]);

  // Fetch Customers from Firebase
  useEffect(() => {
    if (!userDb) return;

    const customerCollection = collection(userDb, 'customers');
    const q = query(
      customerCollection,
      and(
        where('isDeleted', '==', false),
        where('companyId', '==', user?.companyId)
      )
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customerData: CustomerData[] = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        name: doc.data().name ?? '',
        category: doc.data().category ?? '',
        phone: doc.data().phone ?? '',
        email: doc.data().email ?? '',
        gender: doc.data().gender ?? '',
        dob: doc.data().dob ?? '',
        companyId: doc.data().companyId ?? '',
      }));
      setCustomers(customerData);
    }, (err) => {
      console.error('Error fetching customers:', err);
    });

    return () => unsubscribe();
  }, [userDb, user?.companyId]);

  const filteredCustomers = customers.filter(
    (cust) =>
      cust.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      cust.phone?.includes(customerSearch)
  );

  const handleOpenNewCustomer = () => {
    setIsCustomerModalOpen(false);
    setIsNewCustomerModalOpen(true);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustEmail('');
    setNewCustGender(null);
    setNewCustDob('');
    setNewCustNameError(false);
  };

  const handleSubmitNewCustomer = async () => {
    if (!newCustName.trim()) {
      setNewCustNameError(true);
      showToast('Nama wajib diisi', 'error');
      return;
    }
    setIsLoadingAddCustomer(true);
    try {
      const response = await authenticatedAxios.post(`${API_BASE_URL}/api/customers`, {
        name: newCustName,
        category: customerCategories.length > 0 ? customerCategories[0].name : '',
        phone: newCustPhone,
        email: newCustEmail,
        gender: newCustGender || '',
        dob: newCustDob,
        companyId: user?.companyId ?? '',
      });

      if (response.status === 200 || response.status === 201) {
        setIsNewCustomerModalOpen(false);
        setNewCustName('');
        setNewCustPhone('');
        setNewCustEmail('');
        setNewCustGender(null);
        setNewCustDob('');
        const newCust: Customer = response.data;
        onSelectCustomer(newCust);
        showToast('Customer berhasil ditambahkan', 'success');
      }
    } catch (error: any) {
      console.error('Error adding customer:', error);
      showToast(error?.response?.data?.message || 'Gagal menambahkan customer. Silakan coba lagi.', 'error');
    } finally {
      setIsLoadingAddCustomer(false);
    }
  };

  const handleSelectCustomer = (cust: CustomerData) => {
    const customer: Customer = {
      id: parseInt(cust.id) || Date.now(),
      name: cust.name,
      phone: cust.phone,
      email: cust.email,
      gender: cust.gender === 'L' ? 'L' : cust.gender === 'P' ? 'P' : undefined,
      dob: cust.dob,
      points: 0,
    };
    onSelectCustomer(customer);
    setIsCustomerModalOpen(false);
    showToast('Customer berhasil dipilih', 'success');
  };

  return (
    <>
      <ToastUI />
      {/* CUSTOMER SECTION */}
      <div
        className="cursor-pointer hover:bg-gray-100 transition-colors bg-white group select-none shrink-0"
        onClick={() => setIsCustomerModalOpen(true)}
        title="Klik untuk ganti customer"
      >
        <div className="flex items-center gap-2">
          <div className="border border-black rounded-full p-1 group-hover:border-blue-500 transition-colors">
            <User className="w-4 h-4 hover:text-blue-500 transition-colors" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-xs items-center mt-0.5">
              <span className="font-bold text-blue-800 truncate max-w-[150px]">
                {selectedCustomer ? selectedCustomer.name : 'Add Customer'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL LIST CUSTOMER */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-3xl w-full max-w-[500px] p-6 shadow-2xl relative border border-gray-200">
            <div className="text-center font-medium text-lg mb-4">List Customer</div>
            <div className="relative mb-6 flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Cari nama atau nomor HP"
                  className="w-full pl-4 pr-4 py-2 border border-gray-500 rounded-full focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="space-y-3 mb-8 max-h-60 overflow-y-auto">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((cust) => (
                  <div key={cust.id} className="flex items-center justify-between">
                    <div className="flex gap-4 text-gray-800">
                      <span className="font-medium w-24 truncate">{cust.name}</span>
                      <span className="text-gray-600 w-32 hidden sm:inline">{cust.phone}</span>
                    </div>
                    <button
                      onClick={() => handleSelectCustomer(cust)}
                      className="bg-[#5EEAD4] text-black font-medium px-6 py-1 rounded-full hover:bg-teal-300 shadow-sm"
                    >
                      Choose
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">Customer tidak ditemukan</div>
              )}
            </div>
            <div className="flex justify-center">
              <button
                onClick={handleOpenNewCustomer}
                className="bg-[#3FA2F6] text-white px-8 py-2 rounded-xl text-lg hover:bg-blue-600 shadow-md flex items-center gap-2"
              >
                + Customer baru
              </button>
            </div>
            <button
              onClick={() => setIsCustomerModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL NEW CUSTOMER */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-3xl w-full max-w-[550px] p-8 shadow-2xl relative border border-gray-200">
            <div className="text-center font-medium text-lg mb-8">New Customer</div>
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 mb-1">Nama*</label>
                  <input
                    type="text"
                    value={newCustName}
                    onChange={(e) => {
                      setNewCustName(e.target.value);
                      setNewCustNameError(false);
                    }}
                    className={`w-full border ${
                      newCustNameError ? 'border-red-500 bg-red-50' : 'border-gray-400'
                    } rounded-xl px-3 py-2 focus:outline-none`}
                  />
                  {newCustNameError && (
                    <span className="text-red-500 text-xs mt-1">Nama wajib diisi</span>
                  )}
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Nomor HP</label>
                  <input
                    type="text"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full border border-gray-400 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newCustEmail}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                    className="w-full border border-gray-400 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Gender:</label>
                  <div className="flex border border-blue-300 rounded overflow-hidden w-40">
                    <button
                      onClick={() => setNewCustGender('L')}
                      className={`flex-1 py-1 text-center ${
                        newCustGender === 'L' ? 'bg-[#3FA2F6] text-white' : 'bg-white text-blue-400'
                      }`}
                    >
                      L
                    </button>
                    <button
                      onClick={() => setNewCustGender('P')}
                      className={`flex-1 py-1 text-center ${
                        newCustGender === 'P'
                          ? 'bg-[#3FA2F6] text-white'
                          : 'bg-white text-blue-400 border-l border-blue-300'
                      }`}
                    >
                      P
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Tanggal lahir:</label>
                <div className="relative w-full sm:w-1/2">
                  <input
                    type="date"
                    value={newCustDob}
                    onChange={(e) => setNewCustDob(e.target.value)}
                    className="w-full border border-gray-400 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="mt-10 flex justify-center">
              <button
                onClick={handleSubmitNewCustomer}
                className="bg-[#5EEAD4] text-black font-medium px-12 py-2 rounded-full hover:bg-teal-300 shadow-md text-lg"
                disabled={isLoadingAddCustomer}
              >
                {isLoadingAddCustomer ? 'Loading...' : 'Submit'}
              </button>
            </div>
            <button
              onClick={() => setIsNewCustomerModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
