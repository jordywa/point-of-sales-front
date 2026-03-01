// src/utils/salesHelpers.ts

import type { InventoryItem, ProductSalesDetail, CartItem } from '../types/index';

interface ExtendedCartItem extends CartItem {
  qtyPO?: number;
}

/**
 * Map cart items to ProductSalesDetail for API
 */
export const mapCartItemsToProductSalesDetail = (
  cartItems: ExtendedCartItem[],
  products: InventoryItem[]
): ProductSalesDetail[] => {
  return cartItems.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      throw new Error(`Product with id ${item.productId} not found`);
    }

    const variantNum = product.variants.findIndex((v) => v.name === item.size);
    if (variantNum === -1) {
      throw new Error(`Variant ${item.size} not found for product ${product.name}`);
    }

    const variant = product.variants[variantNum];
    const unitNum = variant.unitConversions.findIndex((uc) => uc.name === item.unit);
    if (unitNum === -1) {
      throw new Error(`Unit ${item.unit} not found for variant ${variant.name}`);
    }

    return {
      productId: item.productId,
      productName: item.name,
      variantNum: variantNum,
      variantName: item.size,
      unitNum: unitNum,
      unitName: item.unit,
      salePrice: item.price,
      qty: item.qty,
      qtyPO: item.qtyPO || 0,
    };
  });
};

/**
 * Convert InventoryItem to Product-like format for display in KasirPage
 */
export interface ProductDisplay {
  id: string;
  name: string;
  basePrice: number;
  image: string;
  variants: string[];
  availableUnits: { name: string; priceMultiplier: number }[];
}

export const convertInventoryItemToProductDisplay = (
  item: InventoryItem
): ProductDisplay | null => {
  if (item.variants.length === 0) return null;

  // Use first variant for base price calculation
  const firstVariant = item.variants[0];
  if (firstVariant.unitConversions.length === 0) return null;

  // Get base unit (usually the smallest one)
  const baseUnit = firstVariant.unitConversions[0];
  const basePrice = baseUnit.salesPrice;

  // Collect all variants
  const variants = item.variants.map((v) => v.name);

  // Collect all available units from all variants
  const unitMap = new Map<string, { name: string; priceMultiplier: number }>();
  item.variants.forEach((variant) => {
    variant.unitConversions.forEach((uc) => {
      if (!unitMap.has(uc.name)) {
        const multiplier = basePrice > 0 ? uc.salesPrice / basePrice : 1;
        unitMap.set(uc.name, {
          name: uc.name,
          priceMultiplier: multiplier,
        });
      }
    });
  });

  const availableUnits = Array.from(unitMap.values());

  // Get first image or placeholder
  const image = item.image && item.image.length > 0 ? item.image[0] : 'https://placehold.co/200x200';

  return {
    id: item.id,
    name: item.name,
    basePrice,
    image,
    variants,
    availableUnits,
  };
};
