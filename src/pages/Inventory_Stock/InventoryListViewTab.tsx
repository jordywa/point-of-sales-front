// src/pages/Inventory/tabs/InventoryListViewTab.tsx
import React from 'react';
import { Package, Store, Trash2, EyeOff, Check } from 'lucide-react';
import type { InventoryItem, InventoryVariant, UnitConversion } from '../../types/index';

interface InventoryListViewTabProps {
  items: InventoryItem[];
  listUnitState: Record<string, string>;
  handleListUnitChange: (itemId: string, variantIdx: number, newUnit: string) => void;
  getDisplayStock: (v: InventoryVariant, unit: string) => Record<string, number>;
  getAvailableUnits: (v: InventoryVariant) => string[];
  getSortedUnits: (v: InventoryVariant) => UnitConversion[];
  setSelectedInventoryItem: (item: InventoryItem) => void;
  handleDeleteInventory: (id: string) => void;
  handleToggleStatus: (id: string, currentStatus: string) => void;
}

const InventoryListViewTab: React.FC<InventoryListViewTabProps> = ({
  items,
  listUnitState,
  handleListUnitChange,
  getDisplayStock,
  getAvailableUnits,
  getSortedUnits,
  setSelectedInventoryItem,
  handleDeleteInventory,
  handleToggleStatus,
}) => {
  return (
    <div className="bg-white border border-black rounded-lg overflow-hidden">
      {/* HEADER TABEL */}
      <div className="grid grid-cols-12 bg-white border-b border-black font-bold p-3 text-sm">
        <div className="col-span-4 flex items-center gap-2">
          Nama Produk <Package className="w-4 h-4" />
        </div>
        <div className="col-span-2 flex items-center gap-2">
          Unit <Store className="w-4 h-4" />
        </div>
        <div className="col-span-2">Variasi</div>
        <div className="col-span-4 text-center">Stok</div>
      </div>

      {/* ISI TABEL */}
      {items.map((item) => {
        return (
          <div onClick={() => setSelectedInventoryItem(item)} key={item.id} className="border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="grid grid-cols-12 p-3 text-sm items-start">
              {/* KOLOM NAMA PRODUK */}
              <div
                className="col-span-4 font-bold flex gap-4 items-center group"
              >
                <span className="text-base text-gray-800 pl-2 underline decoration-transparent transition-all">
                  {item.name}
                </span>
              </div>

              {/* KOLOM VARIASI DAN STOK */}
              <div className="col-span-8">
                {item.variants.map((v, idx) => {
                  const availableUnits = getAvailableUnits(v);
                  const sortedUnits = getSortedUnits(v);
                  // Ambil unit yang dipilih dari state parent, default ke unit pertama atau unit terbesar
                  const defaultUnit = availableUnits.length > 0 ? availableUnits[0] : '';
                  const currentUnit = listUnitState[`list-${item.id}-${idx}`] || defaultUnit;
                  const stockDisplay = getDisplayStock(v, currentUnit);

                  return (
                    <div key={idx} className="grid grid-cols-8 mb-4 last:mb-0 items-center">
                      {/* SELECT UNIT */}
                      <div className="col-span-2 pr-4">
                        <select
                          value={currentUnit}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleListUnitChange(item.id, idx, e.target.value)}
                          className="border border-black rounded px-2 py-1 text-sm bg-white w-full cursor-pointer hover:border-blue-500 shadow-sm focus:outline-none"
                        >
                          {availableUnits.map((unitName) => (
                            <option key={unitName} value={unitName}>
                              {unitName}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* NAMA VARIASI */}
                      <div className="col-span-2 font-bold px-2 text-base">{v.name}</div>

                      {/* DISPLAY STOK (Converted) - Dinamis berdasarkan unit yang ada */}
                      <div
                        className={`col-span-4 grid gap-2 text-sm font-bold text-right hover:opacity-70 ${sortedUnits.length <= 3 ? 'grid-cols-3' : 'grid-cols-4'}`}
                      >
                        {sortedUnits.map((unitConversion) => {
                          const qty = stockDisplay[unitConversion.name] || 0;
                          return (
                            <span 
                              key={unitConversion.name}
                              className={qty === 0 ? "text-red-500" : "text-green-600"}
                            >
                              {qty} {unitConversion.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* ACTION BUTTONS (DELETE & TOGGLE STATUS) */}
                {/* WOI BACKEND JORDY: handleDeleteInventory memanggil DELETE /api/inventory/{id} */}
                {/* WOI BACKEND JORDY: handleToggleStatus memanggil PUT /api/inventory/{id}/status */}
                <div className="mt-4 flex justify-end gap-2 border-t border-dashed border-gray-300 pt-3">
                  {/* <button
                    onClick={() => handleDeleteInventory(item.id)}
                    className="bg-red-600 text-white px-3 py-1.5 rounded flex items-center gap-1 hover:bg-red-700 transition-colors text-xs font-bold shadow-sm"
                  >
                    <Trash2 className="w-3 h-3" /> Delete Produk
                  </button> */}
                  
                  {item.status === 'ACTIVE' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleStatus(item.id, item.status)
                      }}
                      className="bg-[#E95318] text-white px-3 py-1.5 rounded flex items-center gap-1 hover:bg-orange-600 transition-colors text-xs font-bold shadow-sm"
                    >
                      <EyeOff className="w-3 h-3" /> Non-Aktifkan
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleStatus(item.id, item.status)
                      }}
                      className="bg-green-600 text-white px-3 py-1.5 rounded flex items-center gap-1 hover:bg-green-700 transition-colors text-xs font-bold shadow-sm"
                    >
                      <Check className="w-3 h-3" /> Aktifkan
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default InventoryListViewTab;