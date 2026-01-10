// src/pages/Inventory/tabs/InventoryGridViewTab.tsx
import React from 'react';
import { Trash2, EyeOff, Check } from 'lucide-react';
import type { InventoryItem, InventoryVariant, UnitConversion } from '../../types/index';

interface InventoryGridViewTabProps {
  items: InventoryItem[];
  gridUnitState: Record<string, string>;
  handleGridUnitChange: (itemId: string, newUnit: string) => void;
  getDisplayStock: (v: InventoryVariant, unit: string) => Record<string, number>;
  getAvailableUnits: (v: InventoryVariant) => string[];
  getSortedUnits: (v: InventoryVariant) => UnitConversion[];
  setSelectedInventoryItem: (item: InventoryItem) => void;
  handleDeleteInventory: (id: string) => void;
  handleToggleStatus: (id: string, currentStatus: string) => void;
}

const InventoryGridViewTab: React.FC<InventoryGridViewTabProps> = ({
  items,
  gridUnitState,
  handleGridUnitChange,
  getDisplayStock,
  getAvailableUnits,
  getSortedUnits,
  setSelectedInventoryItem,
  handleDeleteInventory,
  handleToggleStatus,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {items.map((item) => {
        // Get available units from first variant (assuming all variants have same units)
        // Or get from a specific variant if needed
        const firstVariantUnits = item.variants.length > 0 ? getAvailableUnits(item.variants[0]) : [];
        const defaultUnit = firstVariantUnits.length > 0 ? firstVariantUnits[0] : '';
        // Ambil unit yang dipilih untuk item ini (default: unit terbesar dari variant pertama)
        const currentUnit = gridUnitState[item.id] || defaultUnit;

        return (
          <div
            key={item.id}
            className="bg-white rounded-xl border border-gray-300 shadow-sm overflow-hidden flex flex-col relative transition-all hover:shadow-md hover:scale-[1.01] duration-200"
          >
            {/* AREA INFO PRODUK */}
            <div
              className="p-3 md:p-4 flex gap-3 md:gap-4 cursor-pointer hover:bg-blue-50/30 transition-colors flex-1"
              onClick={() => setSelectedInventoryItem(item)}
            >
              {/* Gambar dengan aspek rasio yang konsisten */}
              <div className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-contain bg-black rounded-lg"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm md:text-base mb-1 md:mb-2 text-gray-800 truncate" title={item.name}>
                  {item.name}
                </h3>
                
                {/* Tabel Stok Mini */}
                <div className="space-y-1">
                  {item.variants.map((v, idx) => {
                    const stockDisplay = getDisplayStock(v, currentUnit);
                    const sortedUnits = getSortedUnits(v);
                    return (
                      <div key={idx} className="flex flex-col text-[10px] md:text-xs font-semibold border-b border-gray-50 last:border-0 pb-1 last:pb-0">
                        <span className="text-gray-500 truncate mb-0.5">{v.name}</span>
                        <div className="flex justify-between gap-1 flex-wrap">
                          {sortedUnits.map((unitConversion) => {
                            const qty = stockDisplay[unitConversion.name] || 0;
                            // Shortened name for display (first 3-4 chars)
                            const shortName = unitConversion.name.length > 4 
                              ? unitConversion.name.substring(0, 4) 
                              : unitConversion.name;
                            return (
                              <span 
                                key={unitConversion.name}
                                className={qty === 0 ? "text-red-500" : "text-green-600"}
                                title={`${qty} ${unitConversion.name}`}
                              >
                                {qty} {shortName}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* UNIT SELECTION */}
            <div className="px-3 md:px-4 pb-3 border-t border-gray-100 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Unit:</span>
                <select
                  className="border border-black rounded-lg px-2 py-1 text-xs bg-white cursor-pointer hover:border-blue-500 shadow-sm focus:outline-none transition-all"
                  value={currentUnit}
                  onChange={(e) => handleGridUnitChange(item.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                >
                  {firstVariantUnits.map((unitName) => (
                    <option key={unitName} value={unitName}>
                      {unitName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ACTION BUTTONS (FOOTER CARD) */}
            {/* WOI BACKEND JORDY: handleDeleteInventory memanggil DELETE /api/inventory/{id} */}
            {/* WOI BACKEND JORDY: handleToggleStatus memanggil PUT /api/inventory/{id}/status */}
            <div className="flex flex-col text-white font-bold text-xs md:text-sm">
              <div className="grid grid-cols-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteInventory(item.id); }}
                  className="bg-red-600 hover:bg-red-700 py-2.5 flex items-center justify-center gap-1 transition-colors border-r border-red-700"
                >
                  <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" /> Hapus
                </button>

                {item.status === 'ACTIVE' ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleStatus(item.id, 'ACTIVE'); }}
                    className="bg-[#E95318] hover:bg-orange-600 py-2.5 flex items-center justify-center gap-1 transition-colors"
                  >
                    <EyeOff className="w-3.5 h-3.5 md:w-4 md:h-4" /> Non-Aktif
                  </button>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleStatus(item.id, 'NON_ACTIVE'); }}
                    className="bg-green-600 hover:bg-green-700 py-2.5 flex items-center justify-center gap-1 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5 md:w-4 md:h-4" /> Aktifkan
                  </button>
                )}
              </div>

              <button
                className="bg-[#3FA2F6] hover:bg-blue-600 py-3 flex items-center justify-center gap-1 transition-colors w-full"
                onClick={() => setSelectedInventoryItem(item)}
              >
                Lihat Detail Stok
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default InventoryGridViewTab;