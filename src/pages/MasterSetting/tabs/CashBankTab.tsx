// src/pages/MasterSetting/tabs/CashBankTab.tsx

import React, { useState, useEffect } from 'react';
import { Plus, Wallet, CreditCard, X, History } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { and, collection, onSnapshot, query, QueryDocumentSnapshot, where, type DocumentData } from 'firebase/firestore';
import authenticatedAxios from '../../../utils/api';
import { API_BASE_URL } from '../../../apiConfig';
import type { Bank } from '../../../types';

// --- TIPE DATA ---
interface TransactionLog {
    id: number;
    date: string;
    refNumber: string;
    category: string;
    type: 'IN' | 'OUT';
    amount: number;
    description: string;
}

interface AccountData {
    id: string;
    name: string;
    type: 'CASH' | 'BANK';
    balance: number;
    accountNumber?: string;
    history: TransactionLog[];
    companyId?: string;
}

const CashBankTab: React.FC = () => {
  const { user, userDb } = useAuth();
  // --- STATE ---
  const [accounts, setAccounts] = useState<AccountData[]>([]);

  // State Modal Tambah Akun
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [newAccountForm, setNewAccountForm] = useState<{name: string, type: 'CASH'|'BANK', balance: string, accNum: string}>({
      name: "", type: "CASH", balance: "", accNum: ""
  });

  // State Modal Detail
  const [selectedAccount, setSelectedAccount] = useState<AccountData | null>(null);

  // Fetch Banks from Firebase
  const fetchBanks = () => {
    if (!userDb) {
      console.error("Tidak ada dbnya: ", userDb);
      return null;
    }
    const bankCollection = collection(userDb, 'banks');

    const q = query(
      bankCollection,
      and(
        where('isDeleted', '==', false),
        where('companyId', '==', user?.companyId)
      )
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bankData: AccountData[] = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        name: doc.data().name ?? "",
        type: doc.data().type ?? "CASH",
        balance: doc.data().balance ?? 0,
        accountNumber: doc.data().accountNumber ?? "",
        history: doc.data().history ?? [],
        companyId: doc.data().companyId ?? ""
      }));
      setAccounts(bankData);
    }, (err) => {
      console.error('Error fetching banks:', err);
    });

    return unsubscribe;
  };

  useEffect(() => {
    const unsubscribeBanks = fetchBanks();
    return () => {
      if (unsubscribeBanks) unsubscribeBanks();
    };
  }, [userDb, user?.companyId]);

  // Helper Format Rupiah
  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  // --- LOGIC TAMBAH AKUN ---
  const handleSaveNewAccount = async () => {
      if (!newAccountForm.name) return alert("Nama Akun Wajib Diisi!");
      
      const newAcc = {
          name: newAccountForm.name,
          type: newAccountForm.type,
          balance: parseInt(newAccountForm.balance) || 0,
          accountNumber: newAccountForm.type === 'BANK' ? newAccountForm.accNum : undefined,
          companyId: user?.companyId ?? "",
          history: [] as TransactionLog[]
      };

      // Auto Catat Saldo Awal
      if (newAcc.balance > 0) {
          newAcc.history.push({
              id: Date.now(),
              date: new Date().toLocaleDateString('id-ID'),
              refNumber: 'OPENING',
              category: 'Saldo Awal',
              type: 'IN',
              amount: newAcc.balance,
              description: 'Saldo Awal Pembukaan Akun'
          });
      }

      try {
          const response = await authenticatedAxios.post(`${API_BASE_URL}/api/banks`, {
              ...newAcc
          });
          console.log("Insert bank response:", response);
          // Accept both 200 and 201 as success
          if (response.status === 200 || response.status === 201) {
              setIsAddAccountOpen(false);
              setNewAccountForm({ name: "", type: "CASH", balance: "", accNum: "" });
              alert("Akun Berhasil Ditambahkan!");
          } else {
              console.error("Unexpected status code:", response.status);
              alert(`Gagal menambahkan akun. Status: ${response.status}`);
          }
      } catch (error: any) {
          console.error("Error menambahkan akun:", error);
          console.error("Error response:", error?.response);
          const errorMsg = error?.response?.data?.message || error?.response?.data?.error || error?.message || "Gagal menambahkan akun. Silakan coba lagi.";
          alert(errorMsg);
      }
  };

  const handleOpenDetail = (account: AccountData) => {
      setSelectedAccount(account);
  };

  return (
    <div className="space-y-6 max-w-6xl animate-in fade-in flex flex-col h-full relative p-1">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6 uppercase tracking-wider">CASH & BANK</h2>
        
        {/* HEADER ACTION */}
        <div className="flex justify-end mb-4">
            <button onClick={() => setIsAddAccountOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-transform hover:scale-105">
                <Plus className="w-4 h-4"/> Tambah Akun
            </button>
        </div>

        {/* ACCOUNT CARDS GRID */}
        {/* Menggunakan auto-rows-fr agar tinggi kartu seragam */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {accounts.map(acc => (
                <div 
                    key={acc.id} 
                    className={`bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all relative flex flex-col justify-between h-full min-h-[280px] overflow-hidden group 
                    ${acc.type === 'CASH' ? 'border-t-4 border-t-green-500' : 'border-t-4 border-t-blue-500'}`}
                >
                    
                    {/* Top Section */}
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl shadow-sm ${acc.type === 'CASH' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                {acc.type === 'CASH' ? <Wallet className="w-8 h-8"/> : <CreditCard className="w-8 h-8"/>}
                            </div>
                            <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${acc.type === 'CASH' ? 'border-green-200 text-green-700 bg-green-50' : 'border-blue-200 text-blue-700 bg-blue-50'}`}>
                                {acc.type}
                            </span>
                        </div>
                        <div>
                            <div className="text-xl font-bold text-gray-800 leading-tight mb-1 truncate" title={acc.name}>{acc.name}</div>
                            <div className="text-gray-500 text-sm font-mono tracking-wide">{acc.accountNumber || "-"}</div>
                        </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="mt-6">
                        <div className="text-xs text-gray-500 mb-1 font-bold uppercase tracking-wider">Saldo Akhir</div>
                        <div className={`text-2xl font-extrabold ${acc.balance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                            {formatRupiah(acc.balance)}
                        </div>
                        
                        {/* TOMBOL LIHAT RIWAYAT (SOLID & COLORED) */}
                        <button 
                            onClick={() => handleOpenDetail(acc)} 
                            className={`mt-4 w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md
                            ${acc.type === 'CASH' 
                                ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-100' 
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'
                            }`}
                        >
                            <History className="w-4 h-4"/> Lihat Riwayat
                        </button>
                    </div>
                </div>
            ))}
        </div>

        {/* --- MODAL DETAIL RIWAYAT (FULL TABLE) --- */}
        {selectedAccount && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col h-[85vh] relative">
                    
                    {/* Header Modal (BERWARNA SESUAI TIPE) */}
                    <div className={`p-6 border-b flex justify-between items-center flex-shrink-0 text-white shadow-md
                        ${selectedAccount.type === 'CASH' ? 'bg-green-600 border-green-700' : 'bg-blue-600 border-blue-700'}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-md">
                                {selectedAccount.type === 'CASH' ? <Wallet className="w-8 h-8 text-white"/> : <CreditCard className="w-8 h-8 text-white"/>}
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold">{selectedAccount.name}</h3>
                                <div className="text-white/80 font-mono text-sm">{selectedAccount.accountNumber || "Cash Account"}</div>
                            </div>
                        </div>
                        <div className="text-right mr-6 hidden md:block">
                            <div className="text-xs text-white/70 uppercase font-bold tracking-widest">Saldo Saat Ini</div>
                            <div className="text-3xl font-bold">{formatRupiah(selectedAccount.balance)}</div>
                        </div>
                        <button onClick={() => setSelectedAccount(null)} className="p-2 bg-white/20 rounded-full text-white hover:bg-white/40 transition-colors">
                            <X className="w-6 h-6"/>
                        </button>
                    </div>

                    <div className="flex-1 bg-white flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center shadow-sm z-10">
                            <h4 className="font-bold text-gray-700 text-sm flex items-center gap-2"><History className="w-4 h-4"/> Mutasi Transaksi</h4>
                            <div className="text-xs text-gray-500 italic bg-white px-3 py-1 rounded border border-gray-200">
                                *Data tercatat otomatis dari sistem (Read-Only)
                            </div>
                        </div>
                        
                        {/* FIX: Tambahkan overflow-x-auto pada tabel di modal */}
                        <div className="flex-1 overflow-y-auto p-0 overflow-x-auto">
                            <table className="w-full text-sm text-left min-w-[700px]">
                                <thead className="bg-gray-100 text-gray-600 font-bold sticky top-0 shadow-sm z-10">
                                    <tr>
                                        <th className="px-6 py-4 w-32">Tanggal</th>
                                        <th className="px-6 py-4 w-40">No. Ref</th>
                                        <th className="px-6 py-4 w-48">Kategori</th>
                                        <th className="px-6 py-4">Keterangan</th>
                                        <th className="px-6 py-4 text-right">Mutasi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {selectedAccount.history.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-20 text-gray-400 italic flex flex-col items-center justify-center">
                                                <History className="w-12 h-12 mb-3 opacity-20"/>
                                                Belum ada riwayat transaksi.
                                            </td>
                                        </tr>
                                    ) : (
                                        selectedAccount.history.map((log) => (
                                            <tr key={log.id} className="hover:bg-gray-50 transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-medium">{log.date}</td>
                                                <td className="px-6 py-4 font-mono text-blue-600 font-bold text-xs">{log.refNumber}</td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-md text-xs border border-gray-200 font-bold">
                                                        {log.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-700">{log.description}</td>
                                                <td className={`px-6 py-4 text-right font-bold text-base ${log.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {log.type === 'IN' ? '+' : '-'} {formatRupiah(log.amount)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- MODAL TAMBAH AKUN --- */}
        {isAddAccountOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-xl w-96 p-6 shadow-2xl animate-in zoom-in duration-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Buat Akun Baru</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1">Nama Akun</label>
                            <input 
                                type="text" 
                                value={newAccountForm.name} 
                                onChange={(e) => setNewAccountForm({...newAccountForm, name: e.target.value})} 
                                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500" 
                                placeholder="Contoh: KAS KECIL"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1">Tipe</label>
                            <div className="flex gap-2">
                                <button onClick={() => setNewAccountForm({...newAccountForm, type: 'CASH'})} className={`flex-1 py-2 rounded text-sm font-bold border ${newAccountForm.type === 'CASH' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white border-gray-300 text-gray-500'}`}>CASH</button>
                                <button onClick={() => setNewAccountForm({...newAccountForm, type: 'BANK'})} className={`flex-1 py-2 rounded text-sm font-bold border ${newAccountForm.type === 'BANK' ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-white border-gray-300 text-gray-500'}`}>BANK</button>
                            </div>
                        </div>
                        {newAccountForm.type === 'BANK' && (
                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-1">No Rekening</label>
                                <input 
                                    type="text" 
                                    value={newAccountForm.accNum} 
                                    onChange={(e) => setNewAccountForm({...newAccountForm, accNum: e.target.value})} 
                                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500" 
                                    placeholder="Nomor Rekening..."
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1">Saldo Awal (Rp)</label>
                            <input 
                                type="number" 
                                value={newAccountForm.balance} 
                                onChange={(e) => setNewAccountForm({...newAccountForm, balance: e.target.value})} 
                                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-right font-mono" 
                                placeholder="0"
                            />
                        </div>
                        <div className="flex gap-2 mt-4 pt-2 border-t border-gray-100">
                            <button onClick={() => setIsAddAccountOpen(false)} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-bold">Batal</button>
                            <button onClick={handleSaveNewAccount} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-bold">Simpan</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default CashBankTab;