// src/pages/Inventory/InventoryTambahProduk.tsx
import React from 'react';
import { Plus, X, Loader2, Image as ImageIcon, Save } from 'lucide-react';
import type { UnitConversion } from '../../types';

interface InventoryTambahProdukProps {
  setIsAddProductPage: (isOpen: boolean) => void;
  isUploading: boolean;
  newProductImages: (File | null)[];
  handleImageUpload: (index: number, file: File) => void;
  newProductName: string;
  setNewProductName: (name: string) => void;
  unitConversions: UnitConversion[];
  updateConversion: (index: number, field: string, val: any) => void;
  handleRemoveConversion: (index: number) => void;
  handleAddConversion: () => void;
  newProductVariants: { name: string }[];
  updateVariant: (index: number, val: string) => void;
  handleRemoveVariant: (index: number) => void;
  handleAddVariant: () => void;
  newProductPrices: Record<string, { modal: number; jual: number }>;
  updatePrice: (variantIdx: number, unit: string, type: 'modal' | 'jual', value: number) => void;
  handleSaveNewProduct: () => void;
  setDefaultProductData: () => void;
}

const InventoryTambahProduk: React.FC<InventoryTambahProdukProps> = ({
  setIsAddProductPage,
  isUploading,
  newProductImages,
  handleImageUpload,
  newProductName,
  setNewProductName,
  unitConversions,
  updateConversion,
  handleRemoveConversion,
  handleAddConversion,
  newProductVariants,
  updateVariant,
  handleRemoveVariant,
  handleAddVariant,
  newProductPrices,
  updatePrice,
  handleSaveNewProduct,
  setDefaultProductData
}) => {
  // Helper internal untuk mendapatkan unit unik dari konversi
  const getUniqueUnits = () => {
    const units = new Set<string>();
    unitConversions.forEach(c => {
      if (c.name) units.add(c.name);
    });
    return Array.from(units);
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-white/90 backdrop-blur-sm animate-in fade-in duration-200 p-4 md:p-8" onClick={(e) => {
        if (e.target === e.currentTarget) {
            setIsAddProductPage(false);
            setDefaultProductData();
        }
    }}>
        {isUploading && (
          <div className="absolute inset-0 z-100 bg-black/60 flex flex-col items-center justify-center text-white rounded-3xl">
            <Loader2 className="w-16 h-16 animate-spin mb-4 text-[#3FA2F6]" />
            <h2 className="text-2xl font-bold">Menyimpan Produk...</h2>
          </div>
        )}
        
        <div className="bg-white w-full max-w-5xl h-full max-h-[90vh] shadow-2xl border border-gray-300 rounded-3xl flex flex-col overflow-hidden relative">
            {/* Header Modal */}
            <div className="bg-white p-4 border-b border-gray-200 flex items-center justify-between shadow-sm z-10">
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Plus className="w-6 h-6 text-blue-600"/> Tambah Produk Baru
                </h1>
                <button onClick={() => {
                    setIsAddProductPage(false)
                    setDefaultProductData()
                }} className="p-2 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-full transition-colors">
                  <X className="w-6 h-6"/>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 pb-32">
                <div className="max-w-5xl mx-auto w-full space-y-10">
                    {/* FOTO PRODUK */}
                    <div className="flex justify-center gap-8">
                        {newProductImages.map((img, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-2">
                                <div 
                                  className="w-32 h-32 border-2 border-dashed border-gray-400 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 bg-white relative overflow-hidden" 
                                  onClick={() => document.getElementById(`img-upload-${idx}`)?.click()}
                                >
                                    {img ? <img src={URL.createObjectURL(img)} alt={`Upload ${idx}`} className="w-full h-full object-contain" /> : (
                                        <>
                                            <ImageIcon className="w-8 h-8 text-gray-400 mb-2"/>
                                            <span className="text-[10px] text-gray-500">Foto {idx + 1}</span>
                                        </>
                                    )}
                                    <input 
                                      type="file" 
                                      id={`img-upload-${idx}`} 
                                      className="hidden" 
                                      accept="image/*" 
                                      onChange={(e) => e.target.files && handleImageUpload(idx, e.target.files[0])}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* NAMA PRODUK */}
                    <div>
                        <label className="block font-bold mb-2 text-gray-800">Nama Produk*</label>
                        <input 
                          type="text" 
                          placeholder="Masukan nama produk" 
                          value={newProductName} 
                          onChange={(e) => setNewProductName(e.target.value)} 
                          className="w-full border border-gray-400 rounded-full px-4 py-2 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* UNIT CONVERSION & VARIASI */}
                    <div className="flex justify-center items-center">
                        {/* LEFT: UNIT CONVERSION */}
                        <div className='w-full'>
                            <h3 className="font-bold text-lg mb-4 text-gray-800 border-b pb-2">Unit Conversion</h3>
                            <div className="space-y-3">
                                {unitConversions.map((conv, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <div className="border border-gray-400 rounded-full px-4 py-1 text-center font-bold bg-gray-100">1</div>
                                        <input 
                                          type="text" 
                                          placeholder="Unit" 
                                          value={conv.name} 
                                          onChange={(e) => updateConversion(idx, 'name', e.target.value)} 
                                          className={`border border-gray-400 rounded-full px-4 py-1 w-full text-sm` }
                                        />
                                        <span className="font-bold">=</span>
                                        {conv.sourceConversion && <input 
                                          type="number" 
                                          value={conv.qtyConversion || '0'} 
                                          onChange={(e) => updateConversion(idx, 'qtyConversion', e.target.value)} 
                                          className={`border border-black rounded-full px-2 py-1 w-20 text-center`}
                                        />}
                                        {!conv.sourceConversion && <input 
                                          type="number"  
                                          value={conv.qtyConversion}
                                          className={`bg-gray-200 rounded-full px-2 py-1 w-20 text-center`}
                                          disabled={true}
                                        />}
                                        {
                                        !conv.sourceConversion && <input 
                                          type="text" 
                                          placeholder="..." 
                                          value={conv.name} 
                                          onChange={(e) => updateConversion(idx, 'sourceConversion', e.target.value)} 
                                          className="bg-gray-200 rounded-full px-4 py-1 w-full text-sm"
                                          disabled={true}
                                        /> 
                                        }
                                        {conv.sourceConversion && <input 
                                          type="text" 
                                          placeholder="..." 
                                          value={unitConversions[0].name} 
                                          onChange={(e) => updateConversion(idx, 'sourceConversion', e.target.value)} 
                                          className="bg-gray-200 rounded-full px-4 py-1 w-full text-sm"
                                          disabled={true}
                                        />}
                                        {unitConversions.length > 1 && conv.sourceConversion && (
                                          <button onClick={() => handleRemoveConversion(idx)} className="text-red-500 hover:bg-red-50 rounded-full p-1">
                                            <X className="w-4 h-4"/>
                                          </button>
                                        )}
                                        {!conv.sourceConversion && (
                                          <div className="text-white rounded-full p-1">
                                            <X className="w-4 h-4"/>
                                          </div>
                                        )}
                                    </div>
                                ))}
                                <button onClick={handleAddConversion} className="mt-2 border border-dashed border-gray-400 text-gray-500 px-6 py-1 rounded-full text-sm font-semibold hover:bg-gray-50 w-full">+ tambah unit baru</button>
                            </div>
                        </div>

                        {/* RIGHT: VARIASI PRODUK */}
                        {/* <div>
                            <h3 className="font-bold text-lg mb-4 text-gray-800 border-b pb-2">Variasi Produk</h3>
                            <div className="space-y-3">
                                {newProductVariants.map((v, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <input 
                                          type="text" 
                                          placeholder={`Ukuran ${idx + 1}...`} 
                                          value={v.name} 
                                          onChange={(e) => updateVariant(idx, e.target.value)} 
                                          className="w-full border border-gray-400 rounded-full px-4 py-2 focus:outline-none focus:border-blue-500"
                                        />
                                        {newProductVariants.length > 1 && <button onClick={() => handleRemoveVariant(idx)} className="text-red-500"><X/></button>}
                                    </div>
                                ))}
                                <button onClick={handleAddVariant} className="w-full border border-dashed border-gray-400 text-gray-500 rounded-full px-4 py-2 text-left hover:bg-gray-50">+ Variasi</button>
                            </div>
                        </div> */}
                    </div>

                    {/* HARGA TABLE (DYNAMIC GENERATED) */}
                    <div>
                        <h3 className="font-bold text-lg mb-4 text-gray-800 border-b pb-2">Harga Jual & Modal</h3>
                        <div className="border border-gray-400 rounded-lg overflow-hidden shadow-sm">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-400">
                                    <tr>
                                        {/* <th className="px-4 py-3">Variasi</th> */}
                                        <th className="px-4 py-3">Unit</th>
                                        <th className="px-4 py-3 text-right">Harga Modal</th>
                                        <th className="px-4 py-3 text-right">Harga Jual</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {newProductVariants.map((v, vIdx) => {
                                        const uniqueUnits = getUniqueUnits();
                                        if (uniqueUnits.length === 0) return null;

                                        return uniqueUnits.map((unit) => {
                                            const priceKey = `${vIdx}-${unit}`;
                                            const prices = newProductPrices[priceKey] || { modal: 0, jual: 0 };

                                            return (
                                                <tr key={priceKey} className="hover:bg-gray-50 transition-colors">
                                                    {/* <td className="px-4 py-3 font-bold">{v.name || <span className="text-gray-400 italic">Nama variasi...</span>}</td> */}
                                                    <td className="px-4 py-3">
                                                        <div className="border border-gray-400 rounded-full px-3 py-1 bg-white text-xs w-fit shadow-sm font-bold text-gray-700">
                                                            {unit || "Unit..."}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">Rp</span>
                                                            <input 
                                                                type="number" 
                                                                value={prices.modal || ''} 
                                                                onChange={(e) => updatePrice(vIdx, unit, 'modal', parseFloat(e.target.value))}
                                                                className="w-full border border-gray-300 rounded-full py-1 pl-8 pr-3 text-right text-red-600 font-bold focus:outline-none focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">Rp</span>
                                                            <input 
                                                                type="number" 
                                                                value={prices.jual || ''} 
                                                                onChange={(e) => updatePrice(vIdx, unit, 'jual', parseFloat(e.target.value))}
                                                                className="w-full border border-gray-300 rounded-full py-1 pl-8 pr-3 text-right text-green-600 font-bold focus:outline-none focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        });
                                    })}
                                    {newProductVariants.length > 0 && getUniqueUnits().length === 0 && (
                                        <tr><td colSpan={4} className="p-4 text-center text-gray-400 italic">Tambahkan unit konversi terlebih dahulu untuk mengatur harga.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tombol Simpan (Floating Footer) */}
            {/* WOI BACKEND JORDY: handleSaveNewProduct akan memanggil POST /api/inventory untuk menyimpan produk baru */}
            <div className="absolute bottom-0 left-0 w-full bg-white/80 backdrop-blur-sm border-t p-6 flex justify-center z-20">
                <button onClick={handleSaveNewProduct} className="bg-[#BEDFFF] text-black text-2xl font-bold px-12 py-3 rounded-full hover:bg-blue-300 shadow-xl flex items-center gap-3">
                    <Save className="w-8 h-8"/> Simpan
                </button>
            </div>
        </div>
    </div>
  );
};

export default InventoryTambahProduk;