// src/pages/InventoryPage.tsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Menu, Plus, Upload, ChevronDown, LayoutGrid, List, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { InventoryItem, InventoryVariant } from '../../types/index';
// Import 5 Komponen yang sudah dipisah
import InventoryListViewTab from './InventoryListViewTab';
import InventoryGridViewTab from './InventoryGridViewTab';
import InventoryDetailProdukTab from './InventoryDetailProdukTab';
import InventoryTambahProduk from './InventoryTambahProduk';
import InventoryUploadProduk from './InventoryUploadProduk';
import { collection, limit, onSnapshot, orderBy, query, QueryDocumentSnapshot, startAfter, type DocumentData } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

interface InventoryPageProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const InventoryPage: React.FC<InventoryPageProps> = ({ setIsSidebarOpen }) => {
  const {userDb} = useAuth()
  const productCollection = 'products'
  // --- STATE DATA ---
  //      ini adalah product
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // --- STATE TAMPILAN (Default ke LIST sesuai permintaan) ---
  const [inventoryViewMode, setInventoryViewMode] = useState<'GRID' | 'LIST'>('LIST'); 
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [inventoryFilter, setInventoryFilter] = useState<'ACTIVE' | 'NON_ACTIVE' | 'HABIS'>('ACTIVE');
  const [inventorySearch, setInventorySearch] = useState("");

  // --- STATE MODAL & PAGES ---
  const [isUploadPage, setIsUploadPage] = useState(false);
  const [isAddProductPage, setIsAddProductPage] = useState(false);

  // --- STATE UNIT & PAGINATION ---
  const [gridUnitState, setGridUnitState] = useState<Record<string, string>>({});
  const [listUnitState, setListUnitState] = useState<Record<string, string>>({});
  const [modalPriceUnits, setModalPriceUnits] = useState<Record<number, string>>({});
  const [modalStockUnits, setModalStockUnits] = useState<Record<number, string>>({}); 
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // --- STATE UNTUK TAMBAH PRODUK ---
  const [newProductImages, setNewProductImages] = useState<(File | null)[]>([null, null, null]);
  const [newProductName, setNewProductName] = useState("");
  const [newProductVariants, setNewProductVariants] = useState([{ name: "" }]);
  const [unitConversions, setUnitConversions] = useState([{ from: "", to: "", value: 0 }]);
  const [newProductPrices, setNewProductPrices] = useState<Record<string, { modal: number, jual: number }>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [pageCursors, setPageCursors] = useState<{[key: number]: QueryDocumentSnapshot<DocumentData> | null}>({
    1: null // Halaman 1 tidak punya cursor startAfter
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- FETCH DATA SIMULATION ---
  useEffect(() => {
    if (!userDb) {
      console.error("Tidak ada dbnya: ", userDb);
      return;
    }
    // 1. Tentukan query dasar
    let q = query(
      collection(userDb, productCollection),
      orderBy("name"), // Urutan harus konsisten agar pagination stabil
      limit(itemsPerPage)
    );

    // 2. Jika bukan halaman 1, gunakan cursor dari halaman sebelumnya
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      const cursor = pageCursors[prevPage];

      if (cursor) {
        q = query(
          collection(userDb, productCollection),
          orderBy("name"),
          startAfter(cursor), // Gunakan cursor dari halaman sebelumnya
          limit(itemsPerPage)
        );
      }
    }

    // 3. Pasang onSnapshot
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setIsLoadingData(true)
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as InventoryItem[];

      setInventoryItems(items);

      // 4. Simpan cursor untuk halaman BERIKUTNYA
      // Dokumen terakhir di snapshot ini akan menjadi titik mulai (startAfter) untuk halaman selanjutnya
      if (snapshot.docs.length > 0) {
        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        setPageCursors(prev => ({
          ...prev,
          [currentPage + 1]: lastDoc
        }));
      }
      setIsLoadingData(false)
    }, (error) => {
      console.error("Error fetching inventory: ", error);
    });

    // 5. Cleanup: Matikan listener saat halaman pindah atau component unmount
    return () => unsubscribe();
  }, [userDb]);

  // --- LOGIC HELPERS ---
  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

  // Get default unit (the one with sourceConversion === undefined)
  const getDefaultUnit = (v: InventoryVariant) => {
    return v.unitConversions.find(uc => uc.sourceConversion === undefined) || v.unitConversions[0];
  };

  // Get unit conversion by name (case-insensitive)
  const getUnitConversion = (v: InventoryVariant, unitName: string) => {
    return v.unitConversions.find(uc => uc.name.toLowerCase() === unitName.toLowerCase());
  };

  // Get sorted units from largest to smallest based on qtyConversion
  const getSortedUnits = (v: InventoryVariant) => {
    if (!v.unitConversions || v.unitConversions.length === 0) {
      return [];
    }
    // Sort by qtyConversion descending (largest first), but default unit (sourceConversion undefined) always goes last
    return [...v.unitConversions].sort((a, b) => {
      // Default unit (sourceConversion undefined) goes to the last
      if (a.sourceConversion === undefined && b.sourceConversion !== undefined) return 1;
      if (a.sourceConversion !== undefined && b.sourceConversion === undefined) return -1;
      // Otherwise sort by qtyConversion descending (larger qtyConversion = larger unit)
      return (b.qtyConversion || 1) - (a.qtyConversion || 1);
    });
  };

  // Get available units as array of names
  const getAvailableUnits = (v: InventoryVariant) => {
    return getSortedUnits(v).map(uc => uc.name);
  };

  // Get total quantity in default units (this is just variant.qty)
  const getTotalPcs = (v: InventoryVariant) => {
    return v.qty; // qty is already in default units
  };

  // Get display stock breakdown dynamically based on unitConversions
  // selectedUnit parameter kept for interface consistency but breakdown is always hierarchical
  const getDisplayStock = (v: InventoryVariant, selectedUnit: string): Record<string, number> => {
    const defaultUnit = getDefaultUnit(v);
    const totalQtyInDefaultUnit = v.qty; // qty is stored in default unit
    
    // If no unitConversions exist, return empty object
    if (!defaultUnit || !v.unitConversions || v.unitConversions.length === 0) {
      return {};
    }

    // Get sorted units (from largest to smallest)
    const sortedUnits = getSortedUnits(v);
    
    // Initialize result object with all units set to 0
    const result: Record<string, number> = {};
    sortedUnits.forEach(uc => {
      result[uc.name] = 0;
    });

    let remainder = totalQtyInDefaultUnit;

    // Convert hierarchically from largest to smallest unit
    // Only convert units that are not the default unit (default unit gets the remainder)
    for (const unitConversion of sortedUnits) {
      // Default unit (sourceConversion undefined) gets all remainder
      if (unitConversion.sourceConversion === undefined) {
        result[unitConversion.name] = remainder;
        break;
      }

      // For non-default units, convert using qtyConversion
      const conversion = unitConversion.qtyConversion || 1;
      if (conversion > 0 && unitConversion.name === selectedUnit) {
        const convertedQty = Math.floor(remainder / conversion);
        result[unitConversion.name] = convertedQty;
        remainder = remainder % conversion;
      }
    }

    return result;
  };
  
  const getConvertedPrice = (v: InventoryVariant, unit: string, priceType: 'purchase' | 'sales' = 'sales') => {
    // Find the unit conversion for the selected unit
    const unitConversion = getUnitConversion(v, unit);
    
    if (!unitConversion) {
      // Fallback to default unit price
      const defaultUnit = getDefaultUnit(v);
      return defaultUnit ? (priceType === 'purchase' ? defaultUnit.purchasePrice : defaultUnit.salesPrice) : 0;
    }
    
    return priceType === 'purchase' ? unitConversion.purchasePrice : unitConversion.salesPrice;
  };

  // --- HANDLERS ---
  const handleDeleteInventory = (id: string) => { 
    if(window.confirm("Hapus produk ini?")) {
      // WOI BACKEND JORDY: DELETE produk dari database
      // DELETE /api/inventory/{id}
      // Setelah berhasil, refresh data atau update state
      setInventoryItems(prev => prev.filter(item => item.id !== id));
    }
  };
  const handleToggleStatus = (id: string, currentStatus: string) => {
      const newStatus = currentStatus === 'ACTIVE' ? 'NON_ACTIVE' : 'ACTIVE';
      // WOI BACKEND JORDY: UPDATE status produk di database
      // PUT /api/inventory/{id}/status dengan body: { status: newStatus }
      // Setelah berhasil, update state atau refresh data
      setInventoryItems(prev => prev.map(item => item.id === id ? { ...item, status: newStatus as any } : item));
  };

  // --- FILTERING & PAGINATION LOGIC ---
  const filteredItems = useMemo(() => {
    return inventoryItems.filter(item => {
      let statusMatch = inventoryFilter === 'ACTIVE' ? item.status === 'ACTIVE' : inventoryFilter === 'NON_ACTIVE' ? item.status === 'NON_ACTIVE' : item.variants.reduce((acc, curr) => acc + getTotalPcs(curr), 0) === 0 && item.status === 'ACTIVE';
      return statusMatch && item.name.toLowerCase().includes(inventorySearch.toLowerCase());
    });
  }, [inventoryItems, inventoryFilter, inventorySearch]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const currentItems = filteredItems.slice(indexOfLastItem - itemsPerPage, indexOfLastItem);

  // --- RENDER LOGIC ---

  // 1. Jika Mode Upload Aktif
  if (isUploadPage) {
    return (
      <InventoryUploadProduk 
        setIsUploadPage={setIsUploadPage} isUploading={isUploading} fileInputRef={fileInputRef}
        uploadFile={uploadFile} handleFileChange={(e) => e.target.files && setUploadFile(e.target.files[0])}
        handleProcessUpload={() => { 
          // WOI BACKEND JORDY: Process upload file Excel/CSV untuk bulk insert produk
          // POST /api/inventory/upload dengan body: FormData (file: uploadFile)
          // Response: { success: boolean, message: string, inserted: number, errors: [] }
          // Setelah berhasil, refresh data inventory
          setIsUploading(true); 
          setTimeout(() => { 
            setIsUploading(false); 
            setIsUploadPage(false); 
            alert("Berhasil!"); 
          }, 1000); 
        }}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
      {/* HEADER (Search, Filter, Tambah Tombol) */}
      <div className="p-4 border-b border-gray-200 flex flex-col gap-4 bg-white shadow-sm z-20">
          <div className="flex items-center gap-4">
              <Menu className="w-6 h-6 cursor-pointer hover:text-blue-500" onClick={() => setIsSidebarOpen(true)} />
              <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input type="text" placeholder="Cari produk..." value={inventorySearch} onChange={(e) => setInventorySearch(e.target.value)} className="w-full pl-10 pr-10 py-2 border border-black rounded-full focus:outline-none focus:border-blue-500"/>
              </div>
              <button onClick={() => setIsAddProductPage(true)} className="bg-[#3FA2F6] text-white px-4 py-2 rounded-full font-semibold flex items-center gap-2 hover:bg-blue-600 shadow-md"><Plus className="w-5 h-5" /> Tambah Produk</button>
              <button onClick={() => setIsUploadPage(true)} className="bg-[#568f5d] text-white px-4 py-2 rounded-full font-semibold flex items-center gap-2 hover:bg-green-700 shadow-md"><Upload className="w-5 h-5" /> Upload</button>
          </div>
          
          <div className="flex justify-between items-center">
              <div className="flex gap-2">
                  <button onClick={() => setInventoryFilter('ACTIVE')} className={`px-4 py-1 rounded-full border border-black font-semibold ${inventoryFilter === 'ACTIVE' ? 'bg-black text-white' : 'bg-white'}`}>Stok Aktif</button>
                  <button onClick={() => setInventoryFilter('NON_ACTIVE')} className={`px-4 py-1 rounded-full border border-black font-semibold ${inventoryFilter === 'NON_ACTIVE' ? 'bg-black text-white' : 'bg-white'}`}>Stok Non Aktif</button>
                  <button onClick={() => setInventoryFilter('HABIS')} className={`px-4 py-1 rounded-full border border-black font-semibold ${inventoryFilter === 'HABIS' ? 'bg-red-600 text-white border-red-600' : 'bg-white'}`}>Stok Habis</button>
              </div>
              
              <div className="flex items-center gap-4 relative z-20">
                <div className="relative">
                    <button onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)} className="flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-lg text-blue-900">
                        {inventoryViewMode === 'GRID' ? <LayoutGrid className="w-5 h-5"/> : <List className="w-5 h-5"/>}
                        <span className="font-semibold">Tampilan</span>
                        <ChevronDown className="w-4 h-4" />
                    </button>
                    {isViewDropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-40 bg-white border rounded-lg shadow-xl z-30">
                            <button onClick={() => { setInventoryViewMode('GRID'); setIsViewDropdownOpen(false); }} className="w-full text-left px-4 py-3 flex items-center gap-2 hover:bg-gray-100"><LayoutGrid className="w-4 h-4"/> Grid View</button>
                            <button onClick={() => { setInventoryViewMode('LIST'); setIsViewDropdownOpen(false); }} className="w-full text-left px-4 py-3 flex items-center gap-2 hover:bg-gray-100"><List className="w-4 h-4"/> List View</button>
                        </div>
                    )}
                </div>
              </div>
          </div>
      </div>

      {/* CONTENT AREA (LIST atau GRID) */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 pb-24">
          {isLoadingData ? (
             <div className="flex items-center justify-center h-64"><Loader2 className="w-10 h-10 animate-spin text-blue-500"/></div>
          ) : inventoryViewMode === 'LIST' ? (
              <InventoryListViewTab 
                items={currentItems} listUnitState={listUnitState} getDisplayStock={getDisplayStock}
                getAvailableUnits={getAvailableUnits} getSortedUnits={getSortedUnits}
                handleListUnitChange={(id, idx, unit) => setListUnitState(prev => ({...prev, [`list-${id}-${idx}`]: unit}))}
                setSelectedInventoryItem={setSelectedInventoryItem} handleDeleteInventory={handleDeleteInventory} handleToggleStatus={handleToggleStatus}
              />
          ) : (
              <InventoryGridViewTab 
                items={currentItems} gridUnitState={gridUnitState} getDisplayStock={getDisplayStock}
                getAvailableUnits={getAvailableUnits} getSortedUnits={getSortedUnits}
                handleGridUnitChange={(id, unit) => setGridUnitState(prev => ({...prev, [id]: unit}))}
                setSelectedInventoryItem={setSelectedInventoryItem} handleDeleteInventory={handleDeleteInventory} handleToggleStatus={handleToggleStatus}
              />
          )}
      </div>

      {/* FOOTER PAGINATION */}
      <div className="bg-white border-t p-4 flex justify-between items-center sticky bottom-0 z-20 shadow-2xl">
          <div className="text-gray-800 font-medium">Menampilkan <span className="font-bold">{indexOfLastItem - itemsPerPage + 1} - {Math.min(indexOfLastItem, filteredItems.length)}</span> dari {filteredItems.length} Produk</div>
          <div className="flex items-center gap-4">
              <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-4 py-2 rounded bg-gray-100 disabled:opacity-50 flex items-center gap-1"><ChevronLeft className="w-4 h-4"/> Balik</button>
              <button onClick={() => setCurrentPage(prev => prev + 1)} disabled={indexOfLastItem >= filteredItems.length} className="px-4 py-2 rounded bg-[#BEDFFF] text-blue-900 disabled:opacity-50 flex items-center gap-1">Lanjut <ChevronRight className="w-4 h-4"/></button>
          </div>
      </div>

      {/* MODAL OVERLAYS */}
      {isAddProductPage && (
        <InventoryTambahProduk 
            setIsAddProductPage={setIsAddProductPage} isUploading={isUploading} newProductImages={newProductImages}
            handleImageUpload={(idx, file) => { const imgs = [...newProductImages]; imgs[idx] = file; setNewProductImages(imgs); }}
            newProductName={newProductName} setNewProductName={setNewProductName} unitConversions={unitConversions}
            updateConversion={(idx, field, val) => { const nc = [...unitConversions]; (nc as any)[idx][field] = val; setUnitConversions(nc); }}
            handleRemoveConversion={(idx) => setUnitConversions(unitConversions.filter((_, i) => i !== idx))}
            handleAddConversion={() => setUnitConversions([...unitConversions, { from: unitConversions[unitConversions.length-1]?.to || "", to: "", value: 0 }])}
            newProductVariants={newProductVariants} updateVariant={(idx, val) => { const nv = [...newProductVariants]; nv[idx].name = val; setNewProductVariants(nv); }}
            handleRemoveVariant={(idx) => setNewProductVariants(newProductVariants.filter((_, i) => i !== idx))}
            handleAddVariant={() => setNewProductVariants([...newProductVariants, { name: "" }])}
            newProductPrices={newProductPrices} updatePrice={(vIdx, unit, type, val) => setNewProductPrices(prev => ({ ...prev, [`${vIdx}-${unit}`]: { ...prev[`${vIdx}-${unit}`], [type]: val } }))}
            handleSaveNewProduct={() => { 
              // WOI BACKEND JORDY: INSERT produk baru ke database
              // POST /api/inventory dengan body: FormData atau JSON
              // Body: { 
              //   name: newProductName, 
              //   variants: newProductVariants.map(v => ({ name: v.name, stockKarung: 0, stockPack: 0, stockPcs: 0 })),
              //   prices: newProductPrices (format: { variantIdx-unit: { modal, jual } }),
              //   images: newProductImages (File[]),
              //   unitConversions: unitConversions 
              // }
              // Response: { success: boolean, data: InventoryItem, message: string }
              // Setelah berhasil, refresh data inventory atau tambahkan ke state
              setIsUploading(true); 
              setTimeout(() => { 
                setIsUploading(false); 
                setIsAddProductPage(false); 
                alert("Tersimpan!"); 
              }, 1000); 
            }}
        />
      )}

      {selectedInventoryItem && (
        <InventoryDetailProdukTab 
            item={selectedInventoryItem} onClose={() => setSelectedInventoryItem(null)}
            modalStockUnits={modalStockUnits} setModalStockUnits={setModalStockUnits}
            modalPriceUnits={modalPriceUnits} setModalPriceUnits={setModalPriceUnits}
            getDisplayStock={getDisplayStock} getConvertedPrice={(v, unit, priceType) => getConvertedPrice(v, unit, priceType)} 
            getAvailableUnits={getAvailableUnits} getSortedUnits={getSortedUnits} formatRupiah={formatRupiah}
        />
      )}
    </div>
  );
};

export default InventoryPage;