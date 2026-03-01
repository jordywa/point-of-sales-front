// src/pages/Inventory_Stock/StockInPage.tsx

import React, { useState, useMemo, useEffect } from 'react';
import {
  Menu, Search, Truck, ArrowRight, CheckCircle, Package,
  Calendar, User, Save, AlertCircle, XCircle, LayoutGrid,
  List, ArrowLeft, ChevronDown, ChevronUp,
} from 'lucide-react';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import authenticatedAxios from '../../utils/api';
import { API_BASE_URL } from '../../apiConfig';
import { useToast } from '../../components/Toast';
import LoadingOverlay from '../../components/LoadingOverlay';
import ConfirmationDialog from '../../components/ConfirmationDialog';

// ─── Props ─────────────────────────────────────────────────────────────────────
interface StockInPageProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
}

// ─── Types ──────────────────────────────────────────────────────────────────────
type POStatus =
  | 'belum selesai'
  | 'setengah sampai'
  | 'selesai'
  | 'selesai tidak lengkap';

type FilterType = 'ALL' | POStatus;

interface ProductPurchaseDetail {
  productId: string;
  productName: string;
  variantNum: number;
  variantName: string;
  unitNum: number;
  unitName: string;
  purchasePrice: number;
  qty: number;      // totalPesanan
  sisaQty: number;  // sisa yang belum diterima
}

interface POTransaction {
  id: string;
  supplierName: string;
  createdAt: any; // Firestore Timestamp
  status: POStatus;
  productDetail: ProductPurchaseDetail[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────────
const toInputDate = (d: Date) => d.toISOString().split('T')[0];

const defaultDateFrom = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return toInputDate(d);
};

const formatFirestoreDate = (createdAt: any): string => {
  if (!createdAt) return '-';
  const date: Date | null = createdAt.toDate
    ? createdAt.toDate()
    : createdAt.seconds
    ? new Date(createdAt.seconds * 1000)
    : null;
  if (!date) return '-';
  return date.toLocaleDateString('id-ID');
};

const toJsDate = (createdAt: any): Date => {
  if (!createdAt) return new Date(0);
  if (createdAt.toDate) return createdAt.toDate();
  if (createdAt.seconds) return new Date(createdAt.seconds * 1000);
  return new Date(0);
};

const getQtyKey = (productId: string, variantNum: number) =>
  `${productId}_${variantNum}`;

// ─── Component ──────────────────────────────────────────────────────────────────
const StockInPage: React.FC<StockInPageProps> = ({ setIsSidebarOpen }) => {
  const { userDb } = useAuth();
  const { showToast, ToastComponent } = useToast();

  // ── Data state ────────────────────────────────────────────────────────────────
  const [poPurchaseList, setPoPurchaseList] = useState<POTransaction[]>([]);
  const [isLoadingList, setIsLoadingList]   = useState(false);

  // product data untuk mengambil poCustQty secara live
  const [productDataMap, setProductDataMap] = useState<Record<string, any>>({});

  // ── Selection ─────────────────────────────────────────────────────────────────
  const [selectedPOId, setSelectedPOId] = useState<string | null>(null);
  const selectedPO = useMemo(
    () => poPurchaseList.find(po => po.id === selectedPOId) ?? null,
    [poPurchaseList, selectedPOId]
  );

  // ── qty input per produk ──────────────────────────────────────────────────────
  const [qtyInputs, setQtyInputs] = useState<Record<string, number>>({});

  // ── UI state ──────────────────────────────────────────────────────────────────
  const [searchQuery,    setSearchQuery]    = useState('');
  const [activeFilter,   setActiveFilter]   = useState<FilterType>('ALL');
  const [dateFrom,       setDateFrom]       = useState<string>(defaultDateFrom);
  const [dateTo,         setDateTo]         = useState<string>(toInputDate(new Date()));
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [isTabletView,   setIsTabletView]   = useState(false);
  const [isLoading,      setIsLoading]      = useState(false);

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmDialogProps, setConfirmDialogProps] = useState({
    title:       '',
    message:     '',
    type:        'warning' as 'warning' | 'danger',
    confirmText: 'Ya, Simpan',
    onConfirm:   () => {},
  });

  // ── Fetch poPurchaseList dari Firestore ───────────────────────────────────────
  useEffect(() => {
    if (!userDb) return;
    setIsLoadingList(true);

    const q = query(
      collection(userDb, 'po-purchases'),
      where('isDeleted', '==', false)
    );

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const items = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() } as POTransaction))
          .filter(po => po.status !== ('Draft' as any)); // buang draft
        setPoPurchaseList(items);
        setIsLoadingList(false);
      },
      error => {
        console.error('Error fetching po-purchases:', error);
        setIsLoadingList(false);
      }
    );

    return () => unsubscribe();
  }, [userDb]);

  // ── Fetch product data saat selectedPO berubah (untuk poCustQty) ──────────────
  useEffect(() => {
    if (!selectedPO || !userDb) {
      setProductDataMap({});
      return;
    }

    const uniqueProductIds = [
      ...new Set(selectedPO.productDetail.map(d => d.productId)),
    ];
    const unsubscribers: (() => void)[] = [];

    setProductDataMap({});

    uniqueProductIds.forEach(productId => {
      const unsub = onSnapshot(
        doc(userDb, 'products', productId),
        snap => {
          if (snap.exists()) {
            setProductDataMap(prev => ({
              ...prev,
              [productId]: { id: snap.id, ...snap.data() },
            }));
          }
        }
      );
      unsubscribers.push(unsub);
    });

    return () => unsubscribers.forEach(u => u());
  }, [selectedPO?.id, userDb]);

  // ── Reset qty inputs saat PO dipilih berganti ─────────────────────────────────
  useEffect(() => {
    setQtyInputs({});
    setExpandedItemId(null);
  }, [selectedPOId]);

  // ── Filter & Sort ─────────────────────────────────────────────────────────────
  const filteredSortedPO = useMemo(() => {
    const fromDate = new Date(dateFrom);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);
    const lower = searchQuery.toLowerCase();

    let data = poPurchaseList.filter(po => {
      // Date range
      const poDate = toJsDate(po.createdAt);
      if (poDate < fromDate || poDate > toDate) return false;
      // Search
      if (
        lower &&
        !po.id.toLowerCase().includes(lower) &&
        !po.supplierName.toLowerCase().includes(lower)
      )
        return false;
      return true;
    });

    if (activeFilter !== 'ALL') {
      data = data.filter(po => po.status === activeFilter);
    }

    return [...data].sort(
      (a, b) => toJsDate(b.createdAt).getTime() - toJsDate(a.createdAt).getTime()
    );
  }, [poPurchaseList, searchQuery, activeFilter, dateFrom, dateTo]);

  // ── poCustQty display helper ──────────────────────────────────────────────────
  const getPoCustQtyDisplay = (detail: ProductPurchaseDetail): number | string => {
    const product = productDataMap[detail.productId];
    if (!product) return '-';
    const variant = product.variants?.[detail.variantNum];
    if (!variant) return '-';
    const poCustQty = variant.poCustQty ?? 0;
    const factor = variant.unitConversions?.[detail.unitNum]?.qtyConversion ?? 1;
    return Math.round((poCustQty / factor) * 100) / 100;
  };

  // ── Handler: qty input ────────────────────────────────────────────────────────
  const handleQtyChange = (
    productId: string,
    variantNum: number,
    val: string,
    sisaQty: number
  ) => {
    const numVal = Math.max(0, parseInt(val) || 0);
    const key = getQtyKey(productId, variantNum);

    if (numVal > sisaQty) {
      showToast(`Jumlah terima melebihi sisa (${sisaQty})`, 'error');
      setQtyInputs(prev => ({ ...prev, [key]: sisaQty }));
      return;
    }
    setQtyInputs(prev => ({ ...prev, [key]: numVal }));
  };

  // ── Handler: simpan masuk stok ────────────────────────────────────────────────
  const handleProcessStockIn = () => {
    if (!selectedPO) return;

    // Validasi minimal 1 produk ada nilai > 0
    const hasIncoming = selectedPO.productDetail.some(
      d => (qtyInputs[getQtyKey(d.productId, d.variantNum)] ?? 0) > 0
    );
    if (!hasIncoming) {
      showToast(
        'Mohon isi jumlah "Terima Sekarang" minimal pada satu barang.',
        'error'
      );
      return;
    }

    // Validasi tidak melebihi sisa
    const exceeds = selectedPO.productDetail.find(d => {
      const incoming = qtyInputs[getQtyKey(d.productId, d.variantNum)] ?? 0;
      return incoming > d.sisaQty;
    });
    if (exceeds) {
      showToast(
        `Jumlah terima untuk "${exceeds.productName}" melebihi sisa (${exceeds.sisaQty})`,
        'error'
      );
      return;
    }

    setConfirmDialogProps({
      title:       'Konfirmasi Terima Barang',
      message:
        'Apakah Anda yakin ingin menyimpan barang masuk? Barang yang ada PO Customer akan diprioritaskan terlebih dahulu.',
      type:        'warning',
      confirmText: 'Ya, Simpan',
      onConfirm:   () => {
        setShowConfirmDialog(false);
        processStockInConfirmed();
      },
    });
    setShowConfirmDialog(true);
  };

  const processStockInConfirmed = async () => {
    if (!selectedPO) return;
    setIsLoading(true);
    try {
      const receivedItems = selectedPO.productDetail
        .filter(d => (qtyInputs[getQtyKey(d.productId, d.variantNum)] ?? 0) > 0)
        .map(d => ({
          productId:   d.productId,
          variantNum:  d.variantNum,
          unitNum:     d.unitNum,
          qtyReceived: qtyInputs[getQtyKey(d.productId, d.variantNum)] ?? 0,
        }));

      await authenticatedAxios.post(
        `${API_BASE_URL}/api/po-purchases/receive-stock-in`,
        { poPurchaseId: selectedPO.id, receivedItems }
      );

      setQtyInputs({});
      showToast('Stok berhasil diterima!', 'success');
    } catch (error: any) {
      console.error('Error receiving stock:', error);
      showToast(
        error.response?.data?.message || 'Gagal menyimpan stok masuk. Silakan coba lagi.',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Handler: selesaikan paksa ─────────────────────────────────────────────────
  const handleForceComplete = () => {
    if (!selectedPO) return;

    setConfirmDialogProps({
      title:       'Konfirmasi Selesaikan PO',
      message:
        'PERINGATAN!\n\nAnda akan menyelesaikan PO ini secara paksa (Selesai Tidak Lengkap).\nSisa barang yang belum diterima akan dianggap batal/hangus.\n\nApakah Anda yakin?',
      type:        'danger',
      confirmText: 'Ya, Selesaikan',
      onConfirm:   () => {
        setShowConfirmDialog(false);
        forceCompleteConfirmed();
      },
    });
    setShowConfirmDialog(true);
  };

  const forceCompleteConfirmed = async () => {
    if (!selectedPO) return;
    setIsLoading(true);
    try {
      await authenticatedAxios.post(
        `${API_BASE_URL}/api/po-purchases/force-complete`,
        { poPurchaseId: selectedPO.id }
      );
      showToast('PO berhasil diselesaikan secara paksa.', 'success');
    } catch (error: any) {
      console.error('Error force completing PO:', error);
      showToast(
        error.response?.data?.message || 'Gagal menyelesaikan PO secara paksa.',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Status badge ──────────────────────────────────────────────────────────────
  const renderStatusBadge = (status: POStatus) => {
    switch (status) {
      case 'belum selesai':
        return (
          <span className="text-[10px] bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-bold">
            BELUM SELESAI
          </span>
        );
      case 'setengah sampai':
        return (
          <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">
            SETENGAH SAMPAI
          </span>
        );
      case 'selesai':
        return (
          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
            SELESAI
          </span>
        );
      case 'selesai tidak lengkap':
        return (
          <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
            SELESAI TDK LENGKAP
          </span>
        );
      default:
        return null;
    }
  };

  const isLocked =
    selectedPO?.status === 'selesai' ||
    selectedPO?.status === 'selesai tidak lengkap';

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 font-sans overflow-hidden">
      <LoadingOverlay show={isLoading} message="Memproses data..." />

      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onConfirm={confirmDialogProps.onConfirm}
        onCancel={() => setShowConfirmDialog(false)}
        title={confirmDialogProps.title}
        message={confirmDialogProps.message}
        confirmText={confirmDialogProps.confirmText}
        cancelText="Batal"
        type={confirmDialogProps.type}
      />

      {/* ── HEADER ───────────────────────────────────────────────────────────── */}
      <div className="h-16 bg-white flex items-center justify-between px-6 border-b border-gray-200 shadow-sm flex-shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="hover:bg-gray-200 p-1 rounded"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg md:text-xl font-bold text-black uppercase flex items-center gap-2 truncate">
            <Truck className="w-5 h-5 md:w-6 md:h-6" />
            <span className="hidden md:inline">STOK MASUK (Receiving)</span>
            <span className="md:hidden">Receiving</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-600 hidden md:block">
            Mode Tampilan:
          </span>
          <button
            onClick={() => setIsTabletView(false)}
            className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${
              !isTabletView
                ? 'bg-blue-100 text-blue-700'
                : 'hover:bg-gray-100 text-gray-500'
            }`}
            title="Tampilan List (PC)"
          >
            <List className="w-5 h-5" />
            <span className="text-xs font-bold hidden md:block">List View</span>
          </button>
          <button
            onClick={() => setIsTabletView(true)}
            className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${
              isTabletView
                ? 'bg-blue-100 text-blue-700'
                : 'hover:bg-gray-100 text-gray-500'
            }`}
            title="Tampilan Grid (Tablet)"
          >
            <LayoutGrid className="w-5 h-5" />
            <span className="text-xs font-bold hidden md:block">Tablet View</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* ── LEFT PANEL: LIST PO ──────────────────────────────────────────────── */}
        <div
          className={`
            flex-col bg-white z-10 transition-all duration-300 border-r border-gray-200
            ${isTabletView ? 'w-full' : 'w-96'}
            ${selectedPO && isTabletView ? 'hidden' : 'flex'}
            ${!isTabletView && selectedPO ? 'md:flex' : ''}
          `}
        >
          {/* Search, Date Filter & Status Chips */}
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Cari No PO / Supplier..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm shadow-sm"
              />
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500"
              />
              <span className="text-gray-400 text-xs">s/d</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Status Filter Chips */}
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: 'ALL',               label: 'Semua' },
                  { id: 'belum selesai',      label: 'Belum Selesai' },
                  { id: 'setengah sampai',    label: 'Setengah Sampai' },
                  { id: 'selesai',            label: 'Selesai' },
                  { id: 'selesai tidak lengkap', label: 'Selesai Tdk Lengkap' },
                ] as { id: FilterType; label: string }[]
              ).map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
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

          {/* List Content */}
          <div className={`flex-1 overflow-y-auto ${isTabletView ? 'bg-gray-100 p-4' : ''}`}>
            {isLoadingList ? (
              <div className="p-8 text-center text-gray-400 text-sm">Memuat data...</div>
            ) : filteredSortedPO.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                Tidak ada transaksi PO yang sesuai.
              </div>
            ) : (
              <div
                className={
                  isTabletView
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                    : 'flex flex-col'
                }
              >
                {filteredSortedPO.map(po => {
                  if (isTabletView) {
                    return (
                      <div
                        key={po.id}
                        onClick={() => setSelectedPOId(po.id)}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 cursor-pointer hover:shadow-md transition-all active:scale-[0.99] flex flex-col justify-between min-h-[160px]"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-bold text-gray-800 text-lg">{po.id}</div>
                            {renderStatusBadge(po.status)}
                          </div>
                          <div className="flex items-center gap-2 text-gray-700 font-medium mb-1">
                            <User className="w-4 h-4 text-blue-500" /> {po.supplierName}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" /> {formatFirestoreDate(po.createdAt)}
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-sm">
                          <div className="text-gray-500 flex items-center gap-1">
                            <Package className="w-4 h-4" /> {po.productDetail?.length ?? 0} Item
                          </div>
                          <div className="text-blue-600 font-bold flex items-center gap-1">
                            Buka Detail <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={po.id}
                      onClick={() => setSelectedPOId(po.id)}
                      className={`p-4 border-b cursor-pointer transition-colors hover:bg-blue-50 group ${
                        selectedPO?.id === po.id
                          ? 'bg-blue-100 border-blue-200'
                          : 'border-gray-100'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-gray-800 text-sm">{po.id}</span>
                        {renderStatusBadge(po.status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1 truncate">
                        <User className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{po.supplierName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" /> {formatFirestoreDate(po.createdAt)}
                      </div>
                      <div className="mt-2 text-xs font-semibold text-blue-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Lihat Detail <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL: DETAIL ──────────────────────────────────────────────── */}
        <div
          className={`
            flex-1 flex-col bg-gray-50 overflow-hidden relative
            ${selectedPO && isTabletView ? 'flex' : isTabletView ? 'hidden' : 'hidden md:flex'}
          `}
        >
          {selectedPO ? (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Back button (tablet view) */}
              {isTabletView && (
                <div className="bg-white p-4 border-b border-gray-200 flex items-center gap-3">
                  <button
                    onClick={() => setSelectedPOId(null)}
                    className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-700"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="font-bold text-lg text-gray-800">{selectedPO.id}</h2>
                    <p className="text-xs text-gray-500">Kembali ke daftar PO</p>
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-6 md:p-8 pb-32">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Card Header */}
                  <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 gap-4">
                    <div>
                      {!isTabletView && (
                        <h2 className="text-2xl font-bold text-gray-800 mb-1">
                          {selectedPO.id}
                        </h2>
                      )}
                      <p className="text-gray-600 flex items-center gap-2">
                        <User className="w-4 h-4" /> Supplier:{' '}
                        <span className="font-semibold">{selectedPO.supplierName}</span>
                      </p>
                    </div>
                    <div className="text-left md:text-right w-full md:w-auto">
                      <p className="text-sm text-gray-500">Tanggal PO</p>
                      <p className="font-bold text-gray-800">
                        {formatFirestoreDate(selectedPO.createdAt)}
                      </p>
                      <div className="mt-2">{renderStatusBadge(selectedPO.status)}</div>
                    </div>
                  </div>

                  {/* Info bar */}
                  {isLocked ? (
                    <div className="bg-gray-100 px-6 py-3 flex items-center gap-3 border-b border-gray-200">
                      <CheckCircle className="w-5 h-5 text-gray-500" />
                      <p className="text-sm text-gray-600">
                        Transaksi ini sudah selesai. Tidak dapat mengubah stok lagi.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-blue-50 px-6 py-3 flex items-center gap-3 border-b border-blue-100">
                      <AlertCircle className="w-5 h-5 text-blue-600" />
                      <p className="text-sm text-blue-800">
                        Isi kolom <b>Terima Sekarang</b> untuk setiap barang yang baru tiba.
                        Barang akan diprioritaskan untuk memenuhi <b>PO Customer</b> terlebih
                        dahulu, sisanya masuk ke <b>Stok Fisik</b>.
                      </p>
                    </div>
                  )}

                  {/* Table */}
                  <div className="p-6 overflow-x-auto">
                    <table className="w-full text-sm min-w-[750px]">
                      <thead>
                        <tr className="bg-gray-100 text-gray-600 uppercase tracking-wider text-xs font-bold text-left">
                          <th className="p-3 rounded-l-lg">Nama Produk</th>
                          <th className="p-3 text-center">Unit</th>
                          <th className="p-3 text-center">Total Pesanan</th>
                          <th className="p-3 text-center">PO Customer</th>
                          <th className="p-3 text-center">Sudah Diterima</th>
                          <th className="p-3 text-center">Sisa</th>
                          <th className="p-3 text-center w-40 rounded-r-lg bg-blue-100 text-blue-800">
                            Terima Sekarang
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedPO.productDetail.map((item, idx) => {
                          const key         = getQtyKey(item.productId, item.variantNum);
                          const sudahDiterima = item.qty - item.sisaQty;
                          const sisa          = item.sisaQty;
                          const isComplete    = sisa <= 0;
                          const qtyIncoming   = qtyInputs[key] ?? 0;
                          const isExpanded    = expandedItemId === key;
                          const poCustDisplay = getPoCustQtyDisplay(item);
                          const expandKey     = key;

                          return (
                            <React.Fragment key={`${item.productId}-${item.variantNum}-${idx}`}>
                              <tr
                                onClick={() =>
                                  setExpandedItemId(isExpanded ? null : expandKey)
                                }
                                className={`cursor-pointer transition-colors ${
                                  isExpanded ? 'bg-blue-50/50' : 'hover:bg-gray-50'
                                }`}
                              >
                                {/* Nama */}
                                <td className="p-3 font-medium text-gray-800">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-100 rounded-md">
                                      {isExpanded ? (
                                        <ChevronUp className="w-4 h-4 text-blue-600" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                      )}
                                    </div>
                                    <div>
                                      <div className="font-bold">{item.productName}</div>
                                      {item.variantName && (
                                        <div className="text-xs text-gray-400">
                                          {item.variantName}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                {/* Unit */}
                                <td className="p-3 text-center font-bold text-gray-500">
                                  {item.unitName}
                                </td>
                                {/* Total Pesanan */}
                                <td className="p-3 text-center font-bold text-gray-700">
                                  {item.qty}
                                </td>
                                {/* PO Customer (live dari products) */}
                                <td className="p-3 text-center font-bold text-purple-700">
                                  {poCustDisplay}
                                </td>
                                {/* Sudah Diterima */}
                                <td className="p-3 text-center text-green-600 font-bold">
                                  {sudahDiterima}
                                </td>
                                {/* Sisa */}
                                <td className="p-3 text-center text-orange-600 font-bold">
                                  {sisa}
                                </td>
                                {/* Terima Sekarang */}
                                <td
                                  className="p-3 text-center bg-blue-50/30"
                                  onClick={e => e.stopPropagation()}
                                >
                                  {isComplete ? (
                                    <span className="text-green-600 font-bold flex justify-center items-center gap-1">
                                      <CheckCircle className="w-4 h-4" /> Lunas
                                    </span>
                                  ) : isLocked ? (
                                    <span className="text-gray-400 font-bold">-</span>
                                  ) : (
                                    <div className="relative">
                                      <input
                                        type="number"
                                        min="0"
                                        max={sisa}
                                        value={qtyIncoming === 0 ? '' : qtyIncoming}
                                        onChange={e =>
                                          handleQtyChange(
                                            item.productId,
                                            item.variantNum,
                                            e.target.value,
                                            sisa
                                          )
                                        }
                                        className="w-full border border-blue-300 rounded-lg px-3 py-2 text-center font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="0"
                                      />
                                      <div className="text-[10px] text-gray-400 mt-1 text-center">
                                        Max: {sisa}
                                      </div>
                                    </div>
                                  )}
                                </td>
                              </tr>

                              {/* Expandable row: info detail */}
                              {isExpanded && (
                                <tr className="bg-gray-50 animate-in slide-in-from-top-2 duration-200">
                                  <td colSpan={7} className="p-4 border-l-4 border-l-blue-500">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                      <div>
                                        <p className="text-xs text-gray-400 uppercase font-semibold mb-1">
                                          Harga Beli
                                        </p>
                                        <p className="font-bold text-gray-700">
                                          Rp {item.purchasePrice.toLocaleString('id-ID')}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-400 uppercase font-semibold mb-1">
                                          Total Pesanan
                                        </p>
                                        <p className="font-bold text-gray-700">
                                          {item.qty} {item.unitName}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-400 uppercase font-semibold mb-1">
                                          Sudah Diterima
                                        </p>
                                        <p className="font-bold text-green-600">
                                          {sudahDiterima} {item.unitName}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-400 uppercase font-semibold mb-1">
                                          Sisa
                                        </p>
                                        <p className="font-bold text-orange-600">
                                          {sisa} {item.unitName}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              {!isLocked && (
                <div className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 shadow-lg z-20 flex justify-end gap-3">
                  <button
                    onClick={handleForceComplete}
                    className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 md:px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-transform active:scale-95 text-sm md:text-base"
                    title="Paksa PO Selesai (Sisa barang dianggap hangus)"
                  >
                    <XCircle className="w-5 h-5" />
                    Selesaikan
                  </button>
                  <button
                    onClick={handleProcessStockIn}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 md:px-8 py-3 rounded-lg font-bold flex items-center gap-2 shadow-md transition-transform active:scale-95 text-sm md:text-base"
                  >
                    <Save className="w-5 h-5" />
                    Simpan Masuk Stok
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <Truck className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">Pilih Transaksi PO di sebelah kiri</p>
              <p className="text-sm">untuk mulai memproses barang masuk.</p>
            </div>
          )}
        </div>
      </div>

      <ToastComponent />
    </div>
  );
};

export default StockInPage;
