// src/pages/LaporanPengeluaranPage.tsx

import React, { useState, useMemo } from 'react';
import { Menu, Filter, Printer, Banknote, Calendar, Tag, ChevronDown, ChevronUp, Download } from 'lucide-react';

interface LaporanPengeluaranPageProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
}

// --- TIPE DATA ---
interface ExpenseReportItem {
  id: number;
  date: string;
  category: string;
  description: string;
  amount: number;
  staff: string;
}

// --- GENERATOR DATA DUMMY ---
const generateMockExpenses = (): ExpenseReportItem[] => {
  const data: ExpenseReportItem[] = [];
  // Menambahkan contoh kategori panjang untuk tes tampilan
  const categories = [
    'Listrik & Air', 
    'Gaji Karyawan', 
    'Transportasi', 
    'Konsumsi', 
    'ATK', 
    'Maintenance & Perbaikan Inventaris Toko (AC/Kulkas/Rak)', // Contoh 50+ karakter
    'Sewa', 
    'Iuran Keamanan & Kebersihan Lingkungan'
  ];
  const staffs = ['Admin Vicky', 'Budi Gudang', 'Siti Kasir', 'Pak Eko'];
  const descriptions = ['Bayar token', 'Beli bensin', 'Makan siang lembur', 'Servis AC', 'Beli kertas struk', 'Iuran sampah', 'Ganti lampu putus'];

  const start = new Date(2024, 0, 1);
  const end = new Date();

  for (let i = 0; i < 100; i++) {
     const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
     const dateStr = `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}/${date.getFullYear()}`;
     
     // Random amount 50rb - 2jt
     const amount = (Math.floor(Math.random() * 40) + 1) * 50000;

     data.push({
         id: i,
         date: dateStr,
         category: categories[Math.floor(Math.random() * categories.length)],
         description: descriptions[Math.floor(Math.random() * descriptions.length)],
         amount: amount,
         staff: staffs[Math.floor(Math.random() * staffs.length)]
     });
  }
  
  return data.sort((a, b) => {
      const [da, ma, ya] = a.date.split('/').map(Number);
      const [db, mb, yb] = b.date.split('/').map(Number);
      return new Date(yb, mb-1, db).getTime() - new Date(ya, ma-1, da).getTime();
  });
};

const INITIAL_DATA = generateMockExpenses();

const LaporanPengeluaranPage: React.FC<LaporanPengeluaranPageProps> = ({ setIsSidebarOpen }) => {
  // --- STATE FILTER ---
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  
  const [reportData] = useState<ExpenseReportItem[]>(INITIAL_DATA);

  // Helper Format Rupiah
  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  // --- FILTER LOGIC ---
  const filteredData = useMemo(() => {
      return reportData.filter(item => {
          const [d, m, y] = item.date.split('/').map(Number);
          const monthMatch = (m - 1) === selectedMonth;
          const yearMatch = y === selectedYear;
          const catMatch = selectedCategory === 'ALL' || item.category === selectedCategory;
          return monthMatch && yearMatch && catMatch;
      });
  }, [reportData, selectedMonth, selectedYear, selectedCategory]);

  // --- SUMMARY CALCULATION ---
  const summary = useMemo(() => {
      return filteredData.reduce((acc, curr) => ({
          totalAmount: acc.totalAmount + curr.amount,
          totalTransactions: acc.totalTransactions + 1
      }), { totalAmount: 0, totalTransactions: 0 });
  }, [filteredData]);

  const monthNames = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
  const uniqueCategories = Array.from(new Set(reportData.map(d => d.category)));

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-100 font-sans overflow-hidden">
      
      {/* HEADER APP */}
      <div className="h-16 bg-white flex items-center justify-between px-6 border-b border-gray-200 shadow-sm flex-shrink-0 z-20">
         <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="hover:bg-gray-200 p-1 rounded">
                 <Menu className="w-6 h-6"/>
             </button>
             <h1 className="text-xl font-bold text-black uppercase flex items-center gap-2">
                <Banknote className="w-6 h-6 text-red-600"/> Laporan Pengeluaran
             </h1>
         </div>
         <div className="flex gap-2">
             <button onClick={() => window.print()} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors border border-gray-300">
                 <Printer className="w-4 h-4"/> Cetak
             </button>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6">

              {/* FILTER BAR */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-700 font-bold">
                      <Filter className="w-5 h-5"/> Filter Data:
                  </div>
                  <div className="flex flex-wrap gap-4 w-full md:w-auto">
                      
                      {/* DROPDOWN KATEGORI (MODIFIED: Auto Width / Mengikuti Karakter) */}
                      <div className="w-auto">
                          <label className="text-xs text-gray-500 font-bold block mb-1">Kategori</label>
                          <select 
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            // w-auto: lebar mengikuti konten
                            // min-w-[150px]: lebar minimal agar tidak terlalu kecil
                            // max-w-[400px]: batas maksimal agar tidak merusak layout jika terlalu panjang (opsional)
                            className="w-auto min-w-[150px] max-w-[400px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 bg-gray-50 font-medium cursor-pointer"
                          >
                              <option value="ALL">Semua Kategori</option>
                              {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                      </div>

                      <div className="flex-1 min-w-[120px]">
                          <label className="text-xs text-gray-500 font-bold block mb-1">Bulan</label>
                          <select 
                            value={selectedMonth} 
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 bg-gray-50 font-medium cursor-pointer"
                          >
                              {monthNames.map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
                          </select>
                      </div>
                      <div className="flex-1 min-w-[100px]">
                          <label className="text-xs text-gray-500 font-bold block mb-1">Tahun</label>
                          <select 
                            value={selectedYear} 
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 bg-gray-50 font-medium cursor-pointer"
                          >
                              {[currentYear, currentYear-1, currentYear-2].map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                      </div>
                  </div>
              </div>

              {/* REPORT CONTENT */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col">
                  
                  {/* HEADER LAPORAN */}
                  <div className="bg-red-50 p-6 border-b border-red-200 text-center">
                      <h2 className="text-2xl font-extrabold text-red-900 tracking-wider mb-1">REKAP PENGELUARAN</h2>
                      <p className="text-red-700 font-bold text-sm uppercase">PERIODE: {monthNames[selectedMonth]} {selectedYear}</p>
                  </div>

                  {/* SUMMARY CARDS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 border-b border-gray-200">
                      <div className="p-6 flex flex-col items-center justify-center border-r border-gray-200">
                          <div className="text-gray-500 text-xs font-bold uppercase mb-1">Total Pengeluaran</div>
                          <div className="text-3xl font-extrabold text-red-600">{formatRupiah(summary.totalAmount)}</div>
                      </div>
                      <div className="p-6 flex flex-col items-center justify-center">
                          <div className="text-gray-500 text-xs font-bold uppercase mb-1">Jumlah Transaksi</div>
                          <div className="text-2xl font-bold text-gray-800">{summary.totalTransactions}</div>
                      </div>
                  </div>

                  {/* TABLE CONTENT */}
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                          <thead>
                              <tr className="bg-gray-100 text-gray-600 border-b border-gray-200 uppercase text-xs font-bold tracking-wider">
                                  <th className="px-6 py-4 text-center w-16">No</th>
                                  <th className="px-6 py-4">Tanggal</th>
                                  <th className="px-6 py-4">Kategori</th>
                                  <th className="px-6 py-4">Keterangan</th>
                                  <th className="px-6 py-4">Staff</th>
                                  <th className="px-6 py-4 text-right">Jumlah</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {filteredData.length === 0 ? (
                                  <tr>
                                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">
                                          Tidak ada data pengeluaran pada periode ini.
                                      </td>
                                  </tr>
                              ) : (
                                  filteredData.map((item, index) => (
                                      <tr key={item.id} className="hover:bg-red-50/20 transition-colors">
                                          <td className="px-6 py-3 text-center text-gray-400 font-medium">{index + 1}</td>
                                          <td className="px-6 py-3 font-medium text-gray-700 whitespace-nowrap">{item.date}</td>
                                          <td className="px-6 py-3">
                                              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold border border-gray-200">
                                                  {item.category}
                                              </span>
                                          </td>
                                          <td className="px-6 py-3 text-gray-600">{item.description}</td>
                                          <td className="px-6 py-3 text-gray-600 text-xs">{item.staff}</td>
                                          <td className="px-6 py-3 text-right font-bold text-red-600">{formatRupiah(item.amount)}</td>
                                      </tr>
                                  ))
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default LaporanPengeluaranPage;