// src/pages/Transaction/Pembelian/utils/cartHelpers.ts

import type {
  Product,
  ProductPurchaseDetail,
} from "../types/index";
import type { ExtendedCartItem } from "../types/pembelian.types";

/**
 * Calculate subtotal from cart items
 */
export const calculateSubTotal = (cart: ExtendedCartItem[]): number => {
  return cart.reduce((acc, item) => {
    const totalQtyItem = item.qty + (item.qtyPO || 0);
    return acc + item.price * totalQtyItem;
  }, 0);
};

/**
 * Map cart items to ProductPurchaseDetail for API
 */
export const mapCartItemsToProductPurchaseDetail = (
  cartItems: ExtendedCartItem[],
  products: Product[]
): ProductPurchaseDetail[] => {
  return cartItems.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      throw new Error(`Product with id ${item.productId} not found`);
    }

    const variantNum = product.variants.findIndex(
      (v) => v.name === item.size
    );
    if (variantNum === -1) {
      throw new Error(`Variant ${item.size} not found for product ${product.name}`);
    }

    const variant = product.variants[variantNum];
    const unitNum = variant.unitConversions.findIndex(
      (uc) => uc.name === item.unit
    );
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
      purchasePrice: item.price,
      qty: item.qty + (item.qtyPO || 0),
      sisaQty: (item.qtyPO || 0),
    } as ProductPurchaseDetail;
  });
};

/**
 * Create new cart item from product selection
 */
export const createCartItem = (
  productId: string,
  productName: string,
  productImage: string,
  variantName: string,
  unitName: string,
  price: number,
  qty: number,
  qtyPO: number,
  note: string
): ExtendedCartItem => {
  return {
    id: Date.now() + Math.random(),
    productId,
    name: productName,
    price,
    image: productImage,
    qty,
    qtyPO,
    unit: unitName,
    size: variantName,
    note,
  };
};

/**
 * Update cart item unit and price
 */
export const updateCartItemUnit = (
  cart: ExtendedCartItem[],
  cartItemId: number,
  newUnitName: string,
  newPrice: number
): ExtendedCartItem[] => {
  return cart.map((item) =>
    item.id === cartItemId
      ? { ...item, unit: newUnitName, price: newPrice }
      : item
  );
};

/**
 * Update cart item quantity
 */
export const updateCartItemQty = (
  cart: ExtendedCartItem[],
  cartItemId: number,
  qtyDelta: number,
  isPO: boolean = false,
  editQty?: number,
): ExtendedCartItem[] => {
  return cart.map((item) => {
    if (item.id !== cartItemId) return item;
    if(editQty != undefined){
      if (isPO) {
        return {
          ...item,
          qtyPO: editQty,
        };
      } else {
        return {
          ...item,
          qty: editQty,
        };
      }
    }else {
      if (isPO) {
        return {
          ...item,
          qtyPO: Math.max(0, (item.qtyPO || 0) + qtyDelta),
        };
      } else {
        return {
          ...item,
          qty: Math.max(0, item.qty + qtyDelta),
        };
      }
    }
  });
};

/**
 * Update cart item price
 */
export const updateCartItemPrice = (
  cart: ExtendedCartItem[],
  cartItemId: number,
  newPrice: number
): ExtendedCartItem[] => {
  return cart.map((item) =>
    item.id === cartItemId ? { ...item, price: newPrice } : item
  );
};

/**
 * Update cart item note
 */
export const updateCartItemNote = (
  cart: ExtendedCartItem[],
  cartItemId: number,
  newNote: string
): ExtendedCartItem[] => {
  return cart.map((item) =>
    item.id === cartItemId ? { ...item, note: newNote } : item
  );
};

/**
 * Remove item from cart
 */
export const removeCartItem = (
  cart: ExtendedCartItem[],
  cartItemId: number
): ExtendedCartItem[] => {
  return cart.filter((item) => item.id !== cartItemId);
};

/**
 * Sort cart items by name
 */
export const sortCartByName = (cart: ExtendedCartItem[]): ExtendedCartItem[] => {
  return [...cart].sort((a, b) => a.name.localeCompare(b.name));
};