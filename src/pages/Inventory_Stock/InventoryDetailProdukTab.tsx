// src/pages/Inventory/tabs/InventoryDetailProdukTab.tsx
import React from 'react';
import { X, Image as ImageIcon, ArrowLeft, Store } from 'lucide-react';
import type { InventoryItem, InventoryVariant, UnitConversion } from '../../types/index';

interface InventoryDetailProdukTabProps {
  item: InventoryItem;
  onClose: () => void;
  modalStockUnits: Record<number, string>;
  setModalStockUnits: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  modalPriceUnits: Record<number, string>;
  setModalPriceUnits: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  getDisplayStock: (v: InventoryVariant, unit: string) => Record<string, number>;
  getConvertedPrice: (v: InventoryVariant, unit: string, priceType: 'purchase' | 'sales') => number;
  getAvailableUnits: (v: InventoryVariant) => string[];
  getSortedUnits: (v: InventoryVariant) => UnitConversion[];
  formatRupiah: (num: number) => string;
}

// WOI BACKEND JORDY: Component ini hanya untuk READ/VIEW detail produk
// Data sudah di-fetch dari parent (InventoryPage), tidak ada operasi CRUD di sini
const InventoryDetailProdukTab: React.FC<InventoryDetailProdukTabProps> = ({
  item,
  onClose,
  modalStockUnits,
  setModalStockUnits,
  modalPriceUnits,
  setModalPriceUnits,
  getDisplayStock,
  getConvertedPrice,
  getAvailableUnits,
  getSortedUnits,
  formatRupiah,
}) => {
  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-white/90 backdrop-blur-sm animate-in fade-in duration-200 p-4 md:p-8" 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full max-w-5xl h-full max-h-[90vh] shadow-2xl border border-gray-300 rounded-3xl flex flex-col overflow-hidden relative">
        
        {/* HEADER MODAL */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50 relative">
           <h2 className="text-2xl font-bold text-black flex-1 text-center pl-10">{item.name}</h2>
           <button onClick={onClose} className="p-2 bg-white rounded-full shadow-sm hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors">
               <X className="w-6 h-6"/>
           </button>
        </div>

        {/* BODY (Scrollable Area) */}
        <div className="p-8 overflow-y-auto flex-1 space-y-8">
           
           {/* GAMBAR PRODUK */}
           <div className="flex justify-center gap-8">
               {[1, 2, 3].map((_, idx) => (
                   <div key={idx} className="flex flex-col items-center">
                       <div className="w-32 h-32 border border-black rounded-lg flex items-center justify-center bg-white shadow-sm overflow-hidden">
                           {idx === 0 ? <img src={item.image} alt={item.name} className="w-full h-full object-contain"/> : <ImageIcon className="w-10 h-10 text-gray-300"/>}
                       </div>
                       <span className="text-xs font-bold mt-2 text-gray-500">Foto {idx + 1}</span>
                   </div>
               ))}
           </div>

           {/* INFO KONVERSI UNIT */}
           <div>
               <h3 className="font-bold text-lg underline mb-3 text-gray-800">Info Konversi Unit</h3>
               <div className="border border-gray-400 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 border-b border-gray-400 font-bold text-gray-700">
                            <tr>
                                <th className="px-6 py-3">Unit Besar</th>
                                <th className="px-6 py-3 text-center">=</th>
                                <th className="px-6 py-3">Unit Kecil (Default Unit)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {item.variants.length > 0 && item.variants[0].unitConversions
                              .filter(uc => uc.sourceConversion !== undefined) // Only show non-default units
                              .sort((a, b) => (b.qtyConversion || 1) - (a.qtyConversion || 1)) // Sort descending
                              .map((uc, idx) => {
                                const defaultUnit = item.variants[0].unitConversions.find(u => u.sourceConversion === undefined);
                                const defaultUnitName = defaultUnit?.name || 'Unit Default';
                                return (
                                  <tr key={idx}>
                                    <td className="px-6 py-3 font-medium">1 {uc.name}</td>
                                    <td className="px-6 py-3 text-center text-gray-400"><ArrowLeft className="w-4 h-4 inline rotate-180"/></td>
                                    <td className="px-6 py-3 font-bold text-blue-600">{uc.qtyConversion} {defaultUnitName}</td>
                                  </tr>
                                );
                              })}
                            {(!item.variants.length || !item.variants[0].unitConversions || 
                              item.variants[0].unitConversions.filter(uc => uc.sourceConversion !== undefined).length === 0) && (
                              <tr>
                                <td colSpan={3} className="px-6 py-3 text-center text-gray-500">Tidak ada konversi unit</td>
                              </tr>
                            )}
                        </tbody>
                    </table>
               </div>
           </div>

           {/* TABEL STOK */}
           <div>
               <h3 className="font-bold text-lg underline mb-3 text-gray-800">Stok</h3>
               <div className="border border-gray-400 rounded-xl overflow-hidden shadow-sm">
                   <table className="w-full text-xs">
                       <thead className="bg-gray-100 border-b border-gray-400 font-bold text-gray-700 text-left">
                           <tr>
                               <th className="px-4 py-3 w-1/4">Variasi</th>
                               <th className="px-4 py-3 w-1/6">Unit</th> 
                               <th className="px-4 py-3 text-center w-auto">Stok (Converted)</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-200 bg-white">
                           {item.variants.map((v, idx) => {
                               const availableUnits = getAvailableUnits(v);
                               const sortedUnits = getSortedUnits(v);
                               const defaultUnit = availableUnits.length > 0 ? availableUnits[0] : '';
                               const unit = modalStockUnits[idx] || defaultUnit; 
                               const stockDisplay = getDisplayStock(v, unit); 

                               return (
                                   <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                                       <td className="px-4 py-4 font-bold text-gray-800 align-middle text-sm">
                                           {v.name}
                                       </td>
                                       <td className="px-4 py-4 align-middle">
                                           <select 
                                                value={unit}
                                                onChange={(e) => setModalStockUnits(prev => ({...prev, [idx]: e.target.value}))}
                                                className="w-full border border-gray-300 rounded-full px-3 py-1.5 text-xs bg-white cursor-pointer hover:border-blue-500 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-200"
                                           >
                                               {availableUnits.map((unitName) => (
                                                 <option key={unitName} value={unitName}>
                                                   {unitName}
                                                 </option>
                                               ))}
                                           </select>
                                       </td>
                                       <td className="px-4 py-4 align-middle">
                                           <div className={`grid gap-8 w-full px-8 ${sortedUnits.length <= 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                                               {sortedUnits.map((unitConversion) => {
                                                 const qty = stockDisplay[unitConversion.name] || 0;
                                                 return (
                                                   <div 
                                                     key={unitConversion.name}
                                                     className={`text-center font-bold text-sm ${qty > 0 ? 'text-green-600' : 'text-red-500'}`}
                                                   >
                                                     {qty} {unitConversion.name}
                                                   </div>
                                                 );
                                               })}
                                           </div>
                                       </td>
                                   </tr>
                               )
                           })}
                       </tbody>
                   </table>
               </div>
           </div>

           {/* TABEL HARGA */}
           <div>
               <h3 className="font-bold text-lg underline mb-3 text-gray-800">Harga</h3>
               <div className="border border-gray-400 rounded-xl overflow-hidden shadow-sm">
                   <table className="w-full text-xs">
                       <thead className="bg-gray-100 border-b border-gray-400 font-bold text-left text-gray-700">
                           <tr>
                               <th className="px-4 py-2">Variasi</th>
                               <th className="px-4 py-2">Unit <Store className="w-3 h-3 inline ml-1"/></th>
                               <th className="px-4 py-2 text-right">Harga Modal</th>
                               <th className="px-4 py-2 text-right">Harga Jual</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-200 bg-white">
                           {item.variants.map((v, idx) => {
                               const availableUnits = getAvailableUnits(v);
                               const defaultUnit = availableUnits.length > 0 ? availableUnits[0] : '';
                               const unit = modalPriceUnits[idx] || defaultUnit;
                               return (
                                   <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                                       <td className="px-4 py-2 font-bold text-gray-800">{v.name}</td>
                                       <td className="px-4 py-2 w-48">
                                           <select 
                                                value={unit}
                                                onChange={(e) => setModalPriceUnits(prev => ({...prev, [idx]: e.target.value}))}
                                                className="w-full border border-gray-300 rounded-full px-2 py-1 text-xs bg-white cursor-pointer hover:border-blue-500 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-200"
                                           >
                                               {availableUnits.map((unitName) => (
                                                 <option key={unitName} value={unitName}>
                                                   {unitName}
                                                 </option>
                                               ))}
                                           </select>
                                       </td>
                                       <td className="px-4 py-2 text-right text-red-600 font-bold text-sm">
                                           {formatRupiah(getConvertedPrice(v, unit, 'purchase'))}
                                       </td>
                                       <td className="px-4 py-2 text-right text-green-600 font-bold text-sm">
                                           {formatRupiah(getConvertedPrice(v, unit, 'sales'))}
                                       </td>
                                   </tr>
                               )
                           })}
                       </tbody>
                   </table>
               </div>
           </div>

        </div>

        {/* FOOTER MODAL */}
        <div className="p-6 border-t flex justify-center bg-gray-50 z-20 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
            <button onClick={onClose} className="bg-[#BEDFFF] text-black text-xl font-bold px-12 py-3 rounded-full hover:bg-blue-300 shadow-lg flex gap-2 items-center transition-transform active:scale-95">
                Tutup
            </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryDetailProdukTab;