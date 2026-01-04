// src/pages/LaporanPembelianPage.tsx

import React, { useState, useMemo } from 'react';
import { Menu, Filter, Printer, ShoppingCart, DollarSign, Truck, Package, ChevronDown, ChevronUp, Box, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface LaporanPembelianPageProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
}

// --- TIPE DATA ---
interface ProductDetail {
  name: string;
  qty: number;
  unit: string;
  price: number; // Harga Beli Satuan
  subtotal: number;
}

type PaymentStatus = 'LUNAS' | 'BELUM LUNAS' | 'PARSIAL';

interface PurchaseReportItem {
  id: number;
  date: string;       // DD/MM/YYYY
  invoiceNo: string;  // No Nota PO
  supplierName: string;
  totalQty: number;   
  totalPrice: number; // Total Nilai PO
  status: PaymentStatus; // Status Pembayaran
  items: ProductDetail[]; // Rincian Barang
}

// --- GENERATOR DATA DUMMY ---
const generateMockPurchaseReport = (): PurchaseReportItem[] => {
  const data: PurchaseReportItem[] = [];
  const suppliers = ['Sumber Makmur', 'Toko Plastik Jaya', 'Pabrik Wayang Utama', 'Aneka Plastik', 'Gudang Pusat', 'CV. Sejahtera']; 
  const productsList = [
      { name: 'Plastik Dayana 15x30', unit: 'Bal', price: 120000 },
      { name: 'Plastik Loco 24', unit: 'Bal', price: 115000 },
      { name: 'Kresek Hitam 28', unit: 'Bal', price: 75000 },
      { name: 'Gelas Cup 16oz', unit: 'Dus', price: 42000 },
      { name: 'Sedotan Steril', unit: 'Dus', price: 22000 },
      { name: 'Karet Gelang', unit: 'Karung', price: 850000 },
  ];

  const start = new Date(2025, 0, 1); // Jan 2025
  const end = new Date();

  for (let i = 0; i < 30; i++) {
     const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
     const dateStr = `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}/${date.getFullYear()}`;
     
     const itemCount = Math.floor(Math.random() * 3) + 1; 
     const currentItems: ProductDetail[] = [];
     let calculatedTotalQty = 0;
     let calculatedTotalPrice = 0;

     for (let j = 0; j < itemCount; j++) {
         const randomProd = productsList[Math.floor(Math.random() * productsList.length)];
         const qty = Math.floor(Math.random() * 20) + 5;
         const subtotal = qty * randomProd.price;
         
         currentItems.push({
             name: randomProd.name,
             qty: qty,
             unit: randomProd.unit,
             price: randomProd.price,
             subtotal: subtotal
         });

         calculatedTotalQty += qty;
         calculatedTotalPrice += subtotal;
     }

     // Random Status
     const rand = Math.random();
     let status: PaymentStatus = 'LUNAS';
     if (rand > 0.6) status = 'BELUM LUNAS';
     else if (rand > 0.5) status = 'PARSIAL';

     data.push({
         id: i,
         date: dateStr,
         invoiceNo: `PO${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}/${String(i+1).padStart(6,'0')}`,
         supplierName: suppliers[Math.floor(Math.random() * suppliers.length)],
         totalQty: calculatedTotalQty,
         totalPrice: calculatedTotalPrice,
         status: status,
         items: currentItems
     });
  }
  
  return data.sort((a, b) => {
      const [da, ma, ya] = a.date.split('/').map(Number);
      const [db, mb, yb] = b.date.split('/').map(Number);
      return new Date(yb, mb-1, db).getTime() - new Date(ya, ma-1, da).getTime();
  });
};

const INITIAL_DATA = generateMockPurchaseReport();

const LaporanPembelianPage: React.FC<LaporanPembelianPageProps> = ({ setIsSidebarOpen }) => {
  // --- STATE FILTER ---
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<number>(0); // Default Januari (0) agar sesuai screenshot
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  
  const [reportData] = useState<PurchaseReportItem[]>(INITIAL_DATA);

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  // --- FILTER LOGIC ---
  const filteredData = useMemo(() => {
      return reportData.filter(item => {
          const [d, m, y] = item.date.split('/').map(Number);
          return (m - 1) === selectedMonth && y === selectedYear;
      });
  }, [reportData, selectedMonth, selectedYear]);

  // --- SUMMARY CALCULATION ---
  const summary = useMemo(() => {
      return filteredData.reduce((acc, curr) => ({
          totalPembelian: acc.totalPembelian + curr.totalPrice, 
          totalQty: acc.totalQty + curr.totalQty,
          totalTransaksi: acc.totalTransaksi + 1
      }), { totalPembelian: 0, totalQty: 0, totalTransaksi: 0 });
  }, [filteredData]);

  const toggleRow = (id: number) => {
      setExpandedRowId(expandedRowId === id ? null : id);
  };

  const renderStatusBadge = (status: PaymentStatus) => {
      switch(status) {
          case 'LUNAS': 
              return <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full"><CheckCircle className="w-3 h-3"/> LUNAS</span>;
          case 'BELUM LUNAS': 
              return <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-100 text-red-700 px-2 py-1 rounded-full"><AlertCircle className="w-3 h-3"/> TEMPO</span>;
          case 'PARSIAL': 
              return <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded-full"><Clock className="w-3 h-3"/> PARSIAL</span>;
      }
  };

  const monthNames = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-100 font-sans overflow-hidden">
      
      {/* STYLE KHUSUS PRINT */}
      <style>{`
        @media print {
          @page { size: auto; margin: 0mm; }
          body * { visibility: hidden; }
          #printable-report, #printable-report * { visibility: visible; }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white;
            border: none;
            box-shadow: none;
          }
          .no-print { display: none !important; }
          tr.detail-row { display: none !important; }
        }
      `}</style>

      {/* HEADER APP (Hidden on Print) */}
      <div className="h-16 bg-white flex items-center justify-between px-6 border-b border-gray-200 shadow-sm flex-shrink-0 z-20 no-print">
         <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="hover:bg-gray-200 p-1 rounded">
                 <Menu className="w-6 h-6"/>
             </button>
             <h1 className="text-xl font-bold text-black uppercase flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-orange-600"/> Laporan Pembelian
             </h1>
         </div>
         <div className="flex gap-2">
             <button onClick={() => window.print()} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors border border-gray-300">
                 <Printer className="w-4 h-4"/> Cetak PDF
             </button>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6">

              {/* FILTER BAR */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-end md:items-center justify-between no-print">
                  <div className="flex items-center gap-2 text-gray-700 font-bold">
                      <Filter className="w-5 h-5"/> Filter Periode:
                  </div>
                  <div className="flex gap-4 w-full md:w-auto">
                      <div className="flex-1 md:w-48">
                          <label className="text-xs text-gray-500 font-bold block mb-1">Bulan</label>
                          <select 
                            value={selectedMonth} 
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 bg-gray-50 font-medium cursor-pointer"
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
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 bg-gray-50 font-medium cursor-pointer"
                          >
                              {[currentYear, currentYear-1, currentYear-2].map(y => (
                                  <option key={y} value={y}>{y}</option>
                              ))}
                          </select>
                      </div>
                  </div>
              </div>

              {/* REPORT CARD */}
              <div id="printable-report" className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden min-h-[600px] flex flex-col">
                  
                  {/* REPORT HEADER */}
                  <div className="bg-orange-50 p-8 border-b-2 border-orange-200 text-center print:bg-white print:border-black">
                      <h2 className="text-2xl md:text-3xl font-extrabold text-orange-900 tracking-wider mb-2 print:text-black">LAPORAN PEMBELIAN</h2>
                      <p className="text-orange-700 font-bold text-lg uppercase mb-4 print:text-black">PERIODE: {monthNames[selectedMonth]} {selectedYear}</p>
                      <div className="inline-block border-t border-orange-300 pt-2 px-8 print:border-black">
                          <p className="text-gray-600 font-bold text-sm tracking-widest uppercase print:text-black">CV. MAJU SENTOSA PLASTIK</p>
                      </div>
                  </div>

                  {/* SUMMARY CARDS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-200 bg-white border-b border-gray-200">
                      <div className="p-6 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors">
                          <div className="text-gray-500 text-xs font-bold uppercase mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3"/> Total Pembelian (PO)</div>
                          <div className="text-xl md:text-2xl font-bold text-red-600 print:text-black">{formatRupiah(summary.totalPembelian)}</div>
                      </div>
                      <div className="p-6 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors">
                          <div className="text-gray-500 text-xs font-bold uppercase mb-1 flex items-center gap-1"><Package className="w-3 h-3"/> Total Item Dibeli</div>
                          <div className="text-xl md:text-2xl font-bold text-gray-800">{summary.totalQty} <span className="text-sm font-normal text-gray-500">Unit</span></div>
                      </div>
                      <div className="p-6 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors">
                          <div className="text-gray-500 text-xs font-bold uppercase mb-1 flex items-center gap-1"><Truck className="w-3 h-3"/> Total Transaksi Pembelian</div>
                          <div className="text-xl md:text-2xl font-bold text-gray-800">{summary.totalTransaksi}</div>
                      </div>
                  </div>

                  {/* TABLE CONTENT */}
                  <div className="flex-1 overflow-x-auto p-0">
                      <table className="w-full text-sm text-left">
                          <thead>
                              <tr className="bg-gray-100 text-gray-600 border-b border-gray-200 uppercase text-xs font-bold tracking-wider print:bg-gray-200 print:text-black">
                                  <th className="px-6 py-4 text-center w-16">No</th>
                                  <th className="px-6 py-4">Tanggal</th>
                                  <th className="px-6 py-4">No. PO</th>
                                  <th className="px-6 py-4">Supplier</th>
                                  <th className="px-6 py-4 text-center">Status</th>
                                  <th className="px-6 py-4 text-center">Total Item</th>
                                  <th className="px-6 py-4 text-right">Nilai Transaksi</th>
                                  <th className="px-6 py-4 text-center no-print w-10"></th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {filteredData.length === 0 ? (
                                  <tr>
                                      <td colSpan={8} className="px-6 py-12 text-center text-gray-400 italic">
                                          Tidak ada data pembelian pada periode ini.
                                      </td>
                                  </tr>
                              ) : (
                                  filteredData.map((item, index) => (
                                      <React.Fragment key={item.id}>
                                          {/* MAIN ROW */}
                                          <tr 
                                            onClick={() => toggleRow(item.id)} 
                                            className={`hover:bg-orange-50/50 transition-colors cursor-pointer group ${expandedRowId === item.id ? 'bg-orange-50 border-l-4 border-l-orange-500' : 'border-l-4 border-l-transparent'}`}
                                          >
                                              {/* 1. NO */}
                                              <td className="px-6 py-3 text-center text-gray-400 font-medium">{index + 1}</td>
                                              
                                              {/* 2. TANGGAL */}
                                              <td className="px-6 py-3 font-medium text-gray-700 whitespace-nowrap">{item.date}</td>
                                              
                                              {/* 3. NO PO */}
                                              <td className="px-6 py-3 font-mono font-bold text-orange-600 print:text-black">{item.invoiceNo}</td>
                                              
                                              {/* 4. SUPPLIER (Tanpa Flex di TD langsung) */}
                                              <td className="px-6 py-3 font-semibold text-gray-800">
                                                  {item.supplierName}
                                              </td>

                                              {/* 5. STATUS (Kolom Sendiri) */}
                                              <td className="px-6 py-3 text-center">
                                                  <div className="flex justify-center">
                                                    {renderStatusBadge(item.status)}
                                                  </div>
                                              </td>

                                              {/* 6. TOTAL ITEM */}
                                              <td className="px-6 py-3 text-center text-gray-600 font-medium">{item.totalQty}</td>
                                              
                                              {/* 7. NILAI TRANSAKSI */}
                                              <td className="px-6 py-3 text-right font-bold text-gray-800">{formatRupiah(item.totalPrice)}</td>
                                              
                                              {/* 8. CHEVRON */}
                                              <td className="px-6 py-3 text-center no-print">
                                                  {expandedRowId === item.id ? <ChevronUp className="w-4 h-4 text-orange-600"/> : <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-orange-600"/>}
                                              </td>
                                          </tr>

                                          {/* DETAIL ROW (Accordion) - FIX: Responsive Padding */}
                                          {expandedRowId === item.id && (
                                              <tr className="bg-gray-50/50 no-print detail-row animate-in fade-in slide-in-from-top-1 duration-200">
                                                  <td colSpan={8} className="p-0">
                                                      {/* FIX: Ubah px-16 jadi px-4 md:px-16 agar di HP tidak gepeng */}
                                                      <div className="px-4 md:px-16 py-4 shadow-inner">
                                                          <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
                                                              <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
                                                                  <Box className="w-4 h-4 text-gray-500"/>
                                                                  <span className="text-xs font-bold text-gray-600 uppercase">Rincian Barang</span>
                                                              </div>
                                                              <table className="w-full text-xs min-w-[500px]">
                                                                  <thead>
                                                                      <tr className="border-b border-gray-100 text-gray-500">
                                                                          <th className="px-4 py-2 text-left">Nama Produk</th>
                                                                          <th className="px-4 py-2 text-center">Unit</th>
                                                                          <th className="px-4 py-2 text-center">Qty</th>
                                                                          <th className="px-4 py-2 text-right">Harga Beli</th>
                                                                          <th className="px-4 py-2 text-right">Subtotal</th>
                                                                      </tr>
                                                                  </thead>
                                                                  <tbody className="divide-y divide-gray-50 text-gray-700">
                                                                      {item.items.map((prod, idx) => (
                                                                          <tr key={idx} className="hover:bg-gray-50">
                                                                              <td className="px-4 py-2 font-medium">{prod.name}</td>
                                                                              <td className="px-4 py-2 text-center">{prod.unit}</td>
                                                                              <td className="px-4 py-2 text-center font-bold">{prod.qty}</td>
                                                                              <td className="px-4 py-2 text-right">{formatRupiah(prod.price)}</td>
                                                                              <td className="px-4 py-2 text-right font-bold text-gray-900">{formatRupiah(prod.subtotal)}</td>
                                                                          </tr>
                                                                      ))}
                                                                  </tbody>
                                                                  <tfoot className="bg-gray-50 border-t border-gray-200">
                                                                      <tr>
                                                                          <td colSpan={4} className="px-4 py-2 text-right font-bold text-gray-600">Total Transaksi</td>
                                                                          <td className="px-4 py-2 text-right font-bold text-orange-600 text-sm">{formatRupiah(item.totalPrice)}</td>
                                                                      </tr>
                                                                  </tfoot>
                                                              </table>
                                                          </div>
                                                      </div>
                                                  </td>
                                              </tr>
                                          )}
                                      </React.Fragment>
                                  ))
                              )}
                          </tbody>
                          {/* TABLE FOOTER SUMMARY */}
                          {filteredData.length > 0 && (
                              <tfoot className="bg-gray-50 border-t-2 border-gray-300 font-bold text-gray-800 print:bg-white">
                                  <tr>
                                      <td colSpan={5} className="px-6 py-4 text-right uppercase tracking-wider text-xs">Total Akhir</td>
                                      <td className="px-6 py-4 text-center text-base">{summary.totalQty}</td>
                                      <td className="px-6 py-4 text-right text-base text-red-700 print:text-black">{formatRupiah(summary.totalPembelian)}</td>
                                      <td className="no-print"></td>
                                  </tr>
                              </tfoot>
                          )}
                      </table>
                  </div>

              </div>
          </div>
      </div>
    </div>
  );
};

export default LaporanPembelianPage;