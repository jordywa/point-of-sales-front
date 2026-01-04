// src/pages/StockInPage.tsx

import React, { useState, useMemo } from 'react';
import { Menu, Search, Truck, ArrowRight, CheckCircle, Package, Calendar, User, Save, AlertCircle, XCircle, LayoutGrid, List, ArrowLeft, History } from 'lucide-react';

interface StockInPageProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
}

// --- TYPE DEFINITIONS ---
interface POItem {
  id: number;
  productId: number;
  name: string;
  unit: string;
  qtyOrdered: number; // Total pesan
  qtyReceived: number; // Yang sudah masuk sebelumnya
  qtyIncoming: number; // State untuk input user (yang baru sampai)
}

// Update Status Type
type POStatus = 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'FORCED_COMPLETE';

interface POTransaction {
  id: string; // No Nota PO
  supplierName: string;
  date: string; // Format DD/MM/YYYY
  status: POStatus;
  items: POItem[];
}

// --- MOCK DATA ---
const INITIAL_PO_DATA: POTransaction[] = [
  {
    id: 'PO202512/000005',
    supplierName: 'Toko Plastik Jaya (Supplier)',
    date: '10/12/2025',
    status: 'PENDING',
    items: [
      { id: 1, productId: 1, name: 'Plastik Dayana', unit: 'Karung', qtyOrdered: 50, qtyReceived: 0, qtyIncoming: 0 },
      { id: 2, productId: 2, name: 'Plastik Loco', unit: 'Pack', qtyOrdered: 200, qtyReceived: 0, qtyIncoming: 0 },
    ]
  },
  {
    id: 'PO202512/000003',
    supplierName: 'Pabrik Wayang Utama',
    date: '08/12/2025',
    status: 'PARTIAL',
    items: [
      { id: 3, productId: 3, name: 'Plastik Wayang', unit: 'KG', qtyOrdered: 100, qtyReceived: 50, qtyIncoming: 0 }, 
    ]
  },
  {
    id: 'PO202512/000001',
    supplierName: 'Aneka Plastik',
    date: '01/12/2025',
    status: 'COMPLETED',
    items: [
        { id: 4, productId: 4, name: 'Kresek Hitam', unit: 'Pack', qtyOrdered: 100, qtyReceived: 100, qtyIncoming: 0 }, 
    ]
  },
  {
    id: 'PO202512/000002',
    supplierName: 'Sumber Makmur',
    date: '05/12/2025',
    status: 'FORCED_COMPLETE', // Selesai Tidak Lengkap
    items: [
        { id: 5, productId: 5, name: 'Gelas Plastik', unit: 'Dus', qtyOrdered: 50, qtyReceived: 40, qtyIncoming: 0 }, 
    ]
  }
];

// Tipe Filter
type FilterType = 'ALL' | 'PENDING' | 'COMPLETED' | 'FORCED_COMPLETE' | 'PARTIAL';

const StockInPage: React.FC<StockInPageProps> = ({ setIsSidebarOpen }) => {
  const [poList, setPoList] = useState<POTransaction[]>(INITIAL_PO_DATA);
  const [selectedPO, setSelectedPO] = useState<POTransaction | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  
  // [NEW] State Tablet View
  const [isTabletView, setIsTabletView] = useState(false);

  // --- LOGIC FILTER & SORT ---
  const filteredSortedPO = useMemo(() => {
    let data = poList.filter(po => 
        (po.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
        po.supplierName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Apply Tab Filter
    if (activeFilter !== 'ALL') {
        data = data.filter(po => po.status === activeFilter);
    }

    // Sort by Date (Newest First)
    return data.sort((a, b) => {
        const [da, ma, ya] = a.date.split('/').map(Number);
        const [db, mb, yb] = b.date.split('/').map(Number);
        const dateA = new Date(ya, ma - 1, da).getTime();
        const dateB = new Date(yb, mb - 1, db).getTime();
        return dateB - dateA; 
    });
  }, [poList, searchQuery, activeFilter]);

  // --- HANDLER ---
  const handleQtyChange = (itemId: number, val: string) => {
    if (!selectedPO) return;
    const numVal = Math.max(0, parseInt(val) || 0);
    
    const updatedItems = selectedPO.items.map(item => {
      if (item.id === itemId) {
        const remaining = item.qtyOrdered - item.qtyReceived;
        return { ...item, qtyIncoming: numVal > remaining ? remaining : numVal };
      }
      return item;
    });

    setSelectedPO({ ...selectedPO, items: updatedItems });
  };

  // 1. Simpan Masuk Stok (Normal)
  const handleProcessStockIn = () => {
    if (!selectedPO) return;

    const hasIncoming = selectedPO.items.some(i => i.qtyIncoming > 0);
    if (!hasIncoming) {
      alert("Mohon isi jumlah 'Terima Sekarang' minimal pada satu barang.");
      return;
    }
    
    // Logic update status
    const isAllCompleted = selectedPO.items.every(i => (i.qtyReceived + i.qtyIncoming) >= i.qtyOrdered);
    const newStatus: POStatus = isAllCompleted ? 'COMPLETED' : 'PARTIAL';

    const updatedItems = selectedPO.items.map(i => ({
        ...i,
        qtyReceived: i.qtyReceived + i.qtyIncoming,
        qtyIncoming: 0
    }));
    
    const updatedPO: POTransaction = { ...selectedPO, items: updatedItems, status: newStatus };

    // Update List Utama
    setPoList(prev => prev.map(p => p.id === selectedPO.id ? updatedPO : p));
    setSelectedPO(updatedPO);

    alert(`Berhasil menerima barang!\nStatus PO: ${newStatus === 'COMPLETED' ? 'SELESAI' : 'PARSIAL (Setengah Sampai)'}`);
  };

  // 2. Selesaikan Paksa (Forced Complete)
  const handleForceComplete = () => {
      if (!selectedPO) return;

      const confirmMsg = "PERINGATAN!\n\nAnda akan menyelesaikan PO ini secara paksa (Selesai Tidak Lengkap).\nSisa barang yang belum diterima akan dianggap batal/hangus.\n\nApakah Anda yakin?";
      
      if (window.confirm(confirmMsg)) {
          const updatedPO: POTransaction = { ...selectedPO, status: 'FORCED_COMPLETE' };
          
          setPoList(prev => prev.map(p => p.id === selectedPO.id ? updatedPO : p));
          setSelectedPO(updatedPO);

          alert("PO berhasil diselesaikan secara paksa.");
      }
  };

  // Helper untuk render status badge
  const renderStatusBadge = (status: POStatus) => {
      switch (status) {
          case 'PENDING': return <span className="text-[10px] bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-bold">BELUM SELESAI</span>;
          case 'PARTIAL': return <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">SETENGAH SAMPAI</span>;
          case 'COMPLETED': return <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">SELESAI</span>;
          case 'FORCED_COMPLETE': return <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">SELESAI TDK LENGKAP</span>;
      }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 font-sans overflow-hidden">
      {/* HEADER PAGE */}
      <div className="h-16 bg-white flex items-center justify-between px-6 border-b border-gray-200 shadow-sm flex-shrink-0 z-20">
         <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="hover:bg-gray-200 p-1 rounded">
                 <Menu className="w-6 h-6"/>
             </button>
             <h1 className="text-lg md:text-xl font-bold text-black uppercase flex items-center gap-2 truncate">
                <Truck className="w-5 h-5 md:w-6 md:h-6"/> 
                <span className="hidden md:inline">STOK MASUK (Receiving)</span>
                <span className="md:hidden">Receiving</span>
             </h1>
         </div>

         {/* TABLET VIEW TOGGLE */}
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
          
          {/* --- LEFT PANEL: LIST PO --- */}
          {/* Layout Logic: Full width on Tablet, Fixed width on PC. Hidden when detail opens in Tablet Mode. */}
          <div className={`
              flex-col bg-white z-10 transition-all duration-300 border-r border-gray-200
              ${isTabletView 
                  ? 'w-full'  
                  : 'w-96' 
              }
              ${selectedPO && isTabletView ? 'hidden' : 'flex'}
              ${!isTabletView && selectedPO ? 'md:flex' : ''}
          `}>
              {/* SEARCH & FILTER SECTION */}
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col gap-3">
                  <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input 
                        type="text" 
                        placeholder="Cari No PO / Supplier..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm shadow-sm"
                      />
                  </div>
                  
                  {/* FILTER CHIPS */}
                  <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'ALL', label: 'Semua' },
                        { id: 'PENDING', label: 'Belum Selesai' },
                        { id: 'COMPLETED', label: 'Selesai' },
                        { id: 'FORCED_COMPLETE', label: 'Selesai Tidak Lengkap' },
                        { id: 'PARTIAL', label: 'Setengah Sampai' },
                      ].map(filter => (
                        <button 
                            key={filter.id}
                            onClick={() => setActiveFilter(filter.id as FilterType)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                                activeFilter === filter.id 
                                ? 'bg-blue-600 text-white border-blue-600' 
                                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
                            }`}
                        >
                            {filter.label}
                        </button>
                      ))}
                  </div>
              </div>
              
              {/* LIST CONTENT */}
              <div className={`flex-1 overflow-y-auto ${isTabletView ? 'bg-gray-100 p-4' : ''}`}>
                  {filteredSortedPO.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 text-sm">Tidak ada transaksi PO yang sesuai.</div>
                  ) : (
                      // CONTAINER: GRID jika TabletView, LIST jika Normal
                      <div className={isTabletView ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col"}>
                          {filteredSortedPO.map(po => {
                              
                              // TAMPILAN CARD (TABLET VIEW)
                              if (isTabletView) {
                                  return (
                                    <div 
                                        key={po.id} 
                                        onClick={() => setSelectedPO(po)}
                                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 cursor-pointer hover:shadow-md transition-all active:scale-[0.99] flex flex-col justify-between min-h-[160px]"
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="font-bold text-gray-800 text-lg">{po.id}</div>
                                                {renderStatusBadge(po.status)}
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-700 font-medium mb-1">
                                                <User className="w-4 h-4 text-blue-500"/> {po.supplierName}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Calendar className="w-4 h-4"/> {po.date}
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-sm">
                                            <div className="text-gray-500 flex items-center gap-1">
                                                <Package className="w-4 h-4"/> {po.items.length} Item
                                            </div>
                                            <div className="text-blue-600 font-bold flex items-center gap-1">
                                                Buka Detail <ArrowRight className="w-4 h-4"/>
                                            </div>
                                        </div>
                                    </div>
                                  );
                              }

                              // TAMPILAN LIST (PC VIEW)
                              return (
                                <div 
                                    key={po.id} 
                                    onClick={() => setSelectedPO(po)}
                                    className={`p-4 border-b cursor-pointer transition-colors hover:bg-blue-50 group ${selectedPO?.id === po.id ? 'bg-blue-100 border-blue-200' : 'border-gray-100'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-gray-800 text-sm">{po.id}</span>
                                        {renderStatusBadge(po.status)}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1 truncate">
                                        <User className="w-3 h-3 flex-shrink-0"/> <span className="truncate">{po.supplierName}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <Calendar className="w-3 h-3"/> {po.date}
                                    </div>
                                    <div className="mt-2 text-xs font-semibold text-blue-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Lihat Detail <ArrowRight className="w-3 h-3"/>
                                    </div>
                                </div>
                              );
                          })}
                      </div>
                  )}
              </div>
          </div>

          {/* --- RIGHT PANEL: DETAIL & ACTION --- */}
          {/* Logic: Show if selectedPO exists. In Tablet view, it takes full width/height. In PC view, it sits on right. */}
          <div className={`
              flex-1 flex-col bg-gray-50 overflow-hidden relative
              ${selectedPO && isTabletView ? 'flex' : (isTabletView ? 'hidden' : 'hidden md:flex')}
          `}>
              {selectedPO ? (
                  <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                    
                    {/* DETAIL HEADER (Mobile Back Button support) */}
                    {(isTabletView) && (
                        <div className="bg-white p-4 border-b border-gray-200 flex items-center gap-3">
                            <button onClick={() => setSelectedPO(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-700">
                                <ArrowLeft className="w-5 h-5"/>
                            </button>
                            <div>
                                <h2 className="font-bold text-lg text-gray-800">{selectedPO.id}</h2>
                                <p className="text-xs text-gray-500">Kembali ke daftar PO</p>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-6 md:p-8 pb-32">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            {/* Card Header Content */}
                            <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 gap-4">
                                <div>
                                    {!isTabletView && <h2 className="text-2xl font-bold text-gray-800 mb-1">{selectedPO.id}</h2>}
                                    <p className="text-gray-600 flex items-center gap-2"><User className="w-4 h-4"/> Supplier: <span className="font-semibold">{selectedPO.supplierName}</span></p>
                                </div>
                                <div className="text-left md:text-right w-full md:w-auto">
                                    <p className="text-sm text-gray-500">Tanggal PO</p>
                                    <p className="font-bold text-gray-800">{selectedPO.date}</p>
                                    <div className="mt-2">{renderStatusBadge(selectedPO.status)}</div>
                                </div>
                            </div>

                            {/* Alert Info Logic */}
                            {selectedPO.status === 'COMPLETED' || selectedPO.status === 'FORCED_COMPLETE' ? (
                                <div className="bg-gray-100 px-6 py-3 flex items-center gap-3 border-b border-gray-200">
                                    <CheckCircle className="w-5 h-5 text-gray-500"/>
                                    <p className="text-sm text-gray-600">
                                        Transaksi ini sudah selesai. Tidak dapat mengubah stok lagi.
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-blue-50 px-6 py-3 flex items-center gap-3 border-b border-blue-100">
                                    <AlertCircle className="w-5 h-5 text-blue-600"/>
                                    <p className="text-sm text-blue-800">
                                        Masukkan jumlah barang yang <b>baru sampai hari ini</b> di kolom "Terima Sekarang". <br/>
                                        Stok akan otomatis berpindah dari <b>Stok PO</b> ke <b>Stok Fisik (Current)</b>.
                                    </p>
                                </div>
                            )}

                            {/* Table Items */}
                            <div className="p-6 overflow-x-auto">
                                <table className="w-full text-sm min-w-[600px]">
                                    <thead>
                                        <tr className="bg-gray-100 text-gray-600 uppercase tracking-wider text-xs font-bold text-left">
                                            <th className="p-3 rounded-l-lg">Nama Produk</th>
                                            <th className="p-3 text-center">Unit</th>
                                            <th className="p-3 text-center">Total Pesan</th>
                                            <th className="p-3 text-center">Sdh Diterima</th>
                                            <th className="p-3 text-center">Sisa PO</th>
                                            <th className="p-3 text-center w-40 rounded-r-lg bg-blue-100 text-blue-800">Terima Sekarang</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {selectedPO.items.map(item => {
                                            const sisa = item.qtyOrdered - item.qtyReceived;
                                            const isComplete = sisa === 0;
                                            const isTransactionLocked = selectedPO.status === 'COMPLETED' || selectedPO.status === 'FORCED_COMPLETE';
                                            
                                            return (
                                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="p-3 font-medium text-gray-800 flex items-center gap-3">
                                                        <div className="p-2 bg-gray-100 rounded-md"><Package className="w-4 h-4 text-gray-500"/></div>
                                                        {item.name}
                                                    </td>
                                                    <td className="p-3 text-center font-bold text-gray-500">{item.unit}</td>
                                                    <td className="p-3 text-center font-bold">{item.qtyOrdered}</td>
                                                    <td className="p-3 text-center text-green-600 font-bold">{item.qtyReceived}</td>
                                                    <td className="p-3 text-center text-orange-600 font-bold">{sisa}</td>
                                                    <td className="p-3 text-center bg-blue-50/30">
                                                        {isComplete ? (
                                                            <span className="text-green-600 font-bold flex justify-center items-center gap-1"><CheckCircle className="w-4 h-4"/> Lunas</span>
                                                        ) : (
                                                            isTransactionLocked ? (
                                                                <span className="text-gray-400 font-bold">-</span>
                                                            ) : (
                                                                <div className="relative">
                                                                    <input 
                                                                        type="number" 
                                                                        min="0"
                                                                        max={sisa}
                                                                        value={item.qtyIncoming === 0 ? '' : item.qtyIncoming}
                                                                        onChange={(e) => handleQtyChange(item.id, e.target.value)}
                                                                        className="w-full border border-blue-300 rounded-lg px-3 py-2 text-center font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                        placeholder="0"
                                                                    />
                                                                    <div className="text-[10px] text-gray-400 mt-1">Max: {sisa}</div>
                                                                </div>
                                                            )
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Footer Action */}
                    {selectedPO.status !== 'COMPLETED' && selectedPO.status !== 'FORCED_COMPLETE' && (
                        <div className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 shadow-lg z-20 flex justify-end gap-3">
                            {/* TOMBOL MERAH: SELESAIKAN (FORCE COMPLETE) */}
                            <button 
                                onClick={handleForceComplete}
                                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 md:px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-transform active:scale-95 text-sm md:text-base"
                                title="Paksa PO Selesai (Sisa barang dianggap hangus)"
                            >
                                <XCircle className="w-5 h-5"/>
                                Selesaikan
                            </button>

                            {/* TOMBOL BIRU: SIMPAN MASUK STOK */}
                            <button 
                                onClick={handleProcessStockIn}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 md:px-8 py-3 rounded-lg font-bold flex items-center gap-2 shadow-md transition-transform active:scale-95 text-sm md:text-base"
                            >
                                <Save className="w-5 h-5"/>
                                Simpan Masuk Stok
                            </button>
                        </div>
                    )}
                  </div>
              ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                      <Truck className="w-16 h-16 mb-4 opacity-20"/>
                      <p className="text-lg font-medium">Pilih Transaksi PO di sebelah kiri</p>
                      <p className="text-sm">untuk mulai memproses barang masuk.</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default StockInPage;