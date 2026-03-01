export interface CartItem {
  id: number;  
  productId: string; 
  name: string;
  price: number;
  image: string;
  qty: number;
  unit: string;
  size: string;
  note: string;
}

export interface SalesPaymentDetail{
  bill: number;
  payment: number;
  change: number;
  remaining: number;
}


export interface SalesTransaction{
  id: string;
  userId: string;
  customerId: string;
  customerName: string;
  productDetail: ProductSalesDetail[];
  paymentMethod: 'Tunai' | 'QRIS';
  paymentDetail: SalesPaymentDetail;
  isCredit: boolean;
  status: 'Draft' | 'Sales';
  deadlineCredit?: Date;
  dp?: number;
}

// ===== PO SALES (TRANSAKSI KREDIT) =====

export interface POProductSalesDetail {
  productId: string;
  productName: string;
  variantNum: number;
  variantName: string;
  unitNum: number;
  unitName: string;
  salePrice: number;
  qty: number;
  qtyPO: number; // required untuk transaksi PO
}

export interface POSalesTransaction {
  id: string;
  userId: string;
  customerId: string;
  customerName: string;
  productDetail: POProductSalesDetail[];
  paymentMethod: 'Tunai' | 'QRIS';
  paymentDetail: SalesPaymentDetail;
  isCredit: true;
  deadlineCredit: Date;
  dp: number;
  status: 'PO';
}

export interface ProductSalesDetail{
  productId: string;
  productName: string;
  variantNum: number;
  variantName: string;
  unitNum: number;
  unitName: string;
  salePrice: number;
  qty: number;
  qtyPO?: number;
}
