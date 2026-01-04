import { Timestamp } from 'firebase/firestore';

export interface StockDetail {
  quantity: number;
  purchasePrice: number;
  expiredDate: Date;
}

export interface StockTransaction {
  id: string;
  productId: string;
  quantity: number;
  purchasePrice: number;
  expiredDate: Date; // Can be Date object or Firestore Timestamp
  isInitialStock: boolean;
  createdAt: Timestamp;
  // These are added by combinedData, not directly from Firestore
  productName?: string;
  categoryName?: string;
  product?: any; // Full product object, if needed
}
