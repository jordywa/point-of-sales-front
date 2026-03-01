// src/pages/Transaction/Pembelian/PembelianPage.tsx

import React, { useState } from "react";
import type { Supplier, PurchaseTransaction } from "../../../types/index";
import authenticatedAxios from "../../../utils/api";
import { API_BASE_URL } from "../../../apiConfig";

// Types
import type { 
  PembelianPageProps, 
  TransactionMode, 
  ViewMode,
  ExtendedCartItem,
  ListSelection,
  DraftPurchase
} from "../../../types/pembelian.types";

// Hooks
import { useProducts, useInvoiceNumber, useDraftPurchase } from "./hooks/index";

// Utils
import {
  getAvailableUnits,
  getPurchasePrice,
  getProductImage,
  createCartItem,
  updateCartItemUnit,
  updateCartItemQty,
  removeCartItem,
  sortCartByName,
  calculateSubTotal,
  mapCartItemsToProductPurchaseDetail,
} from "../../../utils/index";

// Components
import {
  PembelianHeader,
  ProductGrid,
  ProductList,
  PaginationFooter,
  MobileActionBar,
  CartSidebar,
  POModal,
  PaymentModal,
  PriceEditNumpad,
  QtyNumpad,
  ProductModal
} from "./components/index";
import ConfirmationDialog from "../../../components/ConfirmationDialog";
import { useToast } from "../../../components/Toast";
import LoadingOverlay from "../../../components/LoadingOverlay";
import type { Product, ProductVariant } from "../../../types/product.types";
// CartSidebar, ProductModal, PaymentModal, etc. - to be imported when created

const PembelianPage: React.FC<PembelianPageProps> = ({
  setIsSidebarOpen,
  formatRupiah,
}) => {
  // ===== TOAST NOTIFICATION =====
  const { showToast, ToastComponent } = useToast();

  // ===== LOADING STATE =====
  const [isSavingTransaction, setIsSavingTransaction] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // ===== UI STATE =====
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [transactionMode, setTransactionMode] = useState<TransactionMode>("TUNAI");
  const [viewMode, setViewMode] = useState<ViewMode>("LIST");
  const [searchQuery, setSearchQuery] = useState("");

  // ===== CUSTOM HOOKS =====
  const {
    products,
    isLoading,
    currentPage,
    totalItems,
    startIndex,
    endIndex,
    handlePageChange,
  } = useProducts(searchQuery);

  // ===== CART STATE =====
  const [cart, setCart] = useState<ExtendedCartItem[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [activeDraftSource, setActiveDraftSource] = useState<'purchases' | 'po-purchases' | null>(null);

  // ===== DRAFT STATE (dari Firestore) =====
  const { purchaseDrafts, poPurchaseDrafts } = useDraftPurchase();

  const {
    currentInvoiceNo,
    setCurrentInvoiceNo,
    currentPOInvoiceNo,
    setCurrentPOInvoiceNo,
    numberingConfig,
    generatePurchaseId,
    generatePOPurchaseId,
  } = useInvoiceNumber(activeDraftId);

  // ===== EDIT NOTE STATE =====
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteValue, setEditingNoteValue] = useState<string>("");

  // ===== EDIT PRICE STATE =====
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<string>("0");
  const [editingPriceTouched, setEditingPriceTouched] = useState<boolean>(false);

  // ===== PO MODAL STATE =====
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isDpNumpadOpen, setIsDpNumpadOpen] = useState(false);
  const [dpNumpadValue, setDpNumpadValue] = useState<string>("0");

  // ===== QTY NUMPAD STATE =====
  const [isQtyNumpadOpen, setIsQtyNumpadOpen] = useState(false);
  const [qtyNumpadItemId, setQtyNumpadItemId] = useState<number | null>(null);
  const [qtyNumpadIsPO, setQtyNumpadIsPO] = useState<boolean>(false);
  const [qtyNumpadValue, setQtyNumpadValue] = useState<string>("0");

  // ===== CONFIRMATION DIALOG STATE =====
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'warning' | 'danger' | 'info';
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: 'warning',
    onConfirm: () => {},
    confirmText: "OK",
    cancelText: "Batal",
  });

  // ===== PRODUCT MODAL STATE =====
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalQty, setModalQty] = useState(0);
  const [modalUnit, setModalUnit] = useState("");
  const [modalVariant, setModalVariant] = useState<ProductVariant | null>(null);
  const [modalNote, setModalNote] = useState("");


  // ===== SUPPLIER STATE =====
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // ===== PAYMENT STATE =====
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [jatuhTempoDate, setJatuhTempoDate] = useState("");
  const [dpAmount, setDpAmount] = useState(0);

  // ===== LIST VIEW SELECTIONS =====
  const [listSelections, setListSelections] = useState<
    Record<string, ListSelection>
  >({});

  // ===== HANDLERS =====
  const handleProductClick = (product: Product) => {
    if (product.variants.length === 0) return;
    
    setSelectedProduct(product);
    setModalQty(1);
    
    const firstVariant = product.variants[0];
    const availableUnits = getAvailableUnits(firstVariant);
    
    setModalUnit(availableUnits.length > 0 ? availableUnits[0] : "");
    setModalVariant(firstVariant);
    setModalNote("");
  };

  const handleAddToListCart = (product: Product) => {
    if (product.variants.length === 0) return;

    const selection = listSelections[product.id] || {
      variant: "",
      unit: "",
      qty: 1,
      note: "",
    };

    const selectedVariantName = selection.variant || product.variants[0].name;
    const selectedVariant =
      product.variants.find((v) => v.name === selectedVariantName) ||
      product.variants[0];

    const availableUnits = getAvailableUnits(selectedVariant);
    if (availableUnits.length === 0) return;

    const finalUnitName = selection.unit || availableUnits[0];
    const finalPrice = getPurchasePrice(selectedVariant, finalUnitName);
    const productImage = getProductImage(product.image);

    const newItem = createCartItem(
      product.id,
      product.name,
      productImage,
      selectedVariantName,
      finalUnitName,
      finalPrice,
      0, // qty
      0, // qtyPO
      selection.note || ""
    );

    setCart([...cart, newItem]);
    
    // Reset note after adding
    setListSelections((prev) => ({
      ...prev,
      [product.id]: { ...prev[product.id], note: "" },
    }));
  };

  const handleSaveToCart = () => {
    if (!selectedProduct || !modalVariant) return;
    
    const availableUnits = getAvailableUnits(modalVariant);
    if (availableUnits.length === 0) return;

    const finalUnit = modalUnit || availableUnits[0];
    const finalPrice = getPurchasePrice(modalVariant, finalUnit);
    const productImage = getProductImage(selectedProduct.image);

    const newItem = createCartItem(
      selectedProduct.id,
      selectedProduct.name,
      productImage,
      modalVariant.name,
      finalUnit,
      finalPrice,
      modalQty,
      0,
      modalNote
    );

    setCart([...cart, newItem]);
    setSelectedProduct(null);
    setModalVariant(null);
  };

  const handleUpdateListSelection = (
    productId: string,
    field: keyof ListSelection,
    value: any
  ) => {
    setListSelections((prev) => {
      const current = prev[productId] || {
        variant: "",
        unit: "",
        qty: 1,
        note: "",
      };
      return { ...prev, [productId]: { ...current, [field]: value } };
    });
  };

  const handleCartUnitChange = (
    cartItemId: number,
    productId: string,
    newUnitName: string,
    variantName: string
  ) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const variant = product.variants.find((v: ProductVariant) => v.name === variantName);
    if (!variant) return;

    const newPrice = getPurchasePrice(variant, newUnitName);
    setCart(updateCartItemUnit(cart, cartItemId, newUnitName, newPrice));
  };

  const handleChangeQty = (id: number, newQty: number, isPO: boolean = false) =>{
    setCart(updateCartItemQty(cart, id, 0, isPO, newQty));
  }

  const handleIncrementQty = (id: number, isPO: boolean = false) => {
    setCart(updateCartItemQty(cart, id, 1, isPO));
  };

  const handleDecrementQty = (id: number, isPO: boolean = false) => {
    setCart(updateCartItemQty(cart, id, -1, isPO));
  };

  const handleRemoveItem = (id: number) => {
    const newCart = removeCartItem(cart, id);
    setCart(newCart);
    if (newCart.length === 0) setActiveDraftId(null);
  };

  // ===== DRAFT LOGIC =====
  const handleSaveDraft = async () => {
    if (cart.length === 0) return;

    setIsSavingDraft(true);
    try {
      const isKredit = transactionMode === 'KREDIT';
      const endpoint = isKredit ? '/api/po-purchases' : '/api/purchases';
      const invoiceNo = isKredit
        ? (currentPOInvoiceNo || generatePOPurchaseId())
        : (currentInvoiceNo || generatePurchaseId());

      const productDetails = mapCartItemsToProductPurchaseDetail(cart, products);

      const draftData = {
        id: invoiceNo,
        supplierId: selectedSupplier?.id || '',
        supplierName: selectedSupplier?.name || '',
        productDetail: productDetails,
        status: 'Draft',
        isDeleted: false,
        subTotal,
        transactionMode,
        isPO: isKredit,
      };

      const isNewDraft = activeDraftId === null;

      if (!isNewDraft) {
        // Update draft yang sudah ada (invoiceNo sudah ada di transactions list)
        await authenticatedAxios.put(`${API_BASE_URL}${endpoint}/update`, { ...draftData, id: activeDraftId });
      } else {
        // Buat draft baru
        await authenticatedAxios.post(`${API_BASE_URL}${endpoint}`, draftData);
      }

      // Generate nomor invoice baru langsung tanpa menunggu Firestore onSnapshot
      // - draft baru: pass invoiceNo sebagai additionalTaken (belum ada di transactions list)
      // - draft existing: invoiceNo sudah ada di list, generate normal
      if (isKredit) {
        setCurrentPOInvoiceNo(generatePOPurchaseId(isNewDraft ? invoiceNo : undefined));
      } else {
        setCurrentInvoiceNo(generatePurchaseId(isNewDraft ? invoiceNo : undefined));
      }

      setCart([]);
      setActiveDraftId(null);
      setActiveDraftSource(null);
      setSelectedSupplier(null);
      showToast('Draft Pembelian tersimpan.', 'success');
    } catch (error: any) {
      console.error("Error saving draft:", error);
      showToast(error.response?.data?.message || "Gagal menyimpan draft. Silakan coba lagi.", 'error');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleRestoreDraft = (draft: DraftPurchase) => {
    // Konversi productDetail → ExtendedCartItem[]
    const cartItems: ExtendedCartItem[] = draft.productDetail.map((detail) => ({
      id: Date.now() + Math.random(),
      productId: detail.productId,
      name: detail.productName,
      price: detail.purchasePrice,
      image: '',
      qty: detail.qty,
      qtyPO: 0,
      unit: detail.unitName,
      size: detail.variantName,
      note: '',
    }));

    setCart(cartItems);
    setActiveDraftId(draft.id);
    setActiveDraftSource(draft._sourceCollection);

    // Restore transaction mode dari draft
    if (draft._sourceCollection === 'po-purchases' || draft.transactionMode === 'KREDIT') {
      setTransactionMode('KREDIT');
      setCurrentPOInvoiceNo(draft.id);
    } else {
      setTransactionMode('TUNAI');
      setCurrentInvoiceNo(draft.id);
    }

    // Restore supplier dari draft
    if (draft.supplierId) {
      setSelectedSupplier({
        id: draft.supplierId,
        name: draft.supplierName || '',
        phone: '',
        email: '',
        address: '',
      });
    } else {
      setSelectedSupplier(null);
    }
  };

  const handleDeleteDraft = (e: React.MouseEvent, id: string, draft?: DraftPurchase) => {
    e.stopPropagation();
    const source = draft?._sourceCollection || 'purchases';
    const endpoint = source === 'po-purchases' ? '/api/po-purchases' : '/api/purchases';

    showConfirmation(
      "Hapus Draft",
      "Apakah Anda yakin ingin menghapus draft ini?",
      async () => {
        try {
          await authenticatedAxios.delete(`${API_BASE_URL}${endpoint}/delete`, { data: { id } });
          if (activeDraftId === id) {
            setActiveDraftId(null);
            setActiveDraftSource(null);
            setCurrentInvoiceNo("");
          }
          showToast('Draft berhasil dihapus.', 'success');
        } catch (error: any) {
          console.error('Error deleting draft:', error);
          showToast(error.response?.data?.message || 'Gagal menghapus draft.', 'error');
        }
      },
      'danger',
      'Ya, Hapus',
      'Batal'
    );
  };

  // ===== HANDLERS: CANCEL DRAFT SELECTION =====
  const handleCancelDraft = () => {
    setCart([]);
    setActiveDraftId(null);
    setActiveDraftSource(null);
    setSelectedSupplier(null);
    setCurrentInvoiceNo("");
    setCurrentPOInvoiceNo("");
  };

  // ===== HANDLERS: TRANSACTION MODE CHANGE =====
  const handleTransactionModeChange = (mode: TransactionMode) => {
    if (mode === transactionMode) return;
    if (cart.length > 0) {
      showConfirmation(
        'Ganti Mode Transaksi',
        `Mengganti mode ke ${mode === 'KREDIT' ? 'Pembelian Kredit (PO)' : 'Pembelian Tunai'} akan mengosongkan keranjang. Lanjutkan?`,
        () => {
          setCart([]);
          // Hanya reset invoice number jika ada draft aktif yang dibatalkan
          // agar effect auto-generate di hook bisa re-run dengan benar
          if (activeDraftId !== null) {
            setCurrentInvoiceNo("");
            setCurrentPOInvoiceNo("");
          }
          setActiveDraftId(null);
          setActiveDraftSource(null);
          setSelectedSupplier(null);
          setTransactionMode(mode);
        },
        'warning',
        'Ya, Ganti',
        'Batal'
      );
    } else {
      // Hanya reset invoice number jika ada draft aktif yang dibatalkan
      if (activeDraftId !== null) {
        setCurrentInvoiceNo("");
        setCurrentPOInvoiceNo("");
      }
      setActiveDraftId(null);
      setActiveDraftSource(null);
      setSelectedSupplier(null);
      setTransactionMode(mode);
    }
  };

  // ===== EDIT NOTE LOGIC =====
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

  // ===== EDIT PRICE LOGIC =====
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

  // ===== PO MODAL LOGIC =====
  const handleOpenFakturKredit = () => {
    if (cart.length === 0) {
      showInfo("Peringatan", "Keranjang masih kosong!");
      return;
    }
    
    if (!selectedSupplier) {
      showInfo("Peringatan", "Mohon pilih supplier terlebih dahulu sebelum mencetak faktur!");
      return;
    }
    
    // Generate invoice number baru hanya jika bukan dari draft
    if (!activeDraftId && numberingConfig) {
      setCurrentPOInvoiceNo(generatePOPurchaseId());
    }

    setJatuhTempoDate(""); 
    setDpAmount(0);
    setIsPOModalOpen(true);
  };

  const handleFinalizeCredit = async () => {
    try {
      if (!jatuhTempoDate) {
        showInfo("Peringatan", "Harap isi Tanggal Jatuh Tempo!");
        return;
      }
      
      // Validasi supplier
      if (!selectedSupplier) {
        showInfo("Peringatan", "Mohon pilih supplier terlebih dahulu!");
        return;
      }

      // Validasi invoice number sudah ada
      if (!currentPOInvoiceNo) {
        showInfo("Peringatan", "Invoice number PO belum di-generate. Silakan tunggu sebentar dan coba lagi.");
        return;
      }

      setIsSavingTransaction(true);

      // Map cart items ke ProductPurchaseDetail
      const productDetails = mapCartItemsToProductPurchaseDetail(
        cart,
        products
      );

      // Format data sesuai PurchaseTransaction type untuk KREDIT (PO)
      const purchaseTransaction: PurchaseTransaction = {
        id: currentPOInvoiceNo,
        supplierId: selectedSupplier.id,
        supplierName: selectedSupplier.name,
        productDetail: productDetails,
        isHutang: true,
        deadlineDate: new Date(jatuhTempoDate),
        dp: dpAmount, // DP untuk PO/KREDIT
        paymentMethod: 'TUNAI', // Default untuk PO
        paymentValue: dpAmount,
        remainingPayment: subTotal - dpAmount,
        isPO: true,
        status: 'belum selesai', // Status awal PO: menunggu penerimaan barang
      };

      // POST atau PUT ke backend berdasarkan apakah ini dari draft
      if (activeDraftId !== null) {
        // Dari draft KREDIT → update ke Final
        await authenticatedAxios.put(`${API_BASE_URL}/api/po-purchases/update`, purchaseTransaction);
      } else {
        await authenticatedAxios.post(`${API_BASE_URL}/api/po-purchases`, purchaseTransaction);
      }
    
      const savedInvoiceNo = currentPOInvoiceNo; // Simpan invoice number yang digunakan
      const isNewPOTransaction = activeDraftId === null;

      setIsPOModalOpen(false);
      setCart([]);
      setPaymentAmount(0);
      setSelectedPaymentMethod("");
      setActiveDraftId(null);
      setActiveDraftSource(null);
      setJatuhTempoDate("");
      setSelectedSupplier(null);
      setDpAmount(0);

      // Generate nomor PO baru langsung tanpa menunggu Firestore onSnapshot
      setCurrentPOInvoiceNo(generatePOPurchaseId(isNewPOTransaction ? savedInvoiceNo : undefined));

      showToast(
        `Pembelian PO (KREDIT) berhasil dicatat! ID: ${savedInvoiceNo}`,
        'success'
      );
    } catch (error: any) {
      console.error("Error saving purchase transaction (KREDIT):", error);
      showToast(
        error.response?.data?.message || "Gagal menyimpan transaksi pembelian PO. Silakan coba lagi.",
        'error'
      );
    } finally {
      setIsSavingTransaction(false);
    }
  };

  // ===== DP NUMPAD LOGIC =====
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
      showInfo("Peringatan", "DP tidak boleh melebihi total tagihan!");
      return;
    }
    setDpAmount(newDp);
    setIsDpNumpadOpen(false);
  };

  // ===== QTY NUMPAD LOGIC =====
  const openQtyNumpad = (itemId: number, isPO: boolean) => {
    const item = cart.find(i => i.id === itemId);
    if (!item) return;
    
    const currentQty = isPO ? (item.qtyPO || 0) : item.qty;
    setQtyNumpadValue(String(currentQty));
    setQtyNumpadItemId(itemId);
    setQtyNumpadIsPO(isPO);
    setIsQtyNumpadOpen(true);
  };

  const appendQtyDigit = (digit: string) => {
    setQtyNumpadValue(prev => {
      if (prev === "0") return digit;
      return prev + digit;
    });
  };

  const backspaceQtyDigit = () => {
    setQtyNumpadValue(prev => {
      const next = prev.slice(0, -1);
      return next === "" ? "0" : next;
    });
  };

  const clearQtyDigits = () => {
    setQtyNumpadValue("0");
  };

  const confirmQtyNumpad = () => {
    if (qtyNumpadItemId !== null) {
      const newQty = Math.max(0, parseInt(qtyNumpadValue || "0", 10));
      handleChangeQty(qtyNumpadItemId, newQty, qtyNumpadIsPO);
    }
    setIsQtyNumpadOpen(false);
    setQtyNumpadItemId(null);
    setQtyNumpadValue("0");
  };

  const cancelQtyNumpad = () => {
    setIsQtyNumpadOpen(false);
    setQtyNumpadItemId(null);
    setQtyNumpadValue("0");
  };

  // ===== HELPER FUNCTION FOR CONFIRMATION DIALOG =====
  const showConfirmation = (
    title: string,
    message: string,
    onConfirm: () => void,
    type: 'warning' | 'danger' | 'info' = 'warning',
    confirmText?: string,
    cancelText?: string
  ) => {
    setConfirmationDialog({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: () => {
        setConfirmationDialog(prev => ({ ...prev, isOpen: false }));
        onConfirm();
      },
      confirmText,
      cancelText,
    });
  };

  const showInfo = (title: string, message: string) => {
    showConfirmation(
      title,
      message,
      () => {},
      'info',
      'OK',
      ''
    );
  };

  const handleFinishTransaction = async () => {
    try {
      if (!selectedSupplier) {
        showInfo("Peringatan", "Mohon pilih supplier terlebih dahulu!");
        return;
      }

      if (!currentInvoiceNo) {
        showInfo("Peringatan", "Invoice number belum di-generate.");
        return;
      }

      setIsSavingTransaction(true);

      const productDetails = mapCartItemsToProductPurchaseDetail(
        cart,
        products
      );

      const purchaseTransaction: PurchaseTransaction = {
        id: currentInvoiceNo,
        supplierId: selectedSupplier.id,
        supplierName: selectedSupplier.name,
        productDetail: productDetails,
        isHutang: selectedPaymentMethod === "HUTANG",
        deadlineDate:
          selectedPaymentMethod === "HUTANG" && jatuhTempoDate
            ? new Date(jatuhTempoDate)
            : undefined,
        dp: selectedPaymentMethod === "HUTANG" ? dpAmount : 0,
        paymentMethod:
          selectedPaymentMethod === "TRANSFER" ? "Transfer" : "TUNAI",
        paymentValue:
          selectedPaymentMethod === "HUTANG" ? dpAmount : paymentAmount,
        remainingPayment:
          selectedPaymentMethod === "HUTANG"
            ? calculateSubTotal(cart) - dpAmount
            : 0,
        isPO: false,
      };

      // POST atau PUT ke backend berdasarkan apakah ini dari draft TUNAI
      if (activeDraftId !== null) {
        // Dari draft TUNAI → update ke Final
        await authenticatedAxios.put(`${API_BASE_URL}/api/purchases/update`, purchaseTransaction);
      } else {
        await authenticatedAxios.post(`${API_BASE_URL}/api/purchases`, purchaseTransaction);
      }

      const savedInvoiceNo = currentInvoiceNo; // Simpan invoice number sebelum reset
      const isNewTransaction = activeDraftId === null;

      // Reset state
      setCart([]);
      setPaymentAmount(0);
      setSelectedPaymentMethod("");
      setActiveDraftId(null);
      setActiveDraftSource(null);
      setJatuhTempoDate("");
      setSelectedSupplier(null);
      setDpAmount(0);

      // Generate nomor baru langsung tanpa menunggu Firestore onSnapshot
      setCurrentInvoiceNo(generatePurchaseId(isNewTransaction ? savedInvoiceNo : undefined));

      // Show success toast
      showToast(`Transaksi berhasil! ID: ${savedInvoiceNo}`, 'success');
    } catch (error: any) {
      console.error("Error saving transaction:", error);
      showToast(
        error.response?.data?.message ||
          "Gagal menyimpan transaksi. Silakan coba lagi.",
        'error'
      );
    } finally {
      setIsSavingTransaction(false);
    }
  };

  // ===== CALCULATED VALUES =====
  const subTotal = calculateSubTotal(cart);

  // ===== RENDER =====
  return (
    <div className="flex flex-col lg:flex-row h-full w-full overflow-hidden 
                    relative bg-gray-50">
      {/* MAIN AREA - PRODUCT LIST/GRID */}
      <div className={`w-full lg:flex-1 flex flex-col h-full 
                       border-r border-gray-300 relative z-0 
                       transition-all ${
                         isMobileCartOpen ? "hidden lg:flex" : "flex"
                       }`}>
        
        <PembelianHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 pb-20 lg:pb-4">
          {viewMode === "GRID" ? (
            <ProductGrid
              products={products}
              isLoading={isLoading}
              onProductClick={handleProductClick}
              formatRupiah={formatRupiah}
            />
          ) : (
            <ProductList
              products={products}
              isLoading={isLoading}
              listSelections={listSelections}
              onUpdateSelection={handleUpdateListSelection}
              onAddToCart={handleAddToListCart}
              formatRupiah={formatRupiah}
            />
          )}
        </div>

        {/* Pagination Footer Component */}
        <PaginationFooter
          startIndex={startIndex}
          endIndex={endIndex}
          totalItems={totalItems}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />

        {/* Mobile Floating Action Bar */}
        <MobileActionBar
          subTotal={subTotal}
          cartCount={cart.length}
          onOpenCart={() => setIsMobileCartOpen(true)}
          formatRupiah={formatRupiah}
        />
      </div>

      {/* SIDEBAR - CART */}
      <CartSidebar
        cart={sortCartByName(cart)}
        transactionMode={transactionMode}
        onTransactionModeChange={handleTransactionModeChange}
        selectedSupplier={selectedSupplier}
        onSelectSupplier={setSelectedSupplier}
        currentInvoiceNo={transactionMode === 'KREDIT' ? currentPOInvoiceNo : currentInvoiceNo}
        subTotal={subTotal}
        onIncrementQty={handleIncrementQty}
        onDecrementQty={handleDecrementQty}
        onRemoveItem={handleRemoveItem}
        onCartUnitChange={handleCartUnitChange}
        onOpenPayment={() => {
          if (cart.length === 0) {
            showInfo("Peringatan", "Keranjang masih kosong!");
            return;
          }
          if (!selectedSupplier) {
            showInfo("Peringatan", "Mohon pilih supplier terlebih dahulu sebelum melakukan pembayaran!");
            return;
          }
          
          // Generate invoice number baru hanya jika bukan dari draft
          if (!activeDraftId && numberingConfig) {
            setCurrentInvoiceNo(generatePurchaseId());
          }

          setIsPaymentModalOpen(true);
        }}
        formatRupiah={formatRupiah}
        isMobileOpen={isMobileCartOpen}
        onCloseMobile={() => setIsMobileCartOpen(false)}
        onOpenFakturKredit={handleOpenFakturKredit}
        onSaveDraft={handleSaveDraft}
        onStartEditNote={startEditNote}
        onStartEditPrice={startEditPrice}
        products={products}
        draftTransactions={transactionMode === 'KREDIT' ? poPurchaseDrafts : purchaseDrafts}
        activeDraftId={activeDraftId}
        onRestoreDraft={handleRestoreDraft}
        onDeleteDraft={handleDeleteDraft}
        onCancelDraft={handleCancelDraft}
        editingNoteId={editingNoteId}
        editingNoteValue={editingNoteValue}
        onSaveEditNote={saveEditNote}
        onCancelEditNote={cancelEditNote}
        onEditNoteChange={setEditingNoteValue}
        onOpenQtyNumpad={openQtyNumpad}
      />

      {/* MODALS */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          modalQty={modalQty}
          setModalQty={setModalQty}
          modalUnit={modalUnit}
          setModalUnit={setModalUnit}
          modalVariant={modalVariant}
          setModalVariant={setModalVariant}
          modalNote={modalNote}
          setModalNote={setModalNote}
          onClose={() => setSelectedProduct(null)}
          onSave={handleSaveToCart}
          formatRupiah={formatRupiah}
        />
      )}

      {isPaymentModalOpen && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          cart={cart}
          subTotal={subTotal}
          transactionMode={transactionMode}
          selectedSupplier={selectedSupplier}
          currentInvoiceNo={currentInvoiceNo}
          paymentAmount={paymentAmount}
          setPaymentAmount={setPaymentAmount}
          selectedPaymentMethod={selectedPaymentMethod}
          setSelectedPaymentMethod={setSelectedPaymentMethod}
          jatuhTempoDate={jatuhTempoDate}
          setJatuhTempoDate={setJatuhTempoDate}
          dpAmount={dpAmount}
          setDpAmount={setDpAmount}
          onClose={() => setIsPaymentModalOpen(false)}
          onProcessPayment={handleFinishTransaction}
          formatRupiah={formatRupiah}
        />
      )}

      {/* PO MODAL */}
      {isPOModalOpen && (
        <POModal
          isOpen={isPOModalOpen}
          jatuhTempoDate={jatuhTempoDate}
          onJatuhTempoDateChange={setJatuhTempoDate}
          dpAmount={dpAmount}
          subTotal={subTotal}
          onOpenDpNumpad={openDpNumpad}
          onConfirm={handleFinalizeCredit}
          onCancel={() => setIsPOModalOpen(false)}
          formatRupiah={formatRupiah}
        />
      )}

      {/* DP NUMPAD (dalam PO Modal) - Fixed overlay dengan z-index lebih tinggi */}
      {isPOModalOpen && isDpNumpadOpen && (
        <div className="fixed inset-0 z-110 bg-white p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Input Down Payment (DP)</h3>
            <button
              onClick={() => setIsDpNumpadOpen(false)}
              className="text-red-500 font-bold"
            >
              Batal
            </button>
          </div>
          <div className="bg-gray-100 p-4 text-right text-3xl font-bold mb-4 rounded">
            {formatRupiah(parseInt(dpNumpadValue))}
          </div>
          <div className="mb-2 text-sm text-gray-600">
            Total Tagihan: {formatRupiah(subTotal)}
          </div>
          <div className="grid grid-cols-3 gap-3 flex-1">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
              <button
                key={d}
                onClick={() => appendDpDigit(d)}
                className="bg-white border border-gray-300 text-2xl font-bold rounded shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                {d}
              </button>
            ))}
            <button
              onClick={backspaceDpDigit}
              className="bg-red-50 border border-red-200 text-2xl font-bold rounded text-red-500 hover:bg-red-100 active:bg-red-200 transition-colors"
            >
              ⌫
            </button>
            <button
              onClick={() => appendDpDigit("0")}
              className="bg-white border border-gray-300 text-2xl font-bold rounded hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              0
            </button>
            <button
              onClick={confirmDpNumpad}
              className="bg-green-500 text-white text-2xl font-bold rounded hover:bg-green-600 active:bg-green-700 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* PRICE EDIT NUMPAD */}
      {editingPriceId !== null && (
        <PriceEditNumpad
          isOpen={editingPriceId !== null}
          currentValue={editingPriceValue}
          onAppendDigit={appendDigit}
          onBackspace={backspaceDigit}
          onClear={clearDigits}
          onConfirm={confirmEditPrice}
          onCancel={cancelEditPrice}
          formatRupiah={formatRupiah}
        />
      )}

      {/* QTY NUMPAD */}
      {isQtyNumpadOpen && (
        <QtyNumpad
          isOpen={isQtyNumpadOpen}
          currentValue={qtyNumpadValue}
          label={qtyNumpadIsPO ? "Input Qty PO" : "Input Qty Fisik"}
          onAppendDigit={appendQtyDigit}
          onBackspace={backspaceQtyDigit}
          onClear={clearQtyDigits}
          onConfirm={confirmQtyNumpad}
          onCancel={cancelQtyNumpad}
        />
      )}

      {/* CONFIRMATION DIALOG */}
      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        title={confirmationDialog.title}
        message={confirmationDialog.message}
        type={confirmationDialog.type}
        confirmText={confirmationDialog.confirmText}
        cancelText={confirmationDialog.cancelText}
        onConfirm={confirmationDialog.onConfirm}
        onCancel={() => setConfirmationDialog(prev => ({ ...prev, isOpen: false }))}
      />

      {/* TOAST NOTIFICATION */}
      <ToastComponent />

      {/* LOADING OVERLAY */}
      <LoadingOverlay 
        show={isSavingTransaction || isSavingDraft} 
        message={isSavingTransaction ? "Menyimpan transaksi..." : "Menyimpan draft..."}
      />
    </div>
  );
};

export default PembelianPage;