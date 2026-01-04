// src/pages/StockOpnamePage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { Menu, Search, ClipboardCheck, History, Save, ArrowRight, Loader2, Package, AlertCircle, CheckCircle2 } from 'lucide-react';
import { INITIAL_INVENTORY_DATA } from '../data/mockData';
import type { InventoryItem, InventoryVariant } from '../types/index';

interface StockOpnamePageProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
}

// Tipe data untuk log riwayat opname
interface OpnameLog {
  id: string;
  date: string;
  productName: string;
  variant: string;
  systemStock: number; // dalam Pcs
  physicalStock: number; // dalam Pcs
  difference: number; // dalam Pcs
  status: 'MATCH' | 'MINUS' | 'PLUS';
  staff: string;
}

const StockOpnamePage: React.FC<StockOpnamePageProps> = ({ setIsSidebarOpen }) => {
  const [activeTab, setActiveTab] = useState<'INPUT' | 'HISTORY'>('INPUT');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // State untuk menyimpan inputan fisik user sementara
  // Key format: "productId-variantIndex"
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, { karung: number, pack: number, pcs: number }>>({});
  
  // State Riwayat (Dummy awal)
  const [historyLogs, setHistoryLogs] = useState<OpnameLog[]>([
      { id: 'LOG-001', date: '2023-10-25 14:00', productName: 'Kantong Plastik HD', variant: '15x30', systemStock: 1500, physicalStock: 1495, difference: -5, status: 'MINUS', staff: 'Admin' }
  ]);

  // Konstanta Konversi
  const KARUNG_TO_PACK = 50;
  const PACK_TO_PCS = 5;

  // --- FETCH DATA ---
  useEffect(() => {
    setTimeout(() => {
      setItems(INITIAL_INVENTORY_DATA);
      setIsLoading(false);
    }, 500);
  }, []);

  // --- HELPER LOGIC ---
  const getTotalPcs = (karung: number, pack: number, pcs: number) => {
      return (karung * KARUNG_TO_PACK * PACK_TO_PCS) + (pack * PACK_TO_PCS) + pcs;
  };

  const getSystemStockPcs = (v: InventoryVariant) => {
      return getTotalPcs(v.stockKarung, v.stockPack, v.stockPcs);
  };

  // Handle User Input Angka
  const handleInputChange = (itemId: string, variantIdx: number, field: 'karung' | 'pack' | 'pcs', value: string) => {
      const key = `${itemId}-${variantIdx}`;
      const current = physicalCounts[key] || { karung: 0, pack: 0, pcs: 0 }; 
      
      setPhysicalCounts({
          ...physicalCounts,
          [key]: {
              ...current,
              [field]: value === '' ? 0 : parseInt(value)
          }
      });
  };

  // Simpan Opname (Hanya item yang diisi yang diproses)
  const handleSaveOpname = (item: InventoryItem) => {
      const logsToAdd: OpnameLog[] = [];
      let hasChange = false;

      item.variants.forEach((v, idx) => {
          const key = `${item.id}-${idx}`;
          // Cek apakah user sudah mengisi input untuk varian ini?
          if (physicalCounts[key]) {
              const input = physicalCounts[key];
              const physicalTotal = getTotalPcs(input.karung, input.pack, input.pcs);
              const systemTotal = getSystemStockPcs(v);
              const diff = physicalTotal - systemTotal;

              let status: 'MATCH' | 'MINUS' | 'PLUS' = 'MATCH';
              if (diff < 0) status = 'MINUS';
              if (diff > 0) status = 'PLUS';

              logsToAdd.push({
                  id: `LOG-${Date.now()}-${idx}`,
                  date: new Date().toLocaleString(),
                  productName: item.name,
                  variant: v.size,
                  systemStock: systemTotal,
                  physicalStock: physicalTotal,
                  difference: diff,
                  status: status,
                  staff: 'Kasir 1' 
              });
              hasChange = true;
          }
      });

      if (!hasChange) {
          alert("Silakan isi jumlah fisik minimal satu variasi sebelum menyimpan.");
          return;
      }

      if (window.confirm(`Simpan hasil opname untuk ${item.name}? Stok sistem akan diperbarui.`)) {
          // 1. Simpan Log
          setHistoryLogs(prev => [...logsToAdd, ...prev]);

          // 2. Update Stok Sistem (Simulasi Update State Items)
          setItems(prevItems => prevItems.map(currItem => {
              if (currItem.id === item.id) {
                  const newVariants = currItem.variants.map((v, idx) => {
                      const key = `${item.id}-${idx}`;
                      if (physicalCounts[key]) {
                          const input = physicalCounts[key];
                          // Update stok master dengan stok fisik baru
                          return {
                              ...v,
                              stockKarung: input.karung,
                              stockPack: input.pack,
                              stockPcs: input.pcs
                          };
                      }
                      return v;
                  });
                  return { ...currItem, variants: newVariants };
              }
              return currItem;
          }));

          // 3. Reset Inputan Fisik untuk item ini
          const newPhysicalCounts = { ...physicalCounts };
          item.variants.forEach((_, idx) => delete newPhysicalCounts[`${item.id}-${idx}`]);
          setPhysicalCounts(newPhysicalCounts);

          alert("Opname berhasil disimpan!");
      }
  };

  const filteredItems = useMemo(() => {
      return items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [items, searchQuery]);

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden">
        {/* HEADER */}
        <div className="bg-white border-b px-6 py-4 flex flex-col gap-4 shadow-sm z-10">
            <div className="flex items-center gap-4">
                {/* FIX: Hapus class 'lg:hidden' agar tombol selalu muncul */}
                <button onClick={() => setIsSidebarOpen(true)} className="p-1 hover:bg-gray-100 rounded">
                    <Menu className="w-6 h-6 cursor-pointer" />
                </button>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <ClipboardCheck className="w-8 h-8 text-blue-600"/> Stock Opname
                </h1>
            </div>
            
            {/* TABS & SEARCH */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
                    <button 
                        onClick={() => setActiveTab('INPUT')}
                        className={`px-6 py-2 rounded-md font-semibold text-sm flex items-center gap-2 transition-all ${activeTab === 'INPUT' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <ClipboardCheck className="w-4 h-4"/> Input Opname
                    </button>
                    <button 
                        onClick={() => setActiveTab('HISTORY')}
                        className={`px-6 py-2 rounded-md font-semibold text-sm flex items-center gap-2 transition-all ${activeTab === 'HISTORY' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <History className="w-4 h-4"/> Riwayat Opname
                    </button>
                </div>
                
                {activeTab === 'INPUT' && (
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5"/>
                        <input 
                            type="text" 
                            placeholder="Cari nama produk..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                    </div>
                )}
            </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24">
            {activeTab === 'INPUT' ? (
                <>
                    {isLoading ? (
                        <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500 w-10 h-10"/></div>
                    ) : (
                        <div className="space-y-6">
                            {filteredItems.map(item => (
                                <div key={item.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                                    {/* Item Header */}
                                    <div className="bg-blue-50/50 p-4 border-b border-gray-100 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded border flex items-center justify-center">
                                            <img src={item.image} alt="" className="w-10 h-10 object-contain"/>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg text-gray-800">{item.name}</h3>
                                            <p className="text-xs text-gray-500">{item.id}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleSaveOpname(item)}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-transform active:scale-95"
                                        >
                                            <Save className="w-4 h-4"/> Simpan Perubahan
                                        </button>
                                    </div>

                                    {/* Variants Table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-100 text-gray-700 font-bold border-b">
                                                <tr>
                                                    <th className="px-4 py-3 text-left w-1/4">Variasi</th>
                                                    <th className="px-4 py-3 text-center w-1/4">Stok Sistem</th>
                                                    <th className="px-4 py-3 text-center w-1/3">Stok Fisik (Input)</th>
                                                    <th className="px-4 py-3 text-right w-1/6">Selisih</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {item.variants.map((v, idx) => {
                                                    const key = `${item.id}-${idx}`;
                                                    const input = physicalCounts[key] || { karung: 0, pack: 0, pcs: 0 };
                                                    const hasInput = physicalCounts[key] !== undefined;
                                                    
                                                    const systemTotal = getSystemStockPcs(v);
                                                    const physicalTotal = getTotalPcs(input.karung, input.pack, input.pcs);
                                                    const diff = physicalTotal - systemTotal;
                                                    
                                                    return (
                                                        <tr key={idx} className="hover:bg-gray-50 group">
                                                            <td className="px-4 py-3 font-bold text-gray-800">{v.size}</td>
                                                            
                                                            {/* System Stock Display */}
                                                            <td className="px-4 py-3">
                                                                <div className="flex flex-col items-center justify-center text-xs text-gray-500 bg-gray-100 rounded py-1 px-2 mx-auto w-fit">
                                                                    <span className="font-bold text-gray-700">Total: {systemTotal} Pcs</span>
                                                                    <span>({v.stockKarung} Krg, {v.stockPack} Pck, {v.stockPcs} Pcs)</span>
                                                                </div>
                                                            </td>

                                                            {/* Physical Input */}
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <div className="flex flex-col items-center">
                                                                        <input 
                                                                            type="number" 
                                                                            min="0"
                                                                            value={input.karung || ''}
                                                                            placeholder="0"
                                                                            onChange={(e) => handleInputChange(item.id, idx, 'karung', e.target.value)}
                                                                            className="w-16 border border-gray-300 rounded text-center py-1 font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                                                                        />
                                                                        <span className="text-[10px] text-gray-400 mt-1">Karung</span>
                                                                    </div>
                                                                    <div className="flex flex-col items-center">
                                                                        <input 
                                                                            type="number" 
                                                                            min="0"
                                                                            value={input.pack || ''}
                                                                            placeholder="0"
                                                                            onChange={(e) => handleInputChange(item.id, idx, 'pack', e.target.value)}
                                                                            className="w-16 border border-gray-300 rounded text-center py-1 font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                                                                        />
                                                                        <span className="text-[10px] text-gray-400 mt-1">Pack</span>
                                                                    </div>
                                                                    <div className="flex flex-col items-center">
                                                                        <input 
                                                                            type="number" 
                                                                            min="0"
                                                                            value={input.pcs || ''}
                                                                            placeholder="0"
                                                                            onChange={(e) => handleInputChange(item.id, idx, 'pcs', e.target.value)}
                                                                            className="w-16 border border-gray-300 rounded text-center py-1 font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                                                                        />
                                                                        <span className="text-[10px] text-gray-400 mt-1">Pcs</span>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* Difference */}
                                                            <td className="px-4 py-3 text-right align-middle">
                                                                {!hasInput ? (
                                                                    <span className="text-gray-300 text-xs italic">Belum diisi</span>
                                                                ) : (
                                                                    <div className={`font-bold text-sm px-3 py-1 rounded-full inline-flex items-center gap-1 ${
                                                                        diff === 0 ? 'bg-gray-100 text-gray-600' : 
                                                                        diff < 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                                                                    }`}>
                                                                        {diff === 0 && <CheckCircle2 className="w-3 h-3"/>}
                                                                        {diff < 0 && <AlertCircle className="w-3 h-3"/>}
                                                                        {diff > 0 && <ArrowRight className="w-3 h-3 -rotate-45"/>}
                                                                        {diff > 0 ? `+${diff}` : diff} Pcs
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                            {filteredItems.length === 0 && (
                                <div className="text-center py-20 text-gray-400">
                                    <Package className="w-16 h-16 mx-auto mb-4 opacity-50"/>
                                    <p>Produk tidak ditemukan.</p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            ) : (
                // --- HISTORY TAB ---
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 text-gray-700 font-bold border-b">
                            <tr>
                                <th className="px-6 py-4">Tanggal</th>
                                <th className="px-6 py-4">Produk</th>
                                <th className="px-6 py-4">Variasi</th>
                                <th className="px-6 py-4 text-center">Selisih</th>
                                <th className="px-6 py-4">Petugas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {historyLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-gray-600 font-medium">{log.date}</td>
                                    <td className="px-6 py-4 font-bold text-gray-800">{log.productName}</td>
                                    <td className="px-6 py-4">{log.variant}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1 rounded-full font-bold text-xs ${
                                            log.status === 'MATCH' ? 'bg-gray-100 text-gray-600' :
                                            log.status === 'MINUS' ? 'bg-red-100 text-red-600' :
                                            'bg-green-100 text-green-600'
                                        }`}>
                                            {log.difference > 0 ? '+' : ''}{log.difference} Pcs
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{log.staff}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {historyLogs.length === 0 && (
                        <div className="p-10 text-center text-gray-500">Belum ada riwayat opname.</div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};

export default StockOpnamePage;