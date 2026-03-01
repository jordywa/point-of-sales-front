import type { CartItem } from "./kasir.types";

export interface ExtendedCartItem extends CartItem {
  qtyPO?: number; // Qty Kredit/Tempo
}

/**
 * DraftPurchase: struktur data yang datang dari Firestore
 * (collections: 'purchases' atau 'po-purchases' dengan status 'Draft')
 */
export interface DraftPurchase {
  id: string;
  _sourceCollection: 'purchases' | 'po-purchases';
  productDetail: ProductPurchaseDetail[];
  supplierId?: string;
  supplierName?: string;
  status: string;
  isDeleted?: boolean;
  subTotal?: number;
  transactionMode?: 'TUNAI' | 'KREDIT';
  [key: string]: any; // allow extra Firestore fields
}

export interface ListSelection {
  variant: string;
  unit: string;
  qty: number;
  note: string;
}

export type TransactionMode = "TUNAI" | "KREDIT";
export type ViewMode = "GRID" | "LIST";

export interface PembelianPageProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
  formatRupiah: (num: number) => string;
}


export interface ProductPurchaseDetail{
  productId: string;
  productName: string;
  variantNum: number;
  variantName: string;
  unitNum: number;
  unitName: string;
  purchasePrice: number;
  qty: number;
  sisaQty: number;
}

export interface PurchaseTransaction{
  id: string;
  supplierId: string;
  supplierName: string;
  productDetail: ProductPurchaseDetail[];
  isHutang: boolean;
  deadlineDate?: Date;
  dp: number;
  paymentMethod: 'TUNAI' | 'Transfer';
  paymentValue: number;
  remainingPayment: number;
  isPO: boolean;
  status?: string;
}
