// src/pages/InputPengeluaranPage.tsx

import React, { useState } from 'react';
import { Menu, Save, Plus, Calendar, User, Wallet, Tag, FileText, XCircle, Banknote, FileBarChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ConfirmationDialog from '../../components/ConfirmationDialog';

interface InputPengeluaranPageProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
}

// Mock Data Master
const INITIAL_CATEGORIES = ['Listrik & Air', 'Gaji Karyawan', 'Transportasi', 'Konsumsi', 'ATK', 'Perbaikan & Maintenance', 'Iuran Keamanan', 'Internet & Wifi'];
const INITIAL_STAFF = ['Admin Vicky', 'Budi Gudang', 'Siti Kasir', 'Pak Eko Driver'];

const InputPengeluaranPage: React.FC<InputPengeluaranPageProps> = ({ setIsSidebarOpen }) => {
  const navigate = useNavigate();
  
  // --- STATE ---
  const today = new Date().toISOString().split('T')[0]; 
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);
  
  const [formData, setFormData] = useState({
      date: today,
      staffName: INITIAL_STAFF[0],
      category: '',
      description: '',
      amount: '',
      paymentMethod: '' // Default akan di-set ke cash
  });
  
  // Mock data payment methods from Cash Bank
  // # woi back end jordy: GET /api/cash-bank/accounts untuk ambil daftar akun cash/bank
  // Response: Array of { id: number, name: string, type: 'CASH' | 'BANK', balance: number }
  const paymentMethods = [
    { id: 1, name: "KAS TOKO", type: "CASH" as const },
    { id: 2, name: "BANK BCA", type: "BANK" as const },
  ];
  
  // Get default cash method
  const defaultCashMethod = paymentMethods.find(m => m.type === 'CASH')?.id || paymentMethods[0]?.id || "";
  
  // Set default payment method to cash on mount
  React.useEffect(() => {
      if (!formData.paymentMethod) {
          setFormData(prev => ({ ...prev, paymentMethod: String(defaultCashMethod) }));
      }
  }, []);

  // Modal Tambah Kategori
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  
  // Dialog state untuk validasi
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  // Helper Format Rupiah untuk Display Input
  const formatInputCurrency = (value: string) => {
      const rawValue = value.replace(/\D/g, '');
      if (!rawValue) return '';
      return new Intl.NumberFormat('id-ID').format(Number(rawValue));
  };

  // --- HANDLERS ---
  const handleInputChange = (field: string, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, amount: val }));
  };

  const handleSaveCategory = () => {
      if(!newCategoryName.trim()) return;
      if(categories.includes(newCategoryName)) {
          alert("Kategori sudah ada!");
          return;
      }
      // WOI BACKEND JORDY: INSERT kategori pengeluaran baru ke database
      // POST /api/expense-categories dengan body: { name: newCategoryName }
      setCategories([...categories, newCategoryName]);
      setFormData(prev => ({ ...prev, category: newCategoryName })); 
      setIsAddCategoryOpen(false);
      setNewCategoryName("");
  };

  const handleSubmit = () => {
      // Validasi wajib isi
      const missingFields: string[] = [];
      
      if (!formData.category) {
          missingFields.push("Kategori");
      }
      if (!formData.amount || Number(formData.amount) <= 0) {
          missingFields.push("Nominal");
      }
      if (!formData.description || !formData.description.trim()) {
          missingFields.push("Keterangan");
      }
      
      if (missingFields.length > 0) {
          setValidationMessage(`Mohon lengkapi field berikut:\n${missingFields.join(', ')}`);
          setShowValidationDialog(true);
          return;
      }
      
      // WOI BACKEND JORDY: INSERT data pengeluaran baru ke database
      // POST /api/expenses dengan body: 
      // { 
      //   date: formData.date, 
      //   staffName: formData.staffName, 
      //   category: formData.category, 
      //   description: formData.description, 
      //   amount: Number(formData.amount),
      //   paymentMethodId: formData.paymentMethod // ID dari cash bank account
      // }
      console.log("Saving Expense:", formData);
      alert("Pengeluaran Berhasil Disimpan!");
      
      // Reset Form (keep payment method default)
      setFormData(prev => ({ ...prev, category: '', description: '', amount: '', paymentMethod: String(defaultCashMethod) }));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 font-sans overflow-hidden">
      
      {/* HEADER */}
      <div className="h-16 bg-white flex items-center justify-between px-6 border-b border-gray-200 shadow-sm flex-shrink-0 z-20">
         <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="hover:bg-gray-200 p-1 rounded">
                 <Menu className="w-6 h-6"/>
             </button>
             <h1 className="text-xl font-bold text-black uppercase flex items-center gap-2">
                <Banknote className="w-6 h-6 text-red-600"/> Input Pengeluaran
             </h1>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center">
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden h-fit relative">
              
              <div className="bg-red-50 p-6 border-b border-red-100 flex items-center gap-4 relative">
                  <div className="bg-red-100 p-3 rounded-full">
                      <Wallet className="w-8 h-8 text-red-600"/>
                  </div>
                  <div>
                      <h2 className="text-xl font-bold text-red-900">Form Biaya Operasional</h2>
                      <p className="text-red-700 text-sm">Catat pengeluaran harian toko disini.</p>
                  </div>
                  {/* Tombol bulat ke laporan pengeluaran */}
                  <button
                      onClick={() => navigate('/laporan-pengeluaran')}
                      className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white rounded-full p-3 shadow-lg transition-all hover:scale-110 flex items-center justify-center"
                      title="Lihat Laporan Pengeluaran"
                  >
                      <FileBarChart className="w-5 h-5"/>
                  </button>
              </div>

              <div className="p-8 space-y-6">
                  {/* ROW 1: TANGGAL & STAFF */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-500"/> Tanggal Transaksi
                          </label>
                          <input 
                            type="date" 
                            value={formData.date}
                            readOnly 
                            className="w-full border border-gray-300 bg-gray-100 text-gray-500 rounded-lg px-4 py-3 focus:outline-none cursor-not-allowed font-bold"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-500"/> Pengeluaran Oleh (Staff)
                          </label>
                          <select 
                            value={formData.staffName}
                            onChange={(e) => handleInputChange('staffName', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-red-500 focus:outline-none bg-white cursor-pointer"
                          >
                              {INITIAL_STAFF.map(st => <option key={st} value={st}>{st}</option>)}
                          </select>
                      </div>
                  </div>

                  {/* ROW 2: KATEGORI & NOMINAL */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                              <Tag className="w-4 h-4 text-gray-500"/> Kategori Pengeluaran
                          </label>
                          <div className="flex gap-2">
                              <select 
                                value={formData.category}
                                onChange={(e) => handleInputChange('category', e.target.value)}
                                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:border-red-500 focus:outline-none bg-white cursor-pointer"
                              >
                                  <option value="" disabled>-- Pilih Kategori --</option>
                                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                              </select>
                              <button 
                                onClick={() => setIsAddCategoryOpen(true)}
                                className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 p-3 rounded-lg transition-colors"
                                title="Tambah Kategori Baru"
                              >
                                  <Plus className="w-5 h-5"/>
                              </button>
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                              <Wallet className="w-4 h-4 text-gray-500"/> Nominal (Rp)
                          </label>
                          <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rp</span>
                              <input 
                                type="text" 
                                value={formatInputCurrency(formData.amount)}
                                onChange={handleAmountChange}
                                placeholder="0"
                                className="w-full border border-gray-300 rounded-lg pl-12 pr-4 py-3 text-right font-bold text-xl text-red-600 focus:border-red-500 focus:outline-none placeholder:text-gray-300"
                              />
                          </div>
                      </div>
                  </div>

                  {/* ROW 3: METODE PEMBAYARAN & DESKRIPSI */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                              <Wallet className="w-4 h-4 text-gray-500"/> Metode Pembayaran
                          </label>
                          <select 
                            value={formData.paymentMethod}
                            onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-red-500 focus:outline-none bg-white cursor-pointer"
                          >
                              <option value="">Pilih Metode</option>
                              {paymentMethods.map(method => (
                                  <option key={method.id} value={String(method.id)}>
                                      {method.name} ({method.type})
                                  </option>
                              ))}
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-500"/> Keterangan / Catatan
                          </label>
                          <textarea 
                            rows={3}
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="Contoh: Beli token listrik untuk gudang..."
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-red-500 focus:outline-none text-sm resize-none"
                          />
                      </div>
                  </div>

                  {/* BUTTON ACTION */}
                  <div className="pt-4">
                      <button 
                        onClick={handleSubmit}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-3 transition-transform active:scale-[0.98] text-lg"
                      >
                          <Save className="w-6 h-6"/> SIMPAN PENGELUARAN
                      </button>
                  </div>
              </div>
          </div>
      </div>

      {/* MODAL TAMBAH KATEGORI */}
      {isAddCategoryOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center animate-in fade-in zoom-in duration-200">
              <div className="bg-white rounded-xl shadow-2xl w-96 p-6">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold">Tambah Kategori Baru</h3>
                      <button onClick={() => setIsAddCategoryOpen(false)}><XCircle className="w-6 h-6 text-gray-400 hover:text-red-500"/></button>
                  </div>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Nama Kategori</label>
                          <input 
                            type="text" 
                            autoFocus
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="Contoh: Uang Kebersihan"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500"
                          />
                      </div>
                      <button 
                        onClick={handleSaveCategory}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition-colors"
                      >
                          Simpan
                      </button>
                  </div>
              </div>
          </div>
      )}
      
      {/* Validation Dialog */}
      <ConfirmationDialog
        isOpen={showValidationDialog}
        onConfirm={() => {
          setShowValidationDialog(false);
          setValidationMessage("");
        }}
        onCancel={() => {
          setShowValidationDialog(false);
          setValidationMessage("");
        }}
        title="Validasi Gagal"
        message={validationMessage}
        confirmText="OK"
        cancelText="Batal"
        type="danger"
      />

    </div>
  );
};

export default InputPengeluaranPage;