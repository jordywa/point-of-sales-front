// src/pages/KasirPage.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Search, ScanLine, Menu, History, User, Trash2, Edit2, X, ShoppingCart, Calculator, QrCode, ArrowLeft, Check, LayoutGrid, List, ChevronDown, Plus, Calendar, Mail, Printer, Pencil, LogOut, Key } from 'lucide-react';
import type { Product, CartItem, DraftTransaction, Customer, Supplier } from '../types/index';
import { PRODUCTS, INITIAL_CUSTOMERS, INITIAL_SUPPLIERS } from '../data/mockData';
import { useAuth } from '../context/AuthContext';

interface ExtendedCartItem extends CartItem {
  qtyPO?: number;    // Qty yang masuk PO (Hutang Barang)
}

interface KasirPageProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
  formatRupiah: (num: number) => string;
}

const KasirPage: React.FC<KasirPageProps> = ({ setIsSidebarOpen, formatRupiah }) => {

  const {logout} = useAuth();

  // --- STATE RESPONSIVE MOBILE ---
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // --- STATE MODE TRANSAKSI (SALES / PO) ---
  const [transactionMode, setTransactionMode] = useState<'SALES' | 'PO'>('SALES');
  const [isTransactionMenuOpen, setIsTransactionMenuOpen] = useState(false);

  // --- UI VIEW MODE ---
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('LIST');
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);

  // --- PROFILE DROPDOWN STATE ---
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // --- REFS UNTUK KLIK OUTSIDE ---
  const transactionMenuRef = useRef<HTMLDivElement>(null);
  const historyMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const viewDropdownRef = useRef<HTMLDivElement>(null);

  // --- STANDARD POS STATES ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // State Form di dalam Popup Produk (GRID VIEW)
  const [modalQty, setModalQty] = useState(1);
  const [modalUnit, setModalUnit] = useState("");
  const [modalSize, setModalSize] = useState("");
  const [modalNote, setModalNote] = useState("");

  // State Pilihan di LIST VIEW
  const [listSelections, setListSelections] = useState<Record<string, { variant: string, unit: string, qty: number, note: string }>>({});

  // --- State Edit Harga (Numpad) ---
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<string>("0");
  const [editingPriceTouched, setEditingPriceTouched] = useState<boolean>(false);

  // --- State Edit Note (Keterangan) di Cart ---
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteValue, setEditingNoteValue] = useState<string>("");
  
  // --- STATE CART (TRANSAKSI) ---
  const [cart, setCart] = useState<ExtendedCartItem[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<number | null>(null);

  // --- State Draft & History ---
  // #WOIJORDY BACK END WOI: Fetch data Draft Transaction yang statusnya 'PENDING' dari database saat halaman dimuat
  const [draftTransactions, setDraftTransactions] = useState<DraftTransaction[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // --- LOGIC NO NOTA OTOMATIS (FIXED & RECYCLED) ---
  const [transactionCount, setTransactionCount] = useState(1);
  const [currentInvoiceNo, setCurrentInvoiceNo] = useState("");
  const [recycledInvoiceNumbers, setRecycledInvoiceNumbers] = useState<string[]>([]);

  // Helper untuk generate nomor nota berdasarkan count
  const generateInvoiceNumber = (count: number) => {
    // #WOIJORDY BACK END WOI: Request ke API untuk get next sequence number invoice. Format: SOYYYYMM/xxxxxx
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `SO${year}${month}/${String(count).padStart(6, '0')}`;
  };

  // Update Invoice No saat component mount, transactionCount berubah, atau ada nomor recycle
  useEffect(() => {
     if (activeDraftId === null) {
        if (recycledInvoiceNumbers.length > 0) {
            // Prioritaskan nomor nota yang dihapus (recycle)
            setCurrentInvoiceNo(recycledInvoiceNumbers[0]);
        } else {
            // Jika tidak ada recycle, gunakan sequence baru
            setCurrentInvoiceNo(generateInvoiceNumber(transactionCount));
        }
     }
  }, [transactionCount, activeDraftId, recycledInvoiceNumbers]);

  // Helper: Consume Nomor Nota
  const consumeInvoiceNumber = () => {
      if (recycledInvoiceNumbers.length > 0 && recycledInvoiceNumbers.includes(currentInvoiceNo)) {
          setRecycledInvoiceNumbers(prev => prev.filter(no => no !== currentInvoiceNo));
      } else {
          setTransactionCount(prev => prev + 1);
      }
  };

  // --- CLICK OUTSIDE HANDLER ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 1. Transaction Menu
      if (transactionMenuRef.current && !transactionMenuRef.current.contains(event.target as Node)) {
        setIsTransactionMenuOpen(false);
      }
      // 2. History Menu
      if (historyMenuRef.current && !historyMenuRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
      // 3. Profile Menu
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      // 4. View Dropdown
      if (viewDropdownRef.current && !viewDropdownRef.current.contains(event.target as Node)) {
        setIsViewDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // --- STATE CUSTOMER ---
  // #WOIJORDY BACK END WOI: Fetch list semua customer dari database saat halaman ini diload
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  // --- State Form New Customer ---
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustGender, setNewCustGender] = useState<'L'|'P'|null>(null);
  const [newCustDob, setNewCustDob] = useState("");
  const [newCustNameError, setNewCustNameError] = useState(false);

  // --- STATE PEMBAYARAN ---
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [isPaymentNumpadOpen, setIsPaymentNumpadOpen] = useState(false);
  const [paymentNumpadValue, setPaymentNumpadValue] = useState("0");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  
  // --- STATE KHUSUS HUTANG (PO) ---
  const [jatuhTempoDate, setJatuhTempoDate] = useState("");
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);

  // #WOIJORDY BACK END WOI: Implementasi search produk via API (Server-side filtering recommended jika data produk banyak)
  const filteredProducts = PRODUCTS.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCustomers = customers.filter((cust) => 
    cust.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
    cust.phone.includes(customerSearch)
  );

  // SUBTOTAL: Menghitung Qty Fisik + Qty PO
  const subTotal = cart.reduce((acc, item) => {
      const totalQtyItem = item.qty + (item.qtyPO || 0);
      return acc + (item.price * totalQtyItem);
  }, 0);
  
  // Logic Sisa Tagihan 
  const isHutang = selectedPaymentMethod === 'HUTANG';
  const sisaTagihan = isHutang ? 0 : Math.max(0, subTotal - paymentAmount);
  const kembalian = isHutang ? 0 : Math.max(0, paymentAmount - subTotal);

  const handleChangePassword = () => {
      alert("Fitur Ubah Password akan segera hadir!");
      setIsProfileMenuOpen(false);
  };

  // --- LIST VIEW HELPERS ---
  const getListSelection = (productId: string) => {
    return listSelections[productId] || { variant: "", unit: "", qty: 1, note: "" };
  };

  const updateListSelection = (productId: string, field: string, value: any) => {
    setListSelections(prev => {
        const current = prev[productId] || { variant: "", unit: "", qty: 1, note: "" };
        return { ...prev, [productId]: { ...current, [field]: value } };
    });
  };

  // Logic Add List View (DEFAULT SELALU KE STOCK/QTY BIASA)
  const handleAddToListCart = (product: Product) => {
    const selection = getListSelection(product.id);
    const finalVariant = selection.variant || product.variants[0];
    const finalUnitName = selection.unit || product.availableUnits[0].name;
    const finalQty = 1; 
    const finalNote = selection.note || "";

    const unitObj = product.availableUnits.find(u => u.name === finalUnitName) || product.availableUnits[0];
    const finalPrice = product.basePrice * unitObj.priceMultiplier;

    const newItem: ExtendedCartItem = {
        id: Date.now() + Math.random(), 
        productId: product.id,
        name: product.name,
        price: finalPrice,
        image: product.image,
        qty: finalQty, // Masuk ke Qty Biasa (Stock Current)
        qtyPO: 0,      // Qty PO 0 dulu
        unit: finalUnitName,
        size: finalVariant,
        note: finalNote
    };
    setCart([...cart, newItem]);

    updateListSelection(product.id, 'note', "");
  };

  const handleCartUnitChange = (cartItemId: number, productId: string, newUnitName: string) => {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;
    const newUnitObj = product.availableUnits.find(u => u.name === newUnitName);
    if (!newUnitObj) return;
    const newPrice = product.basePrice * newUnitObj.priceMultiplier;

    setCart(prev => prev.map(item => 
        item.id === cartItemId 
        ? { ...item, unit: newUnitName, price: newPrice } 
        : item
    ));
  };

  // --- CUSTOMER LOGIC ---
  const handleOpenNewCustomer = () => {
    setIsCustomerModalOpen(false);
    setIsNewCustomerModalOpen(true);
    setNewCustName("");
    setNewCustPhone("");
    setNewCustNameError(false);
  };

  const handleSubmitNewCustomer = () => {
    if (!newCustName.trim()) {
      setNewCustNameError(true);
      return;
    }
    const newCustomer: Customer = {
      id: Date.now(), 
      name: newCustName,
      phone: newCustPhone,
      email: newCustEmail,
      gender: newCustGender || undefined,
      dob: newCustDob,
      points: 0
    };
    
    // #WOIJORDY BACK END WOI: INSERT data customer baru ke database (POST /api/customers)
    
    setCustomers([...customers, newCustomer]);
    setSelectedCustomer(newCustomer);
    setIsNewCustomerModalOpen(false);
  };

  const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomer(cust);
    setIsCustomerModalOpen(false);
  };

  // --- PRODUCT MODAL & CART LOGIC ---
  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setModalQty(1); // Default Qty selalu 1 untuk Stock
    setModalUnit(product.availableUnits[0].name);
    setModalSize(product.variants[0]);
    setModalNote("");
  };

  const closeProductModal = () => {
    setSelectedProduct(null);
  };

  const handleSaveToCart = () => {
    if (!selectedProduct) return;
    const unitObj = selectedProduct.availableUnits.find(u => u.name === modalUnit) || selectedProduct.availableUnits[0];
    const finalPrice = selectedProduct.basePrice * unitObj.priceMultiplier;
    
    const newItem: ExtendedCartItem = {
      id: Date.now() + Math.random(),
      productId: selectedProduct.id,
      name: selectedProduct.name,
      price: finalPrice,
      image: selectedProduct.image,
      qty: modalQty, 
      qtyPO: 0,      
      unit: modalUnit,
      size: modalSize,
      note: modalNote
    };
    setCart([...cart, newItem]);
    
    closeProductModal();
  };
  
  // --- NOTE EDIT LOGIC ---
  const startEditNote = (item: ExtendedCartItem) => {
    setEditingNoteId(item.id);
    setEditingNoteValue(item.note || "");
  };

  const saveEditNote = (id: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, note: editingNoteValue } : item));
    setEditingNoteId(null);
    setEditingNoteValue("");
  };

  const cancelEditNote = () => {
    setEditingNoteId(null);
    setEditingNoteValue("");
  };

  // --- DRAFT LOGIC ---
  const handleSaveDraft = () => {
    if (cart.length === 0) return;
    const currentDate = new Date().toLocaleString('id-ID');
    
    const newDraft: DraftTransaction = {
        id: activeDraftId || Date.now(),
        invoiceNumber: currentInvoiceNo, 
        items: [...cart],
        total: subTotal,
        date: currentDate,
        customer: selectedCustomer 
    };

    if (activeDraftId !== null) {
        // #WOIJORDY BACK END WOI: UPDATE data draft di database berdasarkan ID (PUT /api/drafts/{id})
        setDraftTransactions(prev => prev.map(d => d.id === activeDraftId ? newDraft : d));
    } else {
        // #WOIJORDY BACK END WOI: INSERT data draft baru ke database (POST /api/drafts)
        setDraftTransactions(prev => [...prev, newDraft]);
    }
    
    const isNewTransaction = activeDraftId === null;
    if (isNewTransaction) {
        consumeInvoiceNumber();
    } 

    setCart([]);
    setActiveDraftId(null);
    setSelectedCustomer(null);
    alert("Draft tersimpan.");
  };

  const handleRestoreDraft = (draft: DraftTransaction) => {
    setCart([...draft.items]);
    setActiveDraftId(draft.id); 
    if (draft.customer) setSelectedCustomer(draft.customer);
    else setSelectedCustomer(null);
    if (draft.invoiceNumber) setCurrentInvoiceNo(draft.invoiceNumber);
    setShowHistory(false);
  };

  const handleDeleteDraft = (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); 
    if (window.confirm("Hapus draft ini?")) {
        // #WOIJORDY BACK END WOI: DELETE data draft dari database (DELETE /api/drafts/{id})
        const draftToDelete = draftTransactions.find(d => d.id === id);
        if (draftToDelete) {
             setRecycledInvoiceNumbers(prev => [...prev, draftToDelete.invoiceNumber].sort());
        }
        setDraftTransactions(prev => prev.filter(d => d.id !== id));
        if (activeDraftId === id) setActiveDraftId(null);
    }
  };

  // --- CETAK BILL LOGIC ---
  const handleCetakBill = () => {
    if (cart.length === 0) return;
    // #WOIJORDY BACK END WOI: Trigger fungsi print ke printer thermal (Kirim command ESC/POS atau generate struk image)
    handleSaveDraft();
  };

  // --- LOGIC BARU: CETAK FAKTUR PO (MINTA TANGGAL DULU) ---
  const handleCetakFakturPO = () => {
    if (cart.length === 0) return;
    setJatuhTempoDate(""); 
    setIsPOModalOpen(true);
  };

  const handleFinalizePO = () => {
    if (!jatuhTempoDate) {
        alert("Harap isi Tanggal Jatuh Tempo!");
        return;
    }

    // #WOIJORDY BACK END WOI: INSERT Transaksi baru tipe 'KREDIT' (PO).
    const isNewTransaction = activeDraftId === null;
    if (activeDraftId !== null) {
        setDraftTransactions(prev => prev.filter(d => d.id !== activeDraftId));
    }
    
    setIsPOModalOpen(false);
    setIsSuccessModalOpen(false);
    setCart([]);
    setPaymentAmount(0);
    setSelectedPaymentMethod("");
    setActiveDraftId(null);
    setJatuhTempoDate("");
    setSelectedCustomer(null);

    if (isNewTransaction) {
        consumeInvoiceNumber();
    }
    
    alert(`Faktur Penjualan KREDIT berhasil dicetak!\nJatuh Tempo tercatat: ${jatuhTempoDate}`);
  };

  // --- PEMBAYARAN LOGIC ---
  const startEditPrice = (id: number, price: number) => {
    setEditingPriceId(id);
    setEditingPriceValue(String(price));
    setEditingPriceTouched(false);
  };
  
  const appendDigit = (digit: string) => {
    setEditingPriceValue(prev => {
      if (!editingPriceTouched) {
        setEditingPriceTouched(true);
        return digit;
      }
      if (prev === "0") return digit;
      return prev + digit;
    });
  };
  
  const backspaceDigit = () => {
    setEditingPriceValue(prev => {
      const next = prev.slice(0, -1);
      setEditingPriceTouched(true);
      return next === "" ? "0" : next;
    });
  };
  
  const clearDigits = () => {
    setEditingPriceValue("0");
    setEditingPriceTouched(true);
  };
  
  const confirmEditPrice = () => {
    const newPrice = Math.max(0, parseInt(editingPriceValue || "0", 10));
    if (editingPriceId !== null) {
      setCart(prev => prev.map(it => it.id === editingPriceId ? { ...it, price: newPrice } : it));
    }
    setEditingPriceId(null);
    setEditingPriceValue("0");
    setEditingPriceTouched(false);
  };
  
  const cancelEditPrice = () => {
    setEditingPriceId(null);
    setEditingPriceValue("0");
    setEditingPriceTouched(false);
  };
  
  const openPaymentNumpad = () => {
    setPaymentNumpadValue("0");
    setIsPaymentNumpadOpen(true);
  };

  const appendPaymentDigit = (digit: string) => {
    setPaymentNumpadValue(prev => prev === "0" ? digit : prev + digit);
  };

  const backspacePaymentDigit = () => {
    setPaymentNumpadValue(prev => {
      const next = prev.slice(0, -1);
      return next === "" ? "0" : next;
    });
  };

  const confirmPaymentNumpad = () => {
    setPaymentAmount(parseInt(paymentNumpadValue));
    setIsPaymentNumpadOpen(false);
    setSelectedPaymentMethod("LAINNYA");
  };

  const handleOpenPayment = () => {
    if (cart.length === 0) return; 
    setPaymentAmount(0);
    setSelectedPaymentMethod("");
    setJatuhTempoDate("");
    setIsPaymentModalOpen(true);
  };

  const handleQuickPayment = (methodName: string) => {
    if (methodName === 'HUTANG') {
        setPaymentAmount(0); 
    } else {
        setPaymentAmount(subTotal);
    }
    setSelectedPaymentMethod(methodName);
  };

  const handleProcessPayment = () => {
    if (selectedPaymentMethod === 'HUTANG' && transactionMode === 'PO' && !jatuhTempoDate) {
        alert("Mohon isi tanggal jatuh tempo untuk PO!");
        return;
    }
    if (selectedPaymentMethod !== 'HUTANG' && sisaTagihan > 0) return;
    
    setIsPaymentModalOpen(false);
    setIsSuccessModalOpen(true);
  };

  const handleFinishTransaction = () => {
    // #WOIJORDY BACK END WOI: INSERT Transaksi baru tipe 'TUNAI/LUNAS'.
    const isNewTransaction = activeDraftId === null;
    if (activeDraftId !== null) {
        setDraftTransactions(prev => prev.filter(d => d.id !== activeDraftId));
    }
    
    setIsSuccessModalOpen(false);
    setCart([]);
    setPaymentAmount(0);
    setSelectedPaymentMethod("");
    setActiveDraftId(null);
    setJatuhTempoDate("");
    setSelectedCustomer(null);

    if (isNewTransaction) {
        consumeInvoiceNumber();
    }
  };

  // --- QTY INCREMENT / DECREMENT LOGIC ---
  const incrementQty = (id: number) => {
    setCart(prev => prev.map(it => it.id === id ? { ...it, qty: it.qty + 1 } : it));
  };

  const decrementQty = (id: number) => {
    setCart(prev => prev.map(it => it.id === id ? { ...it, qty: Math.max(0, it.qty - 1) } : it));
  };

  const incrementQtyPO = (id: number) => {
    setCart(prev => prev.map(it => it.id === id ? { ...it, qtyPO: (it.qtyPO || 0) + 1 } : it));
  };

  const decrementQtyPO = (id: number) => {
    setCart(prev => prev.map(it => it.id === id ? { ...it, qtyPO: Math.max(0, (it.qtyPO || 0) - 1) } : it));
  };

  const removeItem = (id: number) => {
    const newCart = cart.filter(it => it.id !== id);
    setCart(newCart);
    if (newCart.length === 0) setActiveDraftId(null); 
  };

  return (
    <div className="flex flex-col lg:flex-row h-full w-full overflow-hidden relative bg-gray-50">
      
      {/* AREA UTAMA (GRID/LIST PRODUK) - SEBELAH KIRI */}
      <div className={`w-full lg:flex-1 flex flex-col h-full border-r border-gray-300 relative z-0 transition-all ${isMobileCartOpen ? 'hidden lg:flex' : 'flex'}`}>
        
        {/* HEADER */}
        <div className="h-16 bg-white flex items-center px-4 shadow-sm gap-4 shrink-0">
          <Menu className="w-6 h-6 cursor-pointer hover:text-blue-500 transition-colors" onClick={() => setIsSidebarOpen(true)} />
          
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Cari....."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-black rounded-full focus:outline-none focus:border-blue-500 text-lg"
            />
            {searchQuery && <X className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 cursor-pointer hover:text-red-500" onClick={() => setSearchQuery("")} />}
            {!searchQuery && <ScanLine className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black cursor-pointer" />}
          </div>

          {/* VIEW MODE DROPDOWN (Ditambahkan Ref) */}
          <div className="relative" ref={viewDropdownRef}>
             <button onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)} className="flex items-center gap-2 bg-blue-100 px-3 py-2 rounded-lg text-blue-900 hover:bg-blue-200">
                {viewMode === 'GRID' ? <LayoutGrid className="w-5 h-5"/> : <List className="w-5 h-5"/>}
                <span className="hidden md:inline font-semibold">{viewMode === 'GRID' ? 'Grid View' : 'List View'}</span>
                <ChevronDown className="w-4 h-4" />
             </button>
             {isViewDropdownOpen && (
                 <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden z-20">
                    <button onClick={() => { setViewMode('GRID'); setIsViewDropdownOpen(false); }} className={`w-full text-left px-4 py-3 flex items-center gap-2 hover:bg-gray-100 ${viewMode === 'GRID' ? 'text-blue-600 font-bold bg-blue-50' : 'text-gray-700'}`}><LayoutGrid className="w-4 h-4"/> Grid View</button>
                    <button onClick={() => { setViewMode('LIST'); setIsViewDropdownOpen(false); }} className={`w-full text-left px-4 py-3 flex items-center gap-2 hover:bg-gray-100 ${viewMode === 'LIST' ? 'text-blue-600 font-bold bg-blue-50' : 'text-gray-700'}`}><List className="w-4 h-4"/> List View</button>
                 </div>
             )}
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 pb-20 lg:pb-4">
          {viewMode === 'GRID' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
                {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                    <div key={product.id} onClick={() => handleProductClick(product)} className="bg-white p-2 flex flex-col items-center hover:shadow-lg transition-shadow cursor-pointer rounded-lg shadow-sm border border-gray-100">
                        <img src={product.image} alt={product.name} className="w-full h-24 lg:h-32 object-contain mb-2" />
                        <p className="text-green-600 font-bold text-sm">{formatRupiah(product.basePrice)}</p>
                        <p className="text-xs text-center text-gray-700 mt-1 line-clamp-2">{product.name}</p>
                    </div>
                    ))
                ) : (
                    <div className="col-span-full text-center text-gray-500 mt-10">Produk tidak ditemukan.</div>
                )}
              </div>
          ) : (
              <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                 {/* Header Tabel List View */}
                 <div className="grid grid-cols-12 bg-gray-100 border-b border-gray-200 py-3 px-2 font-bold text-gray-700 text-xs uppercase tracking-wider text-center">
                    <div className="col-span-5 lg:col-span-3 text-left pl-2">Nama Produk</div>
                    <div className="col-span-3 lg:col-span-2 text-left">Varian</div>
                    <div className="col-span-1 hidden lg:block">Unit</div>
                    <div className="col-span-2 lg:col-span-2 text-right pr-2 hidden lg:block">Harga</div>
                    <div className="col-span-3 hidden lg:block text-left pl-2">Keterangan</div>
                    <div className="col-span-4 lg:col-span-1">Aksi</div>
                 </div>
                 {filteredProducts.map((product) => {
                     const selection = getListSelection(product.id);
                     const currentVariant = selection.variant || product.variants[0];
                     const currentUnitName = selection.unit || product.availableUnits[0].name;
                     const currentNote = selection.note || "";
                     const unitObj = product.availableUnits.find(u => u.name === currentUnitName) || product.availableUnits[0];
                     const displayPrice = product.basePrice * unitObj.priceMultiplier;

                     return (
                        <div key={product.id} className="grid grid-cols-12 border-b border-gray-100 py-2 px-2 items-center hover:bg-blue-50/50 transition-colors text-sm">
                            <div className="col-span-5 lg:col-span-3 pr-2 flex flex-col justify-center">
                                <span className="font-medium text-gray-800 leading-tight whitespace-normal wrap-break-word">{product.name}</span>
                                <span className="lg:hidden text-xs text-green-600 font-bold">{formatRupiah(displayPrice)}</span>
                            </div>
                            <div className="col-span-3 lg:col-span-2 pr-1">
                                <div className="relative">
                                    <select className="w-full appearance-none border border-gray-300 rounded-md py-1 pl-2 pr-6 text-xs bg-white focus:outline-none focus:border-blue-500 cursor-pointer" value={currentVariant} onChange={(e) => updateListSelection(product.id, 'variant', e.target.value)}>{product.variants.map(v => <option key={v} value={v}>{v}</option>)}</select>
                                    <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none"/>
                                </div>
                            </div>
                            <div className="col-span-1 pr-1 hidden lg:block">
                                <div className="relative">
                                    <select className="w-full appearance-none border border-gray-300 rounded-md py-1 pl-1 pr-5 text-xs bg-white focus:outline-none focus:border-blue-500 cursor-pointer text-center font-bold" value={currentUnitName} onChange={(e) => updateListSelection(product.id, 'unit', e.target.value)}>{product.availableUnits.map(u => <option key={u.name} value={u.name}>{u.name}</option>)}</select>
                                    <ChevronDown className="absolute right-0.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none"/>
                                </div>
                            </div>
                            <div className="col-span-2 text-right pr-2 font-medium text-gray-700 hidden lg:block">{formatRupiah(displayPrice)}</div>
                            <div className="col-span-3 pr-1 hidden lg:block">
                                <input type="text" placeholder="Ket..." className="w-full border border-gray-300 rounded-md py-1 px-2 text-xs focus:outline-none focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors" value={currentNote} onChange={(e) => updateListSelection(product.id, 'note', e.target.value)}/>
                            </div>
                            <div className="col-span-4 lg:col-span-1 flex items-center justify-center">
                                <button className="w-8 h-8 bg-[#3FA2F6] text-white rounded-full flex items-center justify-center shadow-sm hover:bg-blue-600 hover:scale-110 transition-all" onClick={() => handleAddToListCart(product)} title="Tambah">
                                    <Plus className="w-5 h-5 font-bold" strokeWidth={3} />
                                </button>
                            </div>
                        </div>
                     );
                 })}
              </div>
          )}
        </div>

        {/* FLOATING ACTION BAR FOR MOBILE */}
        <div className="lg:hidden absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex items-center justify-between shadow-[0_-4px_10px_rgba(0,0,0,0.1)] z-20">
            <div className="flex flex-col">
                <span className="text-xs text-gray-500">Total Belanja</span>
                <span className="text-lg font-bold text-blue-600">{formatRupiah(subTotal)}</span>
            </div>
            <button 
                onClick={() => setIsMobileCartOpen(true)}
                className="bg-[#3FA2F6] text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-transform"
            >
                <ShoppingCart className="w-5 h-5" />
                <span>Keranjang ({cart.length})</span>
            </button>
        </div>

      </div>

      {/* SIDEBAR KANAN (CART UTAMA) - SEBELAH KANAN */}
      {/* KECIL (350px - 400px) SESUAI REQUEST AWAL */}
      <div className={`w-full lg:w-[350px] xl:w-[400px] bg-white flex-col h-full shadow-2xl z-10 border-l border-gray-200 transition-all ${isMobileCartOpen ? 'flex fixed inset-0 z-50 lg:static' : 'hidden lg:flex'}`}>
        
        {/* HEADER SIDEBAR (HISTORY & USER) - VERSI KECIL */}
        <div className="h-12 flex items-center justify-between lg:justify-end px-3 gap-3 border-b border-gray-200 relative shrink-0">
         
         <button onClick={() => setIsMobileCartOpen(false)} className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-6 h-6" />
         </button>

         <div className="flex items-center gap-3">
            {/* HISTORY DROPDOWN (Ditambahkan Ref) */}
            <div className="relative" ref={historyMenuRef}>
            <button onClick={() => setShowHistory(!showHistory)} className="relative">
                <History className="w-5 h-5 cursor-pointer hover:text-blue-500" />
                {draftTransactions.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{draftTransactions.length}</span>
                )}
            </button>
            {showHistory && (
                <div className="absolute top-10 right-0 bg-white border border-gray-300 rounded-lg shadow-lg w-72 max-h-96 overflow-y-auto z-20">
                <div className="bg-gray-100 p-3 border-b border-gray-200 font-semibold text-gray-700 text-sm">
                    Riwayat Draft ({draftTransactions.length})
                </div>
                {draftTransactions.length === 0 ? <div className="p-4 text-gray-500 text-center text-sm">Tidak ada draft</div> : (
                    <div>{draftTransactions.map(draft => (
                        <div key={draft.id} onClick={() => handleRestoreDraft(draft)} className="p-3 border-b bg-white hover:bg-blue-50 cursor-pointer transition-colors relative group">
                        <div className="flex justify-between items-center">
                            <div className="flex-1">
                                    <div className="font-bold text-sm text-black mb-1">{draft.invoiceNumber}</div>
                                    <div className="text-gray-600 text-xs">{formatRupiah(draft.total)}</div>
                            </div>
                            <button onClick={(e) => handleDeleteDraft(e, draft.id)} className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors z-10" title="Hapus Draft"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        </div>
                    ))}</div>
                )}
                </div>
            )}
            </div>
            
            {/* PROFILE DROPDOWN (Ditambahkan Ref) */}
            <div className="relative" ref={profileMenuRef}>
                <button 
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center gap-2 hover:bg-gray-100 p-1 rounded-full transition-colors focus:outline-none"
                >
                    <span className="text-sm font-medium hidden md:inline">Vicky</span>
                    <div className="w-7 h-7 rounded-full bg-gray-300 overflow-hidden border border-gray-400">
                        <img src="https://placehold.co/50x50" alt="Avatar" />
                    </div>
                </button>
                {isProfileMenuOpen && (
                    <div className="absolute top-10 right-0 bg-white border border-gray-200 rounded-xl shadow-xl w-40 overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
                        <div className="py-1">
                            <button onClick={handleChangePassword} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700 text-sm"><Key className="w-3 h-3 text-blue-500"/> Password</button>
                            <button onClick={() => logout()} className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600 text-sm font-bold">
                              <LogOut className="w-3 h-3"/> Log Out
                            </button>
                        </div>
                    </div>
                )}
            </div>
         </div>
        </div>

        {/* CUSTOMER SECTION & HEADER DROPDOWN TRANSACTION - VERSI KECIL */}
        <div 
          className="px-3 py-2 border-b border-black cursor-pointer hover:bg-gray-100 transition-colors bg-white group select-none shrink-0"
          onClick={() => setIsCustomerModalOpen(true)}
          title="Klik untuk ganti customer"
        >
          <div className="flex items-center gap-2">
             <div className="border border-black rounded-full p-1 group-hover:border-blue-500 transition-colors">
               <User className="w-5 h-5 group-hover:text-blue-500 transition-colors" />
             </div>
             <div className="flex-1">
               
               {/* TRANSACTION DROPDOWN (Ditambahkan Ref & Logika Klik Outside) */}
               <div className="relative text-center" ref={transactionMenuRef} onClick={(e) => e.stopPropagation()}>
                   <h2 
                      className="text-base font-bold text-center flex items-center justify-center gap-1 hover:text-blue-700 transition-colors select-none cursor-pointer"
                      onClick={() => setIsTransactionMenuOpen(!isTransactionMenuOpen)}
                   >
                       {transactionMode === 'SALES' ? 'PENJUALAN' : 'PENJUALAN KREDIT'}
                       <ChevronDown className="w-4 h-4"/>
                   </h2>
                   
                   {isTransactionMenuOpen && (
                       <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                           <button onClick={() => { setTransactionMode('SALES'); setIsTransactionMenuOpen(false); }} className={`w-full px-3 py-2 text-left hover:bg-gray-100 text-xs font-bold ${transactionMode === 'SALES' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}>PENJUALAN</button>
                           <button onClick={() => { setTransactionMode('PO'); setIsTransactionMenuOpen(false); }} className={`w-full px-3 py-2 text-left hover:bg-gray-100 text-xs font-bold ${transactionMode === 'PO' ? 'text-yellow-600 bg-yellow-50' : 'text-gray-700'}`}>PENJUALAN KREDIT</button>
                       </div>
                   )}
               </div>

               <div className="flex justify-between text-xs items-center mt-0.5">
                 <span className="font-bold text-blue-800 truncate max-w-[150px]">
                    {selectedCustomer ? selectedCustomer.name : "Add Customer"}
                 </span>
                 <span className="font-bold">{currentInvoiceNo}</span>
                </div>
             </div>
          </div>
        </div>

        {/* HEADER TABEL CART - VERSI KECIL */}
        <div className={`grid grid-cols-12 gap-1 px-2 py-1 text-xs font-semibold border-b border-gray-300 text-center z-10 bg-white relative transition-colors shrink-0 ${transactionMode === 'PO' ? 'bg-yellow-50' : ''}`}>
          <div className="col-span-1"></div>
          {transactionMode === 'PO' ? (
              <div className="col-span-3 grid grid-cols-2">
                <div className="text-xs text-center">Qty</div>
                <div className="text-xs text-orange-600 text-center">PO</div>
              </div>
          ) : (
              <div className="col-span-3 text-xs">Qty</div>
          )}
          <div className="col-span-2 text-xs">Unit</div>
          <div className="col-span-3 text-left text-xs">Name</div>
          <div className="col-span-3 text-right text-xs">Total</div>
        </div>  
        
        {/* LIST ITEM CART UTAMA - VERSI KECIL */}
        <div className="flex-1 overflow-y-auto relative bg-white">
          <div className="relative z-10">
          {cart.length === 0 ? <div className="flex items-center justify-center h-40 text-xs text-gray-400 italic">Belum ada transaksi</div> : (
            cart.map((item) => {
               const originalProduct = PRODUCTS.find(p => p.id === item.productId);
               const totalQtyItem = item.qty + (item.qtyPO || 0);

               return (
                <div key={item.id} className="grid grid-cols-12 gap-1 px-2 py-2 items-start text-xs border-b border-gray-100 hover:bg-gray-50/80 bg-white/50 backdrop-blur-[1px]">
                    {/* 1. TRASH */}
                    <div className="col-span-1 flex justify-center pt-0.5"><button onClick={() => removeItem(item.id)}><Trash2 className="w-4 h-4 text-black cursor-pointer hover:text-red-600" /></button></div>
                    
                    {/* 2. LOGIC KOLOM QTY */}
                    {transactionMode === 'PO' ? (
                        <div className="col-span-3 grid grid-cols-2 gap-1">
                            {/* QTY FISIK */}
                            <div className="flex flex-col items-center justify-start gap-0.5">
                                <div className="flex items-center">
                                    <button className="text-sm font-bold px-1 text-blue-400 hover:text-blue-600" onClick={() => decrementQty(item.id)}>-</button>
                                    <span className="w-5 text-center text-xs font-bold">{item.qty}</span>
                                    <button className="text-sm font-bold px-1 text-blue-400 hover:text-blue-600" onClick={() => incrementQty(item.id)}>+</button>
                                </div>
                            </div>
                            {/* QTY PO */}
                            <div className="flex flex-col items-center justify-start gap-0.5">
                                <div className="flex items-center">
                                    <button className="text-sm font-bold px-1 text-orange-400 hover:text-orange-600" onClick={() => decrementQtyPO(item.id)}>-</button>
                                    <span className="w-5 text-center text-xs font-bold text-orange-700">{item.qtyPO || 0}</span>
                                    <button className="text-sm font-bold px-1 text-orange-400 hover:text-orange-600" onClick={() => incrementQtyPO(item.id)}>+</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="col-span-3 flex items-center justify-center gap-1 pl-1">
                            <button className="text-sm font-bold px-1 text-[#87C3FE] border border-gray-200 rounded-sm" onClick={() => decrementQty(item.id)}>-</button>
                            <span className="w-6 text-center text-xs font-bold">{item.qty}</span>
                            <button className="text-sm font-bold px-1 text-[#87C3FE] border border-gray-200 rounded-sm" onClick={() => incrementQty(item.id)}>+</button>
                        </div>
                    )}

                    {/* 3. UNIT */}
                    <div className="col-span-2 flex justify-center pt-0.5">{originalProduct ? (<select className="w-full text-[10px] border border-gray-300 rounded px-0 py-0.5 focus:outline-none focus:border-blue-500 bg-white cursor-pointer" value={item.unit} onChange={(e) => handleCartUnitChange(item.id, item.productId, e.target.value)}>{originalProduct.availableUnits.map(u => (<option key={u.name} value={u.name}>{u.name}</option>))}</select>) : (<span className="text-[10px] font-medium">{item.unit}</span>)}</div>
                    
                    {/* 4. NAME & NOTE */}
                    <div className="col-span-3 text-[11px] text-gray-700 leading-tight pr-1 wrap-break-word whitespace-normal pt-0.5">
                        <div className="font-medium truncate">{item.name}</div>
                        {item.size && <div className="text-[10px] text-gray-500 font-light">{item.size}</div>}
                        
                        {editingNoteId === item.id ? (
                            <div className="flex gap-1 mt-1 animate-in fade-in duration-200">
                                <input 
                                    type="text" 
                                    value={editingNoteValue}
                                    onChange={(e) => setEditingNoteValue(e.target.value)}
                                    className="w-full border border-blue-400 rounded text-[10px] px-1 py-0.5 focus:outline-none"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveEditNote(item.id);
                                        if (e.key === 'Escape') cancelEditNote();
                                    }}
                                />
                                <button onClick={() => saveEditNote(item.id)} className="text-green-600 hover:bg-green-100 p-0.5 rounded"><Check className="w-3 h-3"/></button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 mt-0.5 group/note">
                                {item.note ? (
                                    <span className="text-[10px] text-gray-400 italic">"{item.note}"</span>
                                ) : (
                                    <span className="text-[10px] text-gray-300 italic opacity-0 group-hover/note:opacity-100">Ket...</span>
                                )}
                                <button onClick={() => startEditNote(item)} className="opacity-0 group-hover/note:opacity-100 transition-opacity text-gray-400 hover:text-blue-500 p-0.5"><Pencil className="w-3 h-3"/></button>
                            </div>
                        )}
                    </div>

                    {/* 5. PRICE & TOTAL */}
                    <div className="col-span-3 text-right flex flex-col gap-0">
                        <div className="flex justify-end items-center gap-1 text-[10px] text-gray-500">
                            {formatRupiah(item.price)}
                            <button onClick={() => startEditPrice(item.id, item.price)} className="ml-1"><Edit2 className="w-3 h-3 text-gray-400 hover:text-black cursor-pointer" /></button>
                        </div>
                        <div className="text-green-600 text-xs font-bold">{formatRupiah(item.price * totalQtyItem)}</div>
                    </div>
                </div>
               );
            })
          )}
          </div>
        </div>

        {/* FOOTER - VERSI KECIL */}
        <div className="bg-gray-100 border-t border-gray-300 z-10 shrink-0">
          <div className="flex justify-between items-center px-4 py-2 bg-gray-100">
             <span className="text-sm font-medium text-gray-600">Sub Total</span>
             <span className="text-green-600 text-lg font-bold">{formatRupiah(subTotal)}</span>
           </div>
          
          <div className="grid grid-cols-2 grid-rows-2 h-20 text-white font-sans text-sm">
            {transactionMode === 'PO' ? (
                <>
                    <button onClick={handleCetakBill} className="col-span-2 bg-[#7DB9E9] hover:bg-blue-400 flex items-center justify-center border-b border-white font-bold">
                        Simpan Draft
                    </button>
                    <button onClick={handleCetakFakturPO} className="col-span-2 bg-[#A5CEF2] hover:bg-blue-300 text-black flex items-center justify-center px-6">
                        <span className="font-bold text-lg">Cetak Faktur</span>
                    </button>
                </>
            ) : (
                <>
                    <button onClick={handleCetakBill} className="col-span-2 bg-[#7DB9E9] hover:bg-blue-400 flex items-center justify-center border-b border-white font-bold">
                        Cetak Bill
                    </button>
                    <button onClick={handleOpenPayment} className="col-span-2 bg-[#A5CEF2] hover:bg-blue-300 text-black flex items-center justify-between px-6">
                        <span className="font-bold text-lg">Bayar</span>
                        <span className="font-bold text-lg text-green-700">{formatRupiah(subTotal)}</span>
                    </button>
                </>
            )}
           </div>
        </div>
      </div>

      {/* --- MODAL LIST CUSTOMER --- */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-3xl w-full max-w-[500px] p-6 shadow-2xl relative border border-gray-200">
            <div className="text-center font-medium text-lg mb-4">List Customer</div>
            <div className="relative mb-6 flex gap-2"><div className="relative flex-1"><input type="text" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} placeholder="+62 895610402920" className="w-full pl-4 pr-4 py-2 border border-gray-500 rounded-full focus:outline-none focus:border-blue-500"/></div><button className="bg-[#3FA2F6] text-white px-6 rounded-full hover:bg-blue-600">Check</button></div>
            <div className="space-y-3 mb-8 max-h-60 overflow-y-auto">
              {filteredCustomers.length > 0 ? (filteredCustomers.map(cust => (<div key={cust.id} className="flex items-center justify-between">
                <div className="flex gap-4 text-gray-800">
                  <span className="font-medium w-24 truncate">{cust.name}</span>
                  <span className="text-gray-600 w-32 hidden sm:inline">{cust.phone}</span>
                  <span className="text-gray-600">{cust.points} Poin</span>
                </div>
                <button onClick={() => handleSelectCustomer(cust)} className="bg-[#5EEAD4] text-black font-medium px-6 py-1 rounded-full hover:bg-teal-300 shadow-sm">Choose</button>
              </div>))) : (<div className="text-center text-gray-500 py-4">Customer tidak ditemukan</div>)}
            </div>
            <div className="flex justify-center"><button onClick={handleOpenNewCustomer} className="bg-[#3FA2F6] text-white px-8 py-2 rounded-xl text-lg hover:bg-blue-600 shadow-md flex items-center gap-2">+ Customer baru</button></div>
            <button onClick={() => setIsCustomerModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black"><X className="w-6 h-6"/></button>
          </div>
        </div>
      )}

      {/* --- MODAL NEW CUSTOMER --- */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-3xl w-full max-w-[550px] p-8 shadow-2xl relative border border-gray-200">
            <div className="text-center font-medium text-lg mb-8">New Customer</div>
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6"><div><label className="block text-gray-700 mb-1">Nama*</label><input type="text" value={newCustName} onChange={(e) => { setNewCustName(e.target.value); setNewCustNameError(false); }} className={`w-full border ${newCustNameError ? 'border-red-500 bg-red-50' : 'border-gray-400'} rounded-xl px-3 py-2 focus:outline-none`}/>{newCustNameError && <span className="text-red-500 text-xs mt-1">Nama wajib diisi</span>}</div><div><label className="block text-gray-700 mb-1">Nomor HP</label><input type="text" value={newCustPhone} onChange={(e) => setNewCustPhone(e.target.value)} className="w-full border border-gray-400 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"/></div></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6"><div><label className="block text-gray-700 mb-1">Email</label><input type="email" value={newCustEmail} onChange={(e) => setNewCustEmail(e.target.value)} className="w-full border border-gray-400 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"/></div><div><label className="block text-gray-700 mb-1">Gender:</label><div className="flex border border-blue-300 rounded overflow-hidden w-40"><button onClick={() => setNewCustGender('L')} className={`flex-1 py-1 text-center ${newCustGender === 'L' ? 'bg-[#3FA2F6] text-white' : 'bg-white text-blue-400'}`}>L</button><button onClick={() => setNewCustGender('P')} className={`flex-1 py-1 text-center ${newCustGender === 'P' ? 'bg-[#3FA2F6] text-white' : 'bg-white text-blue-400 border-l border-blue-300'}`}>P</button></div></div></div>
              <div><label className="block text-gray-700 mb-1">Tanggal lahir:</label><div className="relative w-full sm:w-1/2"><input type="date" value={newCustDob} onChange={(e) => setNewCustDob(e.target.value)} className="w-full border border-gray-400 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"/></div></div>
            </div>
            <div className="mt-10 flex justify-center"><button onClick={handleSubmitNewCustomer} className="bg-[#5EEAD4] text-black font-medium px-12 py-2 rounded-full hover:bg-teal-300 shadow-md text-lg">Submit</button></div>
             <button onClick={() => setIsNewCustomerModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black"><X className="w-6 h-6"/></button>
          </div>
        </div>
      )}

      {/* MODAL POPUP DETAIL PRODUK */}
      {selectedProduct && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={closeProductModal}>
            <div className="bg-white rounded-2xl w-full max-w-[450px] p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200 border border-gray-200" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-col items-center mb-6"><img src={selectedProduct.image} alt="Product" className="h-32 object-contain mb-3" /><h3 className="text-xl font-medium text-gray-800 text-center">{selectedProduct.name}</h3></div>
                
                <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">Ukuran</label>
                    <div className="grid grid-cols-2 gap-2">{selectedProduct.variants.map(v => (<label key={v} className="flex items-center cursor-pointer gap-2"><input type="radio" name="ukuran" value={v} checked={modalSize === v} onChange={() => setModalSize(v)} className="w-4 h-4 text-teal-600 focus:ring-teal-500"/><span className="text-sm">{v}</span></label>))}</div>
                </div>
                
                <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">Unit</label>
                    <div className="grid grid-cols-3 gap-2">{selectedProduct.availableUnits.map(u => (<label key={u.name} className="flex items-center cursor-pointer gap-2"><input type="radio" name="unit" value={u.name} checked={modalUnit === u.name} onChange={() => setModalUnit(u.name)} className="w-4 h-4 text-teal-600 focus:ring-teal-500"/><span className="text-sm font-bold">{u.name}</span></label>))}</div>
                </div>
                
                <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-1">Tambah deskripsi</label>
                    <input type="text" value={modalNote} onChange={(e) => setModalNote(e.target.value)} className="w-full border-b border-gray-400 py-1 focus:outline-none focus:border-teal-500 transition-colors"/>
                </div>

                <div className="flex flex-col items-center gap-4 mb-6">
                    <div className="flex items-center gap-4 mb-2">
                        <button onClick={() => setModalQty(Math.max(1, modalQty - 1))} className="w-10 h-10 flex items-center justify-center text-[#87C3FE] text-3xl font-bold bg-transparent hover:bg-blue-50 rounded">−</button>
                        <span className="text-2xl font-bold w-8 text-center">{modalQty}</span>
                        <button onClick={() => setModalQty(modalQty + 1)} className="w-10 h-10 flex items-center justify-center text-[#87C3FE] text-3xl font-bold bg-transparent hover:bg-blue-50 rounded">+</button>
                    </div>
                </div>

                <div className="flex w-full gap-3">
                    <button onClick={closeProductModal} className="flex-1 py-3 border border-red-300 text-red-400 font-bold text-base rounded hover:bg-red-50 transition-colors uppercase">Batal</button>
                    <button onClick={handleSaveToCart} className="flex-1 py-3 bg-[#87C3FE] text-white font-bold text-base rounded hover:bg-blue-400 transition-colors shadow-md uppercase">Simpan</button>
                </div>
            </div>
        </div>
      )}

      {/* Modal Edit Harga Numpad */}
      {editingPriceId !== null && (
        <div className="fixed inset-0 z-70 flex items-center justify-center"><div className="absolute inset-0 bg-black opacity-40" onClick={cancelEditPrice}></div><div className="relative bg-white rounded-lg shadow-lg w-80 p-4 z-10"><div className="flex justify-between items-center mb-3"><h3 className="text-lg font-semibold">Edit Harga Satuan</h3><button onClick={cancelEditPrice} className="text-gray-600">Batal</button></div><div className="mb-3"><div className="text-sm text-gray-500">Harga sekarang</div><div className="text-2xl font-bold">{formatRupiah(Number(editingPriceValue || 0))}</div></div><div className="grid grid-cols-3 gap-2 mb-3">{["1","2","3","4","5","6","7","8","9"].map(d => (<button key={d} onClick={() => appendDigit(d)} className="bg-gray-100 py-3 rounded text-lg">{d}</button>))}<button onClick={backspaceDigit} className="bg-gray-100 py-3 rounded text-lg">⌫</button><button onClick={() => appendDigit("0")} className="bg-gray-100 py-3 rounded text-lg">0</button><button onClick={clearDigits} className="bg-gray-100 py-3 rounded text-lg">C</button></div><div className="flex gap-2"><button onClick={cancelEditPrice} className="flex-1 py-2 rounded bg-gray-200">Cancel</button><button onClick={confirmEditPrice} className="flex-1 py-2 rounded bg-green-600 text-white font-bold">OK</button></div></div></div>
      )}

      {/* --- HALAMAN PEMBAYARAN (FULL SCREEN MODAL) --- */}
      {/* DIKEMBALIKAN KE VERSI ORIGINAL YANG BESAR & JELAS */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-80 bg-blue-50 flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="h-14 bg-blue-50 flex items-center px-4 border-b border-gray-200">
            <button onClick={() => setIsPaymentModalOpen(false)} className="flex items-center gap-2 text-gray-700 hover:text-black">
              <ArrowLeft className="w-6 h-6" />
              <span className="font-bold text-lg">Rincian Pembayaran</span>
            </button>
          </div>
          
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden overflow-y-auto">
            {/* KOLOM KIRI: RINCIAN BELANJA */}
            <div className="w-full lg:w-1/3 bg-white border-b lg:border-r border-gray-300 flex flex-col p-4 shrink-0">
              <div className="border border-black p-2 rounded-sm h-full flex flex-col max-h-[300px] lg:max-h-none overflow-y-auto lg:overflow-visible">
                {/* HEADER MODAL PEMBAYARAN */}
                <div className="relative border-b border-black pb-2 mb-2 h-14 shrink-0">
                    <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-center items-center w-16">
                        <div className="border border-black rounded-full p-0.5"><User className="w-6 h-6" /></div>
                        <span className="text-xs font-bold text-center leading-none mt-1 truncate w-full">{selectedCustomer?.name}</span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <h2 className="text-xl font-bold uppercase">
                            {transactionMode === 'PO' ? 'PENJUALAN KREDIT' : 'PENJUALAN'}
                        </h2>
                    </div>
                    <div className="absolute right-0 bottom-0 text-xs font-bold">
                        {currentInvoiceNo}
                    </div>
                </div>
                <div className="grid grid-cols-12 text-base font-bold border-b border-gray-200 pb-1 mb-2"><div className="col-span-2 text-center">{transactionMode === 'PO' ? 'Qty' : 'Qty'}</div><div className="col-span-2">Unit</div><div className="col-span-4">Name</div><div className="col-span-4 text-right">@Harga / Total</div></div>
                <div className="flex-1 overflow-y-auto min-h-[100px]">
                    {cart.map(item => (
                        <div key={item.id} className="grid grid-cols-12 text-base py-3 border-b border-gray-100 items-center">
                            <div className="col-span-2 flex items-center justify-center gap-2"><span className="font-bold">{item.qty + (item.qtyPO || 0)}</span></div>
                            <div className="col-span-2 text-sm">{item.unit}</div>
                            <div className="col-span-4 leading-tight font-medium text-sm">
                                {item.name}
                                <div className="text-xs text-gray-400 font-normal">{item.size}</div>
                                {item.note && <div className="text-[10px] text-gray-500 italic">"{item.note}"</div>}
                            </div>
                            <div className="col-span-4 text-right text-sm">
                                <div className="text-gray-900 font-medium">{formatRupiah(item.price)}</div>
                                <div className="font-bold text-green-700">{formatRupiah(item.price * (item.qty + (item.qtyPO || 0)))}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="bg-blue-100 p-3 flex justify-between items-center mt-2 shrink-0"><span className="font-bold text-2xl lg:text-3xl uppercase">TOTAL</span><span className="font-bold text-2xl lg:text-3xl text-green-700">{formatRupiah(subTotal)}</span></div>
              </div>
            </div>

            {/* KOLOM TENGAH: INFO TAGIHAN (ORIGINAL STYLE) */}
            <div className="w-full lg:w-1/3 p-4 lg:p-6 flex flex-col justify-between border-b lg:border-r border-gray-300">
               <div className="border border-gray-300 shadow-sm"><div className="bg-[#87C3FE] p-4 text-2xl font-bold text-black border-b border-gray-300">Pembayaran</div><div className="bg-white p-6 space-y-6 text-xl"><div className="flex justify-between"><span>Tagihan</span><span>{formatRupiah(subTotal)}</span></div><div className="flex justify-between"><span>Pembayaran</span>{selectedPaymentMethod === 'HUTANG' ? (<span className="text-red-500 font-bold">HUTANG</span>) : (<span>{formatRupiah(paymentAmount)}</span>)}</div>{selectedPaymentMethod !== 'HUTANG' && (<><div className="flex justify-between text-red-500 font-bold"><span>Sisa</span><span>{formatRupiah(sisaTagihan)}</span></div><div className="flex justify-between"><span>Kembalian</span><span>{formatRupiah(kembalian)}</span></div></>)}</div></div>
            </div>

            {/* KOLOM KANAN: METODE PEMBAYARAN (ORIGINAL STYLE) */}
            <div className="w-full lg:w-1/3 p-4 lg:p-6 flex flex-col gap-6 bg-white relative pb-32 lg:pb-6">
              <div className="space-y-4">
                 <div className="flex items-center gap-4"><span className="text-xl lg:text-2xl w-24">TUNAI</span><button onClick={() => handleQuickPayment('UANG_PAS')} className={`border border-black px-4 py-2 text-lg lg:text-xl w-40 ${selectedPaymentMethod === 'UANG_PAS' ? 'bg-[#87C3FE]' : 'hover:bg-gray-100'}`}>UANG PAS</button></div>
                 <div className="flex items-center gap-4 pl-0 lg:pl-28"><button onClick={openPaymentNumpad} className={`border border-black px-4 py-2 text-xl flex items-center gap-2 w-40 ${selectedPaymentMethod === 'LAINNYA' ? 'bg-[#87C3FE]' : 'hover:bg-gray-100'}`}>{selectedPaymentMethod === 'LAINNYA' && paymentAmount > 0 ? formatRupiah(paymentAmount) : <><Calculator className="w-5 h-5"/> Lainnya</>}</button></div>
                 <div className="flex items-center gap-4 mt-8"><span className="text-xl lg:text-2xl w-24">Qris</span><button onClick={() => handleQuickPayment('QRIS')} className={`border border-black px-2 py-1 ${selectedPaymentMethod === 'QRIS' ? 'bg-[#87C3FE]' : 'hover:bg-gray-100'}`}><QrCode className="w-10 h-8"/></button></div>
              </div>

              <div className="lg:absolute lg:bottom-6 lg:right-6 lg:left-6 mt-6 lg:mt-0"><button onClick={handleProcessPayment} disabled={selectedPaymentMethod !== 'HUTANG' && sisaTagihan > 0} className={`w-full py-4 text-2xl font-bold flex items-center justify-center gap-2 rounded-lg ${(selectedPaymentMethod !== 'HUTANG' && sisaTagihan > 0) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#87C3FE] text-black hover:bg-blue-400 shadow-lg'}`}><ShoppingCart className="w-6 h-6"/> Proses Bayar</button></div>

              {isPaymentNumpadOpen && (
                <div className="absolute inset-0 bg-white z-20 p-4 flex flex-col"><div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">Input Uang Tunai</h3><button onClick={() => setIsPaymentNumpadOpen(false)} className="text-red-500 font-bold">Batal</button></div><div className="bg-gray-100 p-4 text-right text-3xl font-bold mb-4 rounded">{formatRupiah(parseInt(paymentNumpadValue))}</div><div className="grid grid-cols-3 gap-3 flex-1">{["1","2","3","4","5","6","7","8","9"].map(d => (<button key={d} onClick={() => appendPaymentDigit(d)} className="bg-white border border-gray-300 text-2xl font-bold rounded shadow-sm hover:bg-gray-50">{d}</button>))}<button onClick={backspacePaymentDigit} className="bg-red-50 border border-red-200 text-2xl font-bold rounded text-red-500">⌫</button><button onClick={() => appendPaymentDigit("0")} className="bg-white border border-gray-300 text-2xl font-bold rounded">0</button><button onClick={confirmPaymentNumpad} className="bg-green-500 text-white text-2xl font-bold rounded">OK</button></div></div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL POP-UP SUKSES --- */}
      {isSuccessModalOpen && (
        <div 
          className="fixed inset-0 z-90 bg-black/50 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200 p-4"
          onClick={(e) => {
             if(e.target === e.currentTarget) handleFinishTransaction();
          }}
        >
           <div className="bg-white rounded-lg shadow-2xl w-full max-w-[400px] p-6 relative flex flex-col items-center">
               <div className="bg-black text-white p-3 rounded-full mb-4">
                 <Check className="w-8 h-8"/>
               </div>
               <h2 className="text-xl font-medium mb-6 text-black text-center">Pembayaran Berhasil</h2>
               
               <div className="w-full space-y-3 mb-8">
                 <div className="flex justify-between text-gray-700"><span>Total Tagihan</span><span>{formatRupiah(subTotal)}</span></div>
                 <div className="flex justify-between text-gray-700"><span>Tunai</span><span>{formatRupiah(paymentAmount)}</span></div>
                 <div className="flex justify-between text-black font-bold text-lg"><span>Kembalian</span><span>{formatRupiah(kembalian)}</span></div>
               </div>

               <div className="grid grid-cols-2 gap-3 w-full">
                 <button onClick={() => alert("Fitur Email...")} className="flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-black py-2 rounded text-sm font-bold"><Mail className="w-4 h-4"/> EMAIL</button>
                 <button onClick={() => alert("Mencetak...")} className="flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-black py-2 rounded text-sm font-bold"><Printer className="w-4 h-4"/> CETAK</button>
                 <button onClick={handleFinishTransaction} className="col-span-2 bg-[#87C3FE] hover:bg-blue-400 text-black py-3 rounded text-sm font-bold mt-2">SELESAI {'>'}</button>
               </div>
           </div>
        </div>
      )}

      {/* --- MODAL INPUT TANGGAL JATUH TEMPO (PO) --- */}
      {isPOModalOpen && (
        <div className="fixed inset-0 z-100 bg-black/50 backdrop-blur-sm flex items-center justify-center animate-in fade-in zoom-in duration-200 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-[400px] p-6 border border-gray-200">
                <div className="text-center mb-6">
                    <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
                        <Calendar className="w-6 h-6 text-yellow-600"/>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Set Jatuh Tempo</h3>
                    <p className="text-sm text-gray-500 mt-1">Masukkan tanggal batas pembayaran untuk faktur kredit ini.</p>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Tanggal Jatuh Tempo</label>
                    <input 
                        type="date" 
                        value={jatuhTempoDate}
                        onChange={(e) => setJatuhTempoDate(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 font-medium"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => setIsPOModalOpen(false)}
                        className="py-3 rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={handleFinalizePO}
                        className="py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg"
                    >
                        Simpan & Cetak
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default KasirPage;