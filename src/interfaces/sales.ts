import { Timestamp } from 'firebase/firestore';

// Interface for the details of stock used in a sale item
export interface SoldItemDetail {
  stockTransactionId: string;
  quantitySold: number;
  purchasePrice: number;
  expiredDate: Timestamp;
  addedAt: Timestamp;
}

// Interface for an item within a sales transaction
export interface SaleItem {
  productId: string;
  name: string; // Denormalized for easy display
  quantity: number;
  price: number; // Selling price at the time of sale
  soldDetails: SoldItemDetail[];
}

// Main interface for a sales transaction
export interface SalesTransaction {
  id: string;
  customerId: string | null;
  paymentMethod: 'cash' | 'transfer';
  totalAmount: number;
  items: SaleItem[];
  status?: 'completed' | 'canceled'; // Optional for backward compatibility
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  // Fields added on the client-side
  customerName?: string;
}
