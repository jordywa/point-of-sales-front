// src/pages/LaporanNeracaPage.tsx

import React, { useState, useMemo } from 'react';
import { Menu, Printer, Scale, TrendingUp, Landmark, Wallet, AlertCircle, Calendar } from 'lucide-react';
import { INITIAL_INVENTORY_DATA } from '../../data/mockData';

interface LaporanNeracaPageProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const LaporanNeracaPage: React.FC<LaporanNeracaPageProps> = ({ setIsSidebarOpen }) => {
  const [currentDate] = useState(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }));

  // Helper Format Rupiah
  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  // --- 1. HITUNG HARTA (ASSETS) ---
  const assets = useMemo(() => {
      // a. Kas & Bank (Simulasi ambil dari CashBankTab)
      const cashBank = 5000000 + 12500000 + 3500000; // Total: 21.000.000

      // b. Persediaan Barang (Looping dari Mock Data Inventory)
      // Rumus: Stok Fisik (Karung * 50 * 5 + Pack * 5 + Pcs) * Harga Modal
      const inventoryValue = INITIAL_INVENTORY_DATA.reduce((total, item) => {
          return total + item.variants.reduce((subTotal, variant) => {
              const totalPcs = (variant.stockKarung * 250) + (variant.stockPack * 5) + variant.stockPcs;
              // Asumsi harga modal per Pcs = priceModal (per karung) / 250
              const costPerPcs = variant.priceModal / 250; 
              return subTotal + (totalPcs * costPerPcs);
          }, 0);
      }, 0);

      // c. Piutang Usaha (Simulasi dari FinancePage)
      const accountsReceivable = 15500000; // Contoh sisa piutang customer

      // d. Aset Tetap (Rak, Meja, Motor - Input Manual biasanya)
      const fixedAssets = 45000000; 

      return {
          cashBank,
          inventoryValue,
          accountsReceivable,
          fixedAssets,
          total: cashBank + inventoryValue + accountsReceivable + fixedAssets
      };
  }, []);

  // --- 2. HITUNG KEWAJIBAN (LIABILITIES) ---
  const liabilities = useMemo(() => {
      // a. Hutang Usaha (Simulasi dari FinancePage / Supplier)
      const accountsPayable = 8500000; 

      return {
          accountsPayable,
          total: accountsPayable
      };
  }, []);

  // --- 3. HITUNG MODAL (EQUITY) ---
  const equity = useMemo(() => {
      // a. Laba Berjalan (Ambil dari Laporan Laba Rugi - Simulasi)
      const currentEarnings = 12500000;

      // b. Modal Awal (ANGKA AJAIB / PENYEIMBANG)
      // Rumus: Total Harta - Total Hutang - Laba Berjalan
      const initialCapital = assets.total - liabilities.total - currentEarnings;

      return {
          initialCapital,
          currentEarnings,
          total: initialCapital + currentEarnings
      };
  }, [assets.total, liabilities.total]);

  // Total Pasiva (Kewajiban + Modal) -> Harus SAMA dengan Total Harta
  const totalPasiva = liabilities.total + equity.total;

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-100 font-sans overflow-hidden">
      
      {/* HEADER */}
      <div className="h-16 bg-white flex items-center justify-between px-6 border-b border-gray-200 shadow-sm flex-shrink-0 z-20 print:hidden">
         <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="hover:bg-gray-200 p-1 rounded">
                 <Menu className="w-6 h-6"/>
             </button>
             <h1 className="text-xl font-bold text-black uppercase flex items-center gap-2">
                <Scale className="w-6 h-6 text-teal-600"/> Laporan Neraca (Balance Sheet)
             </h1>
         </div>
         <button onClick={() => window.print()} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm border border-gray-300">
             <Printer className="w-4 h-4"/> Cetak
         </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 print:p-0">
          <div className="max-w-6xl mx-auto">
              
              {/* KOP LAPORAN */}
              <div className="bg-white p-8 rounded-t-xl border-b border-gray-200 text-center print:border-none">
                  <h2 className="text-3xl font-extrabold text-teal-900 tracking-wider mb-2">NERACA KEUANGAN</h2>
                  <div className="flex items-center justify-center gap-2 text-teal-700 font-bold text-sm uppercase">
                      <Calendar className="w-4 h-4"/> Per Tanggal: {currentDate}
                  </div>
                  <div className="mt-4 text-xs text-gray-400 italic">
                      *Posisi keuangan (Harta vs Modal) pada detik ini.
                  </div>
              </div>

              {/* KONTEN UTAMA - SPLIT VIEW */}
              <div className="flex flex-col md:flex-row bg-white rounded-b-xl shadow-lg overflow-hidden min-h-[500px]">
                  
                  {/* KOLOM KIRI: AKTIVA (HARTA) */}
                  <div className="flex-1 border-r border-gray-200 p-6 md:p-8 relative">
                      <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-teal-500">
                          <div className="p-2 bg-teal-100 rounded-lg text-teal-700">
                              <Wallet className="w-6 h-6"/>
                          </div>
                          <div>
                              <h3 className="text-xl font-extrabold text-gray-800">AKTIVA</h3>
                              <p className="text-xs text-gray-500">Segala sesuatu yang dimiliki toko (Harta)</p>
                          </div>
                      </div>

                      <div className="space-y-4">
                          {/* Aset Lancar */}
                          <div>
                              <h4 className="font-bold text-gray-600 uppercase text-xs mb-2">Aset Lancar</h4>
                              <div className="space-y-2 pl-2 border-l-2 border-gray-100">
                                  <div className="flex justify-between items-center text-sm group">
                                      <span className="text-gray-700 group-hover:text-teal-600 transition-colors">Kas & Bank</span>
                                      <span className="font-bold text-gray-900">{formatRupiah(assets.cashBank)}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-sm group">
                                      <span className="text-gray-700 group-hover:text-teal-600 transition-colors">Piutang Usaha (Bon Customer)</span>
                                      <span className="font-bold text-gray-900">{formatRupiah(assets.accountsReceivable)}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-sm group">
                                      <span className="text-gray-700 group-hover:text-teal-600 transition-colors">Persediaan Barang (Stok)</span>
                                      <span className="font-bold text-gray-900">{formatRupiah(assets.inventoryValue)}</span>
                                  </div>
                              </div>
                          </div>

                          {/* Aset Tetap */}
                          <div className="pt-4">
                              <h4 className="font-bold text-gray-600 uppercase text-xs mb-2">Aset Tetap</h4>
                              <div className="space-y-2 pl-2 border-l-2 border-gray-100">
                                  <div className="flex justify-between items-center text-sm group">
                                      <span className="text-gray-700 group-hover:text-teal-600 transition-colors">Inventaris (Rak, Meja, Kendaraan)</span>
                                      <span className="font-bold text-gray-900">{formatRupiah(assets.fixedAssets)}</span>
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* TOTAL KIRI */}
                      <div className="absolute bottom-0 left-0 w-full p-6 bg-teal-50 border-t border-teal-100">
                          <div className="flex justify-between items-center text-lg">
                              <span className="font-bold text-teal-900">TOTAL AKTIVA (Harta)</span>
                              <span className="font-extrabold text-teal-700 text-xl">{formatRupiah(assets.total)}</span>
                          </div>
                      </div>
                  </div>

                  {/* KOLOM KANAN: PASIVA (KEWAJIBAN + MODAL) */}
                  <div className="flex-1 p-6 md:p-8 relative bg-gray-50/30">
                      <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-orange-500">
                          <div className="p-2 bg-orange-100 rounded-lg text-orange-700">
                              <Landmark className="w-6 h-6"/>
                          </div>
                          <div>
                              <h3 className="text-xl font-extrabold text-gray-800">PASIVA</h3>
                              <p className="text-xs text-gray-500">Sumber dana harta (Utang + Modal)</p>
                          </div>
                      </div>

                      <div className="space-y-6">
                          {/* Kewajiban */}
                          <div>
                              <h4 className="font-bold text-gray-600 uppercase text-xs mb-2 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Kewajiban Jangka Pendek</h4>
                              <div className="space-y-2 pl-2 border-l-2 border-orange-100">
                                  <div className="flex justify-between items-center text-sm group">
                                      <span className="text-gray-700">Hutang Usaha (Ke Supplier)</span>
                                      <span className="font-bold text-red-600">({formatRupiah(liabilities.accountsPayable)})</span>
                                  </div>
                              </div>
                          </div>

                          {/* Ekuitas / Modal */}
                          <div className="pt-2">
                              <h4 className="font-bold text-gray-600 uppercase text-xs mb-2 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Ekuitas (Modal)</h4>
                              <div className="space-y-2 pl-2 border-l-2 border-orange-100">
                                  <div className="flex justify-between items-center text-sm bg-yellow-50 p-2 rounded border border-yellow-100" title="Angka penyeimbang otomatis">
                                      <div className="flex flex-col">
                                          <span className="text-gray-800 font-semibold">Modal Ditempatkan (Awal)</span>
                                          <span className="text-[10px] text-gray-500 italic">*Auto-Balance</span>
                                      </div>
                                      <span className="font-bold text-gray-900">{formatRupiah(equity.initialCapital)}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-sm p-2">
                                      <span className="text-gray-700">Laba Berjalan (Tahun Ini)</span>
                                      <span className="font-bold text-green-600">{formatRupiah(equity.currentEarnings)}</span>
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* TOTAL KANAN */}
                      <div className="absolute bottom-0 left-0 w-full p-6 bg-orange-50 border-t border-orange-100">
                          <div className="flex justify-between items-center text-lg">
                              <span className="font-bold text-orange-900">TOTAL PASIVA</span>
                              <span className="font-extrabold text-orange-700 text-xl">{formatRupiah(totalPasiva)}</span>
                          </div>
                      </div>
                  </div>

              </div>
          </div>
      </div>
    </div>
  );
};

export default LaporanNeracaPage;