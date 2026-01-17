// src/pages/PembelianPage.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Search, ScanLine, Menu, History, Trash2, Edit2, X, ShoppingCart, Calculator, ArrowLeft, Check, LayoutGrid, List, ChevronDown, Plus, Calendar, LogOut, Key, ChevronLeft, ChevronRight, Loader2, Building2 } from 'lucide-react';
import type { InventoryItem, InventoryVariant, CartItem, DraftTransaction, Supplier, PurchaseTransaction, ProductPurchaseDetail, NumberingConfig } from '../../types/index';
import SupplierSelector from './SupplierSelector';
import { collection, getCountFromServer, limit, onSnapshot, orderBy, query, QueryDocumentSnapshot, startAfter, where, doc, type DocumentData } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import authenticatedAxios from '../../utils/api';
import { API_BASE_URL } from '../../apiConfig';
import { db } from '../../firebaseConfig';

// Interface Draft khusus Pembelian (menggunakan Supplier)
interface DraftPurchase extends Omit<DraftTransaction, 'customer'> {
  customer: Supplier | null; 
}

interface ExtendedCartItem extends CartItem {
  qtyPO?: number; // Qty Kredit/Tempo
}

interface PembelianPageProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
  formatRupiah: (num: number) => string;
}

const PembelianPage: React.FC<PembelianPageProps> = ({ setIsSidebarOpen, formatRupiah }) => {
  // --- STATE RESPONSIVE MOBILE ---
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // --- STATE MODE TRANSAKSI (PEMBELIAN / PEMBELIAN PO) ---
  const [transactionMode, setTransactionMode] = useState<'TUNAI' | 'KREDIT'>('TUNAI');

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
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  const [listProducts, setListProducts] = useState<InventoryItem[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  
  // State Form di dalam Popup Produk (GRID VIEW)
  const [modalQty, setModalQty] = useState(1);
  const [modalUnit, setModalUnit] = useState("");
  const [modalVariant, setModalVariant] = useState<InventoryVariant | null>(null);
  const [modalNote, setModalNote] = useState("");

  // State Pilihan di LIST VIEW
  const [listSelections, setListSelections] = useState<Record<string, { variant: string, unit: string, qty: number, note: string }>>({});

  // --- State Edit Harga Beli (Numpad) ---
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<string>("0");
  const [editingPriceTouched, setEditingPriceTouched] = useState<boolean>(false);

  // --- State Edit Note ---
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteValue, setEditingNoteValue] = useState<string>("");
  
  // --- STATE CART (TRANSAKSI) ---
  const [cart, setCart] = useState<ExtendedCartItem[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<number | null>(null);

  // --- State Draft & History ---
  const [draftTransactions, setDraftTransactions] = useState<DraftPurchase[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // --- LOGIC INVOICE NUMBER (MENGgunakan generatePurchaseId) ---
  const [currentInvoiceNo, setCurrentInvoiceNo] = useState("");

  // --- CLICK OUTSIDE HANDLER ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 1. History Menu
      if (historyMenuRef.current && !historyMenuRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
      // 2. Profile Menu
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      // 3. View Dropdown
      if (viewDropdownRef.current && !viewDropdownRef.current.contains(event.target as Node)) {
        setIsViewDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // --- SUPPLIER LOGIC ---
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // --- STATE PEMBAYARAN ---
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [isPaymentNumpadOpen, setIsPaymentNumpadOpen] = useState(false);
  const [paymentNumpadValue, setPaymentNumpadValue] = useState("0");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  
  // --- STATE KHUSUS HUTANG / JATUH TEMPO ---
  const [jatuhTempoDate, setJatuhTempoDate] = useState("");
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [dpAmount, setDpAmount] = useState(0); // Down Payment untuk transaksi HUTANG
  const [isDpNumpadOpen, setIsDpNumpadOpen] = useState(false);
  const [dpNumpadValue, setDpNumpadValue] = useState("0");

  // --- STATE PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [totalItems, setTotalItems] = useState(0);
  const [pageCursors, setPageCursors] = useState<{[key: number]: QueryDocumentSnapshot<DocumentData> | null}>({
    1: null // Halaman 1 tidak punya cursor startAfter
  });

  const {userDb, user} = useAuth();
  const productCollection = 'products';

  // --- STATE NUMBERING CONFIG ---
  const [numberingConfig, setNumberingConfig] = useState<NumberingConfig | null>(null);
  
  // Default numbering config
  const defaultNumberingConfig: NumberingConfig = {
    salesPrefix: "SO",
    purchasePrefix: "PU",
    separator: "-",
    yearFormat: "YYYY",
    includeDay: false,
    salesCounter: 1,
    purchaseCounter: 1
  };

  // --- FETCH DATA FROM FIRESTORE ---
  useEffect(() => {
    if (!userDb) return;

    setIsLoadingProducts(true);

    // 1. Array untuk menampung kondisi query
    let queryConstraints: any[] = [orderBy("name")];

    // 2. Filter hanya produk ACTIVE
    queryConstraints.push(where("status", "==", "ACTIVE"));

    // 3. Logika SEARCH (Prefix Search)
    if (searchQuery.trim() !== "") {
      queryConstraints.push(where("name", ">=", searchQuery));
      queryConstraints.push(where("name", "<=", searchQuery + "\uf8ff"));
    }

    // 4. Logika PAGINATION
    queryConstraints.push(limit(itemsPerPage));
    
    if (currentPage > 1 && pageCursors[currentPage - 1]) {
      queryConstraints.push(startAfter(pageCursors[currentPage - 1]));
    }

    // 5. Eksekusi Query
    const q = query(collection(userDb, productCollection), ...queryConstraints);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as InventoryItem[];

      setListProducts(items);

      if (snapshot.docs.length > 0) {
        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        setPageCursors(prev => ({
          ...prev,
          [currentPage]: lastDoc
        }));
      }
      setIsLoadingProducts(false);
    }, (error) => {
      console.error("Error fetching products: ", error);
      setIsLoadingProducts(false);
    });

    return () => unsubscribe();
  }, [userDb, currentPage, itemsPerPage, searchQuery]);

  // Fetch total count
  useEffect(() => {
    const fetchTotalCount = async () => {
      if (!userDb) return;

      let qConstraints: any[] = [where("status", "==", "ACTIVE")];
      
      if (searchQuery.trim() !== "") {
        qConstraints.push(where("name", ">=", searchQuery));
        qConstraints.push(where("name", "<=", searchQuery + "\uf8ff"));
      }

      const q = query(collection(userDb, productCollection), ...qConstraints);
      const snapshot = await getCountFromServer(q);
      setTotalItems(snapshot.data().count);
    };

    fetchTotalCount();
  }, [userDb, searchQuery]);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
    setPageCursors({ 1: null });
  }, [searchQuery]);

  // --- FETCH NUMBERING CONFIG FROM COMPANY ---
  useEffect(() => {
    if (!user?.companyId) return;
    
    const companyDocRef = doc(db, 'companies', user.companyId);
    
    const unsubscribe = onSnapshot(companyDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const companyData = docSnap.data() as DocumentData;
        
        // Set numbering data from company
        if (companyData.numbering) {
          setNumberingConfig(companyData.numbering);
        } else {
          // Use default if no numbering config exists
          setNumberingConfig(defaultNumberingConfig);
        }
      }
    }, (err) => {
      console.error('Error fetching company numbering config:', err);
      // Use default on error
      setNumberingConfig(defaultNumberingConfig);
    });

    return () => unsubscribe();
  }, [user?.companyId]);

  // --- PAGINATION LOGIC ---
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);
  const currentProducts = listProducts;

  const handlePageChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    } else if (direction === 'next' && listProducts.length >= itemsPerPage) {
      setCurrentPage(prev => prev + 1);
    }
    // Scroll to top when page changes
    const contentArea = document.querySelector('.flex-1.overflow-y-auto');
    if (contentArea) {
      contentArea.scrollTop = 0;
    }
  };


  // --- HELPER FUNCTIONS FOR INVENTORY ITEM ---
  // Get default unit (the one with sourceConversion === undefined)
  const getDefaultUnit = (v: InventoryVariant) => {
    return v.unitConversions.find(uc => uc.sourceConversion === undefined) || v.unitConversions[0];
  };

  // Get unit conversion by name (case-insensitive)
  const getUnitConversion = (v: InventoryVariant, unitName: string) => {
    return v.unitConversions.find(uc => uc.name.toLowerCase() === unitName.toLowerCase());
  };

  // Get available units from variant
  const getAvailableUnits = (v: InventoryVariant) => {
    if (!v.unitConversions || v.unitConversions.length === 0) {
      return [];
    }
    return v.unitConversions.map(uc => uc.name);
  };

  // Get purchase price from variant and unit
  const getPurchasePrice = (v: InventoryVariant, unitName: string) => {
    const unitConversion = getUnitConversion(v, unitName);
    if (!unitConversion) {
      const defaultUnit = getDefaultUnit(v);
      return defaultUnit ? defaultUnit.purchasePrice : 0;
    }
    return unitConversion.purchasePrice;
  };

  // SUBTOTAL
  const subTotal = cart.reduce((acc, item) => {
      const totalQtyItem = item.qty + (item.qtyPO || 0);
      return acc + (item.price * totalQtyItem);
  }, 0);

  // Logic Sisa Tagihan 
  const isHutang = selectedPaymentMethod === 'HUTANG';
  const sisaTagihan = isHutang ? Math.max(0, subTotal - dpAmount) : Math.max(0, subTotal - paymentAmount);
  const kembalian = isHutang ? 0 : Math.max(0, paymentAmount - subTotal);

  // --- HANDLER LOGOUT ---
  const handleLogout = () => {
    if(confirm("Apakah Anda yakin ingin logout?")) {
        localStorage.removeItem('isLoggedIn');
        window.dispatchEvent(new Event('auth-change'));
    }
  };

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

  // Logic Add List View
  const handleAddToListCart = (product: InventoryItem) => {
    if (product.variants.length === 0) return;
    
    const selection = getListSelection(product.id);
    const selectedVariantName = selection.variant || product.variants[0].name;
    const selectedVariant = product.variants.find(v => v.name === selectedVariantName) || product.variants[0];
    
    const availableUnits = getAvailableUnits(selectedVariant);
    if (availableUnits.length === 0) return;
    
    const finalUnitName = selection.unit || availableUnits[0];
    const finalQty = 1; 
    const finalNote = selection.note || "";
    const finalPrice = getPurchasePrice(selectedVariant, finalUnitName);

    const newItem: ExtendedCartItem = {
        id: Date.now() + Math.random(), 
        productId: product.id,
        name: product.name,
        price: finalPrice,
        image: product.image && product.image.length > 0 ? product.image[0] : "",
        qty: finalQty, 
        qtyPO: 0,      
        unit: finalUnitName,
        size: selectedVariantName,
        note: finalNote
    };
    setCart([...cart, newItem]);
    updateListSelection(product.id, 'note', "");
  };

  const handleCartUnitChange = (cartItemId: number, productId: string, newUnitName: string, variantName: string) => {
    const product = listProducts.find(p => p.id === productId);
    if (!product) return;
    const variant = product.variants.find(v => v.name === variantName);
    if (!variant) return;
    const newPrice = getPurchasePrice(variant, newUnitName);

    setCart(prev => prev.map(item => 
        item.id === cartItemId 
        ? { ...item, unit: newUnitName, price: newPrice } 
        : item
    ));
  };


  // --- PRODUCT MODAL ---
  const handleProductClick = (product: InventoryItem) => {
    if (product.variants.length === 0) return;
    setSelectedProduct(product);
    setModalQty(1);
    const firstVariant = product.variants[0];
    const availableUnits = getAvailableUnits(firstVariant);
    setModalUnit(availableUnits.length > 0 ? availableUnits[0] : "");
    setModalVariant(firstVariant);
    setModalNote("");
  };

  const closeProductModal = () => {
    setSelectedProduct(null);
    setModalVariant(null);
  };

  const handleSaveToCart = () => {
    if (!selectedProduct || !modalVariant) return;
    const availableUnits = getAvailableUnits(modalVariant);
    if (availableUnits.length === 0) return;
    
    const finalUnit = modalUnit || availableUnits[0];
    const finalPrice = getPurchasePrice(modalVariant, finalUnit);
    
    const newItem: ExtendedCartItem = {
      id: Date.now() + Math.random(),
      productId: selectedProduct.id,
      name: selectedProduct.name,
      price: finalPrice,
      image: selectedProduct.image && selectedProduct.image.length > 0 ? selectedProduct.image[0] : "",
      qty: modalQty, 
      qtyPO: 0,      
      unit: finalUnit,
      size: modalVariant.name,
      note: modalNote
    };
    setCart([...cart, newItem]);
    closeProductModal();
  };
  
  // --- NOTE & PRICE EDIT ---
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
  const handleSaveDraft = async () => {
    if (cart.length === 0) return;
    
    try {
      // Generate invoice number baru untuk draft baru
      let invoiceNo = currentInvoiceNo;
      if (activeDraftId === null && numberingConfig) {
        invoiceNo = await generatePurchaseId();
      }
      
    const currentDate = new Date().toLocaleString('id-ID');
    
    const newDraft: DraftPurchase = {
        id: activeDraftId || Date.now(),
          invoiceNumber: invoiceNo, 
        items: [...cart],
        total: subTotal,
        date: currentDate,
        customer: selectedSupplier 
    };

    if (activeDraftId !== null) {
        // WOI BACKEND JORDY: UPDATE data draft pembelian di database
        // PUT /api/purchase-drafts/{activeDraftId} dengan body: newDraft
        setDraftTransactions(prev => prev.map(d => d.id === activeDraftId ? newDraft : d));
    } else {
        // WOI BACKEND JORDY: INSERT data draft pembelian baru ke database
        // POST /api/purchase-drafts dengan body: newDraft
        setDraftTransactions(prev => [...prev, newDraft]);
          // Update currentInvoiceNo dengan yang baru
          setCurrentInvoiceNo(invoiceNo);
    }

    setCart([]);
    setActiveDraftId(null);
    setSelectedSupplier(null);
    alert("Draft Pembelian tersimpan.");
    } catch (error) {
      console.error("Error saving draft:", error);
      alert("Gagal menyimpan draft. Silakan coba lagi.");
    }
  };

  const handleRestoreDraft = (draft: DraftPurchase) => {
    setCart([...draft.items]);
    setActiveDraftId(draft.id); 
    if (draft.customer) setSelectedSupplier(draft.customer);
    else setSelectedSupplier(null);
    if (draft.invoiceNumber) setCurrentInvoiceNo(draft.invoiceNumber);
    setShowHistory(false);
  };

  const handleDeleteDraft = (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); 
    if (window.confirm("Hapus draft ini?")) {
        // WOI BACKEND JORDY: DELETE data draft pembelian dari database
        // DELETE /api/purchase-drafts/{id}
        setDraftTransactions(prev => prev.filter(d => d.id !== id));
        if (activeDraftId === id) {
          setActiveDraftId(null);
          // Reset invoice number saat draft dihapus agar generate yang baru
          setCurrentInvoiceNo("");
        }
    }
  };

  // --- FINALISASI ---
  const handleCetakPO = () => {
    if (cart.length === 0) return;
    handleSaveDraft(); // Simpan sebagai draft dulu / cetak struk
  };

  const handleOpenFakturKredit = () => {
    if (cart.length === 0) {
      alert("Keranjang masih kosong!");
      return;
    }
    
    if (!selectedSupplier) {
      alert("Mohon pilih supplier terlebih dahulu sebelum mencetak faktur!");
      return;
    }
    
    setJatuhTempoDate(""); 
    setDpAmount(0);
    setIsPOModalOpen(true);
  };

  const handleFinalizeCredit = async () => {
    try {
    if (!jatuhTempoDate) {
        alert("Harap isi Tanggal Jatuh Tempo!");
        return;
    }
    
      // Validasi supplier
      if (!selectedSupplier) {
        alert("Mohon pilih supplier terlebih dahulu!");
        return;
      }

      // Validasi invoice number sudah ada
      if (!currentInvoiceNo) {
        alert("Invoice number belum di-generate. Silakan tunggu sebentar dan coba lagi.");
        return;
      }

      // Map cart items ke ProductPurchaseDetail
      const productDetails = mapCartItemsToProductPurchaseDetail(cart);

      // Format data sesuai PurchaseTransaction type untuk KREDIT (PO) dengan ID (gunakan currentInvoiceNo)
      const purchaseTransaction: PurchaseTransaction = {
        id: currentInvoiceNo,
        supplierId: selectedSupplier.id,
        supplierName: selectedSupplier.name,
        productDetail: productDetails,
        isHutang: true,
        deadlineDate: new Date(jatuhTempoDate),
        dp: dpAmount, // DP untuk PO/KREDIT
        paymentMethod: 'TUNAI', // Default untuk PO
        paymentValue: dpAmount,
        remainingPayment: subTotal - dpAmount
      };

      // POST ke backend dengan ID yang sudah di-generate
      await authenticatedAxios.post(`${API_BASE_URL}/api/purchases`, purchaseTransaction);

      // Jika berhasil, reset state
      if (activeDraftId !== null) {
        setDraftTransactions(prev => prev.filter(d => d.id !== activeDraftId));
      }
    
      const savedInvoiceNo = currentInvoiceNo; // Simpan invoice number yang digunakan
      const savedJatuhTempo = jatuhTempoDate; // Simpan jatuh tempo
      const savedDpAmount = dpAmount; // Simpan DP amount
      
      setIsPOModalOpen(false);
      setIsSuccessModalOpen(false);
      setCart([]);
      setPaymentAmount(0);
      setSelectedPaymentMethod("");
      setActiveDraftId(null);
      setJatuhTempoDate("");
      setSelectedSupplier(null);
      setDpAmount(0);
      // Reset invoice number agar generate yang baru di useEffect (saat activeDraftId menjadi null)
      setCurrentInvoiceNo("");

      alert(`Pembelian PO (KREDIT) berhasil dicatat!\nID: ${savedInvoiceNo}\nJatuh Tempo: ${savedJatuhTempo}\nDP: ${formatRupiah(savedDpAmount)}`);
    } catch (error: any) {
      console.error("Error saving purchase transaction (KREDIT):", error);
      alert(error.response?.data?.message || "Gagal menyimpan transaksi pembelian PO. Silakan coba lagi.");
    }
  };

  // --- PEMBAYARAN ---
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

  // --- DP NUMPAD LOGIC ---
  const openDpNumpad = () => {
    setDpNumpadValue(String(dpAmount) || "0");
    setIsDpNumpadOpen(true);
  };

  const appendDpDigit = (digit: string) => {
    setDpNumpadValue(prev => prev === "0" ? digit : prev + digit);
  };

  const backspaceDpDigit = () => {
    setDpNumpadValue(prev => {
      const next = prev.slice(0, -1);
      return next === "" ? "0" : next;
    });
  };

  const confirmDpNumpad = () => {
    const newDp = parseInt(dpNumpadValue) || 0;
    if (newDp > subTotal) {
      alert("DP tidak boleh melebihi total tagihan!");
      return;
    }
    setDpAmount(newDp);
    setIsDpNumpadOpen(false);
  };

  // --- HELPER FUNCTION: FETCH PURCHASE TRANSACTIONS COUNT ---
  const fetchPurchaseTransactionsCount = async (dateFilter: string): Promise<number> => {
    try {
      // Format dateFilter: "YYYY-MM-DD" untuk includeDay=true atau "YYYY-MM" untuk includeDay=false
      const response = await authenticatedAxios.get(`${API_BASE_URL}/api/purchases/count`, {
        params: { dateFilter }
      });
      return response.data.count || 0;
    } catch (error: any) {
      console.error("Error fetching purchase transactions count:", error);
      return 0;
    }
  };

  // --- HELPER FUNCTION: GENERATE PURCHASE ID ---
  const generatePurchaseId = async (): Promise<string> => {
    const config = numberingConfig || defaultNumberingConfig;
    const date = new Date();
    
    // Format year sesuai yearFormat
    const yearFull = date.getFullYear().toString();
    const year = config.yearFormat === 'YY' ? yearFull.slice(-2) : yearFull;
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Buat datePart sesuai includeDay
    let dateFilter: string;
    let datePart: string;
    
    if (config.includeDay) {
      // Per hari: format YYYY-MM-DD atau YY-MM-DD untuk filter
      dateFilter = `${yearFull}-${month}-${day}`;
      datePart = `${year}${month}${day}`;
    } else {
      // Per bulan: format YYYY-MM atau YY-MM untuk filter
      dateFilter = `${yearFull}-${month}`;
      datePart = `${year}${month}`;
    }
    
    // Fetch count purchase transactions sesuai format
    const count = await fetchPurchaseTransactionsCount(dateFilter);
    
    // Generate counter: count + 1 (counter dimulai dari 1 jika belum ada transaksi)
    const counter = count + 1;
    
    // Format: prefix + datePart + separator + counter (tanpa padding)
    return `${config.purchasePrefix}${datePart}${config.separator}${counter}`;
  };

  // --- UPDATE INVOICE NUMBER SAAT NUMBERING CONFIG READY DAN TIDAK ADA DRAFT AKTIF ---
  useEffect(() => {
    const updateInvoiceNumber = async () => {
      // Hanya generate invoice baru jika tidak ada draft aktif dan numberingConfig sudah ready
      // Juga generate jika currentInvoiceNo kosong (saat baru buka atau setelah transaksi selesai)
      if (activeDraftId === null && numberingConfig) {
        try {
          const invoiceNumber = await generatePurchaseId();
          setCurrentInvoiceNo(invoiceNumber);
        } catch (error) {
          console.error("Error generating invoice number:", error);
          // Fallback ke format default jika error
          const date = new Date();
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          setCurrentInvoiceNo(`PU${year}${month}-1`);
        }
      }
    };

    updateInvoiceNumber();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numberingConfig, activeDraftId]);

  // --- HELPER FUNCTION: MAP CART ITEMS TO ProductPurchaseDetail ---
  const mapCartItemsToProductPurchaseDetail = (cartItems: ExtendedCartItem[]): ProductPurchaseDetail[] => {
    return cartItems.map(item => {
      const product = listProducts.find(p => p.id === item.productId);
      if (!product) {
        throw new Error(`Product with id ${item.productId} not found`);
      }

      const variant = product.variants.find(v => v.name === item.size);
      if (!variant) {
        throw new Error(`Variant ${item.size} not found for product ${product.name}`);
      }

      const variantNum = product.variants.findIndex(v => v.name === item.size);
      if (variantNum === -1) {
        throw new Error(`Variant ${item.size} index not found`);
      }

      const unitConversion = variant.unitConversions.find(uc => uc.name === item.unit);
      if (!unitConversion) {
        throw new Error(`Unit ${item.unit} not found for variant ${variant.name}`);
      }

      const unitNum = variant.unitConversions.findIndex(uc => uc.name === item.unit);
      if (unitNum === -1) {
        throw new Error(`Unit ${item.unit} index not found`);
      }

      return {
        productId: item.productId,
        productName: item.name,
        variantNum: variantNum,
        variantName: item.size,
        unitNum: unitNum,
        unitName: item.unit,
        purchasePrice: item.price,
        qty: item.qty + (item.qtyPO || 0)
      };
    });
  };

  const handleOpenPayment = () => {
    if (cart.length === 0) {
      alert("Keranjang masih kosong!");
      return;
    }
    
    if (!selectedSupplier) {
      alert("Mohon pilih supplier terlebih dahulu sebelum melanjutkan ke pembayaran!");
      return;
    }
    
    setPaymentAmount(0);
    setSelectedPaymentMethod("");
    setJatuhTempoDate("");
    setDpAmount(0);
    setIsPaymentModalOpen(true);
  };

  const handleQuickPayment = (methodName: string) => {
    if (methodName === 'HUTANG') {
        setPaymentAmount(0); 
        setDpAmount(0); // Reset DP saat pilih HUTANG
    } else {
        setPaymentAmount(subTotal);
        setDpAmount(0);
    }
    setSelectedPaymentMethod(methodName);
  };

  const handleProcessPayment = () => {
    if (selectedPaymentMethod === 'HUTANG') {
        if (!jatuhTempoDate) {
        alert("Mohon isi Tanggal Jatuh Tempo untuk pembayaran HUTANG!");
        return;
    }
        if (dpAmount > subTotal) {
            alert("DP tidak boleh melebihi total tagihan!");
            return;
        }
    } else {
        if (sisaTagihan > 0) return;
    }
    
    setIsPaymentModalOpen(false);
    setIsSuccessModalOpen(true);
  };

  const handleFinishTransaction = async () => {
    try {
      // Validasi supplier
      if (!selectedSupplier) {
        alert("Mohon pilih supplier terlebih dahulu!");
        return;
      }

      // Validasi invoice number sudah ada
      if (!currentInvoiceNo) {
        alert("Invoice number belum di-generate. Silakan tunggu sebentar dan coba lagi.");
        return;
      }

      // Map cart items ke ProductPurchaseDetail
      const productDetails = mapCartItemsToProductPurchaseDetail(cart);

      // Format data sesuai PurchaseTransaction type dengan ID (gunakan currentInvoiceNo)
      const purchaseTransaction: PurchaseTransaction = {
        id: currentInvoiceNo,
        supplierId: selectedSupplier.id,
        supplierName: selectedSupplier.name,
        productDetail: productDetails,
        isHutang: isHutang,
        deadlineDate: isHutang && jatuhTempoDate ? new Date(jatuhTempoDate) : undefined,
        dp: isHutang ? dpAmount : 0,
        paymentMethod: selectedPaymentMethod === 'TRANSFER' ? 'Transfer' : 'TUNAI',
        paymentValue: isHutang ? dpAmount : paymentAmount,
        remainingPayment: isHutang ? (subTotal - dpAmount) : 0
      };

      // POST ke backend dengan ID yang sudah di-generate
      await authenticatedAxios.post(`${API_BASE_URL}/api/purchases`, purchaseTransaction);

      // Jika berhasil, reset state
    if (activeDraftId !== null) {
        setDraftTransactions(prev => prev.filter(d => d.id !== activeDraftId));
    }
    
      const savedInvoiceNo = currentInvoiceNo; // Simpan invoice number yang digunakan
      
      setIsSuccessModalOpen(false);
      setCart([]);
      setPaymentAmount(0);
      setSelectedPaymentMethod("");
      setActiveDraftId(null);
      setJatuhTempoDate("");
      setSelectedSupplier(null);
      setDpAmount(0);
      // Reset invoice number agar generate yang baru di useEffect (saat activeDraftId menjadi null)
      setCurrentInvoiceNo("");

      alert(`Transaksi pembelian berhasil disimpan!\nID: ${savedInvoiceNo}`);
    } catch (error: any) {
      console.error("Error saving purchase transaction:", error);
      alert(error.response?.data?.message || "Gagal menyimpan transaksi pembelian. Silakan coba lagi.");
    }
  };

  // --- QTY INCREMENT / DECREMENT ---
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
      
      {/* AREA UTAMA (GRID/LIST PRODUK) */}
      <div className={`w-full lg:flex-1 flex flex-col h-full border-r border-gray-300 relative z-0 transition-all ${isMobileCartOpen ? 'hidden lg:flex' : 'flex'}`}>
        
        {/* HEADER */}
        <div className="h-16 bg-white flex items-center px-4 shadow-sm gap-4 shrink-0">
          <Menu className="w-6 h-6 cursor-pointer hover:text-blue-500 transition-colors" onClick={() => setIsSidebarOpen(true)} />
          
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Cari Produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-black rounded-full focus:outline-none focus:border-blue-500 text-lg"
            />
            {searchQuery && <X className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 cursor-pointer hover:text-red-500" onClick={() => setSearchQuery("")} />}
            {!searchQuery && <ScanLine className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black cursor-pointer" />}
          </div>

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
          {isLoadingProducts ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500"/>
            </div>
          ) : viewMode === 'GRID' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
                {currentProducts.length > 0 ? (
                    currentProducts.map((product) => {
                      // Get first variant and default unit for display
                      const firstVariant = product.variants && product.variants.length > 0 ? product.variants[0] : null;
                      const defaultPrice = firstVariant ? getPurchasePrice(firstVariant, getAvailableUnits(firstVariant)[0] || "") : 0;
                      const productImage = product.image && product.image.length > 0 ? product.image[0] : "";
                      
                      return (
                        <div key={product.id} onClick={() => handleProductClick(product)} className="bg-white p-2 flex flex-col items-center hover:shadow-lg transition-shadow cursor-pointer rounded-lg shadow-sm border border-gray-100">
                          <img src={productImage} alt={product.name} className="w-full h-24 lg:h-32 object-contain mb-2" />
                          <p className="text-green-600 font-bold text-sm">{formatRupiah(defaultPrice)}</p>
                          <p className="text-xs text-center text-gray-700 mt-1 line-clamp-2">{product.name}</p>
                        </div>
                      );
                    })
                ) : (
                    <div className="col-span-full text-center text-gray-500 mt-10">Produk tidak ditemukan.</div>
                )}
              </div>
          ) : (
              <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                 <div className="grid grid-cols-12 bg-gray-100 border-b border-gray-200 py-3 px-2 font-bold text-gray-700 text-xs uppercase tracking-wider text-center">
                    <div className="col-span-5 lg:col-span-3 text-left pl-2">Nama Produk</div>
                    <div className="col-span-3 lg:col-span-2 text-left">Varian</div>
                    <div className="col-span-1 hidden lg:block">Unit</div>
                    <div className="col-span-2 lg:col-span-2 text-right pr-2 hidden lg:block">Harga Beli</div>
                    <div className="col-span-3 hidden lg:block text-left pl-2">Keterangan</div>
                    <div className="col-span-4 lg:col-span-1">Aksi</div>
                 </div>
                 {currentProducts.map((product) => {
                     if (product.variants.length === 0) return null;
                     
                     const selection = getListSelection(product.id);
                     const selectedVariantName = selection.variant || product.variants[0].name;
                     const selectedVariant = product.variants.find(v => v.name === selectedVariantName) || product.variants[0];
                     const availableUnits = getAvailableUnits(selectedVariant);
                     const currentUnitName = selection.unit || (availableUnits.length > 0 ? availableUnits[0] : "");
                     const currentNote = selection.note || "";
                     const displayPrice = getPurchasePrice(selectedVariant, currentUnitName);

                     return (
                        <div key={product.id} className="grid grid-cols-12 border-b border-gray-100 py-2 px-2 items-center hover:bg-blue-50/50 transition-colors text-sm">
                            <div className="col-span-5 lg:col-span-3 pr-2 flex flex-col justify-center">
                                <span className="font-medium text-gray-800 leading-tight whitespace-normal break-words">{product.name}</span>
                                <span className="lg:hidden text-xs text-green-600 font-bold">{formatRupiah(displayPrice)}</span>
                            </div>
                            <div className="col-span-3 lg:col-span-2 pr-1">
                                <div className="relative">
                                    <select className="w-full appearance-none border border-gray-300 rounded-md py-1 pl-2 pr-6 text-xs bg-white focus:outline-none focus:border-blue-500 cursor-pointer" value={selectedVariantName} onChange={(e) => {
                                      updateListSelection(product.id, 'variant', e.target.value);
                                      // Reset unit when variant changes
                                      const newVariant = product.variants.find(v => v.name === e.target.value);
                                      if (newVariant) {
                                        const newUnits = getAvailableUnits(newVariant);
                                        if (newUnits.length > 0) {
                                          updateListSelection(product.id, 'unit', newUnits[0]);
                                        }
                                      }
                                    }}>{product.variants.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}</select>
                                    <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none"/>
                                </div>
                            </div>
                            <div className="col-span-1 pr-1 hidden lg:block">
                                <div className="relative">
                                    <select className="w-full appearance-none border border-gray-300 rounded-md py-1 pl-1 pr-5 text-xs bg-white focus:outline-none focus:border-blue-500 cursor-pointer text-center font-bold" value={currentUnitName} onChange={(e) => updateListSelection(product.id, 'unit', e.target.value)}>{availableUnits.map(u => <option key={u} value={u}>{u}</option>)}</select>
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

        {/* PAGINATION FOOTER */}
        <div className="bg-white border-t border-gray-200 p-4 flex justify-between items-center sticky bottom-0 z-20 shadow-2xl">
            <div className="text-gray-800 font-medium">
                Menampilkan <span className="font-bold">{startIndex} - {endIndex}</span> dari <span className="font-bold">{totalItems}</span> Produk (Halaman {currentPage})
            </div>
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => handlePageChange('prev')} 
                    disabled={currentPage === 1} 
                    className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4"/> Balik
                </button>
                
                <button 
                    onClick={() => handlePageChange('next')} 
                    disabled={listProducts.length < itemsPerPage} 
                    className="px-4 py-2 rounded bg-[#BEDFFF] hover:bg-blue-300 text-blue-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                    Lanjut <ChevronRight className="w-4 h-4"/>
                </button>
            </div>
        </div>

        {/* FLOATING ACTION BAR FOR MOBILE */}
        <div className="lg:hidden absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex items-center justify-between shadow-[0_-4px_10px_rgba(0,0,0,0.1)] z-20">
            <div className="flex flex-col">
                <span className="text-xs text-gray-500">Total Beli</span>
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

      {/* SIDEBAR KANAN (CART UTAMA) */}
      <div className={`w-full lg:w-[350px] xl:w-[400px] bg-white flex-col h-full shadow-2xl z-10 border-l border-gray-200 transition-all ${isMobileCartOpen ? 'flex fixed inset-0 z-50 lg:static' : 'hidden lg:flex'}`}>
        
        {/* HEADER SIDEBAR */}
        <div className="h-12 flex items-center justify-between lg:justify-end px-3 gap-3 border-b border-gray-200 relative shrink-0">
         <button onClick={() => setIsMobileCartOpen(false)} className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-6 h-6" />
         </button>

         <div className="flex items-center gap-3">
            {/* HISTORY DROPDOWN */}
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
                    Riwayat Draft PO ({draftTransactions.length})
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
            
            {/* PROFILE DROPDOWN */}
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
                            <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600 text-sm font-bold"><LogOut className="w-3 h-3"/> Log Out</button>
                        </div>
                    </div>
                )}
            </div>
         </div>
        </div>

        {/* SUPPLIER SECTION & TRANSACTION DROPDOWN */}
        <SupplierSelector
          selectedSupplier={selectedSupplier}
          onSelectSupplier={setSelectedSupplier}
          currentInvoiceNo={currentInvoiceNo}
          transactionMode={transactionMode}
          onTransactionModeChange={(mode) => {
            setTransactionMode(mode);
          }}
          transactionMenuRef={transactionMenuRef}
        />

        {/* HEADER TABEL CART */}
        <div className={`grid grid-cols-12 gap-1 px-2 py-1 text-xs font-semibold border-b border-gray-300 text-center z-10 bg-white relative transition-colors shrink-0 ${transactionMode === 'KREDIT' ? 'bg-yellow-50' : ''}`}>
          <div className="col-span-1"></div>
          {transactionMode === 'KREDIT' ? (
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
        
        {/* LIST ITEM CART */}
        <div className="flex-1 overflow-y-auto relative bg-white">
          <div className="relative z-10">
            {cart.length === 0 ? <div className="flex items-center justify-center h-40 text-xs text-gray-400 italic">Belum ada item</div> : (
              [...cart].sort((a, b) => a.name.localeCompare(b.name)).map((item) => {
                const originalProduct = listProducts.find(p => p.id === item.productId);
                const totalQtyItem = item.qty + (item.qtyPO || 0);

                return transactionMode === 'KREDIT' ? (
                  // VERTICAL LAYOUT untuk KREDIT MODE
                  <div key={item.id} className="border-b border-gray-200 p-3 hover:bg-gray-50/80 bg-white">
                    {/* Row 1: Product Name & Price */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1 pr-4">
                        <h3 className="font-semibold text-base text-gray-800 leading-snug break-words whitespace-normal">
                          {item.name}
                        </h3>
                        {item.size && <p className="text-xs text-gray-500 mt-1">{item.size}</p>}
                        {item.note && <p className="text-xs text-gray-500 italic mt-1">"{item.note}"</p>}
                      </div>
                      <div className="text-right">
                        <div className="text-green-600 text-lg font-bold whitespace-nowrap">
                          {formatRupiah(item.price * totalQtyItem)}
                        </div>
                        <div className="flex items-center justify-end gap-1 text-xs text-gray-500">
                          {formatRupiah(item.price)}/{item.unit}
                          <button onClick={() => startEditPrice(item.id, item.price)} className="ml-1"><Edit2 className="w-4 h-4 text-gray-400 hover:text-black cursor-pointer" /></button>
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Controls (Trash, Qty, Qty PO, Unit) */}
                    <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                      {/* Trash */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-5 h-5 text-red-500 hover:text-red-700" />
                      </button>

                      {/* Qty Fisik */}
                      <div className="flex flex-col items-center min-w-[110px]">
                        <span className="text-[10px] font-semibold text-blue-700 mb-1">QTY FISIK</span>
                        <div className="flex items-center gap-2">
                          <button
                            className="w-8 h-8 flex items-center justify-center text-lg font-bold text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                            onClick={() => decrementQty(item.id)}
                          >
                            -
                          </button>
                          <span className="w-10 text-center text-lg font-bold text-blue-700">
                            {item.qty}
                          </span>
                          <button
                            className="w-8 h-8 flex items-center justify-center text-lg font-bold text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                            onClick={() => incrementQty(item.id)}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Qty PO */}
                      <div className="flex flex-col items-center min-w-[110px]">
                        <span className="text-[10px] font-semibold text-orange-700 mb-1">QTY PO</span>
                        <div className="flex items-center gap-2">
                          <button
                            className="w-8 h-8 flex items-center justify-center text-lg font-bold text-orange-500 hover:bg-orange-50 rounded-md transition-colors"
                            onClick={() => decrementQtyPO(item.id)}
                          >
                            -
                          </button>
                          <span className="w-10 text-center text-lg font-bold text-orange-700">
                            {item.qtyPO || 0}
                          </span>
                          <button
                            className="w-8 h-8 flex items-center justify-center text-lg font-bold text-orange-500 hover:bg-orange-50 rounded-md transition-colors"
                            onClick={() => incrementQtyPO(item.id)}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Unit Selector */}
                      <div className="flex flex-col items-center min-w-[90px]">
                        <span className="text-[10px] font-semibold text-gray-600 mb-1">UNIT</span>
                        {originalProduct ? (
                          <select
                            className="text-sm font-medium border-none bg-transparent focus:outline-none cursor-pointer text-center"
                            value={item.unit}
                            onChange={(e) => handleCartUnitChange(item.id, item.productId, e.target.value, item.size)}
                          >
                            {originalProduct.variants[0].unitConversions.map(u => (
                              <option key={u.name} value={u.name}>{u.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-sm font-medium">{item.unit}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  // HORIZONTAL LAYOUT untuk mode TUNAI
                  <div key={item.id} className="grid grid-cols-12 gap-1 px-2 py-2 items-center text-xs border-b border-gray-100 hover:bg-gray-50/80 bg-white/50 backdrop-blur-[1px]">
                    {/* 1. TRASH */}
                    <div className="col-span-1 flex justify-center items-center"><button onClick={() => removeItem(item.id)}><Trash2 className="w-4 h-4 text-red-500 cursor-pointer hover:text-red-700" /></button></div>

                    {/* 2. QTY */}
                    <div className="col-span-3 flex items-center justify-center gap-1 pl-1">
                      <button className="text-lg font-bold px-2 py-1 text-[#87C3FE] hover:text-blue-600" onClick={() => decrementQty(item.id)}>-</button>
                      <span className="w-8 text-center text-base font-bold">{item.qty}</span>
                      <button className="text-lg font-bold px-2 py-1 text-[#87C3FE] hover:text-blue-600" onClick={() => incrementQty(item.id)}>+</button>
                    </div>

                    {/* 3. UNIT */}
                    <div className="col-span-2 flex justify-center items-center mr-2">{originalProduct ? (<select className="w-full text-xs border-none bg-transparent focus:outline-none cursor-pointer appearance-none text-center relative" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23999\' d=\'M6 8L2 4h8z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'center right', paddingRight: '16px' }} value={item.unit} onChange={(e) => handleCartUnitChange(item.id, item.productId, e.target.value)}>{originalProduct.availableUnits.map(u => (<option key={u.name} value={u.name}>{u.name}</option>))}</select>) : (<span className="text-xs">{item.unit}</span>)}</div>

                    {/* 4. NAME & NOTE */}
                    <div className="col-span-3 text-sm text-gray-700 leading-tight pr-1 break-words whitespace-normal pt-0.5">
                      <div className="font-semibold text-base break-words whitespace-normal">{item.name}</div>
                      {/* MENAMPILKAN VARIAN (UKURAN) */}
                      <div className="text-xs text-gray-400 font-normal">{item.size}</div>
                      {item.note && <div className="text-[10px] text-gray-500 italic">"{item.note}"</div>}
                    </div>

                    {/* 5. PRICE & TOTAL */}
                    <div className="col-span-3 text-right flex flex-col gap-0">
                      <div className="text-green-600 text-base font-bold">{formatRupiah(item.price * totalQtyItem)}</div>
                      <div className="flex justify-end items-center gap-1 text-xs text-gray-500">
                        {formatRupiah(item.price)}/{item.unit}
                        <button onClick={() => startEditPrice(item.id, item.price)} className="ml-1"><Edit2 className="w-4 h-4 text-gray-400 hover:text-black cursor-pointer" /></button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-gray-100 border-t border-gray-300 z-10 shrink-0">
          <div className="flex justify-between items-center px-4 py-2 bg-gray-100">
             <span className="text-sm font-medium text-gray-600">Sub Total</span>
             <span className="text-green-600 text-lg font-bold">{formatRupiah(subTotal)}</span>
           </div>
          
          <div className="grid grid-cols-2 grid-rows-2 h-20 text-white font-sans text-sm">
            {transactionMode === 'KREDIT' ? (
                <>
                    <button onClick={handleCetakPO} className="col-span-2 bg-[#7DB9E9] hover:bg-blue-400 flex items-center justify-center border-b border-white font-bold">
                        Simpan Draft
                    </button>
                    <button onClick={handleOpenFakturKredit} className="col-span-2 bg-[#A5CEF2] hover:bg-blue-300 text-black flex items-center justify-center px-6">
                        <span className="font-bold text-lg">Cetak Faktur</span>
                    </button>
                </>
            ) : (
                <>
                    <button onClick={handleCetakPO} className="col-span-2 bg-[#7DB9E9] hover:bg-blue-400 flex items-center justify-center border-b border-white font-bold">
                        Simpan Draft
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


      {/* MODAL POPUP DETAIL PRODUK */}
      {selectedProduct && selectedProduct.variants.length > 0 && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={closeProductModal}>
            <div className="bg-white rounded-2xl w-full max-w-[450px] p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200 border border-gray-200" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-col items-center mb-6">
                  <img src={selectedProduct.image && selectedProduct.image.length > 0 ? selectedProduct.image[0] : ""} alt="Product" className="h-32 object-contain mb-3" />
                  <h3 className="text-xl font-medium text-gray-800 text-center">{selectedProduct.name}</h3>
                </div>
                
                <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">Varian</label>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedProduct.variants.map(v => (
                        <label key={v.name} className="flex items-center cursor-pointer gap-2">
                          <input 
                            type="radio" 
                            name="variant" 
                            value={v.name} 
                            checked={modalVariant?.name === v.name} 
                            onChange={() => {
                              setModalVariant(v);
                              const availableUnits = getAvailableUnits(v);
                              if (availableUnits.length > 0) {
                                setModalUnit(availableUnits[0]);
                              }
                            }} 
                            className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                          />
                          <span className="text-sm">{v.name}</span>
                        </label>
                      ))}
                    </div>
                </div>
                
                {modalVariant && (
                  <>
                    <div className="mb-4">
                        <label className="block text-gray-700 font-medium mb-2">Unit</label>
                        <div className="grid grid-cols-3 gap-2">
                          {getAvailableUnits(modalVariant).map(u => (
                            <label key={u} className="flex items-center cursor-pointer gap-2">
                              <input 
                                type="radio" 
                                name="unit" 
                                value={u} 
                                checked={modalUnit === u} 
                                onChange={() => setModalUnit(u)} 
                                className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                              />
                              <span className="text-sm font-bold">{u}</span>
                            </label>
                          ))}
                        </div>
                        {modalUnit && (
                          <div className="mt-2 text-sm text-gray-600">
                            Harga: {formatRupiah(getPurchasePrice(modalVariant, modalUnit))}
                          </div>
                        )}
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
                  </>
                )}
            </div>
        </div>
      )}

      {/* Modal Edit Harga Numpad */}
      {editingPriceId !== null && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center"><div className="absolute inset-0 bg-black opacity-40" onClick={cancelEditPrice}></div><div className="relative bg-white rounded-lg shadow-lg w-80 p-4 z-10"><div className="flex justify-between items-center mb-3"><h3 className="text-lg font-semibold">Edit Harga Beli</h3><button onClick={cancelEditPrice} className="text-gray-600">Batal</button></div><div className="mb-3"><div className="text-sm text-gray-500">Harga sekarang</div><div className="text-2xl font-bold">{formatRupiah(Number(editingPriceValue || 0))}</div></div><div className="grid grid-cols-3 gap-2 mb-3">{["1","2","3","4","5","6","7","8","9"].map(d => (<button key={d} onClick={() => appendDigit(d)} className="bg-gray-100 py-3 rounded text-lg">{d}</button>))}<button onClick={backspaceDigit} className="bg-gray-100 py-3 rounded text-lg">⌫</button><button onClick={() => appendDigit("0")} className="bg-gray-100 py-3 rounded text-lg">0</button><button onClick={clearDigits} className="bg-gray-100 py-3 rounded text-lg">C</button></div><div className="flex gap-2"><button onClick={cancelEditPrice} className="flex-1 py-2 rounded bg-gray-200">Cancel</button><button onClick={confirmEditPrice} className="flex-1 py-2 rounded bg-green-600 text-white font-bold">OK</button></div></div></div>
      )}

      {/* --- HALAMAN PEMBAYARAN (FULL SCREEN MODAL) --- */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[80] bg-blue-50 flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="h-14 bg-blue-50 flex items-center px-4 border-b border-gray-200">
            <button onClick={() => setIsPaymentModalOpen(false)} className="flex items-center gap-2 text-gray-700 hover:text-black">
              <ArrowLeft className="w-6 h-6" />
              <span className="font-bold text-lg">Pembayaran Pembelian</span>
            </button>
          </div>
          
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden overflow-y-auto">
            {/* KOLOM KIRI */}
            <div className="w-full lg:w-1/3 bg-white border-b lg:border-r border-gray-300 flex flex-col p-4 shrink-0">
              <div className="border border-black p-2 rounded-sm h-full flex flex-col max-h-[300px] lg:max-h-none overflow-y-auto lg:overflow-visible">
                <div className="relative border-b border-black pb-2 mb-2 h-14 shrink-0">
                    <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-center items-center w-16">
                        <div className="border border-black rounded-full p-0.5"><Building2 className="w-6 h-6" /></div>
                        <span className="text-xs font-bold text-center leading-none mt-1 truncate w-full">{selectedSupplier?.name}</span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <h2 className="text-xl font-bold uppercase">
                            {transactionMode === 'KREDIT' ? 'PEMBELIAN PO' : 'PEMBELIAN'}
                        </h2>
                    </div>
                    <div className="absolute right-0 bottom-0 text-xs font-bold">
                        {currentInvoiceNo}
                    </div>
                </div>
                <div className="grid grid-cols-12 text-base font-bold border-b border-gray-200 pb-1 mb-2"><div className="col-span-2 text-center">Qty</div><div className="col-span-2">Unit</div><div className="col-span-4">Name</div><div className="col-span-4 text-right">@Harga / Total</div></div>
                <div className="flex-1 overflow-y-auto min-h-[100px]">
                    {cart.map(item => (
                        <div key={item.id} className="grid grid-cols-12 text-base py-3 border-b border-gray-100 items-center">
                            <div className="col-span-2 flex items-center justify-center gap-2"><span className="font-bold">{item.qty + (item.qtyPO || 0)}</span></div>
                            <div className="col-span-2 text-sm">{item.unit}</div>
                            <div className="col-span-4 leading-tight font-medium text-sm">
                                {item.name}
                                {/* MENAMPILKAN VARIAN (UKURAN) */}
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

            {/* KOLOM TENGAH */}
            <div className="w-full lg:w-1/3 p-4 lg:p-6 flex flex-col justify-between border-b lg:border-r border-gray-300">
               <div className="border border-gray-300 shadow-sm">
                 <div className="bg-[#87C3FE] p-4 text-2xl font-bold text-black border-b border-gray-300">Pembayaran</div>
                 <div className="bg-white p-6 space-y-6 text-xl">
                   <div className="flex justify-between">
                     <span>Tagihan</span>
                     <span>{formatRupiah(subTotal)}</span>
                   </div>
                   <div className="flex justify-between">
                     <span>Bayar</span>
                     {selectedPaymentMethod === 'HUTANG' ? (
                       <span className="text-red-500 font-bold">HUTANG</span>
                     ) : (
                       <span>{formatRupiah(paymentAmount)}</span>
                     )}
                   </div>
                   {selectedPaymentMethod === 'HUTANG' && (
                     <>
                       <div className="flex justify-between">
                         <span>DP</span>
                         <span className="font-bold">{formatRupiah(dpAmount)}</span>
                       </div>
                       <div className="flex justify-between text-red-500 font-bold">
                         <span>Sisa Tagihan</span>
                         <span>{formatRupiah(sisaTagihan)}</span>
                       </div>
                     </>
                   )}
                   {selectedPaymentMethod !== 'HUTANG' && (
                     <>
                       <div className="flex justify-between text-red-500 font-bold">
                         <span>Sisa</span>
                         <span>{formatRupiah(sisaTagihan)}</span>
                       </div>
                       <div className="flex justify-between">
                         <span>Kembalian</span>
                         <span>{formatRupiah(kembalian)}</span>
                       </div>
                     </>
                   )}
                 </div>
               </div>
            </div>

            {/* KOLOM KANAN */}
            <div className="w-full lg:w-1/3 p-4 lg:p-6 flex flex-col gap-6 bg-white relative pb-32 lg:pb-6">
              <div className="space-y-4">
                 <div className="flex items-center gap-4"><span className="text-xl lg:text-2xl w-24">TUNAI</span><button onClick={() => handleQuickPayment('UANG_PAS')} className={`border border-black px-4 py-2 text-lg lg:text-xl w-40 ${selectedPaymentMethod === 'UANG_PAS' ? 'bg-[#87C3FE]' : 'hover:bg-gray-100'}`}>UANG PAS</button></div>
                 <div className="flex items-center gap-4 pl-0 lg:pl-28"><button onClick={openPaymentNumpad} className={`border border-black px-4 py-2 text-xl flex items-center gap-2 w-40 ${selectedPaymentMethod === 'LAINNYA' ? 'bg-[#87C3FE]' : 'hover:bg-gray-100'}`}>{selectedPaymentMethod === 'LAINNYA' && paymentAmount > 0 ? formatRupiah(paymentAmount) : <><Calculator className="w-5 h-5"/> Lainnya</>}</button></div>
                 <div className="flex items-center gap-4 mt-8"><span className="text-xl lg:text-2xl w-24">Transfer</span><button onClick={() => handleQuickPayment('TRANSFER')} className={`border border-black px-4 py-2 text-lg ${selectedPaymentMethod === 'TRANSFER' ? 'bg-[#87C3FE]' : 'hover:bg-gray-100'}`}>BANK TRANSFER</button></div>
                 
                 {/* TOMBOL HUTANG + INPUT JATUH TEMPO + DP */}
                 <div className="flex flex-col gap-2 mt-4 border-t border-gray-200 pt-4">
                     <div className="flex items-center gap-4">
                        <span className="text-xl lg:text-2xl w-24 font-bold text-red-600">HUTANG</span>
                        <button 
                            onClick={() => {
                                setSelectedPaymentMethod('HUTANG');
                                setPaymentAmount(0);
                                setDpAmount(0);
                            }} 
                            className={`border border-black px-4 py-2 text-lg w-40 font-bold ${selectedPaymentMethod === 'HUTANG' ? 'bg-[#87C3FE]' : 'hover:bg-gray-100'}`}
                        >
                            TEMPO
                        </button>
                     </div>
                     {selectedPaymentMethod === 'HUTANG' && (
                         <div className="pl-0 lg:pl-28 mt-2 space-y-3 animate-in fade-in slide-in-from-top-2">
                             <div>
                             <label className="block text-sm font-bold text-gray-700 mb-1">Tanggal Jatuh Tempo:</label>
                             <input 
                                type="date" 
                                value={jatuhTempoDate}
                                onChange={(e) => setJatuhTempoDate(e.target.value)}
                                className="w-40 border border-gray-400 rounded px-2 py-1 font-bold text-gray-800 focus:outline-none focus:border-blue-500"
                             />
                             </div>
                             <div>
                                 <label className="block text-sm font-bold text-gray-700 mb-1">Down Payment (DP):</label>
                                 <button 
                                    onClick={openDpNumpad}
                                    className={`border border-black px-4 py-2 text-lg w-40 flex items-center gap-2 ${dpAmount > 0 ? 'bg-[#87C3FE]' : 'hover:bg-gray-100'}`}
                                 >
                                    {dpAmount > 0 ? formatRupiah(dpAmount) : <><Calculator className="w-5 h-5"/> Input DP</>}
                                 </button>
                                 {dpAmount > 0 && (
                                    <div className="mt-1 text-xs text-gray-600">
                                        Sisa Tagihan: {formatRupiah(subTotal - dpAmount)}
                                    </div>
                                 )}
                             </div>
                         </div>
                     )}
                 </div>
              </div>

              <div className="lg:absolute lg:bottom-6 lg:right-6 lg:left-6 mt-6 lg:mt-0"><button onClick={handleProcessPayment} disabled={selectedPaymentMethod !== 'HUTANG' && sisaTagihan > 0} className={`w-full py-4 text-2xl font-bold flex items-center justify-center gap-2 rounded-lg ${(selectedPaymentMethod !== 'HUTANG' && sisaTagihan > 0) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#87C3FE] text-black hover:bg-blue-400 shadow-lg'}`}><ShoppingCart className="w-6 h-6"/> Proses Bayar</button></div>

              {isPaymentNumpadOpen && (
                <div className="absolute inset-0 bg-white z-20 p-4 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Input Nominal</h3>
                    <button onClick={() => setIsPaymentNumpadOpen(false)} className="text-red-500 font-bold">Batal</button>
                  </div>
                  <div className="bg-gray-100 p-4 text-right text-3xl font-bold mb-4 rounded">
                    {formatRupiah(parseInt(paymentNumpadValue))}
                  </div>
                  <div className="grid grid-cols-3 gap-3 flex-1">
                    {["1","2","3","4","5","6","7","8","9"].map(d => (
                      <button key={d} onClick={() => appendPaymentDigit(d)} className="bg-white border border-gray-300 text-2xl font-bold rounded shadow-sm hover:bg-gray-50">
                        {d}
                      </button>
                    ))}
                    <button onClick={backspacePaymentDigit} className="bg-red-50 border border-red-200 text-2xl font-bold rounded text-red-500">⌫</button>
                    <button onClick={() => appendPaymentDigit("0")} className="bg-white border border-gray-300 text-2xl font-bold rounded">0</button>
                    <button onClick={confirmPaymentNumpad} className="bg-green-500 text-white text-2xl font-bold rounded">OK</button>
                  </div>
                </div>
              )}

              {isDpNumpadOpen && (
                <div className="absolute inset-0 bg-white z-20 p-4 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Input Down Payment (DP)</h3>
                    <button onClick={() => setIsDpNumpadOpen(false)} className="text-red-500 font-bold">Batal</button>
            </div>
                  <div className="bg-gray-100 p-4 text-right text-3xl font-bold mb-4 rounded">
                    {formatRupiah(parseInt(dpNumpadValue))}
                  </div>
                  <div className="mb-2 text-sm text-gray-600">
                    Total Tagihan: {formatRupiah(subTotal)}
                  </div>
                  <div className="grid grid-cols-3 gap-3 flex-1">
                    {["1","2","3","4","5","6","7","8","9"].map(d => (
                      <button key={d} onClick={() => appendDpDigit(d)} className="bg-white border border-gray-300 text-2xl font-bold rounded shadow-sm hover:bg-gray-50">
                        {d}
                      </button>
                    ))}
                    <button onClick={backspaceDpDigit} className="bg-red-50 border border-red-200 text-2xl font-bold rounded text-red-500">⌫</button>
                    <button onClick={() => appendDpDigit("0")} className="bg-white border border-gray-300 text-2xl font-bold rounded">0</button>
                    <button onClick={confirmDpNumpad} className="bg-green-500 text-white text-2xl font-bold rounded">OK</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL SUKSES --- */}
      {isSuccessModalOpen && (
        <div 
          className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200 p-4"
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
                 <div className="flex justify-between text-gray-700">
                   <span>Bayar</span>
                   {selectedPaymentMethod === 'HUTANG' ? (
                     <span className="text-red-500 font-bold">HUTANG</span>
                   ) : (
                     <span>{formatRupiah(paymentAmount)}</span>
                   )}
                 </div>
                 {selectedPaymentMethod === 'HUTANG' && (
                   <>
                     <div className="flex justify-between text-gray-700">
                       <span>Down Payment (DP)</span>
                       <span className="font-bold">{formatRupiah(dpAmount)}</span>
                     </div>
                     <div className="flex justify-between text-red-600 font-bold">
                       <span>Sisa Tagihan</span>
                       <span>{formatRupiah(sisaTagihan)}</span>
                     </div>
                     <div className="flex justify-between text-red-600 font-bold">
                       <span>Jatuh Tempo</span>
                       <span>{jatuhTempoDate}</span>
                     </div>
                   </>
                 )}
                 {selectedPaymentMethod !== 'HUTANG' && (
                   <div className="flex justify-between text-black font-bold text-lg">
                     <span>Kembalian</span>
                     <span>{formatRupiah(kembalian)}</span>
                   </div>
                 )}
               </div>

               <div className="grid grid-cols-1 gap-3 w-full">
                 {/* HANYA TOMBOL SELESAI */}
                 <button onClick={handleFinishTransaction} className="w-full bg-[#87C3FE] hover:bg-blue-400 text-black py-4 rounded-lg text-lg font-bold mt-2 shadow-md">SELESAI</button>
               </div>
           </div>
        </div>
      )}

      {/* --- MODAL JATUH TEMPO (PO) --- */}
      {isPOModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center animate-in fade-in zoom-in duration-200 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-[400px] p-6 border border-gray-200">
                <div className="text-center mb-6">
                    <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
                        <Calendar className="w-6 h-6 text-yellow-600"/>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Set Jatuh Tempo</h3>
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Tanggal Jatuh Tempo</label>
                    <input 
                        type="date" 
                        value={jatuhTempoDate}
                        onChange={(e) => setJatuhTempoDate(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 font-medium"
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Down Payment (DP) - Opsional</label>
                    <button 
                        onClick={openDpNumpad}
                        className={`w-full border border-gray-400 rounded-lg px-4 py-3 font-bold text-gray-800 focus:outline-none focus:border-blue-500 flex items-center justify-center gap-2 ${dpAmount > 0 ? 'bg-blue-50 border-blue-500' : 'bg-white hover:bg-gray-50'}`}
                    >
                        {dpAmount > 0 ? formatRupiah(dpAmount) : <><Calculator className="w-5 h-5"/> Input DP (Opsional)</>}
                    </button>
                    {dpAmount > 0 && (
                        <div className="mt-2 text-sm text-gray-600">
                            Total: {formatRupiah(subTotal)} | DP: {formatRupiah(dpAmount)} | Sisa: {formatRupiah(subTotal - dpAmount)}
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setIsPOModalOpen(false)} className="py-3 rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors">Batal</button>
                    <button onClick={handleFinalizeCredit} className="py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg">Simpan</button>
                </div>
            </div>
        </div>
      )}

      {/* DP Numpad Modal untuk PO Modal */}
      {isPOModalOpen && isDpNumpadOpen && (
        <div className="fixed inset-0 z-[110] bg-white p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Input Down Payment (DP)</h3>
            <button onClick={() => setIsDpNumpadOpen(false)} className="text-red-500 font-bold">Batal</button>
          </div>
          <div className="bg-gray-100 p-4 text-right text-3xl font-bold mb-4 rounded">
            {formatRupiah(parseInt(dpNumpadValue))}
          </div>
          <div className="mb-2 text-sm text-gray-600">
            Total Tagihan: {formatRupiah(subTotal)}
          </div>
          <div className="grid grid-cols-3 gap-3 flex-1">
            {["1","2","3","4","5","6","7","8","9"].map(d => (
              <button key={d} onClick={() => appendDpDigit(d)} className="bg-white border border-gray-300 text-2xl font-bold rounded shadow-sm hover:bg-gray-50">
                {d}
              </button>
            ))}
            <button onClick={backspaceDpDigit} className="bg-red-50 border border-red-200 text-2xl font-bold rounded text-red-500">⌫</button>
            <button onClick={() => appendDpDigit("0")} className="bg-white border border-gray-300 text-2xl font-bold rounded">0</button>
            <button onClick={confirmDpNumpad} className="bg-green-500 text-white text-2xl font-bold rounded">OK</button>
            </div>
        </div>
      )}
    </div>
  );
};

export default PembelianPage;