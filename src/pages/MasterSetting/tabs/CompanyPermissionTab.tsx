// src/pages/MasterSetting/tabs/CompanyPermissionTab.tsx

import React, { useState, useEffect } from 'react';
import { Edit, Save, X as XIcon, Shield, CheckSquare, Square, Building2, RotateCcw } from 'lucide-react';
import ConfirmationDialog from '../../../components/ConfirmationDialog';
import LoadingOverlay from '../../../components/LoadingOverlay';

// --- DATA PERMISSION (IDENTIK DENGAN USER GROUP) ---
const ALL_PERMISSIONS = {
    KASIR: [
        { key: 'pos.view', label: 'Akses Halaman Kasir' },
        { key: 'pos.custom_price', label: 'Ubah Harga Jual' },
        { key: 'pos.process_payment', label: 'Proses Pembayaran' },
        { key: 'pos.transaction_mode', label: 'Ganti Jenis Transaksi (Sales/PO)' },
        { key: 'pos.manage_customer', label: 'Tambah Customer Baru' },
        { key: 'pos.view_mode', label: 'Pilih Tampilan (List / Grid)' },
        { key: 'pos.loss_sale', label: 'Izin Jual Rugi (Loss Sale)' },
    ],
    PEMBELIAN: [
        { key: 'purchase.view', label: 'Akses Halaman Pembelian' },
        { key: 'purchase.custom_price', label: 'Ubah Harga Beli' },
        { key: 'purchase.process_payment', label: 'Proses Pembayaran Ke Supplier' },
        { key: 'purchase.transaction_mode', label: 'Ganti Jenis Transaksi (Regular/PO)' },
        { key: 'purchase.manage_supplier', label: 'Tambah Supplier Baru' },
        { key: 'purchase.view_mode', label: 'Pilih Tampilan (List / Grid)' },
    ],
    INVENTORY: [
        { key: 'inventory.view', label: 'Lihat Daftar Stok' },
        { key: 'inventory.add', label: 'Tambah Produk Baru' },
        { key: 'inventory.edit', label: 'Edit Detail Produk' },
        { key: 'inventory.delete', label: 'Hapus Produk' },
        { key: 'inventory.upload', label: 'Upload Data Excel' },
        { key: 'inventory.view_mode', label: 'Pilih Tampilan (List / Grid)' },
    ],
    STOK_MASUK: [
        { key: 'stock_in.view', label: 'Lihat Stok Masuk (PO)' },
        { key: 'stock_in.process', label: 'Proses Terima Barang' },
        { key: 'stock_in.force_complete', label: 'Paksa Selesai (Force Complete)' },
    ],
    BIAYA_OPERASIONAL: [
        { key: 'expense.view', label: 'Akses Halaman Pengeluaran' },
        { key: 'expense.add_category', label: 'Tambah Kategori Pengeluaran Baru' },
    ],
    PENGGAJIAN: [
        { key: 'payroll.view', label: 'Akses Halaman Penggajian' },
        { key: 'payroll.pay_salary', label: 'Proses Bayar Gaji' },
        { key: 'payroll.save_draft', label: 'Simpan Draft Gaji' },
        { key: 'payroll.add_overtime', label: 'Tambah Data Lembur' },
        { key: 'payroll.add_debt', label: 'Tambah Data Kasbon' },
    ],
    HUTANG_PIUTANG: [
        { key: 'finance.view', label: 'Akses Halaman Keuangan' },
        { key: 'finance.pay_installment', label: 'Bayar Cicilan Hutang/Piutang' },
        { key: 'finance.view_mode', label: 'Pilih Tampilan (List / Grid)' },
    ],
    LAPORAN: [
        { key: 'report.sales', label: 'Laporan Penjualan' },
        { key: 'report.purchase', label: 'Laporan Pembelian' },
        { key: 'report.expense', label: 'Laporan Pengeluaran' },
        { key: 'report.financial', label: 'Laba Rugi & Neraca' },
    ],
    PENGATURAN: [
        { key: 'setting.template_nota', label: 'Akses Template Struk' },
        { key: 'setting.template_faktur', label: 'Akses Template Faktur' },
        { key: 'setting.printer', label: 'Akses Printer Setting' },
        { key: 'setting.company', label: 'Akses Master Company' },
        { key: 'setting.outlet', label: 'Akses Master Outlet' },
        { key: 'setting.user_group', label: 'Akses Master User Group (Role)' },
        { key: 'setting.user', label: 'Akses Master User' },
        { key: 'setting.staff', label: 'Akses Master Staff' },
        { key: 'setting.customer', label: 'Akses Master Customer' },
        { key: 'setting.category', label: 'Akses Master Category Product' },
        { key: 'setting.numbering', label: 'Akses Master Penomoran' },
        { key: 'setting.tax', label: 'Akses Master Tax (Pajak)' },
        { key: 'setting.discount', label: 'Akses Master Diskon' },
        { key: 'setting.payment_method', label: 'Akses Master Metode Pembayaran' },
        { key: 'setting.supplier', label: 'Akses Master Supplier' },
        { key: 'setting.cash_bank', label: 'Akses Master Cash & Bank' },
        { key: 'setting.additional', label: 'Akses Additional Setting' },
    ]
};

interface CompanyPermission {
    id: string;
    name: string;
    permissions: string[];
}

const CompanyPermissionTab: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{isOpen: boolean, type: 'save' | 'reset'}>({
      isOpen: false,
      type: 'save'
  });
  
  const [companies, setCompanies] = useState<CompanyPermission[]>([
      { id: '1', name: "PT. MAJU BERSAMA", permissions: Object.values(ALL_PERMISSIONS).flat().map(p => p.key) },
      { id: '2', name: "CV. SUMBER REJEKI", permissions: ['pos.view', 'inventory.view'] },
      { id: '3', name: "TOKO BERKAH JAYA", permissions: ['pos.view'] },
  ]);

  const [form, setForm] = useState<CompanyPermission>(companies[0]);

  // --- HANDLER ---
  const handleSelectCompany = (company: CompanyPermission) => {
      if (!isEditing) {
          setForm(JSON.parse(JSON.stringify(company)));
          // Responsive: Scroll ke detail panel jika di layar mobile (< 1024px)
          const detailElement = document.getElementById('company-detail-panel');
          if(detailElement && window.innerWidth < 1024) {
              detailElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
      }
  };

  const handleEdit = () => setIsEditing(true);

  const handleCancel = () => {
      setIsEditing(false);
      const current = companies.find(c => c.id === form.id);
      if (current) setForm(current);
  };

  const handleConfirmedAction = async () => {
      setDialogConfig({ ...dialogConfig, isOpen: false });
      setIsLoading(true);

      await new Promise(resolve => setTimeout(resolve, 1200));

      if (dialogConfig.type === 'reset') {
          setForm({ ...form, permissions: [] });
          setIsLoading(false);
          alert("Permission dikosongkan.");
      } else {
          setCompanies(prev => prev.map(c => c.id === form.id ? form : c));
          setIsEditing(false);
          setIsLoading(false);
          alert("Permission Berhasil Diperbarui!");
      }
  };

  const togglePermission = (key: string) => {
      if (!isEditing) return;
      const current = form.permissions;
      setForm({ ...form, permissions: current.includes(key) ? current.filter(k => k !== key) : [...current, key] });
  };

  const toggleCategory = (categoryKeys: string[]) => {
      if (!isEditing) return;
      const allSelected = categoryKeys.every(k => form.permissions.includes(k));
      if (allSelected) {
          setForm({ ...form, permissions: form.permissions.filter(k => !categoryKeys.includes(k)) });
      } else {
          const newPerms = [...form.permissions];
          categoryKeys.forEach(k => { if (!newPerms.includes(k)) newPerms.push(k); });
          setForm({ ...form, permissions: newPerms });
      }
  };

  return (
    <div className="flex flex-col animate-in fade-in space-y-4 md:space-y-6 p-1 pb-24 md:pb-10">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 text-center mb-2 uppercase tracking-wider px-4">
            COMPANY PERMISSIONS
        </h2>
        
        {/* Responsive Layout: Stack di HP, Row di Desktop */}
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
            
            {/* PANEL KIRI: LIST COMPANY */}
            <div className="w-full lg:w-1/4 bg-white border border-gray-300 rounded-xl overflow-hidden shadow-sm flex flex-col h-fit lg:sticky lg:top-4">
                <div className="bg-gray-100 p-4 border-b border-gray-300 font-bold text-gray-700 text-sm flex justify-between items-center sticky top-0 z-10">
                    <span>Daftar Company</span>
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">{companies.length}</span>
                </div>
                
                {/* List container dengan scroll-x di mobile jika perlu, tapi vertikal tetap aman */}
                <div className="flex flex-col divide-y divide-gray-100 max-h-[300px] lg:max-h-none overflow-y-auto">
                    {companies.map(company => (
                        <div 
                            key={company.id} 
                            onClick={() => handleSelectCompany(company)}
                            className={`p-4 cursor-pointer hover:bg-blue-50 transition-colors ${form.id === company.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
                        >
                            <div className="font-bold text-gray-800 flex items-center gap-3">
                                <Building2 className={`w-5 h-5 ${form.id === company.id ? 'text-blue-500' : 'text-gray-400'}`}/> 
                                <span className="truncate">{company.name}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-200 text-center italic text-[10px] text-gray-400">
                    Edit daftar company di Master Company
                </div>
            </div>

            {/* PANEL KANAN: DETAIL PERMISSION */}
            <div id="company-detail-panel" className="flex-1 bg-white border border-gray-300 rounded-xl flex flex-col shadow-sm overflow-hidden min-h-screen lg:min-h-0">
                
                {/* HEADER PANEL - Sticky Mobile & Desktop */}
                <div className="p-4 md:p-6 border-b border-gray-200 bg-white sticky top-0 z-20 shadow-sm">
                    <div className="flex flex-col space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Company Terpilih</label>
                            <div className="text-lg md:text-xl font-black text-gray-800 truncate flex items-center gap-2">
                                <Building2 className="w-6 h-6 text-blue-600 flex-shrink-0" /> {form.name}
                            </div>
                        </div>
                        
                        {/* TOOLBAR BUTTONS: Stack di layar kecil, Row di layar sedang keatas */}
                        <div className="flex flex-col sm:flex-row justify-end gap-2 md:gap-3">
                            {!isEditing ? (
                                <button 
                                    onClick={handleEdit} 
                                    className="w-full sm:w-auto px-6 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg font-bold flex items-center justify-center gap-2 text-sm shadow-sm transition-transform active:scale-95"
                                >
                                    <Edit className="w-4 h-4"/> Edit Akses Modul
                                </button>
                            ) : (
                                <>
                                    <button 
                                        onClick={() => setDialogConfig({isOpen: true, type: 'reset'})} 
                                        className="w-full sm:w-auto px-4 py-2.5 border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 font-bold flex items-center justify-center gap-2 text-sm active:scale-95"
                                    >
                                        <RotateCcw className="w-4 h-4"/> Reset
                                    </button>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button 
                                            onClick={handleCancel} 
                                            className="flex-1 sm:w-auto px-4 py-2.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 font-bold flex items-center justify-center gap-2 text-sm active:scale-95"
                                        >
                                            <XIcon className="w-4 h-4"/> Batal
                                        </button>
                                        <button 
                                            onClick={() => setDialogConfig({isOpen: true, type: 'save'})} 
                                            className="flex-1 sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 text-sm shadow-md active:scale-95"
                                        >
                                            <Save className="w-4 h-4"/> Simpan
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* PERMISSION GRID - Scrollable area */}
                <div className="p-4 md:p-6 bg-gray-50 flex-1">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm md:text-base">
                        <Shield className="w-5 h-5 text-purple-600"/> Hak Akses Aplikasi
                    </h3>
                    
                    {/* Grid: 1 Kolom (HP), 2 Kolom (Tablet), 3 Kolom (Desktop XL) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
                        {Object.entries(ALL_PERMISSIONS).map(([category, items]) => {
                            const isAllSelected = items.every(i => form.permissions.includes(i.key));
                            const categoryKeys = items.map(i => i.key);

                            return (
                                <div key={category} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
                                    <div 
                                        className={`px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-white ${isEditing ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                                        onClick={() => toggleCategory(categoryKeys)}
                                    >
                                        <h4 className="font-bold text-[10px] md:text-xs text-gray-500 uppercase tracking-widest">{category.replace(/_/g, ' ')}</h4>
                                        {isEditing && (
                                            <span className="text-[9px] text-blue-600 font-black bg-blue-50 px-2 py-0.5 rounded uppercase">
                                                {isAllSelected ? 'Unselect' : 'Select All'}
                                            </span>
                                        )}
                                    </div>
                                   <div className="p-2 md:p-3 space-y-1">
                                        {items.map((perm) => {
                                            const isActive = form.permissions.includes(perm.key);
                                            return (
                                                <div 
                                                    key={perm.key} 
                                                    onClick={() => togglePermission(perm.key)}
                                                    className={`flex items-start gap-3 px-3 py-2.5 rounded-lg text-[13px] md:text-sm cursor-pointer transition-all ${!isEditing ? 'pointer-events-none opacity-80' : 'hover:bg-blue-50 active:bg-blue-100'}`}
                                                >
                                                    {isActive ? (
                                                        <CheckSquare className={`w-5 h-5 flex-shrink-0 ${isEditing ? 'text-blue-600' : 'text-green-600'}`}/>
                                                    ) : (
                                                        <Square className="w-5 h-5 flex-shrink-0 text-gray-300"/>
                                                    )}
                                                    <span className={`leading-tight mt-0.5 ${isActive ? 'text-gray-800 font-semibold' : 'text-gray-400'}`}>
                                                        {perm.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>

        {/* DIALOGS */}
        <ConfirmationDialog 
            isOpen={dialogConfig.isOpen}
            onConfirm={handleConfirmedAction}
            onCancel={() => setDialogConfig({ ...dialogConfig, isOpen: false })}
            title={dialogConfig.type === 'reset' ? "Reset Semua Modul?" : "Simpan Perubahan?"}
            message={dialogConfig.type === 'reset' 
                ? "Seluruh tanda centang akan dihapus. Anda harus menekan tombol 'Simpan' setelah ini untuk memprosesnya." 
                : "Akses modul untuk company ini akan segera diperbarui di database."}
            confirmText={dialogConfig.type === 'reset' ? "Ya, Reset" : "Ya, Simpan"}
        />

        <LoadingOverlay show={isLoading} message="Memproses sinkronisasi..." />
    </div>
  );
};

export default CompanyPermissionTab;