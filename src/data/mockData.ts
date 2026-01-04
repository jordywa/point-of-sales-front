// src/data/mockData.ts

import WayangImage from '../assets/wayang.jpeg';
import DayanaImage from '../assets/dayana.jpeg';
import LocoImage from '../assets/loco.jpeg';
import type { Product, InventoryItem, Customer, Supplier } from '../types/index';

// --- Data Produk POS & Pembelian ---
const UNITS_STANDARD = [
  { name: 'Pcs', priceMultiplier: 0.2 },
  { name: 'Pack', priceMultiplier: 1 },
  { name: 'Karung', priceMultiplier: 50 },
];

const UNITS_KG_ONLY = [
  { name: 'KG', priceMultiplier: 1 }
];

// PERBAIKAN: Ubah id menjadi string ("1", "2", dll)
export const PRODUCTS: Product[] = [
  { 
    id: "1", 
    name: "Plastik Dayana", 
    basePrice: 6000, 
    image: DayanaImage,
    variants: ["Ukuran 17", "Ukuran 24", "Ukuran 28", "Ukuran 35"],
    availableUnits: UNITS_STANDARD
  },
  { 
    id: "2", 
    name: "Plastik Loco", 
    basePrice: 5000, 
    image: LocoImage,
    variants: ["Ukuran 17", "Ukuran 24", "Ukuran 28", "Ukuran 35"],
    availableUnits: UNITS_STANDARD
  },
  { 
    id: "3", 
    name: "Plastik Wayang", 
    basePrice: 25000, 
    image: WayangImage,
    variants: ["15 x 30", "17 x 35"],
    availableUnits: UNITS_KG_ONLY
  },
  { 
    id: "4", 
    name: "Plastik Dayana (HD)", 
    basePrice: 6500, 
    image: DayanaImage,
    variants: ["Ukuran 17", "Ukuran 24"],
    availableUnits: UNITS_STANDARD
  },
  { 
    id: "5", 
    name: "Loco Hitam", 
    basePrice: 5500, 
    image: LocoImage,
    variants: ["Ukuran 28", "Ukuran 35"],
    availableUnits: UNITS_STANDARD
  }, 
];

// --- GENERATOR INVENTORY ---
export const INITIAL_INVENTORY_DATA: InventoryItem[] = PRODUCTS.map((product, index) => {
  const baseStock = (index + 1) * 20; 
  
  return {
    id: product.id, // Sudah string
    name: product.name,
    image: product.image,
    status: 'ACTIVE',
    variants: product.variants.map((variant, vIndex) => ({
      size: variant,
      stockKarung: Math.floor(baseStock / 50) + vIndex, 
      stockPack: Math.floor(baseStock / 5) + vIndex,
      stockPcs: baseStock + vIndex,
      priceModal: product.basePrice * 45, 
      priceJual: product.basePrice * 55   
    }))
  };
});

export const INITIAL_CUSTOMERS: Customer[] = [];
export const INITIAL_SUPPLIERS: Supplier[] = [];