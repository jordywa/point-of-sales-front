// src/pages/HutangPiutangPage.tsx

import React, { useState, useMemo } from 'react';
import { Menu, Search, Wallet, ArrowRight, Calendar, CheckCircle, XCircle, Banknote, History, CreditCard, ArrowLeft, AlertTriangle, ChevronDown, Package, LayoutGrid, List } from 'lucide-react';

interface HutangPiutangPageProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
}

// --- TIPE DATA ---
interface PaymentRecord {
  id: number;
  date: string;
  amount: number;
  note: string;
}

interface TransactionItem {
  id: number;
  name: string;
  variant: string;
  unit: string;
  qty: number;
  qtyPO?: number; // Khusus Piutang Customer
  price: number;
  note?: string;
}

interface DebtTransaction {
  id: string; 
  date: string;
  entityName: string; 
  type: 'PIUTANG' | 'HUTANG'; 
  totalAmount: number;
  paidAmount: number;
  status: 'BELUM_LUNAS' | 'LUNAS';
  dueDate?: string;
  items: TransactionItem[]; // Tambahan: Rincian Barang
  paymentHistory: PaymentRecord[];
}

// --- GENERATOR DATA DUMMY ---
const generateMockTransactions = (): DebtTransaction[] => {
  const data: DebtTransaction[] = [];
  const entitiesCust = ['Budi Santoso', 'Warung Bu Ijah', 'Toko Abadi', 'Ibu Ani', 'Pak Eko'];
  const entitiesSupp = ['Toko Plastik Jaya', 'Pabrik Wayang', 'CV. Makmur', 'Sumber Rejeki', 'Gudang Utama'];
  
  const productNames = ['Plastik Dayana', 'Plastik Loco', 'Plastik Wayang', 'Gelas Cup', 'Sedotan Steril', 'Kresek Hitam', 'Karet Gelang'];
  const variants = ['Ukuran 15x30', 'Ukuran 20x40', 'Ukuran Jumbo', 'Warna Merah', 'Warna Putih', 'Standard'];
  const units = ['Pak', 'Bal', 'Dus', 'Ikat', 'Kg'];

  // Helper Random Date
  const getRandomDate = () => {
     const end = new Date();
     const start = new Date();
     start.setFullYear(end.getFullYear() - 3);
     const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
     return {
         obj: date,
         str: `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}/${date.getFullYear()}`,
         ym: `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}`
     };
  };

  const getRandomDueDate = (baseDate: Date) => {
      const due = new Date(baseDate.getTime() + (Math.random() * 30 + 7) * 24 * 60 * 60 * 1000);
      return `${String(due.getDate()).padStart(2,'0')}/${String(due.getMonth()+1).padStart(2,'0')}/${due.getFullYear()}`;
  };

  for (let i = 1; i <= 50; i++) {
     const isPiutang = Math.random() > 0.5;
     const type = isPiutang ? 'PIUTANG' : 'HUTANG';
     const dateInfo = getRandomDate();
     
     // Generate Items
     const itemCount = Math.floor(Math.random() * 3) + 1;
     const items: TransactionItem[] = [];
     let totalAmount = 0;

     for(let k=0; k<itemCount; k++) {
         const qty = Math.floor(Math.random() * 50) + 5;
         const qtyPO = isPiutang && Math.random() > 0.7 ? Math.floor(Math.random() * 10) : 0; // Kadang ada qtyPO di Piutang
         const price = (Math.floor(Math.random() * 50) + 5) * 1000;
         
         totalAmount += price * (qty + qtyPO); // Total including PO

         items.push({
             id: k,
             name: productNames[Math.floor(Math.random() * productNames.length)],
             variant: variants[Math.floor(Math.random() * variants.length)],
             unit: units[Math.floor(Math.random() * units.length)],
             qty: qty,
             qtyPO: qtyPO,
             price: price,
             note: Math.random() > 0.7 ? 'Titipan sales' : ''
         });
     }

     const isLunas = Math.random() > 0.6; 
     const paid = isLunas ? totalAmount : (Math.random() > 0.5 ? Math.floor(totalAmount * 0.5) : 0);

     // Format ID: SOYYYYMM/xxxxxx atau POYYYYMM/xxxxxx
     const prefix = isPiutang ? 'SO' : 'PO';
     const id = `${prefix}${dateInfo.ym}/${String(i).padStart(6,'0')}`;

     data.push({
         id: id,
         date: dateInfo.str,
         entityName: isPiutang 
            ? `${entitiesCust[Math.floor(Math.random() * entitiesCust.length)]} (Customer)` 
            : `${entitiesSupp[Math.floor(Math.random() * entitiesSupp.length)]} (Supplier)`,
         type: type,
         totalAmount: totalAmount,
         paidAmount: paid,
         status: isLunas ? 'LUNAS' : 'BELUM_LUNAS',
         dueDate: getRandomDueDate(dateInfo.obj), 
         items: items,
         paymentHistory: paid > 0 ? [{ id: i, date: getRandomDate().str, amount: paid, note: 'Cicilan/Pelunasan' }] : []
     });
  }

  // DATA MANUAL
  data.unshift({
    id: 'SO202512/000001',
    date: '01/12/2025',
    entityName: 'Budi Santoso (Customer)',
    type: 'PIUTANG',
    totalAmount: 1500000,
    paidAmount: 500000,
    status: 'BELUM_LUNAS',
    dueDate: '01/01/2026',
    items: [
        { id: 1, name: 'Plastik Dayana', variant: '15x30', unit: 'Bal', qty: 10, qtyPO: 5, price: 100000, note: 'Sisa stok besok' }
    ],
    paymentHistory: [{ id: 1, date: '05/12/2025', amount: 500000, note: 'DP Awal' }]
  });

  return data;
};

const INITIAL_TRANSACTIONS = generateMockTransactions();

const HutangPiutangPage: React.FC<HutangPiutangPageProps> = ({ setIsSidebarOpen }) => {
  const [activeTab, setActiveTab] = useState<'PIUTANG' | 'HUTANG'>('PIUTANG'); 
  const [transactions, setTransactions] = useState<DebtTransaction[]>(INITIAL_TRANSACTIONS);
  const [searchQuery, setSearchQuery] = useState("");
  
  // --- FILTER STATES ---
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'BELUM_LUNAS' | 'LUNAS' | 'OVERDUE'>('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState<number>(2); 

  // State Seleksi & Tampilan Mobile/Tablet
  const [selectedTransaction, setSelectedTransaction] = useState<DebtTransaction | null>(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false); 
  const [isTabletView, setIsTabletView] = useState(false); // [NEW] Toggle Tablet View

  // --- MODAL PEMBAYARAN STATE ---
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<string>("");
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [payNote, setPayNote] = useState<string>("");

  // Helper Format Rupiah
  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const formatInputCurrency = (value: string) => {
    const rawValue = value.replace(/\D/g, '');
    if (!rawValue) return '';
    return new Intl.NumberFormat('id-ID').format(Number(rawValue));
  };

  const handlePayAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const rawVal = val.replace(/\./g, ''); 
    setPayAmount(rawVal);
  };

  // --- FILTER LOGIC ---
  const filteredData = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - dateRangeFilter);
    cutoffDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return transactions.filter(t => {
      if (t.type !== activeTab) return false;

      const matchesSearch = t.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            t.entityName.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (statusFilter === 'LUNAS' && t.status !== 'LUNAS') return false;
      if (statusFilter === 'BELUM_LUNAS' && t.status !== 'BELUM_LUNAS') return false;
      
      if (statusFilter === 'OVERDUE') {
          if (t.status === 'LUNAS') return false;
          if (!t.dueDate) return false; 
          const [dd, mm, yy] = t.dueDate.split('/').map(Number);
          const dueObj = new Date(yy, mm - 1, dd);
          if (dueObj >= today) return false; 
      }

      const [day, month, year] = t.date.split('/').map(Number);
      const transDate = new Date(year, month - 1, day);
      if (transDate < cutoffDate) return false;

      return true;
    });
  }, [transactions, activeTab, searchQuery, statusFilter, dateRangeFilter]);

  // --- HANDLER ---
  const handleSelectTransaction = (item: DebtTransaction) => {
      setSelectedTransaction(item);
      setShowMobileDetail(true); 
  };

  const handleBackToList = () => {
      setShowMobileDetail(false); 
  };

  const handleOpenPayModal = () => {
    if(!selectedTransaction) return;
    setPayAmount(""); 
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayNote("");
    setIsPayModalOpen(true);
  };

  const handleProcessPayment = () => {
    if (!selectedTransaction) return;
    
    const amountNum = parseInt(payAmount) || 0;
    const remaining = selectedTransaction.totalAmount - selectedTransaction.paidAmount;

    if (amountNum <= 0) {
        alert("Jumlah pembayaran harus lebih dari 0");
        return;
    }
    if (amountNum > remaining) {
        alert(`Pembayaran melebihi sisa tagihan! Maksimal: ${formatRupiah(remaining)}`);
        return;
    }

    const newPayment: PaymentRecord = {
        id: Date.now(),
        date: payDate,
        amount: amountNum,
        note: payNote || "-"
    };

    const updatedPaidAmount = selectedTransaction.paidAmount + amountNum;
    const isLunas = updatedPaidAmount >= selectedTransaction.totalAmount;

    const updatedTransaction: DebtTransaction = {
        ...selectedTransaction,
        paidAmount: updatedPaidAmount,
        status: isLunas ? 'LUNAS' : 'BELUM_LUNAS',
        paymentHistory: [newPayment, ...selectedTransaction.paymentHistory]
    };

    setTransactions(prev => prev.map(t => t.id === selectedTransaction.id ? updatedTransaction : t));
    setSelectedTransaction(updatedTransaction); 
    setIsPayModalOpen(false);

    alert(`Pembayaran berhasil dicatat!\nSisa Tagihan: ${formatRupiah(selectedTransaction.totalAmount - updatedPaidAmount)}`);
  };

  const summary = useMemo(() => {
    const totalTagihan = filteredData.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const totalTerbayar = filteredData.reduce((acc, curr) => acc + curr.paidAmount, 0);
    const totalSisa = totalTagihan - totalTerbayar;
    return { totalTagihan, totalTerbayar, totalSisa };
  }, [filteredData]);

  const isOverdue = (t: DebtTransaction) => {
      if (t.status === 'LUNAS' || !t.dueDate) return false;
      const [d, m, y] = t.dueDate.split('/').map(Number);
      const due = new Date(y, m-1, d);
      const today = new Date();
      today.setHours(0,0,0,0);
      return due < today;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 font-sans overflow-hidden">
      
      {/* HEADER UTAMA */}
      <div className="h-16 bg-white flex items-center justify-between px-4 md:px-6 border-b border-gray-200 shadow-sm flex-shrink-0 z-20">
         <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="hover:bg-gray-200 p-1 rounded">
                 <Menu className="w-6 h-6"/>
             </button>
             <h1 className="text-lg md:text-xl font-bold text-black uppercase flex items-center gap-2 truncate">
                <Wallet className="w-5 h-5 md:w-6 md:h-6"/> 
                <span className="hidden md:inline">Keuangan</span>
                <span className="md:hidden">Keuangan</span>
             </h1>
         </div>

         {/* [NEW] TABLET VIEW TOGGLE */}
         <div className="flex items-center gap-2">
             <span className="text-sm font-semibold text-gray-600 hidden md:block">Mode Tampilan:</span>
             <button 
                onClick={() => setIsTabletView(false)}
                className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${!isTabletView ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-500'}`}
                title="Tampilan List (PC)"
             >
                 <List className="w-5 h-5"/>
                 <span className="text-xs font-bold hidden md:block">List View</span>
             </button>
             <button 
                onClick={() => setIsTabletView(true)}
                className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${isTabletView ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-500'}`}
                title="Tampilan Grid (Tablet)"
             >
                 <LayoutGrid className="w-5 h-5"/>
                 <span className="text-xs font-bold hidden md:block">Tablet View</span>
             </button>
         </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
          
          {/* --- LEFT PANEL: LIST TRANSAKSI --- */}
          {/* Kondisi Class:
              - Jika isTabletView: Width FULL (w-full), Grid layout. Detail muncul overlay/full screen.
              - Jika !isTabletView (PC): Width Fixed (md:w-[340px]), List layout. Detail muncul di kanan (Split View).
          */}
          <div className={`
              flex-col border-r border-gray-200 bg-white z-10 transition-all duration-300
              ${isTabletView 
                  ? 'w-full'  // Mode Tablet: Full Width
                  : 'w-full md:w-[340px] lg:w-[400px] xl:w-[450px]' // Mode PC: Split Width
              }
              ${showMobileDetail ? 'hidden' : 'flex'} // Hide list when detail is showing (Mobile/Tablet behavior)
              ${!isTabletView ? 'md:flex' : ''} // FIX: FORCE FLEX ON DESKTOP LIST VIEW
          `}>
              
              {/* TABS SWITCHER */}
              <div className="flex border-b border-gray-200">
                  <button 
                    onClick={() => { setActiveTab('PIUTANG'); setSelectedTransaction(null); setShowMobileDetail(false); }}
                    className={`flex-1 py-4 text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-colors border-b-4 ${activeTab === 'PIUTANG' ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
                  >
                      <ArrowRight className="w-4 h-4 bg-green-100 text-green-600 rounded-full p-0.5 box-content"/>
                      PIUTANG (Customer)
                  </button>
                  <button 
                    onClick={() => { setActiveTab('HUTANG'); setSelectedTransaction(null); setShowMobileDetail(false); }}
                    className={`flex-1 py-4 text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-colors border-b-4 ${activeTab === 'HUTANG' ? 'border-red-600 text-red-700 bg-red-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
                  >
                      <ArrowRight className="w-4 h-4 bg-red-100 text-red-600 rounded-full p-0.5 box-content rotate-180"/>
                      HUTANG (Supplier)
                  </button>
              </div>

              {/* SUMMARY CARD */}
              <div className={`px-4 py-2 ${activeTab === 'PIUTANG' ? 'bg-[#DAF3FF] text-blue-900' : 'bg-red-500 text-white'} transition-colors duration-300 border-b border-gray-200 shadow-inner`}>
                   <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[10px] md:text-xs opacity-90 font-bold uppercase tracking-wide">
                        Total Sisa {activeTab === 'PIUTANG' ? 'Piutang' : 'Hutang'}
                      </span>
                      <div className="flex gap-2 text-[10px] font-medium opacity-90">
                         <span>Total: {filteredData.length}</span>
                         <span>Lunas: {filteredData.filter(d => d.status === 'LUNAS').length}</span>
                      </div>
                   </div>
                   <div className="text-xl md:text-2xl font-bold">{formatRupiah(summary.totalSisa)}</div>
              </div>

              {/* SEARCH & FILTERS */}
              <div className="p-3 border-b border-gray-200 bg-gray-50 space-y-2">
                  <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input 
                        type="text" 
                        placeholder={activeTab === 'PIUTANG' ? "Cari Customer / No Nota..." : "Cari Supplier / No PO..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm bg-white shadow-sm"
                      />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                     <button onClick={() => setStatusFilter('ALL')} className={`px-3 py-1 rounded-md text-[10px] md:text-xs font-bold border ${statusFilter === 'ALL' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300'}`}>Semua</button>
                     <button onClick={() => setStatusFilter('BELUM_LUNAS')} className={`px-3 py-1 rounded-md text-[10px] md:text-xs font-bold border ${statusFilter === 'BELUM_LUNAS' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-300'}`}>Belum Lunas</button>
                     <button onClick={() => setStatusFilter('LUNAS')} className={`px-3 py-1 rounded-md text-[10px] md:text-xs font-bold border ${statusFilter === 'LUNAS' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300'}`}>Sudah Lunas</button>
                     <button onClick={() => setStatusFilter('OVERDUE')} className={`px-3 py-1 rounded-md text-[10px] md:text-xs font-bold border flex items-center gap-1 ${statusFilter === 'OVERDUE' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-600 border-red-200 hover:bg-red-50'}`}><AlertTriangle className="w-3 h-3"/> Lewat Tempo</button>
                     
                     <div className="relative flex-1 min-w-[100px]">
                         <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 z-10"/>
                         <select value={dateRangeFilter} onChange={(e) => setDateRangeFilter(Number(e.target.value))} className="w-full pl-6 pr-6 py-1 border border-gray-300 rounded-md text-[10px] md:text-xs font-bold bg-white focus:outline-none cursor-pointer appearance-none text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                            <option value={1}>1 Bulan</option>
                            <option value={2}>2 Bulan</option>
                            <option value={3}>3 Bulan</option>
                            <option value={6}>6 Bulan</option>
                            <option value={12}>12 Bulan</option>
                         </select>
                         <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none"/>
                     </div>
                  </div>
              </div>
              
              {/* LIST ITEMS CONTAINER */}
              <div className={`flex-1 overflow-y-auto ${isTabletView ? 'bg-gray-100 p-4' : 'bg-white'}`}>
                  
                  {filteredData.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 text-sm">
                          <p>Tidak ada data transaksi.</p>
                      </div>
                  ) : (
                      // CONTAINER: GRID jika TabletView, LIST jika Normal
                      <div className={isTabletView ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col"}>
                          
                          {filteredData.map(item => {
                              const sisa = item.totalAmount - item.paidAmount;
                              const overdue = isOverdue(item);

                              // TAMPILAN CARD (TABLET VIEW)
                              if (isTabletView) {
                                  return (
                                    <div 
                                        key={item.id} 
                                        onClick={() => handleSelectTransaction(item)}
                                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 cursor-pointer hover:shadow-md transition-all active:scale-[0.99] flex flex-col justify-between h-48"
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="font-bold text-lg text-gray-800 line-clamp-1">{item.entityName}</div>
                                                {item.status === 'LUNAS' ? (
                                                    <span className="bg-green-100 text-green-700 p-1 rounded-full"><CheckCircle className="w-5 h-5"/></span>
                                                ) : (
                                                    overdue ? 
                                                    <span className="bg-red-100 text-red-600 p-1 rounded-full animate-pulse"><AlertTriangle className="w-5 h-5"/></span> 
                                                    : <span className="bg-orange-100 text-orange-600 p-1 rounded-full"><History className="w-5 h-5"/></span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500 font-mono mb-1">{item.id}</div>
                                            <div className="text-xs text-gray-500">{item.date}</div>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-gray-100">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-500">Total</span>
                                                <span className="font-semibold">{formatRupiah(item.totalAmount)}</span>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${item.status === 'LUNAS' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {item.status === 'LUNAS' ? 'LUNAS' : 'BELUM LUNAS'}
                                                </span>
                                                <div className={`text-lg font-bold ${item.status === 'LUNAS' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {item.status === 'LUNAS' ? 'Rp 0' : formatRupiah(sisa)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                  );
                              }

                              // TAMPILAN LIST (PC VIEW)
                              return (
                                <div 
                                    key={item.id} 
                                    onClick={() => handleSelectTransaction(item)}
                                    className={`p-4 border-b cursor-pointer transition-colors hover:bg-gray-50 group relative ${selectedTransaction?.id === item.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-gray-800 text-sm truncate w-2/3" title={item.entityName}>{item.entityName}</span>
                                        {item.status === 'LUNAS' ? (
                                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 flex-shrink-0"><CheckCircle className="w-3 h-3"/> LUNAS</span>
                                        ) : (
                                            overdue ? 
                                            <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold flex-shrink-0 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> LEWAT TEMPO</span>
                                            :
                                            <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold flex-shrink-0">BELUM LUNAS</span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500 mb-2 flex gap-2">
                                        <span className="font-mono">{item.id}</span> • <span>{item.date}</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div className="text-xs text-gray-500">
                                            <div>Total: {formatRupiah(item.totalAmount)}</div>
                                            <div>Bayar: {formatRupiah(item.paidAmount)}</div>
                                        </div>
                                        <div className={`font-bold ${item.status === 'LUNAS' ? 'text-green-600' : 'text-red-600'}`}>
                                            Sisa: {formatRupiah(sisa)}
                                        </div>
                                    </div>
                                </div>
                              );
                          })}
                      </div>
                  )}
              </div>
          </div>

          {/* --- RIGHT PANEL: DETAIL & ACTION --- */}
          {/* LOGIKA TAMPILAN:
              - Mobile/Tablet (isTabletView atau showMobileDetail): Tampil Full Width (Overlay style)
              - PC (!isTabletView): Tampil Split View di kanan
          */}
          <div className={`
              flex-1 flex-col bg-gray-100 h-full overflow-hidden relative border-l border-gray-200
              ${showMobileDetail ? 'flex' : (isTabletView ? 'hidden' : 'hidden md:flex')}
          `}>
              {selectedTransaction ? (
                  <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                      
                      {/* === KONTEN UTAMA SCROLLABLE === */}
                      <div className="flex-1 overflow-y-auto">

                          {/* HEADER BAGIAN ATAS (IKUT SCROLL) */}
                          <div className="bg-white p-4 md:p-6 border-b border-gray-200 shadow-sm">
                              
                              {/* Tombol Kembali (Hanya muncul jika Tablet View atau Mobile, TIDAK di List View Desktop) */}
                              {(showMobileDetail || isTabletView) && (
                                  <div className={`mb-4 ${!isTabletView ? 'md:hidden' : ''}`}>
                                      <button onClick={handleBackToList} className="flex items-center gap-2 text-gray-600 hover:text-black font-bold bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors">
                                          <ArrowLeft className="w-5 h-5"/> Kembali ke List
                                      </button>
                                  </div>
                              )}

                              <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-0">
                                  <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <h2 className="text-xl md:text-2xl font-bold text-gray-800 break-all">{selectedTransaction.entityName}</h2>
                                        {selectedTransaction.status === 'LUNAS' && <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0"/>}
                                      </div>
                                      <p className="text-gray-500 text-sm font-mono">{selectedTransaction.id}</p>
                                  </div>
                                  <div className="text-left md:text-right w-full md:w-auto">
                                      <p className="text-xs text-gray-500 font-bold mb-1">JATUH TEMPO</p>
                                      <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border w-fit md:w-auto ${isOverdue(selectedTransaction) ? 'bg-red-100 text-red-700 border-red-200 animate-pulse' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                          <Calendar className="w-4 h-4"/>
                                          <span className="font-bold">{selectedTransaction.dueDate || '-'}</span>
                                      </div>
                                  </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mt-6">
                                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-between md:block">
                                      <div className="text-xs text-gray-500 font-bold uppercase mb-1">Total Tagihan</div>
                                      <div className="text-base md:text-lg font-bold text-gray-800">{formatRupiah(selectedTransaction.totalAmount)}</div>
                                  </div>
                                  <div className="p-3 bg-green-50 rounded-lg border border-green-200 flex justify-between md:block">
                                      <div className="text-xs text-green-700 font-bold uppercase mb-1">Sudah Dibayar</div>
                                      <div className="text-base md:text-lg font-bold text-green-700">{formatRupiah(selectedTransaction.paidAmount)}</div>
                                  </div>
                                  <div className="p-3 bg-red-50 rounded-lg border border-red-200 flex justify-between md:block">
                                      <div className="text-xs text-red-700 font-bold uppercase mb-1">Sisa Tagihan</div>
                                      <div className="text-base md:text-lg font-bold text-red-700">{formatRupiah(selectedTransaction.totalAmount - selectedTransaction.paidAmount)}</div>
                                  </div>
                              </div>
                          </div>

                          {/* DETAIL CONTENT (IKUT SCROLL JUGA) */}
                          <div className="p-4 md:p-6 pb-20"> {/* Tambah padding bottom biar ga ketutupan tombol bayar */}
                              
                              {/* RINCIAN PRODUK (ITEMS) */}
                              <div className="mb-8">
                                  <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                                      <Package className="w-5 h-5"/> Rincian Produk
                                  </h3>
                                  <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto shadow-sm">
                                      <table className="w-full text-sm min-w-[600px]">
                                          <thead>
                                              <tr className="bg-gray-50 text-gray-600 text-xs uppercase font-bold text-left">
                                                  <th className="px-4 py-3">Nama Produk</th>
                                                  <th className="px-4 py-3 text-center">Qty</th>
                                                  {/* Kolom Qty PO hanya muncul jika Tab = PIUTANG */}
                                                  {activeTab === 'PIUTANG' && <th className="px-4 py-3 text-center">Qty PO</th>}
                                                  <th className="px-4 py-3 text-center">Unit</th>
                                                  <th className="px-4 py-3 text-right">Harga</th>
                                                  <th className="px-4 py-3 text-right">Total</th>
                                              </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-100">
                                              {selectedTransaction.items.map((item) => (
                                                  <tr key={item.id} className="hover:bg-gray-50">
                                                      <td className="px-4 py-3 align-top">
                                                          <div className="font-bold text-gray-800">{item.name}</div>
                                                          <div className="text-xs text-gray-500 mt-0.5">
                                                              {item.variant} 
                                                              {item.note && <span className="italic text-gray-400"> - "{item.note}"</span>}
                                                          </div>
                                                      </td>
                                                      <td className="px-4 py-3 text-center align-top font-bold">{item.qty}</td>
                                                      {activeTab === 'PIUTANG' && (
                                                          <td className="px-4 py-3 text-center align-top text-orange-600 font-bold">
                                                              {item.qtyPO || '-'}
                                                          </td>
                                                      )}
                                                      <td className="px-4 py-3 text-center align-top text-gray-600">{item.unit}</td>
                                                      <td className="px-4 py-3 text-right align-top text-gray-700">{formatRupiah(item.price)}</td>
                                                      <td className="px-4 py-3 text-right align-top font-bold text-gray-900">
                                                          {formatRupiah(item.price * (item.qty + (item.qtyPO || 0)))}
                                                      </td>
                                                  </tr>
                                              ))}
                                          </tbody>
                                      </table>
                                  </div>
                              </div>

                              {/* RIWAYAT PEMBAYARAN */}
                              <div>
                                  <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                                      <History className="w-5 h-5"/> Riwayat Pembayaran
                                  </h3>
                                  
                                  {selectedTransaction.paymentHistory.length === 0 ? (
                                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-400 text-sm">
                                          <Banknote className="w-10 h-10 mx-auto mb-2 opacity-50"/>
                                          Belum ada pembayaran yang tercatat.
                                      </div>
                                  ) : (
                                      <div className="space-y-3">
                                          {selectedTransaction.paymentHistory.map((hist, idx) => (
                                              <div key={hist.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-2">
                                                  <div className="flex items-center gap-4">
                                                      <div className="bg-green-100 text-green-600 font-bold w-8 h-8 flex items-center justify-center rounded-full text-xs flex-shrink-0">
                                                          #{selectedTransaction.paymentHistory.length - idx}
                                                      </div>
                                                      <div>
                                                          <div className="font-bold text-gray-800">{formatRupiah(hist.amount)}</div>
                                                          <div className="text-xs text-gray-500">{hist.date}</div>
                                                      </div>
                                                  </div>
                                                  <div className="text-left md:text-right pl-12 md:pl-0">
                                                      <div className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded inline-block">
                                                          {hist.note}
                                                      </div>
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  )}
                              </div>
                          </div>
                      </div>

                      {/* ACTION BAR (BUTTON BAYAR) - FIXED BOTTOM */}
                      {selectedTransaction.status !== 'LUNAS' && (
                          <div className="p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex justify-end flex-shrink-0 z-10">
                              <button 
                                onClick={handleOpenPayModal}
                                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95"
                              >
                                  <CreditCard className="w-5 h-5"/>
                                  Bayar Cicilan
                              </button>
                          </div>
                      )}
                  </div>
              ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                      <Wallet className="w-16 h-16 md:w-20 md:h-20 mb-4 opacity-20"/>
                      <p className="text-lg md:text-xl font-medium">Pilih Transaksi</p>
                      <p className="text-sm">untuk melihat detail & pembayaran.</p>
                  </div>
              )}
          </div>

          {/* --- MODAL FORM PEMBAYARAN --- */}
          {isPayModalOpen && selectedTransaction && (
              <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center animate-in fade-in zoom-in duration-200 p-4">
                  <div className="bg-white rounded-xl shadow-2xl w-full max-w-[450px] overflow-hidden">
                      <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                          <h3 className="font-bold text-lg flex items-center gap-2">
                              <Banknote className="w-5 h-5"/> Input Pembayaran
                          </h3>
                          <button onClick={() => setIsPayModalOpen(false)} className="hover:bg-blue-700 p-1 rounded"><XCircle className="w-6 h-6"/></button>
                      </div>
                      
                      <div className="p-6 space-y-4">
                          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
                              <p className="text-xs text-gray-500 uppercase font-bold">Sisa Tagihan Saat Ini</p>
                              <p className="text-2xl font-bold text-red-600">{formatRupiah(selectedTransaction.totalAmount - selectedTransaction.paidAmount)}</p>
                          </div>

                          <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">Tanggal Bayar</label>
                              <input 
                                type="date" 
                                value={payDate}
                                onChange={(e) => setPayDate(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                              />
                          </div>

                          <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">Jumlah Bayar (Rp)</label>
                              <input 
                                type="text" 
                                value={formatInputCurrency(payAmount)}
                                onChange={handlePayAmountChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xl font-bold text-right focus:outline-none focus:border-blue-500"
                                placeholder="0"
                              />
                              <div className="flex justify-end gap-2 mt-2">
                                  <button onClick={() => setPayAmount(String(selectedTransaction.totalAmount - selectedTransaction.paidAmount))} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold hover:bg-blue-200 transition-colors">
                                      Bayar Full (Lunas)
                                  </button>
                              </div>
                          </div>

                          <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">Catatan / Metode</label>
                              <input 
                                type="text" 
                                value={payNote}
                                onChange={(e) => setPayNote(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                                placeholder="Contoh: Transfer BCA, Tunai, dll"
                              />
                          </div>
                      </div>

                      <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                          <button onClick={() => setIsPayModalOpen(false)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded-lg transition-colors">Batal</button>
                          <button onClick={handleProcessPayment} className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-sm flex items-center gap-2 transition-colors">
                              <CheckCircle className="w-4 h-4"/> Simpan
                          </button>
                      </div>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default HutangPiutangPage;