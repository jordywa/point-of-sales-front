// src/pages/Transaction/KasirPage.tsx

import React, { useState, useMemo } from 'react';
import ConfirmationDialog from '../../../components/ConfirmationDialog';
import { useToast } from '../../../components/Toast';
import type { CartItem, Customer, SalesTransaction, POSalesTransaction } from '../../../types/index';
import authenticatedAxios from '../../../utils/api';
import { API_BASE_URL } from '../../../apiConfig';
import { useAuth } from '../../../context/AuthContext';

// Hooks
import { useProductsSales, useInvoiceNumberSales, useDraftSales } from './hooks/index';
import type { DraftTransaction } from './hooks/useDraftSales';

// Components
import {
  KasirHeader,
  ProductGrid,
  ProductList,
  PaginationFooter,
  MobileActionBar,
  CartSidebar,
  ProductModal,
  PaymentModal,
  SuccessModal,
  POModal,
  PriceEditNumpad,
  DpNumpad,
} from './components/index';

// Utils
import {
  convertInventoryItemToProductDisplay,
  mapCartItemsToProductSalesDetail,
  type ProductDisplay,
} from '../../../utils/salesHelpers';

// ===== TYPES =====
interface ExtendedCartItem extends CartItem {
  qtyPO?: number;
}

interface KasirPageProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
  formatRupiah: (num: number) => string;
}

const KasirPage: React.FC<KasirPageProps> = ({ setIsSidebarOpen, formatRupiah }) => {
  // ===== TOAST NOTIFICATION =====
  const { showToast, ToastComponent } = useToast();

  // ===== AUTH =====
  const { user } = useAuth();

  // ===== LOADING STATE =====
  const [isSavingTransaction, setIsSavingTransaction] = useState(false);

  // ===== UI STATE =====
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [transactionMode, setTransactionMode] = useState<'SALES' | 'PO'>('SALES');
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('LIST');
  const [searchQuery, setSearchQuery] = useState('');

  // ===== CUSTOM HOOKS =====
  const {
    products: inventoryProducts,
    currentProducts: currentInventoryProducts,
    isLoading,
    currentPage,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    handlePageChange,
  } = useProductsSales(searchQuery);

  // Convert InventoryItem → ProductDisplay
  const products = useMemo(() => {
    return inventoryProducts
      .map(convertInventoryItemToProductDisplay)
      .filter((p): p is ProductDisplay => p !== null);
  }, [inventoryProducts]);

  const currentProducts = useMemo(() => {
    return currentInventoryProducts
      .map(convertInventoryItemToProductDisplay)
      .filter((p): p is ProductDisplay => p !== null);
  }, [currentInventoryProducts]);

  // ===== CART STATE =====
  const [cart, setCart] = useState<ExtendedCartItem[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [activeDraftType, setActiveDraftType] = useState<'sales' | 'po-sales' | null>(null);

  // ===== DRAFT STATE (fetched from Firestore) =====
  const { draftTransactions } = useDraftSales();

  // Filter draft sesuai mode yang aktif saat ini
  const filteredDraftTransactions = draftTransactions.filter(d =>
    transactionMode === 'PO'
      ? d._sourceCollection === 'po-sales'
      : d._sourceCollection === 'sales'
  );

  const {
    currentInvoiceNo,
    setCurrentInvoiceNo,
    recycledInvoiceNumbers,
    setRecycledInvoiceNumbers,
    generateSalesId,
    currentPOInvoiceNo,
    setCurrentPOInvoiceNo,
    recycledPOInvoiceNumbers,
    setRecycledPOInvoiceNumbers,
    generatePOSalesId,
    numberingConfig,
  } = useInvoiceNumberSales(activeDraftId);

  // ===== CUSTOMER STATE =====
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // ===== PRODUCT MODAL STATE =====
  const [selectedProduct, setSelectedProduct] = useState<ProductDisplay | null>(null);
  const [modalQty, setModalQty] = useState(0);
  const [modalUnit, setModalUnit] = useState('');
  const [modalSize, setModalSize] = useState('');
  const [modalNote, setModalNote] = useState('');

  // ===== LIST VIEW SELECTIONS =====
  const [listSelections, setListSelections] = useState<
    Record<string, { variant: string; unit: string; qty: number; note: string }>
  >({});

  // ===== EDIT PRICE STATE =====
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<string>('0');
  const [editingPriceTouched, setEditingPriceTouched] = useState<boolean>(false);

  // ===== EDIT NOTE STATE =====
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteValue, setEditingNoteValue] = useState<string>('');

  // ===== PAYMENT STATE =====
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [isPaymentNumpadOpen, setIsPaymentNumpadOpen] = useState(false);
  const [paymentNumpadValue, setPaymentNumpadValue] = useState('0');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');

  // ===== PO / KREDIT STATE =====
  const [jatuhTempoDate, setJatuhTempoDate] = useState('');
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [dpAmount, setDpAmount] = useState(0);
  const [isDpNumpadOpen, setIsDpNumpadOpen] = useState(false);
  const [dpNumpadValue, setDpNumpadValue] = useState('0');

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
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {},
    confirmText: 'OK',
    cancelText: 'Batal',
  });

  // ===== CALCULATED VALUES =====
  const subTotal = cart.reduce((acc, item) => {
    const totalQtyItem = item.qty + (item.qtyPO || 0);
    return acc + item.price * totalQtyItem;
  }, 0);

  const isHutang = selectedPaymentMethod === 'HUTANG';
  const sisaTagihan = isHutang ? 0 : Math.max(0, subTotal - paymentAmount);
  const kembalian = isHutang ? 0 : Math.max(0, paymentAmount - subTotal);

  // ===== HELPER: CONFIRMATION DIALOG =====
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

  // ===== HANDLERS: TRANSACTION MODE CHANGE =====
  const handleTransactionModeChange = (mode: 'SALES' | 'PO') => {
    if (mode === transactionMode) return;
    if (cart.length > 0) {
      showConfirmation(
        'Ganti Mode Transaksi',
        `Mengganti mode ke ${mode === 'PO' ? 'Penjualan Kredit (PO)' : 'Penjualan Biasa'} akan mengosongkan keranjang. Lanjutkan?`,
        () => {
          setCart([]);
          setActiveDraftId(null);
          setActiveDraftType(null);
          setSelectedCustomer(null);
          setTransactionMode(mode);
        },
        'warning',
        'Ya, Ganti',
        'Batal'
      );
    } else {
      setActiveDraftId(null);
      setActiveDraftType(null);
      setSelectedCustomer(null);
      setTransactionMode(mode);
    }
  };

  // ===== HANDLERS: PRODUCT MODAL (GRID VIEW) =====
  const handleProductClick = (product: ProductDisplay) => {
    setSelectedProduct(product);
    setModalQty(0);
    setModalUnit(product.availableUnits[0].name);
    setModalSize(product.variants[0]);
    setModalNote('');
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
      note: modalNote,
    };
    setCart([...cart, newItem]);
    setSelectedProduct(null);
  };

  // ===== HANDLERS: LIST VIEW =====
  const getListSelection = (productId: string) => {
    return listSelections[productId] || { variant: '', unit: '', qty: 1, note: '' };
  };

  const updateListSelection = (productId: string, field: string, value: any) => {
    setListSelections(prev => {
      const current = prev[productId] || { variant: '', unit: '', qty: 1, note: '' };
      return { ...prev, [productId]: { ...current, [field]: value } };
    });
  };

  const handleAddToListCart = (product: ProductDisplay) => {
    const selection = getListSelection(product.id);
    const finalUnitName = selection.unit || product.availableUnits[0].name;
    const unitObj = product.availableUnits.find(u => u.name === finalUnitName) || product.availableUnits[0];
    const finalPrice = product.basePrice * unitObj.priceMultiplier;

    const newItem: ExtendedCartItem = {
      id: Date.now() + Math.random(),
      productId: product.id,
      name: product.name,
      price: finalPrice,
      image: product.image,
      qty: 0,
      qtyPO: 0,
      unit: finalUnitName,
      size: selection.variant || product.variants[0],
      note: selection.note || '',
    };
    setCart([...cart, newItem]);
    updateListSelection(product.id, 'note', '');
  };

  // ===== HANDLERS: CART UNIT CHANGE =====
  const handleCartUnitChange = (cartItemId: number, productId: string, newUnitName: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const newUnitObj = product.availableUnits.find(u => u.name === newUnitName);
    if (!newUnitObj) return;
    const newPrice = product.basePrice * newUnitObj.priceMultiplier;
    setCart(prev =>
      prev.map(item => item.id === cartItemId ? { ...item, unit: newUnitName, price: newPrice } : item)
    );
  };

  // ===== HANDLERS: EDIT NOTE =====
  const startEditNote = (item: ExtendedCartItem) => {
    setEditingNoteId(item.id);
    setEditingNoteValue(item.note || '');
  };

  const saveEditNote = (id: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, note: editingNoteValue } : item));
    setEditingNoteId(null);
    setEditingNoteValue('');
  };

  const cancelEditNote = () => {
    setEditingNoteId(null);
    setEditingNoteValue('');
  };

  // ===== HANDLERS: EDIT PRICE =====
  const startEditPrice = (id: number, price: number) => {
    setEditingPriceId(id);
    setEditingPriceValue(String(price));
    setEditingPriceTouched(false);
  };

  const appendDigit = (digit: string) => {
    setEditingPriceValue(prev => {
      if (!editingPriceTouched) { setEditingPriceTouched(true); return digit; }
      if (prev === '0') return digit;
      return prev + digit;
    });
  };

  const backspaceDigit = () => {
    setEditingPriceValue(prev => {
      const next = prev.slice(0, -1);
      setEditingPriceTouched(true);
      return next === '' ? '0' : next;
    });
  };

  const clearDigits = () => {
    setEditingPriceValue('0');
    setEditingPriceTouched(true);
  };

  const confirmEditPrice = () => {
    const newPrice = Math.max(0, parseInt(editingPriceValue || '0', 10));
    if (editingPriceId !== null) {
      setCart(prev => prev.map(it => it.id === editingPriceId ? { ...it, price: newPrice } : it));
    }
    setEditingPriceId(null);
    setEditingPriceValue('0');
    setEditingPriceTouched(false);
  };

  const cancelEditPrice = () => {
    setEditingPriceId(null);
    setEditingPriceValue('0');
    setEditingPriceTouched(false);
  };

  // ===== HANDLERS: QTY =====
  const incrementQty = (id: number) => {
    setCart(prev => prev.map(it => it.id === id ? { ...it, qty: it.qty + 1 } : it));
  };

  const decrementQty = (id: number) => {
    const item = cart.find(it => it.id === id);
    if (!item) return;
    // Di PO mode: izinkan qty fisik turun ke 0 tanpa hapus item
    // (validasi qty+qtyPO >= 1 dilakukan saat Cetak Faktur)
    if (transactionMode === 'PO') {
      if (item.qty <= 0) return;
      setCart(prev => prev.map(it => it.id === id ? { ...it, qty: it.qty - 1 } : it));
      return;
    }
    // Di SALES mode: hapus item jika qty akan jadi 0 dan tidak ada qtyPO
    if (item.qty === 1 && (item.qtyPO || 0) === 0) {
      setConfirmationDialog({
        title: 'Konfirmasi Hapus',
        message: `Qty akan menjadi 0. Produk "${item.name}" akan dihapus dari list. Lanjutkan?`,
        onConfirm: () => {
          const newCart = cart.filter(it => it.id !== id);
          setCart(newCart);
          if (newCart.length === 0) setActiveDraftId(null);
          setConfirmationDialog(prev => ({ ...prev, isOpen: false }));
        },
        isOpen: true,
        type: 'warning',
        confirmText: 'Ya',
      });
      return;
    }
    setCart(prev => prev.map(it => it.id === id ? { ...it, qty: Math.max(0, it.qty - 1) } : it));
  };

  const incrementQtyPO = (id: number) => {
    setCart(prev => prev.map(it => it.id === id ? { ...it, qtyPO: (it.qtyPO || 0) + 1 } : it));
  };

  const decrementQtyPO = (id: number) => {
    const item = cart.find(it => it.id === id);
    if (!item) return;
    const currentQtyPO = item.qtyPO || 0;
    if (currentQtyPO === 1 && item.qty === 0) {
      setConfirmationDialog({
        title: 'Konfirmasi Hapus',
        message: `Qty akan menjadi 0. Produk "${item.name}" akan dihapus dari list. Lanjutkan?`,
        onConfirm: () => {
          const newCart = cart.filter(it => it.id !== id);
          setCart(newCart);
          if (newCart.length === 0) setActiveDraftId(null);
          setConfirmationDialog(prev => ({ ...prev, isOpen: false }));
        },
        isOpen: true,
        type: 'warning',
        confirmText: 'Ya',
      });
      return;
    }
    setCart(prev => prev.map(it => it.id === id ? { ...it, qtyPO: Math.max(0, (it.qtyPO || 0) - 1) } : it));
  };

  const removeItem = (id: number) => {
    const item = cart.find(it => it.id === id);
    if (!item) return;
    setConfirmationDialog({
      title: 'Konfirmasi Hapus',
      message: `Apakah Anda yakin ingin menghapus "${item.name}" dari keranjang?`,
      onConfirm: () => {
        const newCart = cart.filter(it => it.id !== id);
        setCart(newCart);
        if (newCart.length === 0) setActiveDraftId(null);
        setConfirmationDialog(prev => ({ ...prev, isOpen: false }));
      },
      isOpen: true,
      type: 'warning',
      confirmText: 'Ya',
    });
  };

  // ===== HANDLERS: DRAFT =====
  const handleSaveDraft = async () => {
    if (cart.length === 0) return;

    const isPOMode = transactionMode === 'PO';
    const invoiceNo = isPOMode ? currentPOInvoiceNo : currentInvoiceNo;
    const endpoint = isPOMode ? '/api/po-sales' : '/api/sales';

    try {
      setIsSavingTransaction(true);

      const productDetails = mapCartItemsToProductSalesDetail(cart, inventoryProducts);

      const draftTransaction: SalesTransaction = {
        id: invoiceNo,
        userId: user?.id || '',
        customerId: String(selectedCustomer?.id || ''),
        customerName: selectedCustomer?.name || '',
        productDetail: productDetails,
        paymentMethod: 'Tunai',
        paymentDetail: {
          bill: subTotal,
          payment: 0,
          change: 0,
          remaining: subTotal,
        },
        isCredit: isPOMode,
        status: 'Draft',
      };

      await authenticatedAxios.post(`${API_BASE_URL}${endpoint}`, draftTransaction);

      // Setelah draft berhasil disimpan, langsung generate nomor invoice baru
      // tanpa menunggu Firestore onSnapshot agar nomor tidak sempat kosong.
      // - isNewTransaction: invoiceNo belum ada di transactions list (Firestore belum update),
      //   jadi perlu di-pass sebagai additionalTaken agar counter-nya ikut dihitung.
      // - existing draft: invoiceNo sudah ada di transactions list, cukup generate tanpa tambahan.
      const isNewTransaction = activeDraftId === null;
      if (isPOMode) {
        if (recycledPOInvoiceNumbers.includes(invoiceNo)) {
          setRecycledPOInvoiceNumbers(prev => prev.filter(no => no !== invoiceNo));
        }
        setCurrentPOInvoiceNo(generatePOSalesId(isNewTransaction ? invoiceNo : undefined));
      } else {
        if (recycledInvoiceNumbers.includes(invoiceNo)) {
          setRecycledInvoiceNumbers(prev => prev.filter(no => no !== invoiceNo));
        }
        setCurrentInvoiceNo(generateSalesId(isNewTransaction ? invoiceNo : undefined));
      }

      setCart([]);
      setActiveDraftId(null);
      setActiveDraftType(null);
      setSelectedCustomer(null);
      showToast('Draft tersimpan.', 'success');
    } catch (error: any) {
      console.error('Error saving draft:', error);
      showToast(error.response?.data?.message || 'Gagal menyimpan draft. Silakan coba lagi.', 'error');
    } finally {
      setIsSavingTransaction(false);
    }
  };

  const handleRestoreDraft = (draft: DraftTransaction) => {
    // Convert ProductSalesDetail[] back to CartItem[] for the cart
    const cartItems: ExtendedCartItem[] = draft.productDetail.map((detail) => ({
      id: Date.now() + Math.random(),
      productId: detail.productId,
      name: detail.productName,
      price: detail.salePrice,
      image: '',
      qty: detail.qty,
      qtyPO: detail.qtyPO || 0,
      unit: detail.unitName,
      size: detail.variantName,
      note: '',
    }));

    const isPODraft = draft._sourceCollection === 'po-sales';

    setCart(cartItems);
    setActiveDraftId(draft.id);
    setActiveDraftType(draft._sourceCollection);
    // Switch mode sesuai jenis draft
    setTransactionMode(isPODraft ? 'PO' : 'SALES');
    // Set invoice number ke slot yang tepat
    if (isPODraft) {
      setCurrentPOInvoiceNo(draft.id);
    } else {
      setCurrentInvoiceNo(draft.id);
    }
    // Restore customer dari draft
    if (draft.customerId) {
      setSelectedCustomer({
        id: Number(draft.customerId) || 0,
        name: draft.customerName || '',
        phone: '',
        points: 0,
      });
    } else {
      setSelectedCustomer(null);
    }
  };

  const handleDeleteDraft = (e: React.MouseEvent, id: string, draft?: DraftTransaction) => {
    e.stopPropagation();
    const sourceCollection = draft?._sourceCollection || 'sales';
    const endpoint = sourceCollection === 'po-sales' ? 'po-sales' : 'sales';
    showConfirmation(
      'Hapus Draft',
      'Apakah Anda yakin ingin menghapus draft ini?',
      async () => {
        try {
          await authenticatedAxios.delete(`${API_BASE_URL}/api/${endpoint}/delete`, { data: { id } });
          if (activeDraftId === id) {
            setActiveDraftId(null);
            setActiveDraftType(null);
            if (sourceCollection === 'po-sales') {
              setCurrentPOInvoiceNo(generatePOSalesId());
            } else {
              setCurrentInvoiceNo(generateSalesId());
            }
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

  // ===== HANDLERS: CETAK BILL =====
  const handleCetakBill = () => {
    if (cart.length === 0) return;
    if (!selectedCustomer && transactionMode === 'SALES') { showToast('Mohon pilih customer terlebih dahulu sebelum menyimpan draft!', 'warning'); return; }
    handleSaveDraft();
  };

  // ===== HANDLERS: CANCEL DRAFT SELECTION =====
  const handleCancelDraft = () => {
    setCart([]);
    if (activeDraftType === 'po-sales') {
      setCurrentPOInvoiceNo(generatePOSalesId());
    } else {
      setCurrentInvoiceNo(generateSalesId());
    }
    setActiveDraftId(null);
    setActiveDraftType(null);
    setSelectedCustomer(null);
  };

  // ===== HANDLERS: CETAK FAKTUR PO =====
  const handleCetakFakturPO = () => {
    if (cart.length === 0) { showToast('Keranjang masih kosong!', 'warning'); return; }
    if (!selectedCustomer) { showToast('Mohon pilih customer terlebih dahulu sebelum mencetak faktur!', 'warning'); return; }

    // Validasi: setiap item harus punya qty fisik atau qty PO minimal 1
    const invalidItems = cart.filter(item => (item.qty + (item.qtyPO || 0)) < 1);
    if (invalidItems.length > 0) {
      const names = invalidItems.map(i => i.name).join(', ');
      showToast(`Qty fisik dan qty PO tidak boleh keduanya 0: ${names}`, 'error');
      return;
    }
    // Jika bukan dari draft, generate PO invoice baru
    if (!activeDraftId && numberingConfig) {
      const newPOInvoiceNo = generatePOSalesId();
      setCurrentPOInvoiceNo(newPOInvoiceNo);
    }
    setJatuhTempoDate('');
    setDpAmount(0);
    setIsPOModalOpen(true);
  };

  // ===== HANDLERS: DP NUMPAD =====
  const openDpNumpad = () => {
    setDpNumpadValue(String(dpAmount) || '0');
    setIsDpNumpadOpen(true);
  };

  const appendDpDigit = (digit: string) => {
    setDpNumpadValue(prev => prev === '0' ? digit : prev + digit);
  };

  const backspaceDpDigit = () => {
    setDpNumpadValue(prev => {
      const next = prev.slice(0, -1);
      return next === '' ? '0' : next;
    });
  };

  const confirmDpNumpad = () => {
    const newDp = parseInt(dpNumpadValue) || 0;
    if (newDp > subTotal) { showToast('DP tidak boleh melebihi total tagihan!', 'warning'); return; }
    setDpAmount(newDp);
    setIsDpNumpadOpen(false);
  };

  // ===== HANDLERS: FINALIZE KREDIT (PO) =====
  const handleFinalizeCredit = async () => {
    try {
      if (!jatuhTempoDate) { showToast('Harap isi Tanggal Jatuh Tempo!', 'warning'); return; }
      if (!selectedCustomer) { showToast('Mohon pilih customer terlebih dahulu!', 'warning'); return; }
      if (!currentPOInvoiceNo) { showToast('Nomor invoice PO belum di-generate. Silakan tunggu sebentar dan coba lagi.', 'warning'); return; }

      setIsSavingTransaction(true);

      const productDetails = mapCartItemsToProductSalesDetail(cart, inventoryProducts);

      const poTransaction: POSalesTransaction = {
        id: currentPOInvoiceNo,
        userId: user?.id || '',
        customerId: String(selectedCustomer.id),
        customerName: selectedCustomer.name,
        productDetail: productDetails.map(d => ({ ...d, qtyPO: d.qtyPO ?? 0 })),
        paymentMethod: 'Tunai',
        paymentDetail: {
          bill: subTotal,
          payment: dpAmount,
          change: 0,
          remaining: subTotal - dpAmount,
        },
        isCredit: true,
        deadlineCredit: new Date(jatuhTempoDate),
        status: 'PO',
        dp: dpAmount,
      };

      // Jika dari PO draft → update; jika transaksi baru → create
      if (activeDraftId) {
        await authenticatedAxios.put(`${API_BASE_URL}/api/po-sales/update`, poTransaction);
      } else {
        await authenticatedAxios.post(`${API_BASE_URL}/api/po-sales`, poTransaction);
      }

      const savedInvoiceNo = currentPOInvoiceNo;
      const isNewPOTransaction = !activeDraftId;

      setIsPOModalOpen(false);
      setCart([]);
      setPaymentAmount(0);
      setSelectedPaymentMethod('');
      setActiveDraftId(null);
      setActiveDraftType(null);
      setJatuhTempoDate('');
      setSelectedCustomer(null);
      setDpAmount(0);

      // Generate nomor baru langsung tanpa menunggu Firestore
      if (recycledPOInvoiceNumbers.includes(savedInvoiceNo)) {
        setRecycledPOInvoiceNumbers(prev => prev.filter(no => no !== savedInvoiceNo));
      }
      setCurrentPOInvoiceNo(generatePOSalesId(isNewPOTransaction ? savedInvoiceNo : undefined));

      showToast(`Penjualan KREDIT berhasil dicatat! ID: ${savedInvoiceNo}`, 'success');
    } catch (error: any) {
      console.error('Error saving sales transaction (KREDIT):', error);
      showToast(error.response?.data?.message || 'Gagal menyimpan transaksi penjualan KREDIT. Silakan coba lagi.', 'error');
    } finally {
      setIsSavingTransaction(false);
    }
  };

  // ===== HANDLERS: PAYMENT NUMPAD =====
  const openPaymentNumpad = () => {
    setPaymentNumpadValue('0');
    setIsPaymentNumpadOpen(true);
  };

  const appendPaymentDigit = (digit: string) => {
    setPaymentNumpadValue(prev => prev === '0' ? digit : prev + digit);
  };

  const backspacePaymentDigit = () => {
    setPaymentNumpadValue(prev => {
      const next = prev.slice(0, -1);
      return next === '' ? '0' : next;
    });
  };

  const confirmPaymentNumpad = () => {
    setPaymentAmount(parseInt(paymentNumpadValue));
    setIsPaymentNumpadOpen(false);
    setSelectedPaymentMethod('LAINNYA');
  };

  // ===== HANDLERS: OPEN PAYMENT =====
  const handleOpenPayment = () => {
    if (cart.length === 0) { showToast('Keranjang masih kosong!', 'warning'); return; }
    if (!selectedCustomer) { showToast('Mohon pilih customer terlebih dahulu sebelum melakukan pembayaran!', 'warning'); return; }
    // Jika bukan dari draft, generate invoice baru
    if (!activeDraftId && numberingConfig) {
      const newInvoiceNo = generateSalesId();
      setCurrentInvoiceNo(newInvoiceNo);
    }
    setPaymentAmount(0);
    setSelectedPaymentMethod('');
    setJatuhTempoDate('');
    setIsPaymentModalOpen(true);
  };

  const handleQuickPayment = (methodName: string) => {
    setPaymentAmount(methodName === 'HUTANG' ? 0 : subTotal);
    setSelectedPaymentMethod(methodName);
  };

  const handleProcessPayment = () => {
    if (selectedPaymentMethod === 'HUTANG' && transactionMode === 'PO' && !jatuhTempoDate) {
      showToast('Mohon isi tanggal jatuh tempo untuk PO!', 'warning'); return;
    }
    if (selectedPaymentMethod !== 'HUTANG' && sisaTagihan > 0) {
      showToast('Pembayaran belum lunas!', 'warning'); return;
    }
    setIsPaymentModalOpen(false);
    setIsSuccessModalOpen(true);
  };

  // ===== HANDLERS: FINISH PENJUALAN =====
  const handleFinishPenjualan = async () => {
    try {
      if (!selectedCustomer) { showToast('Mohon pilih customer terlebih dahulu!', 'warning'); return; }
      if (!currentInvoiceNo) { showToast('Invoice number belum di-generate. Silakan tunggu sebentar.', 'warning'); return; }

      setIsSavingTransaction(true);

      const productDetails = mapCartItemsToProductSalesDetail(cart, inventoryProducts);

      const salesTransaction: SalesTransaction = {
        id: currentInvoiceNo,
        userId: user?.id || '',
        customerId: String(selectedCustomer.id),
        customerName: selectedCustomer.name,
        productDetail: productDetails,
        paymentMethod: selectedPaymentMethod === 'QRIS' ? 'QRIS' : 'Tunai',
        paymentDetail: {
          bill: subTotal,
          payment: paymentAmount,
          change: kembalian,
          remaining: 0,
        },
        status: 'Sales',
        isCredit: false,
      };

      // Jika dari draft, gunakan update (PUT); jika transaksi baru, gunakan create (POST)
      if (activeDraftId) {
        await authenticatedAxios.put(`${API_BASE_URL}/api/sales/update`, salesTransaction);
      } else {
        await authenticatedAxios.post(`${API_BASE_URL}/api/sales`, salesTransaction);
      }

      const savedInvoiceNo = currentInvoiceNo;

      setIsSuccessModalOpen(false);
      setCart([]);
      setPaymentAmount(0);
      setSelectedPaymentMethod('');
      setActiveDraftId(null);
      setJatuhTempoDate('');
      setSelectedCustomer(null);
      setDpAmount(0);
      setCurrentInvoiceNo('');

      showToast(`Transaksi berhasil! ID: ${savedInvoiceNo}`, 'success');
    } catch (error: any) {
      console.error('Error saving transaction:', error);
      showToast(
        error.response?.data?.message || 'Gagal menyimpan transaksi. Silakan coba lagi.',
        'error'
      );
    } finally {
      setIsSavingTransaction(false);
    }
  };

  // ===== HANDLERS: USER =====
  const handleLogout = () => {
    if (confirm('Apakah Anda yakin ingin logout?')) {
      localStorage.removeItem('isLoggedIn');
      window.dispatchEvent(new Event('auth-change'));
    }
  };

  const handleChangePassword = () => {
    alert('Fitur Ubah Password akan segera hadir!');
  };

  // ===== RENDER =====
  return (
    <div className="flex flex-col lg:flex-row h-full w-full overflow-hidden relative bg-gray-50">

      {/* ===== AREA UTAMA (PRODUK) ===== */}
      <div className={`w-full lg:flex-1 flex flex-col h-full border-r border-gray-300
                       relative z-0 transition-all ${isMobileCartOpen ? 'hidden lg:flex' : 'flex'}`}>

        {/* Header */}
        <KasirHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 pb-20 lg:pb-4">
          {viewMode === 'GRID' ? (
            <ProductGrid
              currentProducts={currentProducts}
              isLoading={isLoading}
              onProductClick={handleProductClick}
              formatRupiah={formatRupiah}
            />
          ) : (
            <ProductList
              currentProducts={currentProducts}
              isLoading={isLoading}
              listSelections={listSelections}
              onUpdateSelection={updateListSelection}
              onAddToCart={handleAddToListCart}
              formatRupiah={formatRupiah}
            />
          )}
        </div>

        {/* Pagination Footer */}
        <PaginationFooter
          startIndex={startIndex}
          endIndex={endIndex}
          totalItems={totalItems}
          currentPage={currentPage}
          totalPages={totalPages}
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

      {/* ===== SIDEBAR KANAN (CART) ===== */}
      <CartSidebar
        isMobileOpen={isMobileCartOpen}
        onCloseMobile={() => setIsMobileCartOpen(false)}
        transactionMode={transactionMode}
        onTransactionModeChange={handleTransactionModeChange}
        selectedCustomer={selectedCustomer}
        onSelectCustomer={setSelectedCustomer}
        currentInvoiceNo={transactionMode === 'PO' ? currentPOInvoiceNo : currentInvoiceNo}
        cart={cart}
        products={products}
        subTotal={subTotal}
        draftTransactions={filteredDraftTransactions}
        activeDraftId={activeDraftId}
        onRestoreDraft={handleRestoreDraft}
        onDeleteDraft={(e, id) => {
          const draft = draftTransactions.find(d => d.id === id);
          handleDeleteDraft(e, id, draft as DraftTransaction | undefined);
        }}
        onCancelDraft={handleCancelDraft}
        editingNoteId={editingNoteId}
        editingNoteValue={editingNoteValue}
        onStartEditNote={startEditNote}
        onSaveEditNote={saveEditNote}
        onCancelEditNote={cancelEditNote}
        onEditNoteChange={setEditingNoteValue}
        onIncrementQty={incrementQty}
        onDecrementQty={decrementQty}
        onIncrementQtyPO={incrementQtyPO}
        onDecrementQtyPO={decrementQtyPO}
        onRemoveItem={removeItem}
        onCartUnitChange={handleCartUnitChange}
        onStartEditPrice={startEditPrice}
        onOpenPayment={handleOpenPayment}
        onCetakBill={handleCetakBill}
        onCetakFakturPO={handleCetakFakturPO}
        userName={user?.username || 'User'}
        onLogout={handleLogout}
        onChangePassword={handleChangePassword}
        formatRupiah={formatRupiah}
      />

      {/* ===== PRODUCT MODAL (GRID VIEW) ===== */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          modalQty={modalQty}
          setModalQty={setModalQty}
          modalUnit={modalUnit}
          setModalUnit={setModalUnit}
          modalSize={modalSize}
          setModalSize={setModalSize}
          modalNote={modalNote}
          setModalNote={setModalNote}
          onClose={() => setSelectedProduct(null)}
          onSave={handleSaveToCart}
          formatRupiah={formatRupiah}
        />
      )}

      {/* ===== PAYMENT MODAL ===== */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        cart={cart}
        subTotal={subTotal}
        transactionMode={transactionMode}
        selectedCustomer={selectedCustomer}
        currentInvoiceNo={currentInvoiceNo}
        paymentAmount={paymentAmount}
        selectedPaymentMethod={selectedPaymentMethod}
        sisaTagihan={sisaTagihan}
        kembalian={kembalian}
        isPaymentNumpadOpen={isPaymentNumpadOpen}
        paymentNumpadValue={paymentNumpadValue}
        onClose={() => setIsPaymentModalOpen(false)}
        onOpenPaymentNumpad={openPaymentNumpad}
        onAppendPaymentDigit={appendPaymentDigit}
        onBackspacePaymentDigit={backspacePaymentDigit}
        onConfirmPaymentNumpad={confirmPaymentNumpad}
        onClosePaymentNumpad={() => setIsPaymentNumpadOpen(false)}
        onQuickPayment={handleQuickPayment}
        onProcessPayment={handleProcessPayment}
        formatRupiah={formatRupiah}
      />

      {/* ===== SUCCESS MODAL ===== */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        subTotal={subTotal}
        paymentAmount={paymentAmount}
        kembalian={kembalian}
        isSaving={isSavingTransaction}
        onFinish={handleFinishPenjualan}
        formatRupiah={formatRupiah}
      />

      {/* ===== PO MODAL ===== */}
      <POModal
        isOpen={isPOModalOpen}
        jatuhTempoDate={jatuhTempoDate}
        onJatuhTempoDateChange={setJatuhTempoDate}
        dpAmount={dpAmount}
        subTotal={subTotal}
        isSaving={isSavingTransaction}
        onOpenDpNumpad={openDpNumpad}
        onConfirm={handleFinalizeCredit}
        onCancel={() => setIsPOModalOpen(false)}
        formatRupiah={formatRupiah}
      />

      {/* ===== DP NUMPAD ===== */}
      <DpNumpad
        isOpen={isPOModalOpen && isDpNumpadOpen}
        dpNumpadValue={dpNumpadValue}
        subTotal={subTotal}
        onAppendDigit={appendDpDigit}
        onBackspace={backspaceDpDigit}
        onConfirm={confirmDpNumpad}
        onCancel={() => setIsDpNumpadOpen(false)}
        formatRupiah={formatRupiah}
      />

      {/* ===== PRICE EDIT NUMPAD ===== */}
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

      {/* ===== CONFIRMATION DIALOG ===== */}
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

      {/* ===== TOAST ===== */}
      <ToastComponent />
    </div>
  );
};

export default KasirPage;
