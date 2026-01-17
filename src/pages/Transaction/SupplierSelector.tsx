// src/pages/Transaction/SupplierSelector.tsx

import React, { useState, useRef, useEffect } from 'react';
import { Building2, X, ChevronDown } from 'lucide-react';
import type { Supplier } from '../../types/index';
import { useAuth } from '../../context/AuthContext';
import { and, collection, onSnapshot, query, QueryDocumentSnapshot, where, type DocumentData } from 'firebase/firestore';
import authenticatedAxios from '../../utils/api';
import { API_BASE_URL } from '../../apiConfig';

interface SupplierSelectorProps {
  selectedSupplier: Supplier | null;
  onSelectSupplier: (supplier: Supplier | null) => void;
  currentInvoiceNo: string;
  transactionMode: 'TUNAI' | 'KREDIT';
  onTransactionModeChange: (mode: 'TUNAI' | 'KREDIT') => void;
  transactionMenuRef?: React.RefObject<HTMLDivElement | null>;
}

const SupplierSelector: React.FC<SupplierSelectorProps> = ({
  selectedSupplier,
  onSelectSupplier,
  currentInvoiceNo,
  transactionMode,
  onTransactionModeChange,
  transactionMenuRef
}) => {
  const { user, userDb } = useAuth();

  // --- SUPPLIER LOGIC ---
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingNewSupplier, setPendingNewSupplier] = useState<{name: string, phone: string} | null>(null);

  // --- State Form New Supplier ---
  const [newSuppName, setNewSuppName] = useState("");
  const [newSuppPhone, setNewSuppPhone] = useState("");
  const [newSuppContact, setNewSuppContact] = useState(""); // Contact Person
  const [newSuppEmail, setNewSuppEmail] = useState("");
  const [newSuppAddress, setNewSuppAddress] = useState("");
  const [newSuppAccountNumber, setNewSuppAccountNumber] = useState("");
  const [newSuppNameError, setNewSuppNameError] = useState(false);
  const [isTransactionMenuOpen, setIsTransactionMenuOpen] = useState(false);

  // Internal ref jika tidak ada dari parent
  const internalTransactionMenuRef = useRef<HTMLDivElement>(null);
  const menuRef = transactionMenuRef ? transactionMenuRef as React.RefObject<HTMLDivElement> : internalTransactionMenuRef;

  // --- FETCH SUPPLIERS FROM FIRESTORE ---
  const fetchSuppliers = () => {
    if (!userDb) {
      console.error("Tidak ada dbnya: ", userDb);
      return null;
    }
    const supplierCollection = collection(userDb, 'suppliers');

    const q = query(
      supplierCollection,
      and(
        where('isDeleted', '==', false),
        where('companyId', '==', user?.companyId)
      )
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const supplierData: Supplier[] = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        name: doc.data().name ?? "",
        contact: doc.data().contact ?? "",
        phone: doc.data().phone ?? "",
        email: doc.data().email ?? "",
        address: doc.data().address ?? "",
        accountNumber: doc.data().accountNumber ?? "",
        companyId: doc.data().companyId ?? ""
      }));
      setSuppliers(supplierData);
    }, (err) => {
      console.error('Error fetching suppliers:', err);
    });

    return unsubscribe;
  };

  useEffect(() => {
    const unsubscribeSuppliers = fetchSuppliers();
    return () => {
      if (unsubscribeSuppliers) unsubscribeSuppliers();
    };
  }, [userDb, user?.companyId]);

  // Auto-select supplier yang baru dibuat setelah suppliers ter-update
  useEffect(() => {
    if (pendingNewSupplier && suppliers.length > 0) {
      const newSupplier = suppliers.find(s => 
        s.name === pendingNewSupplier.name && 
        s.phone === pendingNewSupplier.phone &&
        s.companyId === user?.companyId
      );
      if (newSupplier) {
        onSelectSupplier(newSupplier);
        setPendingNewSupplier(null);
      }
    }
  }, [suppliers, pendingNewSupplier, user?.companyId, onSelectSupplier]);

  // --- CLICK OUTSIDE HANDLER ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsTransactionMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  const filteredSuppliers = suppliers.filter((supp) => 
    supp.name.toLowerCase().includes(supplierSearch.toLowerCase()) || 
    (supp.phone && supp.phone.includes(supplierSearch))
  );

  // --- SUPPLIER HANDLERS ---
  const handleOpenNewSupplier = () => {
    setIsSupplierModalOpen(false);
    setIsNewSupplierModalOpen(true);
    setNewSuppName("");
    setNewSuppPhone("");
    setNewSuppContact("");
    setNewSuppAddress("");
    setNewSuppEmail("");
    setNewSuppAccountNumber("");
    setNewSuppNameError(false);
  };

  const handleSubmitNewSupplier = async () => {
    if (!newSuppName.trim()) {
      setNewSuppNameError(true);
      return;
    }

    setIsSubmitting(true);

    const newSupplierData = {
      name: newSuppName,
      contact: newSuppContact,
      phone: newSuppPhone,
      email: newSuppEmail,
      address: newSuppAddress,
      accountNumber: newSuppAccountNumber,
      companyId: user?.companyId ?? ""
    };

    try {
      const response = await authenticatedAxios.post(`${API_BASE_URL}/api/suppliers`, {
        ...newSupplierData
      });
      console.log("Insert supplier response:", response);
      
      // Accept both 200 and 201 as success
      if (response.status === 200 || response.status === 201) {
        // Set pending supplier untuk auto-select setelah onSnapshot update
        setPendingNewSupplier({
          name: newSuppName,
          phone: newSuppPhone
        });
        
        // Reset form
        setNewSuppName("");
        setNewSuppPhone("");
        setNewSuppContact("");
        setNewSuppAddress("");
        setNewSuppEmail("");
        setNewSuppAccountNumber("");
        setNewSuppNameError(false);
        setIsNewSupplierModalOpen(false);
        
        alert("Data Supplier Berhasil Ditambahkan!");
      } else {
        console.error("Unexpected status code:", response.status);
        alert(`Gagal menambahkan supplier. Status: ${response.status}`);
      }
    } catch (error: any) {
      console.error("Error menambahkan supplier:", error);
      console.error("Error response:", error?.response);
      const errorMsg = error?.response?.data?.message || error?.response?.data?.error || error?.message || "Gagal menambahkan supplier. Silakan coba lagi.";
      alert(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectSupplier = (supp: Supplier) => {
    onSelectSupplier(supp);
    setIsSupplierModalOpen(false);
  };

  return (
    <>
      {/* SUPPLIER SECTION & TRANSACTION DROPDOWN */}
      <div 
        className="px-3 py-2 border-b border-black cursor-pointer hover:bg-gray-100 transition-colors bg-white group select-none shrink-0"
        onClick={() => setIsSupplierModalOpen(true)}
        title="Klik untuk ganti supplier"
      >
        <div className="flex items-center gap-2">
           <div className="border border-black rounded-full p-1 group-hover:border-blue-500 transition-colors">
             <Building2 className="w-5 h-5 group-hover:text-blue-500 transition-colors" />
           </div>
           <div className="flex-1">
             
             {/* TRANSACTION TYPE - FIXED OPTIONS */}
             <div className="relative text-center" ref={menuRef} onClick={(e) => e.stopPropagation()}>
                <h2 
                   className="text-base font-bold text-center flex items-center justify-center gap-1 hover:text-blue-700 transition-colors select-none cursor-pointer"
                   onClick={() => setIsTransactionMenuOpen(!isTransactionMenuOpen)}
                >
                    {transactionMode === 'TUNAI' ? 'PEMBELIAN' : 'PEMBELIAN PO'}
                    <ChevronDown className="w-4 h-4"/>
                </h2>
                
                {isTransactionMenuOpen && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                        <button onClick={() => { onTransactionModeChange('TUNAI'); setIsTransactionMenuOpen(false); }} className={`w-full px-3 py-2 text-left hover:bg-gray-100 text-xs font-bold ${transactionMode === 'TUNAI' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}>PEMBELIAN</button>
                        <button onClick={() => { onTransactionModeChange('KREDIT'); setIsTransactionMenuOpen(false); }} className={`w-full px-3 py-2 text-left hover:bg-gray-100 text-xs font-bold ${transactionMode === 'KREDIT' ? 'text-yellow-600 bg-yellow-50' : 'text-gray-700'}`}>PEMBELIAN PO</button>
                    </div>
                )}
             </div>

             <div className="flex justify-between text-xs items-center mt-0.5">
               <span className="font-bold text-blue-800 truncate max-w-[150px]">
                  {selectedSupplier ? selectedSupplier.name : "Pilih Supplier"}
               </span>
               <span className="font-bold">{currentInvoiceNo}</span>
              </div>
           </div>
        </div>
      </div>

      {/* --- MODAL LIST SUPPLIER --- */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-3xl w-full max-w-[500px] p-6 shadow-2xl relative border border-gray-200">
            <div className="text-center font-medium text-lg mb-4">List Supplier</div>
            <div className="relative mb-6 flex gap-2">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  value={supplierSearch} 
                  onChange={(e) => setSupplierSearch(e.target.value)} 
                  placeholder="Cari Supplier..." 
                  className="w-full pl-4 pr-4 py-2 border border-gray-500 rounded-full focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="space-y-3 mb-8 max-h-60 overflow-y-auto">
              {filteredSuppliers.length > 0 ? (
                filteredSuppliers.map(supp => (
                  <div key={supp.id} className="flex items-center justify-between">
                    <div className="flex gap-4 text-gray-800">
                      <span className="font-medium w-24 truncate">{supp.name}</span>
                      <span className="text-gray-600 w-32 hidden sm:inline">{supp.phone}</span>
                    </div>
                    <button 
                      onClick={() => handleSelectSupplier(supp)} 
                      className="bg-[#5EEAD4] text-black font-medium px-6 py-1 rounded-full hover:bg-teal-300 shadow-sm"
                    >
                      Pilih
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">Supplier tidak ditemukan</div>
              )}
            </div>
            <div className="flex justify-center">
              <button 
                onClick={handleOpenNewSupplier} 
                className="bg-[#3FA2F6] text-white px-8 py-2 rounded-xl text-lg hover:bg-blue-600 shadow-md flex items-center gap-2"
              >
                + Supplier baru
              </button>
            </div>
            <button 
              onClick={() => setIsSupplierModalOpen(false)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-black"
            >
              <X className="w-6 h-6"/>
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL NEW SUPPLIER --- */}
      {isNewSupplierModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-3xl w-full max-w-[550px] p-8 shadow-2xl relative border border-gray-200">
            <div className="text-center font-medium text-lg mb-8">Supplier Baru</div>
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 mb-1">Nama Perusahaan*</label>
                  <input 
                    type="text" 
                    value={newSuppName} 
                    onChange={(e) => { 
                      setNewSuppName(e.target.value); 
                      setNewSuppNameError(false); 
                    }} 
                    className={`w-full border ${newSuppNameError ? 'border-red-500 bg-red-50' : 'border-gray-400'} rounded-xl px-3 py-2 focus:outline-none`}
                  />
                  {newSuppNameError && <span className="text-red-500 text-xs mt-1">Nama wajib diisi</span>}
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Telepon</label>
                  <input 
                    type="text" 
                    value={newSuppPhone} 
                    onChange={(e) => setNewSuppPhone(e.target.value)} 
                    className="w-full border border-gray-400 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 mb-1">Kontak Person</label>
                  <input 
                    type="text" 
                    value={newSuppContact} 
                    onChange={(e) => setNewSuppContact(e.target.value)} 
                    className="w-full border border-gray-400 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    value={newSuppEmail} 
                    onChange={(e) => setNewSuppEmail(e.target.value)} 
                    className="w-full border border-gray-400 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Alamat</label>
                <textarea 
                  value={newSuppAddress} 
                  onChange={(e) => setNewSuppAddress(e.target.value)} 
                  className="w-full border border-gray-400 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500" 
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Nomor Rekening</label>
                <input 
                  type="text" 
                  value={newSuppAccountNumber} 
                  onChange={(e) => setNewSuppAccountNumber(e.target.value)} 
                  className="w-full border border-gray-400 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
                  placeholder="Nomor Rekening Bank"
                />
              </div>
            </div>
            <div className="mt-10 flex justify-center">
              <button 
                onClick={handleSubmitNewSupplier}
                disabled={isSubmitting}
                className="bg-[#5EEAD4] text-black font-medium px-12 py-2 rounded-full hover:bg-teal-300 shadow-md text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
            <button 
              onClick={() => setIsNewSupplierModalOpen(false)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-black"
            >
              <X className="w-6 h-6"/>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SupplierSelector;
