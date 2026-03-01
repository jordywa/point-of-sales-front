export interface UnitConversion{
  name: string;
  qtyConversion: number;
  sourceConversion?: string;
  purchasePrice: number;
  salesPrice: number;
}
// --- Update: ID jadi string untuk support Firebase UUID ---
export interface ProductItem {
  id: string; 
  name: string;
  basePrice: number;
  image: string;
  variants: string[];
  availableUnits: { name: string, priceMultiplier: number }[];
}

export interface Product {
  id: string; // Changed from number
  name: string;
  image: string[];
  status: 'ACTIVE' | 'NON_ACTIVE';
  variants: ProductVariant[];
  createdAt?: any; // Helper untuk sorting
}

export interface ProductVariant {
  name: string;
  unitConversions: UnitConversion[];
  qty: number;
  poQty: number;
  poCustQty: number;
  currSeq: ProductDetailSequence[];
  poCustSeq?: ProductDetailSequence[];
  poSeq?: ProductDetailSequence[];
  outSeq?: ProductDetailSequence[];
}

export interface ProductDetailSequence{
  qty: number;
  inId?: string;
  outId?: string;
  purchasePrice: number;
}