// src/pages/MasterSetting/tabs/DiscountTab.tsx

import React, { useState, useEffect } from 'react';
import { Plus, Edit, X as XIcon, Save, Calendar, Tag } from 'lucide-react';

interface DiscountData {
    id: number;
    name: string;
    type: 'PERSEN' | 'NOMINAL';
    value: number;
    startDate: string;
    endDate: string;
    minPurchase: number;
    status: 'Aktif' | 'Tidak Aktif';
}

const DiscountTab: React.FC = () => {
  const [isDiscountEditing, setIsDiscountEditing] = useState(false);
  const [discounts, setDiscounts] = useState<DiscountData[]>([]);
  const [discountForm, setDiscountForm] = useState<DiscountData>({ 
      id: 0, name: "", type: "PERSEN", value: 0, startDate: "", endDate: "", minPurchase: 0, status: "Aktif" 
  });

  // Format Rupiah Helper
  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  useEffect(() => {
      const defaultDisc = discounts.find(d => d.status === 'Aktif') || discounts[0];
      if(defaultDisc) setDiscountForm(defaultDisc);
      setIsDiscountEditing(false);
  }, []);

  const handleSelectDiscountRow = (disc: DiscountData) => { if (!isDiscountEditing) setDiscountForm(disc); };
  const handleAddDiscount = () => { setDiscountForm({ id: 0, name: "", type: "PERSEN", value: 0, startDate: "", endDate: "", minPurchase: 0, status: "Aktif" }); setIsDiscountEditing(true); };
  const handleEditDiscount = () => setIsDiscountEditing(true);
  const handleCancelDiscount = () => { setIsDiscountEditing(false); const current = discountForm.id === 0 ? discounts[0] : discounts.find(d => d.id === discountForm.id); if(current) setDiscountForm(current); };
  const handleSaveDiscount = () => { 
      if (discountForm.id === 0) {
          const newId = Date.now();
          setDiscounts([...discounts, {...discountForm, id: newId}]);
          setDiscountForm({...discountForm, id: newId});
      } else {
          setDiscounts(prev => prev.map(d => d.id === discountForm.id ? discountForm : d)); 
      }
      setIsDiscountEditing(false); 
      alert("Data Diskon Berhasil Disimpan!"); 
  };

  return (
     // FIX: Hapus h-full, tambah pb-20 agar scroll aman
     <div className="space-y-6 max-w-4xl animate-in fade-in flex flex-col p-1 pb-20 mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6 uppercase tracking-wider">DISKON & PROMO</h2>
        
        {/* FORM INPUT AREA */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
             {/* ROW 1: NAMA & TANGGAL */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-4">
                <div>
                    <label className="block text-gray-800 font-medium mb-2 flex items-center gap-2"><Tag className="w-4 h-4"/> Nama Diskon</label>
                    <input type="text" disabled={!isDiscountEditing} value={discountForm.name} onChange={(e) => setDiscountForm({...discountForm, name: e.target.value})} placeholder="Contoh: Diskon BCA Imlek" className={`w-full border rounded-full px-4 py-2 focus:outline-none transition-colors ${isDiscountEditing ? 'border-gray-400 focus:border-blue-500 bg-white' : 'border-transparent bg-gray-100 text-gray-600 cursor-not-allowed'}`} />
                </div>
                <div>
                    <label className="block text-gray-800 font-medium mb-2 flex items-center gap-2"><Calendar className="w-4 h-4"/> Tanggal berlaku</label>
                    <div className="flex flex-col md:flex-row items-center gap-2">
                        <div className={`flex items-center gap-2 border rounded-full px-4 py-2 w-full ${isDiscountEditing ? 'border-gray-400 bg-white' : 'bg-gray-100 border-transparent'}`}>
                            <input type="date" disabled={!isDiscountEditing} value={discountForm.startDate} onChange={(e) => setDiscountForm({...discountForm, startDate: e.target.value})} className="bg-transparent focus:outline-none w-full text-sm"/>
                        </div>
                        <span className="hidden md:inline text-gray-400 font-bold">—</span>
                        <div className={`flex items-center gap-2 border rounded-full px-4 py-2 w-full ${isDiscountEditing ? 'border-gray-400 bg-white' : 'bg-gray-100 border-transparent'}`}>
                            <input type="date" disabled={!isDiscountEditing} value={discountForm.endDate} onChange={(e) => setDiscountForm({...discountForm, endDate: e.target.value})} className="bg-transparent focus:outline-none w-full text-sm"/>
                        </div>
                    </div>
                </div>
            </div>

            {/* ROW 2: JENIS & MINIMAL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-4">
                <div>
                    <label className="block text-gray-800 font-medium mb-2">Jenis Diskon</label>
                    <div className="flex gap-4">
                        <button disabled={!isDiscountEditing} onClick={() => setDiscountForm({...discountForm, type: 'PERSEN'})} className={`flex-1 px-4 py-2 rounded-full border text-sm font-semibold transition-colors ${discountForm.type === 'PERSEN' ? 'bg-green-200 border-green-400 text-black' : 'bg-white border-gray-400 text-black'}`}>Persentase (%)</button>
                        <button disabled={!isDiscountEditing} onClick={() => setDiscountForm({...discountForm, type: 'NOMINAL'})} className={`flex-1 px-4 py-2 rounded-full border text-sm font-semibold transition-colors ${discountForm.type === 'NOMINAL' ? 'bg-green-200 border-green-400 text-black' : 'bg-white border-gray-400 text-black'}`}>Nominal (Rp)</button>
                    </div>
                </div>
                <div>
                    <label className="block text-gray-800 font-medium mb-2">Minimal Belanja</label>
                    <div className={`relative w-full border rounded-full px-4 py-2 ${isDiscountEditing ? 'border-gray-400 bg-white' : 'bg-gray-100 border-transparent'}`}>
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rp</span>
                        <input type="number" disabled={!isDiscountEditing} value={discountForm.minPurchase} onChange={(e) => setDiscountForm({...discountForm, minPurchase: parseFloat(e.target.value)})} placeholder="0" className="w-full bg-transparent focus:outline-none pl-6 font-mono"/>
                    </div>
                </div>
            </div>

             {/* ROW 3: NILAI & STATUS */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div>
                    <label className="block text-gray-800 font-medium mb-2">{discountForm.type === 'PERSEN' ? 'Persentase Diskon' : 'Nominal Diskon'}</label>
                    <div className={`relative border rounded-full px-4 py-2 ${isDiscountEditing ? 'border-gray-400 bg-white' : 'bg-gray-100 border-transparent'} ${discountForm.type === 'PERSEN' ? 'w-full md:w-32' : 'w-full md:w-48'}`}>
                        {discountForm.type === 'NOMINAL' && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rp</span>}
                        <input 
                            type="number" 
                            disabled={!isDiscountEditing} 
                            value={discountForm.value} 
                            onChange={(e) => setDiscountForm({...discountForm, value: parseFloat(e.target.value)})} 
                            className={`w-full bg-transparent focus:outline-none font-bold ${discountForm.type === 'NOMINAL' ? 'pl-6' : 'text-center'}`}
                        />
                        {discountForm.type === 'PERSEN' && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">%</span>}
                    </div>
                </div>
                <div>
                    <label className="block text-gray-800 font-medium mb-2">Status</label>
                     <div className="flex gap-4 items-center">
                        <button disabled={!isDiscountEditing} onClick={() => setDiscountForm({...discountForm, status: 'Aktif'})} className={`flex-1 px-6 py-2 rounded-full font-medium border transition-colors ${discountForm.status === 'Aktif' ? 'bg-green-300 border-green-400 text-black' : 'bg-white border-gray-400 text-black hover:bg-gray-50'} ${!isDiscountEditing && discountForm.status !== 'Aktif' ? 'opacity-50 cursor-not-allowed' : ''}`}>Aktif</button>
                        <button disabled={!isDiscountEditing} onClick={() => setDiscountForm({...discountForm, status: 'Tidak Aktif'})} className={`flex-1 px-6 py-2 rounded-full font-medium border transition-colors ${discountForm.status === 'Tidak Aktif' ? 'bg-red-300 border-red-400 text-black' : 'bg-white border-gray-400 text-black hover:bg-gray-50'} ${!isDiscountEditing && discountForm.status !== 'Tidak Aktif' ? 'opacity-50 cursor-not-allowed' : ''}`}>Tidak Aktif</button>
                    </div>
                </div>
            </div>
        </div>

        {/* BUTTON ACTIONS */}
        <div className="flex flex-wrap justify-center gap-4">
            {!isDiscountEditing ? (
                <>
                    <button onClick={handleAddDiscount} className="bg-[#BEDFFF] hover:bg-blue-300 text-black px-8 md:px-12 py-3 rounded-full flex items-center gap-2 text-lg md:text-xl font-medium shadow-md transition-transform hover:scale-105"><Plus className="w-6 h-6"/> Tambah</button>
                    <button onClick={handleEditDiscount} className="bg-[#FFE167] hover:bg-yellow-400 text-black px-8 md:px-12 py-3 rounded-full flex items-center gap-2 text-lg md:text-xl font-medium shadow-md transition-transform hover:scale-105"><Edit className="w-6 h-6"/> Edit</button>
                </>
            ) : (
                <>
                    <button onClick={handleCancelDiscount} className="bg-[#A5CEF2] hover:bg-blue-200 text-black px-6 md:px-8 py-3 rounded-full flex items-center gap-2 text-lg md:text-xl font-medium shadow-md transition-transform hover:scale-105"><XIcon className="w-6 h-6"/> Batalkan</button>
                    <button onClick={handleSaveDiscount} className="bg-[#BEDFFF] hover:bg-blue-300 text-black px-6 md:px-8 py-3 rounded-full flex items-center gap-2 text-lg md:text-xl font-medium shadow-md transition-transform hover:scale-105"><Save className="w-6 h-6 font-bold"/> Simpan</button>
                </>
            )}
        </div>

        {/* TABLE LIST - FIX RESPONSIVE */}
        <div className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm flex flex-col">
            <div className="bg-gray-100 border-b border-gray-200 px-4 py-3 font-bold text-gray-700 text-sm">
                Daftar Diskon
            </div>
            
            {/* WRAPPER SCROLL */}
            <div className="overflow-x-auto w-full">
                <table className="w-full text-sm text-left min-w-[700px]">
                    <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-xs border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3">Nama Diskon</th>
                            <th className="px-4 py-3 text-center">Nilai</th>
                            <th className="px-4 py-3 text-center">Periode</th>
                            <th className="px-4 py-3 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {discounts.length === 0 ? (
                             <tr>
                                 <td colSpan={4} className="text-center p-8 text-gray-400 italic">Belum ada data diskon.</td>
                             </tr>
                        ) : (
                            discounts.map(disc => (
                                <tr 
                                    key={disc.id} 
                                    onClick={() => handleSelectDiscountRow(disc)} 
                                    className={`cursor-pointer transition-colors hover:bg-blue-50 ${discountForm?.id === disc.id ? 'bg-blue-100' : ''}`}
                                >
                                    <td className="px-4 py-3 font-medium text-gray-800">{disc.name}</td>
                                    <td className="px-4 py-3 text-center text-gray-800">
                                        {disc.type === 'PERSEN' ? (
                                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded font-bold">{disc.value}%</span>
                                        ) : (
                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold">{formatRupiah(disc.value)}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center text-xs text-gray-600 font-medium">
                                        {disc.startDate || "-"} s/d {disc.endDate || "-"}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-4 py-1 rounded-full text-xs font-bold ${disc.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {disc.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default DiscountTab;