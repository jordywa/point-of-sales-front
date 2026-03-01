// src/pages/Transaction/Pembelian/components/CartSidebar.tsx

import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  History,
  Trash2,
  Edit2,
  LogOut,
  Key,
  Pencil,
  Check,
  ChevronDown,
} from "lucide-react";
import type { Supplier } from "../../../../types/index";
import type {
  ExtendedCartItem,
  TransactionMode,
  DraftPurchase,
} from "../../../../types/pembelian.types";
import SupplierSelector from "./SupplierSelector";

interface CartSidebarProps {
  cart: ExtendedCartItem[];
  transactionMode: TransactionMode;
  onTransactionModeChange: (mode: TransactionMode) => void;
  selectedSupplier: Supplier | null;
  onSelectSupplier: (supplier: Supplier | null) => void;
  currentInvoiceNo: string;
  subTotal: number;
  products: any[]; // For getting unit options
  onIncrementQty: (id: number, isPO?: boolean) => void;
  onDecrementQty: (id: number, isPO?: boolean) => void;
  onRemoveItem: (id: number) => void;
  onCartUnitChange: (
    cartItemId: number,
    productId: string,
    newUnitName: string,
    variantName: string
  ) => void;
  onStartEditPrice: (id: number, currentPrice: number) => void;
  onStartEditNote: (item: ExtendedCartItem) => void;
  onSaveDraft: () => void;
  onOpenPayment: () => void;
  onOpenFakturKredit: () => void;
  formatRupiah: (num: number) => string;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  // Draft management
  draftTransactions?: DraftPurchase[];
  activeDraftId?: string | null;
  onRestoreDraft?: (draft: DraftPurchase) => void;
  onDeleteDraft?: (e: React.MouseEvent, id: string, draft?: DraftPurchase) => void;
  onCancelDraft?: () => void;
  // Note editing
  editingNoteId?: number | null;
  editingNoteValue?: string;
  onSaveEditNote?: (id: number) => void;
  onCancelEditNote?: () => void;
  onEditNoteChange?: (value: string) => void;
  // Qty numpad
  onOpenQtyNumpad?: (itemId: number, isPO: boolean) => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
  cart,
  transactionMode,
  onTransactionModeChange,
  selectedSupplier,
  onSelectSupplier,
  currentInvoiceNo,
  subTotal,
  products,
  onIncrementQty,
  onDecrementQty,
  onRemoveItem,
  onCartUnitChange,
  onStartEditPrice,
  onStartEditNote,
  onSaveDraft,
  onOpenPayment,
  onOpenFakturKredit,
  formatRupiah,
  isMobileOpen,
  onCloseMobile,
  draftTransactions = [],
  activeDraftId,
  onRestoreDraft,
  onDeleteDraft,
  onCancelDraft,
  editingNoteId,
  editingNoteValue,
  onSaveEditNote,
  onCancelEditNote,
  onEditNoteChange,
  onOpenQtyNumpad,
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isTransactionMenuOpen, setIsTransactionMenuOpen] = useState(false);

  const historyMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const transactionMenuRef = useRef<HTMLDivElement>(null);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        historyMenuRef.current &&
        !historyMenuRef.current.contains(event.target as Node)
      ) {
        setShowHistory(false);
      }
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
      if (
        transactionMenuRef.current &&
        !transactionMenuRef.current.contains(event.target as Node)
      ) {
        setIsTransactionMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    if (confirm("Apakah Anda yakin ingin logout?")) {
      localStorage.removeItem("isLoggedIn");
      window.dispatchEvent(new Event("auth-change"));
    }
  };

  const handleChangePassword = () => {
    alert("Fitur Ubah Password akan segera hadir!");
    setIsProfileMenuOpen(false);
  };

  return (
    <div
      className={`w-full lg:w-[500px] xl:w-[600px] bg-white flex-col h-full 
                  shadow-2xl z-10 border-l border-gray-200 transition-all 
                  ${
                    isMobileOpen
                      ? "flex fixed inset-0 z-50 lg:static"
                      : "hidden lg:flex"
                  }`}
    >
      {/* HEADER SIDEBAR */}
      <div className="h-12 flex items-center justify-between lg:justify-end px-3 gap-3 border-b border-gray-200 relative shrink-0">
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3">
          {/* HISTORY DROPDOWN */}
          <div className="relative" ref={historyMenuRef}>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="relative"
            >
              <History className="w-5 h-5 cursor-pointer hover:text-blue-500" />
              {draftTransactions.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {draftTransactions.length}
                </span>
              )}
            </button>
            {showHistory && (
              <div className="absolute top-10 right-0 bg-white border border-gray-300 rounded-lg shadow-lg w-72 max-h-96 overflow-y-auto z-20">
                <div className="bg-gray-100 p-3 border-b border-gray-200 font-semibold text-gray-700 text-sm">
                  Riwayat Draft ({draftTransactions.length})
                </div>
                {draftTransactions.length === 0 ? (
                  <div className="p-4 text-gray-500 text-center text-sm">
                    Tidak ada draft
                  </div>
                ) : (
                  <div>
                    {draftTransactions.map((draft) => {
                      const isActive = draft.id === activeDraftId;
                      return (
                        <div
                          key={draft.id}
                          onClick={() => onRestoreDraft?.(draft)}
                          className={`p-3 border-b cursor-pointer transition-colors relative group
                            ${isActive
                              ? 'bg-blue-50 border-l-4 border-l-blue-500'
                              : 'bg-white hover:bg-blue-50'
                            }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <div className={`font-bold text-sm mb-1 flex items-center gap-1.5 flex-wrap ${isActive ? 'text-blue-700' : 'text-black'}`}>
                                {draft.id}
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                  draft._sourceCollection === 'po-purchases'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-green-100 text-green-700'
                                }`}>
                                  {draft._sourceCollection === 'po-purchases' ? 'Kredit' : 'Tunai'}
                                </span>
                                {isActive && (
                                  <span className="text-[10px] font-semibold bg-blue-500 text-white px-1.5 py-0.5 rounded-full">
                                    Aktif
                                  </span>
                                )}
                              </div>
                              <div className="text-gray-500 text-xs mb-0.5">
                                {draft.supplierName || 'Tanpa supplier'}
                              </div>
                              <div className="text-gray-600 text-xs">
                                {formatRupiah(draft.subTotal ?? 0)}
                              </div>
                            </div>
                            <button
                              onClick={(e) => onDeleteDraft?.(e, draft.id, draft)}
                              className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors z-10"
                              title="Hapus Draft"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
              <span className="text-sm font-medium hidden md:inline">
                Vicky
              </span>
              <div className="w-7 h-7 rounded-full bg-gray-300 overflow-hidden border border-gray-400">
                <img src="https://placehold.co/50x50" alt="Avatar" />
              </div>
            </button>
            {isProfileMenuOpen && (
              <div className="absolute top-10 right-0 bg-white border border-gray-200 rounded-xl shadow-xl w-40 overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
                <div className="py-1">
                  <button
                    onClick={handleChangePassword}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700 text-sm"
                  >
                    <Key className="w-3 h-3 text-blue-500" /> Password
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600 text-sm font-bold"
                  >
                    <LogOut className="w-3 h-3" /> Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SUPPLIER + TRANSACTION DROPDOWN + INVOICE NO */}
      <div className="px-3 py-2 border-b border-black bg-white select-none shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="flex justify-between text-xs items-center mt-0.5">

              {/* SUPPLIER SELECTOR - KIRI */}
              <SupplierSelector
                selectedSupplier={selectedSupplier}
                onSelectSupplier={onSelectSupplier}
              />

              {/* TRANSACTION MODE DROPDOWN - TENGAH */}
              <div
                className="relative text-center align-top self-start"
                ref={transactionMenuRef}
                onClick={(e) => e.stopPropagation()}
              >
                <h2
                  className="text-base font-bold text-center flex items-center justify-center gap-1
                             hover:text-blue-700 transition-colors select-none cursor-pointer"
                  onClick={() => setIsTransactionMenuOpen(!isTransactionMenuOpen)}
                >
                  {transactionMode === 'TUNAI' ? 'PEMBELIAN' : 'PEMBELIAN PO'}
                  <ChevronDown className="w-4 h-4" />
                </h2>

                {isTransactionMenuOpen && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-40 bg-white
                                  border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                    <button
                      onClick={() => { onTransactionModeChange('TUNAI'); setIsTransactionMenuOpen(false); }}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-100 text-xs font-bold ${
                        transactionMode === 'TUNAI' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                      }`}
                    >
                      PEMBELIAN
                    </button>
                    <button
                      onClick={() => { onTransactionModeChange('KREDIT'); setIsTransactionMenuOpen(false); }}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-100 text-xs font-bold ${
                        transactionMode === 'KREDIT' ? 'text-yellow-600 bg-yellow-50' : 'text-gray-700'
                      }`}
                    >
                      PEMBELIAN PO
                    </button>
                  </div>
                )}
              </div>

              {/* INVOICE NO - KANAN */}
              <span className="font-bold">{currentInvoiceNo}</span>

            </div>
          </div>
        </div>
      </div>

      {/* HEADER TABEL CART */}
      {(
        <div className="grid grid-cols-12 gap-1 px-2 py-1 text-sm font-semibold border-b border-gray-300 text-center z-10 bg-white relative transition-colors shrink-0">
          <div className="col-span-1"></div>
          <div className="col-span-3 text-sm">Qty {transactionMode === 'KREDIT' && "PO"}</div>
          <div className="col-span-2 text-sm">Unit</div>
          <div className="col-span-3 text-left text-sm">Name</div>
          <div className="col-span-3 text-right text-sm">Total</div>
        </div>
      )}

      {/* LIST ITEM CART */}
      <div className="flex-1 overflow-y-auto relative bg-white">
        <div className="relative z-10">
          {cart.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-xs text-gray-400 italic">
              Belum ada item
            </div>
          ) : (
            cart.map((item) => {
              const originalProduct = products.find(
                (p) => p.id === item.productId
              );
              const totalQtyItem = item.qty + (item.qtyPO || 0);

              return (
                // HORIZONTAL LAYOUT untuk mode TUNAI
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-1 px-2 py-2 items-center text-xs border-b border-gray-100 hover:bg-gray-50/80 bg-white/50 backdrop-blur-[1px]"
                >
                  {/* 1. TRASH */}
                  <div className="col-span-1 flex justify-center items-center">
                    <button onClick={() => onRemoveItem(item.id)}>
                      <Trash2 className="w-4 h-4 text-red-500 cursor-pointer hover:text-red-700" />
                    </button>
                  </div>

                  {/* 2. QTY */}
                  {transactionMode === 'TUNAI' && <div className="col-span-3 flex items-center justify-center gap-1 pl-1">
                    <button
                      className="text-lg font-bold px-2 py-1 text-[#87C3FE] hover:text-blue-600"
                      onClick={() => onDecrementQty(item.id, false)}
                    >
                      -
                    </button>
                    <input 
                      type="text" 
                      value={item.qty} 
                      readOnly
                      onClick={() => onOpenQtyNumpad?.(item.id, false)}
                      className="w-8 text-center text-lg font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
                    />
                    <button
                      className="text-lg font-bold px-2 py-1 text-[#87C3FE] hover:text-blue-600"
                      onClick={() => onIncrementQty(item.id, false)}
                    >
                      +
                    </button>
                  </div>}

                  {transactionMode === 'KREDIT' && <div className="col-span-3 flex items-center justify-center gap-1 pl-1">
                    <button
                      className="text-lg font-bold px-2 py-1 text-orange-500 hover:bg-orange-50 rounded-md transition-colors"
                      onClick={() => onDecrementQty(item.id, true)}
                    >
                      -
                    </button>
                    <input 
                      type="text" 
                      value={item.qtyPO || 0} 
                      readOnly
                      onClick={() => onOpenQtyNumpad?.(item.id, true)}
                      className="w-8 text-center text-lg font-bold text-orange-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-400 rounded"
                    />
                    <button
                      className="text-lg font-bold px-2 py-1 text-orange-500 hover:bg-orange-50 rounded-md transition-colors"
                      onClick={() => onIncrementQty(item.id, true)}
                    >
                      +
                    </button>
                  </div>}
                   {/* Qty PO
                    <div className="flex flex-col items-center min-w-[110px]">
                      <span className="text-[10px] font-semibold text-orange-700 mb-1">
                        QTY PO
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          className="w-8 h-8 flex items-center justify-center text-lg font-bold text-orange-500 hover:bg-orange-50 rounded-md transition-colors"
                          onClick={() => onDecrementQty(item.id, true)}
                        >
                          -
                        </button>
                        <input 
                          type="text" 
                          value={item.qtyPO || 0} 
                          readOnly
                          onClick={() => onOpenQtyNumpad?.(item.id, true)}
                          className="w-10 text-center text-lg font-bold text-orange-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-400 rounded"
                        />
                        <button
                          className="w-8 h-8 flex items-center justify-center text-lg font-bold text-orange-500 hover:bg-orange-50 rounded-md transition-colors"
                          onClick={() => onIncrementQty(item.id, true)}
                        >
                          +
                        </button>
                      </div>
                    </div> */}

                  {/* 3. UNIT */}
                  <div className="col-span-2 flex justify-center items-center mr-2">
                    {originalProduct ? (
                      <select
                        className="w-full text-xs border-none bg-transparent focus:outline-none cursor-pointer appearance-none text-center relative"
                        style={{
                          backgroundImage:
                            'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23999\' d=\'M6 8L2 4h8z\'/%3E%3C/svg%3E")',
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "center right",
                          paddingRight: "16px",
                        }}
                        value={item.unit}
                        onChange={(e) =>
                          onCartUnitChange(
                            item.id,
                            item.productId,
                            e.target.value,
                            item.size
                          )
                        }
                      >
                        {originalProduct.variants[0].unitConversions.map(
                          (u: any) => (
                            <option key={u.name} value={u.name}>
                              {u.name}
                            </option>
                          )
                        )}
                      </select>
                    ) : (
                      <span className="text-xs">{item.unit}</span>
                    )}
                  </div>

                  {/* 4. NAME & NOTE */}
                  <div className="col-span-3 text-sm text-gray-700 leading-tight pr-1 wrap-break-word whitespace-normal pt-0.5">
                    <div className="font-semibold text-base wrap-break-word whitespace-normal">
                      {item.name}
                    </div>
                    <div className="text-xs text-gray-400 font-normal">
                      {item.size}
                    </div>

                    {editingNoteId === item.id ? (
                      <div className="flex gap-1 mt-1 animate-in fade-in duration-200">
                        <input
                          type="text"
                          value={editingNoteValue}
                          onChange={(e) => onEditNoteChange?.(e.target.value)}
                          className="w-full border border-blue-400 rounded text-[10px] px-1 py-0.5 focus:outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") onSaveEditNote?.(item.id);
                            if (e.key === "Escape") onCancelEditNote?.();
                          }}
                        />
                        <button
                          onClick={() => onSaveEditNote?.(item.id)}
                          className="text-green-600 hover:bg-green-100 p-0.5 rounded"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 mt-0.5 group/note">
                        {item.note ? (
                          <span className="text-[10px] text-gray-400 italic">
                            "{item.note}"
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-300 italic opacity-0 group-hover/note:opacity-100">
                            Ket...
                          </span>
                        )}
                        <button
                          onClick={() => onStartEditNote(item)}
                          className="opacity-0 group-hover/note:opacity-100 transition-opacity text-gray-400 hover:text-blue-500 p-0.5"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 5. PRICE & TOTAL */}
                  <div className="col-span-3 text-right flex flex-col gap-0">
                    <div className="text-green-600 text-base font-bold">
                      {formatRupiah(item.price * totalQtyItem)}
                    </div>
                    <div className="flex justify-end items-center gap-1 text-xs text-gray-500">
                      {formatRupiah(item.price)}/{item.unit}
                      <button
                        onClick={() => onStartEditPrice(item.id, item.price)}
                        className="ml-1"
                      >
                        <Edit2 className="w-4 h-4 text-gray-400 hover:text-black cursor-pointer" />
                      </button>
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
          <span className="text-green-600 text-lg font-bold">
            {formatRupiah(subTotal)}
          </span>
        </div>

        <div className="grid grid-cols-2 grid-rows-2 h-20 text-white font-sans text-sm">
          {transactionMode === "KREDIT" ? (
            <>
              {activeDraftId ? (
                <>
                  <button
                    onClick={onCancelDraft}
                    className="col-span-1 bg-gray-400 hover:bg-gray-500 flex items-center justify-center border-b border-r border-white font-bold"
                  >
                    Batal
                  </button>
                  <button
                    onClick={onSaveDraft}
                    className="col-span-1 bg-[#7DB9E9] hover:bg-blue-400 flex items-center justify-center border-b border-white font-bold"
                  >
                    Update Draft
                  </button>
                </>
              ) : (
                <button
                  onClick={onSaveDraft}
                  className="col-span-2 bg-[#7DB9E9] hover:bg-blue-400 flex items-center justify-center border-b border-white font-bold"
                >
                  Simpan Draft
                </button>
              )}
              <button
                onClick={onOpenFakturKredit}
                className="col-span-2 bg-[#A5CEF2] hover:bg-blue-300 text-black flex items-center justify-center px-6"
              >
                <span className="font-bold text-lg">Cetak Faktur</span>
              </button>
            </>
          ) : (
            <>
              {activeDraftId ? (
                <>
                  <button
                    onClick={onCancelDraft}
                    className="col-span-1 bg-gray-400 hover:bg-gray-500 flex items-center justify-center border-b border-r border-white font-bold"
                  >
                    Batal
                  </button>
                  <button
                    onClick={onSaveDraft}
                    className="col-span-1 bg-[#7DB9E9] hover:bg-blue-400 flex items-center justify-center border-b border-white font-bold"
                  >
                    Update Draft
                  </button>
                </>
              ) : (
                <button
                  onClick={onSaveDraft}
                  className="col-span-2 bg-[#7DB9E9] hover:bg-blue-400 flex items-center justify-center border-b border-white font-bold"
                >
                  Simpan Draft
                </button>
              )}
              <button
                onClick={onOpenPayment}
                className="col-span-2 bg-[#A5CEF2] hover:bg-blue-300 text-black flex items-center justify-between px-6"
              >
                <span className="font-bold text-lg">Bayar</span>
                <span className="font-bold text-lg text-green-700">
                  {formatRupiah(subTotal)}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};