// src/types/index.ts

// --- Update: ID jadi string untuk support Firebase UUID ---
export interface Product {
  id: string; // Changed from number
  name: string;
  basePrice: number;
  image: string;
  variants: string[];
  availableUnits: { name: string, priceMultiplier: number }[];
}

export interface CartItem {
  id: number;
  productId: string; // Changed from number
  name: string;
  price: number;
  image: string;
  qty: number;
  unit: string;
  size: string;
  note: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  gender?: 'L' | 'P';
  dob?: string;
  points: number;
}

export interface DraftTransaction {
  id: number;
  invoiceNumber: string;
  items: CartItem[];
  total: number;
  date: string;
  customer: Customer | null;
}

export interface Supplier {
  id: string;
  name: string;
  contact?: string;
  phone: string;
  email: string;
  address: string;
  accountNumber?: string;
  companyId?: string;
}

export interface Outlet {
  id: string;
  name: string;
  phone: string;
  address: string;
  status: 'Aktif' | 'Tidak Aktif';
}

export interface Role{
  id: string;
  name: string;
  description?: string;
}

export interface User {
  id: string;
  username: string;
  phone: string;
  companyId: string;
  role: string;
  status: 'Aktif' | 'Tidak Aktif';
  accessOutlets: string[];
  password?: string;
  permissions?: String[];
}

export interface NumberingConfig {
  salesPrefix: string;
  purchasePrefix: string;
  separator: string;
  yearFormat: 'YYYY' | 'YY';
  includeDay: boolean;
  salesCounter: number;
  purchaseCounter: number;
}

export interface Company{
  id: string;
  name: string;
  address?: string;
  contact?: string;
  numbering?: NumberingConfig;
}

export interface CategoryNode {
  id: string;
  name: string;
  isOpen: boolean;
  children: CategoryNode[];
  parentId?: string;
  companyId?: string;
}

export interface Bank {
  id: string;
  name: string;
  type: 'CASH' | 'BANK';
  balance: number;
  accountNumber?: string;
  companyId?: string;
}

export interface InventoryVariant {
  name: string;
  unitConversions: UnitConversion[];
  qty: number;
  currSeq: ProductDetailSequence[];
  outSeq?: ProductDetailSequence[];
}

export interface ProductDetailSequence{
  qty: number;
  inId?: string;
  outId?: string;
  purchasePrice: number;
}

export interface Permission{
  id: string,
  label: string,
}

export interface UnitConversion{
  name: string;
  qtyConversion: number;
  sourceConversion?: string;
  purchasePrice: number;
  salesPrice: number;
}

export interface InventoryItem {
  id: string; // Changed from number
  name: string;
  image: string[];
  status: 'ACTIVE' | 'NON_ACTIVE';
  variants: InventoryVariant[];
  createdAt?: any; // Helper untuk sorting
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

}