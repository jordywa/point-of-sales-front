// src/pages/Transaction/Pembelian/utils/productHelpers.ts

import type { InventoryVariant, UnitConversion } from "../types/index";

/**
 * Get default unit (the one without sourceConversion)
 */
export const getDefaultUnit = (variant: InventoryVariant): UnitConversion => {
  const defaultUnit = variant.unitConversions.find(
    (uc) => uc.sourceConversion === undefined
  );
  return defaultUnit || variant.unitConversions[0];
};

/**
 * Get unit conversion by name (case-insensitive)
 */
export const getUnitConversion = (
  variant: InventoryVariant,
  unitName: string
): UnitConversion | undefined => {
  return variant.unitConversions.find(
    (uc) => uc.name.toLowerCase() === unitName.toLowerCase()
  );
};

/**
 * Get available units from variant
 */
export const getAvailableUnits = (variant: InventoryVariant): string[] => {
  if (!variant.unitConversions || variant.unitConversions.length === 0) {
    return [];
  }
  return variant.unitConversions.map((uc) => uc.name);
};

/**
 * Get purchase price from variant and unit
 */
export const getPurchasePrice = (
  variant: InventoryVariant,
  unitName: string
): number => {
  const unitConversion = getUnitConversion(variant, unitName);
  if (!unitConversion) {
    const defaultUnit = getDefaultUnit(variant);
    return defaultUnit ? defaultUnit.purchasePrice : 0;
  }
  return unitConversion.purchasePrice;
};

/**
 * Get first available variant from product
 */
export const getFirstVariant = (
  variants: InventoryVariant[]
): InventoryVariant | null => {
  return variants.length > 0 ? variants[0] : null;
};

/**
 * Get display price for product (from first variant and first unit)
 */
export const getProductDisplayPrice = (
  variants: InventoryVariant[]
): number => {
  const firstVariant = getFirstVariant(variants);
  if (!firstVariant) return 0;

  const availableUnits = getAvailableUnits(firstVariant);
  if (availableUnits.length === 0) return 0;

  return getPurchasePrice(firstVariant, availableUnits[0]);
};

/**
 * Get product image URL (first image or empty string)
 */
export const getProductImage = (images: string[]): string => {
  return images && images.length > 0 ? images[0] : "";
};