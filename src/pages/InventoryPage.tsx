// src/pages/InventoryPage.tsx TAMBAHIN HARGA KHUSUS KATEGORI CUSTOMER

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, ScanLine, Menu, X, Package, LayoutGrid, List, Plus, Upload, EyeOff, Image as ImageIcon, ChevronDown, Check, Trash2, Store, ArrowLeft, Loader2, Save, ChevronLeft, ChevronRight, FileSpreadsheet, Edit2 } from 'lucide-react';
import type { InventoryItem, InventoryVariant } from '../types/index';
import { INITIAL_INVENTORY_DATA } from '../data/mockData';

interface InventoryPageProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
}

// Interface Helper untuk State Add Product
interface NewVariantItem {
  name: string;
}

const InventoryPage: React.FC<InventoryPageProps> = ({ setIsSidebarOpen }) => {
  // --- STATE DATA (MOCK / DUMMY) ---
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // --- FETCH DATA (SIMULASI DARI DUMMY) ---
  useEffect(() => {
    // Simulasi loading sebentar agar terasa seperti fetch data
    setTimeout(() => {
        setInventoryItems(INITIAL_INVENTORY_DATA);
        setIsLoadingData(false);
    }, 500);
  }, []);
  
  // --- STATE TAMPILAN ---
  const [inventoryViewMode, setInventoryViewMode] = useState<'GRID' | 'LIST'>('LIST'); 
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [inventoryFilter, setInventoryFilter] = useState<'ACTIVE' | 'NON_ACTIVE' | 'HABIS'>('ACTIVE');
  const [inventorySearch, setInventorySearch] = useState("");

  // --- STATE UNIT SELECTION (GRID & LIST) ---
  const [gridUnitState, setGridUnitState] = useState<Record<string, string>>({});
  const [listUnitState, setListUnitState] = useState<Record<string, string>>({});

  // --- STATE MODAL DETAIL ---
  const [modalPriceUnits, setModalPriceUnits] = useState<Record<number, string>>({});
  const [modalStockUnits, setModalStockUnits] = useState<Record<number, string>>({}); 

  useEffect(() => {
    if (selectedInventoryItem) {
        const initialUnits: Record<number, string> = {};
        selectedInventoryItem.variants.forEach((_, idx) => {
            initialUnits[idx] = 'Karung'; 
        });
        setModalPriceUnits(initialUnits);
        setModalStockUnits(initialUnits); // Init unit stok
    }
  }, [selectedInventoryItem]);

  // --- STATE PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
  // --- STATE UPLOAD & ADD PRODUCT ---
  const [isUploadPage, setIsUploadPage] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- STATE FORM ADD PRODUCT ---
  const [isAddProductPage, setIsAddProductPage] = useState(false);
  const [newProductImages, setNewProductImages] = useState<(File | null)[]>([null, null, null]);
  const [newProductName, setNewProductName] = useState("");
  
  const [newProductVariants, setNewProductVariants] = useState<NewVariantItem[]>([
      { name: "" }
  ]);
  
  // State Konversi Unit (Default Kosong)
  const [unitConversions, setUnitConversions] = useState([{ from: "", to: "", value: 0 }]); 

  // State Harga Dinamis: Key = "variantIndex-unitName", Value = { modal, jual }
  const [newProductPrices, setNewProductPrices] = useState<Record<string, { modal: number, jual: number }>>({});

  // --- LOGIC HELPER ---
  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

  // --- LOGIC ADD PRODUCT (LOCAL STATE) ---
  const handleImageUpload = (index: number, file: File) => { const newImages = [...newProductImages]; newImages[index] = file; setNewProductImages(newImages); };
  
  const handleAddConversion = () => { 
      // Otomatis ambil unit 'to' dari baris terakhir sebagai unit 'from' baris baru
      const lastConversion = unitConversions[unitConversions.length - 1];
      const nextFrom = lastConversion && lastConversion.to ? lastConversion.to : "";
      
      setUnitConversions([...unitConversions, { from: nextFrom, to: "", value: 0 }]); 
  };

  const handleRemoveConversion = (index: number) => { if (unitConversions.length > 1) setUnitConversions(unitConversions.filter((_, i) => i !== index)); };
  const updateConversion = (index: number, field: string, val: any) => { const nc = [...unitConversions]; (nc as any)[index][field] = val; setUnitConversions(nc); };

  const handleAddVariant = () => setNewProductVariants([...newProductVariants, { name: "" }]);
  const handleRemoveVariant = (index: number) => { if (newProductVariants.length > 1) setNewProductVariants(newProductVariants.filter((_, i) => i !== index)); };
  
  const updateVariant = (index: number, val: string) => { 
      const nv = [...newProductVariants]; 
      nv[index].name = val; 
      setNewProductVariants(nv); 
  };

  // Update Harga Dinamis
  const updatePrice = (variantIdx: number, unit: string, type: 'modal' | 'jual', value: number) => {
      const key = `${variantIdx}-${unit}`;
      setNewProductPrices(prev => ({
          ...prev,
          [key]: {
              ...prev[key],
              [type]: value
          }
      }));
  };

  const handleSaveNewProduct = () => { 
      if(!newProductName.trim()) return alert("Nama Produk Wajib Diisi!");
      const validVariants = newProductVariants.filter(v => v.name.trim() !== "");
      if(validVariants.length === 0) return alert("Minimal satu variasi harus diisi!");
      
      setIsUploading(true);

      // Simulasi Simpan ke Database
      setTimeout(() => {
        const newId = `PROD-${Date.now()}`;
        
        // Cari harga dasar (misal dari unit terbesar/pertama) untuk mock data
        const firstUnit = unitConversions[0]?.from || "Pcs";
        
        const newItem: InventoryItem = {
            id: newId,
            name: newProductName,
            image: "https://placehold.co/400", // Placeholder Image
            status: "ACTIVE",
            variants: validVariants.map((v, idx) => {
                const key = `${idx}-${firstUnit}`;
                const prices = newProductPrices[key] || { modal: 0, jual: 0 };
                return {
                    size: v.name,
                    stockKarung: 0, 
                    stockPack: 0,
                    stockPcs: 0,
                    priceModal: prices.modal,
                    priceJual: prices.jual
                };
            })
        };

        // Update Local State
        setInventoryItems([newItem, ...inventoryItems]);
        
        alert("Produk Berhasil Disimpan (Local State)!"); 
        setIsAddProductPage(false); 
        
        // Reset Form
        setNewProductName("");
        setNewProductVariants([{ name: "" }]);
        setNewProductImages([null, null, null]);
        setUnitConversions([{ from: "", to: "", value: 0 }]);
        setNewProductPrices({});
        setIsUploading(false);
      }, 1000);
  };

  // --- LOGIC UPLOAD ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) setUploadFile(e.target.files[0]); };
  const handleProcessUpload = () => { if(!uploadFile) return; setIsUploading(true); setTimeout(() => { setIsUploading(false); alert("Upload Berhasil! (Simulasi)"); setUploadFile(null); setIsUploadPage(false); }, 2000); };

  // --- LOGIC CONVERSION ---
  const KARUNG_TO_PACK = 50;
  const PACK_TO_PCS = 5;

  const getTotalPcs = (v: InventoryVariant) => (v.stockKarung * KARUNG_TO_PACK * PACK_TO_PCS) + (v.stockPack * PACK_TO_PCS) + v.stockPcs;

  // 1. Helper untuk GRID View
  const getGridUnit = (itemId: string) => gridUnitState[itemId] || 'Karung';
  const handleGridUnitChange = (itemId: string, newUnit: string) => setGridUnitState(prev => ({ ...prev, [itemId]: newUnit }));

  // 2. Helper untuk LIST View
  const getListUnit = (itemId: string, variantIdx: number) => listUnitState[`list-${itemId}-${variantIdx}`] || 'Karung';
  const handleListUnitChange = (itemId: string, variantIdx: number, newUnit: string) => setListUnitState(prev => ({ ...prev, [`list-${itemId}-${variantIdx}`]: newUnit }));

  // 3. Konversi Stok
  const getDisplayStock = (v: InventoryVariant, unit: string) => {
    const totalPcs = getTotalPcs(v);
    if (unit === 'Pcs') return { karung: 0, pack: 0, pcs: totalPcs };
    if (unit === 'Pack') return { karung: 0, pack: Math.floor(totalPcs / PACK_TO_PCS), pcs: totalPcs % PACK_TO_PCS };
    return { karung: v.stockKarung, pack: v.stockPack, pcs: v.stockPcs };
  };
  
  // 4. Konversi Harga
  const getConvertedPrice = (basePrice: number, unit: string) => {
      if (unit === 'Karung') return basePrice;
      if (unit === 'Pack') return basePrice / KARUNG_TO_PACK;
      if (unit === 'Pcs') return basePrice / (KARUNG_TO_PACK * PACK_TO_PCS);
      return basePrice;
  };

  // --- FILTERING ---
  const filteredInventoryItems = useMemo(() => {
    return inventoryItems.filter(item => {
      let statusMatch = false;
      if (inventoryFilter === 'ACTIVE') statusMatch = item.status === 'ACTIVE';
      else if (inventoryFilter === 'NON_ACTIVE') statusMatch = item.status === 'NON_ACTIVE';
      else if (inventoryFilter === 'HABIS') statusMatch = item.variants.reduce((acc, curr) => acc + getTotalPcs(curr), 0) === 0 && item.status === 'ACTIVE';
      const searchMatch = item.name.toLowerCase().includes(inventorySearch.toLowerCase());
      return statusMatch && searchMatch;
    });
  }, [inventoryItems, inventoryFilter, inventorySearch]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInventoryItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInventoryItems.length / itemsPerPage);
  
  const startItemIndex = filteredInventoryItems.length === 0 ? 0 : indexOfFirstItem + 1;
  const endItemIndex = Math.min(indexOfLastItem, filteredInventoryItems.length);

  const handlePageChange = (pageNumber: number) => setCurrentPage(pageNumber);

  // --- ACTION HANDLERS (LOCAL STATE) ---
  const handleDeleteInventory = (id: string) => { 
      if(window.confirm("Hapus produk ini permanen?")) {
          setInventoryItems(prev => prev.filter(item => item.id !== id));
      }
  };

  const handleToggleStatus = (id: string, currentStatus: string) => { 
      const newStatus = currentStatus === 'ACTIVE' ? 'NON_ACTIVE' : 'ACTIVE';
      setInventoryItems(prev => prev.map(item => 
          item.id === id ? { ...item, status: newStatus as any } : item
      ));
  };

  // Get Unique Units for Price Table
  const getUniqueUnits = () => {
      const units = new Set<string>();
      unitConversions.forEach(c => {
          if (c.from) units.add(c.from);
          if (c.to) units.add(c.to);
      });
      return Array.from(units);
  };

  // === RENDER UPLOAD STOCK ===
  if (isUploadPage) {
    return (
        <div className="flex-1 flex flex-col h-full bg-gray-50 relative">
            {isUploading && <div className="absolute inset-0 z-100 bg-black/60 flex flex-col items-center justify-center text-white"><Loader2 className="w-16 h-16 animate-spin mb-4 text-[#3FA2F6]" /><h2 className="text-2xl font-bold">Uploading...</h2></div>}
            <div className="bg-white p-4 border-b flex items-center gap-4 shadow-sm"><button onClick={() => setIsUploadPage(false)} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft/></button><h1 className="text-xl font-bold">Upload Stock</h1></div>
            <div className="flex-1 p-8 flex justify-center"><div className="bg-white w-full max-w-4xl p-8 rounded-xl border border-gray-300 shadow-sm"><div className="flex justify-between items-center mb-8 border-b pb-4"><h2 className="text-2xl font-bold">Upload Data</h2><button className="bg-[#568f5d] text-white px-6 py-2 rounded-lg flex gap-2"><FileSpreadsheet/> Download Template</button></div><div className="space-y-6"><div><label className="block font-semibold mb-2">Upload Excel/CSV</label><div className="flex items-center gap-4"><input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange}/><button onClick={() => fileInputRef.current?.click()} className="bg-blue-50 text-blue-600 border border-blue-200 px-6 py-3 rounded-lg">Choose File</button><span className="text-gray-500 italic">{uploadFile ? uploadFile.name : "No file chosen"}</span></div></div><div className="pt-8 flex justify-end"><button onClick={handleProcessUpload} disabled={!uploadFile} className="bg-[#3FA2F6] text-white font-bold px-8 py-3 rounded-lg hover:bg-blue-600 flex gap-2"><Upload/> Upload Data</button></div></div></div></div>
        </div>
    );
  }

  // === RENDER UTAMA ===
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
      {/* HEADER */}
      <div className="p-4 border-b border-gray-200 flex flex-col gap-4 bg-white shadow-sm z-20">
          <div className="flex items-center gap-4">
              <Menu className="w-6 h-6 cursor-pointer hover:text-blue-500" onClick={() => setIsSidebarOpen(true)} />
              <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input type="text" placeholder="Cari produk..." value={inventorySearch} onChange={(e) => setInventorySearch(e.target.value)} className="w-full pl-10 pr-10 py-2 border border-black rounded-full focus:outline-none focus:border-blue-500"/>
                  {inventorySearch ? <X className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 cursor-pointer" onClick={() => setInventorySearch("")} /> : <ScanLine className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black cursor-pointer" />}
              </div>
              <button onClick={() => setIsAddProductPage(true)} className="bg-[#3FA2F6] text-white px-4 py-2 rounded-full font-semibold flex items-center gap-2 hover:bg-blue-600 shadow-md"><Plus className="w-5 h-5" /> Tambah Produk</button>
              <button onClick={() => setIsUploadPage(true)} className="bg-[#568f5d] text-white px-4 py-2 rounded-full font-semibold flex items-center gap-2 hover:bg-green-700 shadow-md"><Upload className="w-5 h-5" /> Upload</button>
          </div>
          
          <div className="flex justify-between items-center">
              <div className="flex gap-2">
                  <button onClick={() => setInventoryFilter('ACTIVE')} className={`px-4 py-1 rounded-full border border-black font-semibold transition-colors ${inventoryFilter === 'ACTIVE' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}>Stok Aktif</button>
                  <button onClick={() => setInventoryFilter('NON_ACTIVE')} className={`px-4 py-1 rounded-full border border-black font-semibold transition-colors ${inventoryFilter === 'NON_ACTIVE' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}>Stok Non Aktif</button>
                  <button onClick={() => setInventoryFilter('HABIS')} className={`px-4 py-1 rounded-full border border-black font-semibold transition-colors ${inventoryFilter === 'HABIS' ? 'bg-red-600 text-white border-red-600' : 'bg-white hover:bg-gray-100'}`}>Stok Habis</button>
              </div>
              
              <div className="flex items-center gap-4 relative z-20">
                <select 
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white shadow-sm font-medium cursor-pointer"
                >
                    <option value={10}>10 per halaman</option>
                    <option value={20}>20 per halaman</option>
                    <option value={50}>50 per halaman</option>
                    <option value={100}>100 per halaman</option>
                </select>

                <div className="relative">
                    <button onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)} className="flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-lg text-blue-900 hover:bg-blue-200">
                        {inventoryViewMode === 'GRID' ? <LayoutGrid className="w-5 h-5"/> : <List className="w-5 h-5"/>}
                        <span className="font-semibold">Tampilan</span>
                        <ChevronDown className="w-4 h-4" />
                    </button>
                    {isViewDropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden z-30">
                            <button onClick={() => { setInventoryViewMode('GRID'); setIsViewDropdownOpen(false); }} className={`w-full text-left px-4 py-3 flex items-center gap-2 hover:bg-gray-100 ${inventoryViewMode === 'GRID' ? 'text-blue-600 font-bold bg-blue-50' : 'text-gray-700'}`}><LayoutGrid className="w-4 h-4"/> Grid View</button>
                            <button onClick={() => { setInventoryViewMode('LIST'); setIsViewDropdownOpen(false); }} className={`w-full text-left px-4 py-3 flex items-center gap-2 hover:bg-gray-100 ${inventoryViewMode === 'LIST' ? 'text-blue-600 font-bold bg-blue-50' : 'text-gray-700'}`}><List className="w-4 h-4"/> List View</button>
                        </div>
                    )}
                </div>
              </div>
          </div>
      </div>

      {/* CONTENT LIST */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 pb-24">
          {isLoadingData ? (
             <div className="flex items-center justify-center h-64"><Loader2 className="w-10 h-10 animate-spin text-blue-500"/></div>
          ) : filteredInventoryItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400"><Package className="w-16 h-16 mb-4 opacity-50"/><p className="text-xl font-medium">Data tidak ditemukan</p></div>
          ) : (
             <>
             {inventoryViewMode === 'GRID' ? (
              // --- GRID VIEW ---
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentItems.map(item => {
                  const currentUnit = getGridUnit(item.id); 
                  return (
                  <div key={item.id} className="bg-white rounded-lg border border-gray-300 shadow-sm overflow-hidden flex flex-col relative transition-transform hover:scale-[1.01] duration-200">
                      <div className="p-4 flex gap-4 cursor-pointer hover:bg-blue-50/50 transition-colors" onClick={() => setSelectedInventoryItem(item)}>
                          <img src={item.image} alt={item.name} className="w-24 h-24 object-contain bg-black rounded-md" />
                          <div className="flex-1">
                              <h3 className="font-bold text-lg mb-2 text-gray-800">{item.name}</h3>
                              <div className="space-y-1 text-xs font-semibold">
                                {item.variants.map((v, idx) => {
                                  const stockDisplay = getDisplayStock(v, currentUnit);
                                  return (
                                  <div key={idx} className="grid grid-cols-12 gap-1 items-center">
                                      <span className="col-span-3 text-gray-700 truncate" title={v.size}>{v.size}</span>
                                      <span className={`col-span-3 text-right ${stockDisplay.karung === 0 ? "text-red-500" : "text-green-600"}`}>{stockDisplay.karung} Karung</span>
                                      <span className={`col-span-3 text-right ${stockDisplay.pack === 0 ? "text-red-500" : "text-green-600"}`}>{stockDisplay.pack} Pack</span>
                                      <span className={`col-span-3 text-right ${stockDisplay.pcs === 0 ? "text-red-500" : "text-green-600"}`}>{stockDisplay.pcs} Pcs</span>
                                  </div>
                                )})}
                              </div>
                          </div>
                      </div>
                      
                      {/* UNIT SELECTION */}
                      <div className="px-4 pb-2 border-t border-gray-100 pt-2">
                          <select 
                            className="border border-black rounded px-2 py-1 text-sm w-32 bg-white cursor-pointer hover:border-blue-500 shadow-sm focus:outline-none"
                            value={currentUnit} 
                            onChange={(e) => handleGridUnitChange(item.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="Karung">Karung</option>
                            <option value="Pack">Pack</option>
                            <option value="Pcs">Pcs</option>
                          </select>
                      </div>

                      <div className="grid grid-cols-2 text-white font-bold text-sm mt-2">
                          <button onClick={() => handleDeleteInventory(item.id)} className="bg-red-600 hover:bg-red-700 py-3 flex items-center justify-center gap-1 transition-colors"><Trash2 className="w-4 h-4" /> Delete</button>
                          {item.status === 'ACTIVE' ? (<button onClick={() => handleToggleStatus(item.id, 'ACTIVE')} className="bg-[#E95318] hover:bg-orange-600 py-3 flex items-center justify-center gap-1 transition-colors"><EyeOff className="w-4 h-4" /> Non - Aktifkan</button>) : (<button onClick={() => handleToggleStatus(item.id, 'NON_ACTIVE')} className="bg-green-600 hover:bg-green-700 py-3 flex items-center justify-center gap-1 transition-colors"><Check className="w-4 h-4" /> Aktifkan</button>)}
                          <button className="col-span-2 bg-[#3FA2F6] hover:bg-blue-600 py-3 flex items-center justify-center gap-1 transition-colors" onClick={() => setSelectedInventoryItem(item)}>Detail Stok</button>
                      </div>
                  </div>
                )})}
              </div>
          ) : (
              // --- LIST VIEW ---
              <div className="bg-white border border-black rounded-lg overflow-hidden">
                 <div className="grid grid-cols-12 bg-white border-b border-black font-bold p-3 text-sm">
                    <div className="col-span-4 flex items-center gap-2">Nama Produk <Package className="w-4 h-4"/></div>
                    <div className="col-span-2 flex items-center gap-2">Unit <Store className="w-4 h-4"/></div>
                    <div className="col-span-2">Variasi</div>
                    <div className="col-span-4 text-center">Stok (Converted)</div>
                 </div>
                 {currentItems.map(item => {
                    return (
                    <div key={item.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                       <div className="grid grid-cols-12 p-3 text-sm items-start">
                          <div className="col-span-4 font-bold flex gap-4 items-center cursor-pointer group" onClick={() => setSelectedInventoryItem(item)}>
                             <span className="text-base text-gray-800 group-hover:text-blue-600 pl-2 underline decoration-transparent group-hover:decoration-blue-600 transition-all">{item.name}</span>
                          </div>
                          <div className="col-span-8">
                             {item.variants.map((v, idx) => {
                                const currentUnit = getListUnit(item.id, idx);
                                const stockDisplay = getDisplayStock(v, currentUnit);
                                return (
                                <div key={idx} className="grid grid-cols-8 mb-4 last:mb-0 items-center">
                                   <div className="col-span-2 pr-4"><select value={currentUnit} onChange={(e) => handleListUnitChange(item.id, idx, e.target.value)} className="border border-black rounded px-2 py-1 text-sm bg-white w-full cursor-pointer hover:border-blue-500 shadow-sm focus:outline-none"><option value="Karung">Karung</option><option value="Pack">Pack</option><option value="Pcs">Pcs</option></select></div>
                                   <div className="col-span-2 font-bold px-2 text-base">{v.size}</div>
                                   <div 
                                      className="col-span-4 grid grid-cols-3 gap-2 text-sm font-bold text-right cursor-pointer hover:opacity-70"
                                      onClick={() => setSelectedInventoryItem(item)} // KLIK STOK JUGA BUKA DETAIL
                                   >
                                       <span className={stockDisplay.karung === 0 ? "text-red-500" : "text-green-600"}>{stockDisplay.karung} Karung</span>
                                       <span className={stockDisplay.pack === 0 ? "text-red-500" : "text-green-600"}>{stockDisplay.pack} Pack</span>
                                       <span className={stockDisplay.pcs === 0 ? "text-red-500" : "text-green-600"}>{stockDisplay.pcs} Pcs</span>
                                   </div>
                                </div>
                             )})}
                             <div className="mt-4 flex justify-end gap-2 border-t border-dashed border-gray-300 pt-3">
                                <button onClick={() => handleDeleteInventory(item.id)} className="bg-red-600 text-white px-3 py-1.5 rounded flex items-center gap-1 hover:bg-red-700 transition-colors text-xs font-bold shadow-sm"><Trash2 className="w-3 h-3" /> Delete Produk</button>
                                {item.status === 'ACTIVE' ? <button onClick={() => handleToggleStatus(item.id, 'ACTIVE')} className="bg-[#E95318] text-white px-3 py-1.5 rounded flex items-center gap-1 hover:bg-orange-600 transition-colors text-xs font-bold shadow-sm"><EyeOff className="w-3 h-3" /> Non-Aktifkan</button> : <button onClick={() => handleToggleStatus(item.id, 'NON_ACTIVE')} className="bg-green-600 text-white px-3 py-1.5 rounded flex items-center gap-1 hover:bg-green-700 transition-colors text-xs font-bold shadow-sm"><Check className="w-3 h-3" /> Aktifkan</button>}
                             </div>
                          </div>
                       </div>
                    </div>
                 )})}
              </div>
          )}
          </> 
         )}
      </div>

      {/* --- FOOTER PAGINATION --- */}
      <div className="bg-white border-t border-gray-200 p-4 flex justify-between items-center sticky bottom-0 z-20 shadow-2xl">
          <div className="text-gray-800 font-medium">
              Menampilkan <span className="font-bold">{startItemIndex} - {endItemIndex}</span> dari <span className="font-bold">{filteredInventoryItems.length}</span> Produk
          </div>

          <div className="flex items-center gap-4">
              <button 
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))} 
                disabled={currentPage === 1} 
                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
              >
                  <ChevronLeft className="w-4 h-4"/> Balik
              </button>
              
              <button 
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} 
                disabled={currentPage === totalPages || totalPages === 0} 
                className="px-4 py-2 rounded bg-[#BEDFFF] hover:bg-blue-300 text-blue-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
              >
                  Lanjut <ChevronRight className="w-4 h-4"/>
              </button>
          </div>
      </div>

      {/* === ADD PRODUCT POPUP MODAL (REPLACING FULL PAGE) === */}
      {isAddProductPage && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-white/90 backdrop-blur-sm animate-in fade-in duration-200 p-4 md:p-8" onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddProductPage(false);
        }}>
            {isUploading && <div className="absolute inset-0 z-100 bg-black/60 flex flex-col items-center justify-center text-white rounded-3xl"><Loader2 className="w-16 h-16 animate-spin mb-4 text-[#3FA2F6]" /><h2 className="text-2xl font-bold">Menyimpan Produk...</h2></div>}
            
            <div className="bg-white w-full max-w-5xl h-full max-h-[90vh] shadow-2xl border border-gray-300 rounded-3xl flex flex-col overflow-hidden relative">
                {/* Header Modal Add Product */}
                <div className="bg-white p-4 border-b border-gray-200 flex items-center justify-between shadow-sm z-10">
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Plus className="w-6 h-6 text-blue-600"/> Tambah Produk Baru</h1>
                    <button onClick={() => setIsAddProductPage(false)} className="p-2 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-full transition-colors"><X className="w-6 h-6"/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 pb-32">
                    <div className="max-w-5xl mx-auto w-full space-y-10">
                        {/* FOTO PRODUK */}
                        <div className="flex justify-center gap-8">
                            {newProductImages.map((img, idx) => (
                                <div key={idx} className="flex flex-col items-center gap-2">
                                    <div className="w-32 h-32 border-2 border-dashed border-gray-400 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 bg-white relative overflow-hidden" onClick={() => document.getElementById(`img-upload-${idx}`)?.click()}>
                                        {img ? <img src={URL.createObjectURL(img)} className="w-full h-full object-contain" /> : (
                                            <>
                                                <ImageIcon className="w-8 h-8 text-gray-400 mb-2"/>
                                                <span className="text-[10px] text-gray-500">Foto {idx + 1}</span>
                                            </>
                                        )}
                                        <input type="file" id={`img-upload-${idx}`} className="hidden" accept="image/*" onChange={(e) => e.target.files && handleImageUpload(idx, e.target.files[0])}/>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* NAMA PRODUK */}
                        <div>
                            <label className="block font-bold mb-2 text-gray-800">Nama Produk*</label>
                            <input type="text" placeholder="Masukan nama produk" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} className="w-full border border-gray-400 rounded-full px-4 py-2 focus:outline-none focus:border-blue-500"/>
                        </div>

                        {/* UNIT CONVERSION & VARIASI */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {/* LEFT: UNIT CONVERSION */}
                            <div>
                                <h3 className="font-bold text-lg mb-4 text-gray-800 border-b pb-2">Unit Conversion</h3>
                                <div className="space-y-3">
                                    {unitConversions.map((conv, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <div className="border border-gray-400 rounded-full px-4 py-1 w-12 text-center font-bold bg-gray-100">1</div>
                                            <input type="text" placeholder="Unit Besar (Karung)" value={conv.from} onChange={(e) => updateConversion(idx, 'from', e.target.value)} className="border border-gray-400 rounded-full px-4 py-1 w-full text-sm"/>
                                            <span className="font-bold">=</span>
                                            <input type="number" value={conv.value || ''} onChange={(e) => updateConversion(idx, 'value', e.target.value)} className="border border-black rounded-full px-2 py-1 w-20 text-center"/>
                                            <input type="text" placeholder="Unit Kecil (Pack)" value={conv.to} onChange={(e) => updateConversion(idx, 'to', e.target.value)} className="border border-gray-400 rounded-full px-4 py-1 w-full text-sm"/>
                                            {unitConversions.length > 1 && (<button onClick={() => handleRemoveConversion(idx)} className="text-red-500 hover:bg-red-50 rounded-full p-1"><X className="w-4 h-4"/></button>)}
                                        </div>
                                    ))}
                                    <button onClick={handleAddConversion} className="mt-2 border border-dashed border-gray-400 text-gray-500 px-6 py-1 rounded-full text-sm font-semibold hover:bg-gray-50 w-full">+ tambah unit baru</button>
                                </div>
                            </div>

                            {/* RIGHT: VARIASI PRODUK */}
                            <div>
                                <h3 className="font-bold text-lg mb-4 text-gray-800 border-b pb-2">Variasi Produk</h3>
                                <div className="space-y-3">
                                    {newProductVariants.map((v, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <input type="text" placeholder={`Ukuran ${idx + 1}...`} value={v.name} onChange={(e) => updateVariant(idx, e.target.value)} className="w-full border border-gray-400 rounded-full px-4 py-2 focus:outline-none focus:border-blue-500"/>
                                            {newProductVariants.length > 1 && <button onClick={() => handleRemoveVariant(idx)} className="text-red-500"><X/></button>}
                                        </div>
                                    ))}
                                    <button onClick={handleAddVariant} className="w-full border border-dashed border-gray-400 text-gray-500 rounded-full px-4 py-2 text-left hover:bg-gray-50">+ Variasi</button>
                                </div>
                            </div>
                        </div>

                        {/* HARGA TABLE (DYNAMIC GENERATED) */}
                        <div>
                            <h3 className="font-bold text-lg mb-4 text-gray-800 border-b pb-2">Harga Jual & Modal</h3>
                            <div className="border border-gray-400 rounded-lg overflow-hidden shadow-sm">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-400">
                                        <tr>
                                            <th className="px-4 py-3">Variasi</th>
                                            <th className="px-4 py-3">Unit</th>
                                            <th className="px-4 py-3 text-right">Harga Modal</th>
                                            <th className="px-4 py-3 text-right">Harga Jual</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {/* Generate Rows: Variant x Unique Units */}
                                        {newProductVariants.map((v, vIdx) => {
                                            const uniqueUnits = getUniqueUnits();
                                            if (uniqueUnits.length === 0) return null;

                                            return uniqueUnits.map((unit, _) => {
                                                const priceKey = `${vIdx}-${unit}`;
                                                const prices = newProductPrices[priceKey] || { modal: 0, jual: 0 };

                                                return (
                                                    <tr key={priceKey} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-4 py-3 font-bold">{v.name || <span className="text-gray-400 italic">Nama variasi...</span>}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="border border-gray-400 rounded-full px-3 py-1 bg-white text-xs w-fit shadow-sm font-bold text-gray-700">
                                                                {unit || "Unit..."}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">Rp</span>
                                                                <input 
                                                                    type="number" 
                                                                    value={prices.modal || ''} 
                                                                    onChange={(e) => updatePrice(vIdx, unit, 'modal', parseFloat(e.target.value))}
                                                                    className="w-full border border-gray-300 rounded-full py-1 pl-8 pr-3 text-right text-red-600 font-bold focus:outline-none focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">Rp</span>
                                                                <input 
                                                                    type="number" 
                                                                    value={prices.jual || ''} 
                                                                    onChange={(e) => updatePrice(vIdx, unit, 'jual', parseFloat(e.target.value))}
                                                                    className="w-full border border-gray-300 rounded-full py-1 pl-8 pr-3 text-right text-green-600 font-bold focus:outline-none focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        })}
                                        {newProductVariants.length > 0 && getUniqueUnits().length === 0 && (
                                            <tr><td colSpan={4} className="p-4 text-center text-gray-400 italic">Tambahkan unit konversi terlebih dahulu untuk mengatur harga.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full bg-white/80 backdrop-blur-sm border-t p-6 flex justify-center z-20">
                    <button onClick={handleSaveNewProduct} className="bg-[#BEDFFF] text-black text-2xl font-bold px-12 py-3 rounded-full hover:bg-blue-300 shadow-xl flex items-center gap-3">
                        <Save className="w-8 h-8"/> Simpan
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* === DETAIL MODAL === */}
      {selectedInventoryItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-white/90 backdrop-blur-sm animate-in fade-in duration-200 p-4 md:p-8" onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedInventoryItem(null);
        }}>
          <div className="bg-white w-full max-w-5xl h-full max-h-[90vh] shadow-2xl border border-gray-300 rounded-3xl flex flex-col overflow-hidden relative">
            
            {/* HEADER (Hanya Judul & Tombol Close - Gambar dipindah ke bawah agar ikut scroll) */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50 relative">
               <h2 className="text-2xl font-bold text-black flex-1 text-center pl-10">{selectedInventoryItem.name}</h2>
               <button onClick={() => setSelectedInventoryItem(null)} className="p-2 bg-white rounded-full shadow-sm hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors">
                   <X className="w-6 h-6"/>
               </button>
            </div>

            {/* BODY (Area Scrollable: Gambar, Info Konversi, Stok, Harga) */}
            <div className="p-8 overflow-y-auto flex-1 space-y-8">
               
               {/* GAMBAR PRODUK (Sekarang ikut di-scroll) */}
               <div className="flex justify-center gap-8">
                   {[1, 2, 3].map((_, idx) => (
                       <div key={idx} className="flex flex-col items-center">
                           <div className="w-32 h-32 border border-black rounded-lg flex items-center justify-center bg-white shadow-sm overflow-hidden">
                               {idx === 0 ? <img src={selectedInventoryItem.image} className="w-full h-full object-contain"/> : <ImageIcon className="w-10 h-10 text-gray-300"/>}
                           </div>
                           <span className="text-xs font-bold mt-2 text-gray-500">Foto {idx + 1}</span>
                       </div>
                   ))}
               </div>

               {/* INFO KONVERSI UNIT (Tabel Full) */}
               <div>
                   <h3 className="font-bold text-lg underline mb-3 text-gray-800">Info Konversi Unit</h3>
                   <div className="border border-gray-400 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 border-b border-gray-400 font-bold text-gray-700">
                                <tr>
                                    <th className="px-6 py-3">Unit Besar</th>
                                    <th className="px-6 py-3 text-center">=</th>
                                    <th className="px-6 py-3">Unit Kecil</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {/* Contoh Data Dummy Konversi */}
                                <tr>
                                    <td className="px-6 py-3 font-medium">1 Karung</td>
                                    <td className="px-6 py-3 text-center text-gray-400"><ArrowLeft className="w-4 h-4 inline rotate-180"/></td>
                                    <td className="px-6 py-3 font-bold text-blue-600">50 Pack</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-3 font-medium">1 Pack</td>
                                    <td className="px-6 py-3 text-center text-gray-400"><ArrowLeft className="w-4 h-4 inline rotate-180"/></td>
                                    <td className="px-6 py-3 font-bold text-blue-600">5 Pcs</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-3 font-medium">1 Bal</td>
                                    <td className="px-6 py-3 text-center text-gray-400"><ArrowLeft className="w-4 h-4 inline rotate-180"/></td>
                                    <td className="px-6 py-3 font-bold text-blue-600">10 Pack</td>
                                </tr>
                            </tbody>
                        </table>
                   </div>
               </div>

               {/* TABLE STOK */}
               <div>
                   <h3 className="font-bold text-lg underline mb-3 text-gray-800">Stok</h3>
                   <div className="border border-gray-400 rounded-xl overflow-hidden shadow-sm">
                       <table className="w-full text-xs">
                           <thead className="bg-gray-100 border-b border-gray-400 font-bold text-gray-700 text-left">
                               <tr>
                                   <th className="px-4 py-3 w-1/4">Variasi</th>
                                   <th className="px-4 py-3 w-1/6">Unit</th> 
                                   <th className="px-4 py-3 text-center w-auto">Stok (Converted)</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-200 bg-white">
                               {selectedInventoryItem.variants.map((v, idx) => {
                                   const unit = modalStockUnits[idx] || 'Karung'; 
                                   const stockDisplay = getDisplayStock(v, unit); 

                                   return (
                                       <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                                           <td className="px-4 py-4 font-bold text-gray-800 align-middle text-sm">
                                               {v.size}
                                           </td>
                                           <td className="px-4 py-4 align-middle">
                                               <select 
                                                    value={unit}
                                                    onChange={(e) => setModalStockUnits(prev => ({...prev, [idx]: e.target.value}))}
                                                    className="w-full border border-gray-300 rounded-full px-3 py-1.5 text-xs bg-white cursor-pointer hover:border-blue-500 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-200"
                                               >
                                                   <option value="Karung">Karung</option>
                                                   <option value="Pack">Pack</option>
                                                   <option value="Pcs">Pcs</option>
                                               </select>
                                           </td>
                                           <td className="px-4 py-4 align-middle">
                                               <div className="grid grid-cols-3 gap-8 w-full px-8">
                                                   <div className={`text-center font-bold text-sm ${stockDisplay.karung > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                       {stockDisplay.karung} Karung
                                                   </div>
                                                   <div className={`text-center font-bold text-sm ${stockDisplay.pack > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                       {stockDisplay.pack} Pack
                                                   </div>
                                                   <div className={`text-center font-bold text-sm ${stockDisplay.pcs > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                       {stockDisplay.pcs} Pcs
                                                   </div>
                                               </div>
                                           </td>
                                       </tr>
                                   )
                               })}
                           </tbody>
                       </table>
                   </div>
               </div>

               {/* TABLE HARGA */}
               <div>
                   <h3 className="font-bold text-lg underline mb-3 text-gray-800">Harga</h3>
                   <div className="border border-gray-400 rounded-xl overflow-hidden shadow-sm">
                       <table className="w-full text-xs">
                           <thead className="bg-gray-100 border-b border-gray-400 font-bold text-left text-gray-700">
                               <tr>
                                   <th className="px-4 py-2">Variasi</th>
                                   <th className="px-4 py-2">Unit <Store className="w-3 h-3 inline ml-1"/></th>
                                   <th className="px-4 py-2 text-right">Harga Modal</th>
                                   <th className="px-4 py-2 text-right">Harga Jual</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-200 bg-white">
                               {selectedInventoryItem.variants.map((v, idx) => {
                                   const unit = modalPriceUnits[idx] || 'Karung';
                                   return (
                                       <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                                           <td className="px-4 py-2 font-bold text-gray-800">{v.size}</td>
                                           <td className="px-4 py-2 w-48">
                                               <select 
                                                    value={unit}
                                                    onChange={(e) => setModalPriceUnits(prev => ({...prev, [idx]: e.target.value}))}
                                                    className="w-full border border-gray-300 rounded-full px-2 py-1 text-xs bg-white cursor-pointer hover:border-blue-500 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-200"
                                               >
                                                   <option value="Karung">Karung</option>
                                                   <option value="Pack">Pack</option>
                                                   <option value="Pcs">Pcs</option>
                                               </select>
                                           </td>
                                           <td className="px-4 py-2 text-right text-red-600 font-bold text-sm">
                                               {formatRupiah(getConvertedPrice(v.priceModal, unit))}
                                           </td>
                                           <td className="px-4 py-2 text-right text-green-600 font-bold text-sm">
                                               {formatRupiah(getConvertedPrice(v.priceJual, unit))}
                                           </td>
                                       </tr>
                                   )
                               })}
                           </tbody>
                       </table>
                   </div>
               </div>

            </div>

            <div className="p-6 border-t flex justify-center bg-gray-50 z-20 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
                <button onClick={() => setSelectedInventoryItem(null)} className="bg-[#BEDFFF] text-black text-xl font-bold px-12 py-3 rounded-full hover:bg-blue-300 shadow-lg flex gap-2 items-center transition-transform active:scale-95">
                    <Edit2 className="w-5 h-5"/> Tutup
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;