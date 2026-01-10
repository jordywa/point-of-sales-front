// src/pages/LaporanLabaRugiPage.tsx

import React, { useState, useMemo } from 'react';
import { Menu, Filter, Printer, TrendingUp, TrendingDown, DollarSign, PieChart, Calendar, ArrowRight } from 'lucide-react';

interface LaporanLabaRugiPageProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
}

// --- TYPE DEFINITIONS ---
interface MonthlyStats {
  revenue: number; // Omset Penjualan
  cogs: number;    // HPP (Harga Pokok Penjualan / Modal)
  expenses: { category: string; amount: number }[]; // Rincian Pengeluaran
}

// --- MOCK DATA GENERATOR ---
// Fungsi ini mensimulasikan data keuangan agar terlihat realistis
const generateFinancialData = (month: number, year: number): MonthlyStats => {
  // 1. Simulasi Penjualan (Omset & HPP)
  // Random range omset: 50jt - 150jt
  const baseRevenue = 50000000 + Math.random() * 100000000;
  // Margin rata-rata 20-30%, jadi HPP sekitar 70-80% dari omset
  const cogsRatio = 0.7 + Math.random() * 0.1; 
  const revenue = Math.floor(baseRevenue);
  const cogs = Math.floor(revenue * cogsRatio);

  // 2. Simulasi Pengeluaran Operasional
  const expenseCategories = [
    { name: 'Gaji Karyawan', base: 12000000, variance: 0 }, // Tetap
    { name: 'Listrik & Air', base: 1500000, variance: 500000 },
    { name: 'Sewa Gedung (Amortisasi)', base: 2500000, variance: 0 },
    { name: 'Transportasi & Bensin', base: 800000, variance: 400000 },
    { name: 'Konsumsi Harian', base: 1500000, variance: 300000 },
    { name: 'ATK & Perlengkapan', base: 300000, variance: 200000 },
    { name: 'Maintenance & Perbaikan', base: 500000, variance: 1000000 }, // Kadang ada kadang ngga
    { name: 'Iuran Lingkungan', base: 100000, variance: 0 },
    { name: 'Lain-lain', base: 200000, variance: 300000 },
  ];

  const expenses = expenseCategories.map(cat => ({
    category: cat.name,
    amount: Math.floor(cat.base + (Math.random() * cat.variance))
  }));

  return { revenue, cogs, expenses };
};

const LaporanLabaRugiPage: React.FC<LaporanLabaRugiPageProps> = ({ setIsSidebarOpen }) => {
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Helper Format Rupiah
  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  // --- CALCULATE DATA BASED ON FILTER ---
  const data = useMemo(() => {
      return generateFinancialData(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  // Derived Values
  const grossProfit = data.revenue - data.cogs; // Laba Kotor
  const totalOperatingExpenses = data.expenses.reduce((acc, curr) => acc + curr.amount, 0); // Total Pengeluaran
  const netProfit = grossProfit - totalOperatingExpenses; // Laba Bersih
  
  // Hitung Margin dalam Persen
  const grossMarginPercent = ((grossProfit / data.revenue) * 100).toFixed(1);
  const netMarginPercent = ((netProfit / data.revenue) * 100).toFixed(1);

  const monthNames = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-100 font-sans overflow-hidden">
      
      {/* HEADER APP */}
      <div className="h-16 bg-white flex items-center justify-between px-6 border-b border-gray-200 shadow-sm flex-shrink-0 z-20 print:hidden">
         <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="hover:bg-gray-200 p-1 rounded">
                 <Menu className="w-6 h-6"/>
             </button>
             <h1 className="text-xl font-bold text-black uppercase flex items-center gap-2">
                <PieChart className="w-6 h-6 text-purple-600"/> Laporan Laba Rugi
             </h1>
         </div>
         <div className="flex gap-2">
             <button onClick={() => window.print()} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors border border-gray-300">
                 <Printer className="w-4 h-4"/> Cetak PDF
             </button>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto space-y-6">

              {/* FILTER BAR (Hidden on Print) */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-end md:items-center justify-between print:hidden">
                  <div className="flex items-center gap-2 text-gray-700 font-bold">
                      <Filter className="w-5 h-5"/> Filter Periode:
                  </div>
                  <div className="flex gap-4 w-full md:w-auto">
                      <div className="flex-1 md:w-48">
                          <label className="text-xs text-gray-500 font-bold block mb-1">Bulan</label>
                          <select 
                            value={selectedMonth} 
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 bg-gray-50 font-medium cursor-pointer"
                          >
                              {monthNames.map((m, idx) => (
                                  <option key={idx} value={idx}>{m}</option>
                              ))}
                          </select>
                      </div>
                      <div className="flex-1 md:w-32">
                          <label className="text-xs text-gray-500 font-bold block mb-1">Tahun</label>
                          <select 
                            value={selectedYear} 
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 bg-gray-50 font-medium cursor-pointer"
                          >
                              {[currentYear, currentYear-1, currentYear-2].map(y => (
                                  <option key={y} value={y}>{y}</option>
                              ))}
                          </select>
                      </div>
                  </div>
              </div>

              {/* REPORT CARD */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden min-h-[600px] flex flex-col print:shadow-none print:border-none">
                  
                  {/* REPORT HEADER */}
                  <div className="bg-purple-50 p-8 border-b-2 border-purple-200 text-center print:bg-white print:border-black">
                      <h2 className="text-3xl font-extrabold text-purple-900 tracking-wider mb-2 print:text-black">LAPORAN LABA RUGI</h2>
                      <p className="text-purple-700 font-bold text-lg uppercase mb-4 print:text-black">PERIODE: {monthNames[selectedMonth]} {selectedYear}</p>
                      <div className="inline-block border-t border-purple-300 pt-2 px-8 print:border-black">
                          <p className="text-gray-600 font-bold text-sm tracking-widest uppercase print:text-black">CV. MAJU SENTOSA PLASTIK</p>
                      </div>
                  </div>

                  {/* CONTENT (INCOME STATEMENT FORMAT) */}
                  <div className="p-8 md:px-16 md:py-10">
                      
                      {/* 1. PENDAPATAN (REVENUE) */}
                      <div className="mb-8">
                          <div className="flex justify-between items-center mb-2 border-b border-gray-300 pb-1">
                              <h3 className="font-bold text-gray-800 text-lg uppercase flex items-center gap-2">
                                  <TrendingUp className="w-5 h-5 text-green-600"/> Pendapatan Usaha
                              </h3>
                          </div>
                          <div className="flex justify-between items-center py-2 text-gray-700">
                              <span className="font-medium">Penjualan (Omset)</span>
                              <span className="font-bold text-gray-900 text-lg">{formatRupiah(data.revenue)}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 text-gray-700">
                              <span className="font-medium">Harga Pokok Penjualan (HPP)</span>
                              <span className="font-bold text-red-600 text-lg">({formatRupiah(data.cogs)})</span>
                          </div>
                          
                          {/* LABA KOTOR */}
                          <div className="mt-2 bg-gray-100 p-4 rounded-lg flex justify-between items-center border-l-4 border-gray-500">
                              <div>
                                  <span className="font-bold text-gray-800 uppercase block">Laba Kotor (Gross Profit)</span>
                                  <span className="text-xs text-gray-500 font-semibold">Margin: {grossMarginPercent}%</span>
                              </div>
                              <span className="font-bold text-gray-900 text-xl">{formatRupiah(grossProfit)}</span>
                          </div>
                      </div>

                      {/* 2. BEBAN OPERASIONAL (EXPENSES) */}
                      <div className="mb-8">
                          <div className="flex justify-between items-center mb-2 border-b border-gray-300 pb-1">
                              <h3 className="font-bold text-gray-800 text-lg uppercase flex items-center gap-2">
                                  <TrendingDown className="w-5 h-5 text-red-600"/> Beban Operasional
                              </h3>
                          </div>
                          
                          <div className="space-y-1">
                              {data.expenses.map((exp, idx) => (
                                  <div key={idx} className="flex justify-between items-center py-1 text-gray-600 hover:bg-gray-50 px-2 rounded text-sm">
                                      <span>{exp.category}</span>
                                      <span className="font-medium">{formatRupiah(exp.amount)}</span>
                                  </div>
                              ))}
                          </div>

                          {/* TOTAL BEBAN */}
                          <div className="mt-4 flex justify-between items-center py-2 border-t border-dashed border-gray-400">
                              <span className="font-bold text-gray-700">Total Beban Operasional</span>
                              <span className="font-bold text-red-600 text-lg">({formatRupiah(totalOperatingExpenses)})</span>
                          </div>
                      </div>

                      {/* 3. LABA BERSIH (NET PROFIT) */}
                      <div>
                          <div className="bg-purple-100 p-6 rounded-xl border border-purple-200 flex justify-between items-center shadow-sm print:bg-gray-100 print:border-black">
                              <div>
                                  <h3 className="font-extrabold text-purple-900 text-xl uppercase mb-1 print:text-black">Laba Bersih (Net Profit)</h3>
                                  <div className="text-sm font-semibold text-purple-700 print:text-black flex items-center gap-1">
                                      Net Margin: <span className="bg-white px-2 py-0.5 rounded text-purple-800 border border-purple-200 print:border-black">{netMarginPercent}%</span>
                                  </div>
                              </div>
                              <div className="text-right">
                                  {netProfit >= 0 ? (
                                      <span className="text-3xl md:text-4xl font-extrabold text-green-600 print:text-black">{formatRupiah(netProfit)}</span>
                                  ) : (
                                      <span className="text-3xl md:text-4xl font-extrabold text-red-600 print:text-black">({formatRupiah(Math.abs(netProfit))})</span>
                                  )}
                              </div>
                          </div>
                      </div>

                  </div>

                  {/* FOOTER REPORT */}
                  <div className="bg-gray-50 p-6 text-center text-xs text-gray-400 border-t border-gray-200 mt-auto print:bg-white">
                      Generated by System pada {new Date().toLocaleString('id-ID')}
                  </div>

              </div>
          </div>
      </div>
    </div>
  );
};

export default LaporanLabaRugiPage;