// src/pages/MasterSetting/tabs/TaxTab.tsx

import React, { useState, useEffect } from 'react';
import { Plus, Edit, X as XIcon, Save, Percent } from 'lucide-react';

interface TaxData {
    id: number;
    name: string;
    percentage: number;
    status: 'Aktif' | 'Tidak Aktif';
}

const TaxTab: React.FC = () => {
  const [isTaxEditing, setIsTaxEditing] = useState(false);
  const [taxes, setTaxes] = useState<TaxData[]>([
      { id: 1, name: "PPN", percentage: 11, status: "Tidak Aktif" },
  ]);
  const [taxForm, setTaxForm] = useState<TaxData>({ id: 0, name: "", percentage: 0, status: "Aktif" });

  useEffect(() => {
      const defaultTax = taxes.find(t => t.status === 'Aktif') || taxes[0];
      if(defaultTax) setTaxForm(defaultTax);
      setIsTaxEditing(false);
  }, []);

  const handleSelectTaxRow = (tax: TaxData) => { if (!isTaxEditing) setTaxForm(tax); };
  const handleAddTax = () => { setTaxForm({ id: 0, name: "", percentage: 0, status: "Aktif" }); setIsTaxEditing(true); };
  const handleEditTax = () => setIsTaxEditing(true);
  const handleCancelTax = () => { setIsTaxEditing(false); const current = taxForm.id === 0 ? taxes[0] : taxes.find(t => t.id === taxForm.id); if(current) setTaxForm(current); };
  
  const handleSaveTax = () => { 
      let updatedTaxes = [...taxes];
      // Logika: Jika status Aktif, matikan tax lain (Asumsi hanya 1 tax aktif utama)
      if (taxForm.status === 'Aktif') {
          updatedTaxes = updatedTaxes.map(t => ({ ...t, status: 'Tidak Aktif' }));
      }
      if(taxForm.id === 0) {
          const newId = Date.now();
          updatedTaxes.push({...taxForm, id: newId});
          setTaxForm({...taxForm, id: newId});
      } else {
          updatedTaxes = updatedTaxes.map(t => t.id === taxForm.id ? taxForm : t);
      }
      setTaxes(updatedTaxes);
      setIsTaxEditing(false); 
      alert("Data Tax Berhasil Disimpan!"); 
  };

  return (
     // FIX: Hapus h-full agar scroll mengikuti konten
     <div className="space-y-6 max-w-4xl animate-in fade-in flex flex-col p-1 pb-20 mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6 uppercase tracking-wider">TAX (PAJAK)</h2>
        
        {/* FORM INPUT AREA */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
             {/* ADAPTIF */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div>
                    <label className="block text-gray-800 font-medium mb-2 flex items-center gap-2">
                        <Percent className="w-4 h-4"/> Tax Name
                    </label>
                    <input type="text" disabled={!isTaxEditing} value={taxForm.name} onChange={(e) => setTaxForm({...taxForm, name: e.target.value})} className={`w-full border rounded-full px-4 py-2 focus:outline-none transition-colors ${isTaxEditing ? 'border-gray-400 focus:border-blue-500 bg-white' : 'border-transparent bg-gray-100 text-gray-600 cursor-not-allowed'}`} placeholder="Contoh: PPN 11%"/>
                </div>
                <div>
                    <label className="block text-gray-800 font-medium mb-2">Percentage (%)</label>
                    <input type="number" disabled={!isTaxEditing} value={taxForm.percentage} onChange={(e) => setTaxForm({...taxForm, percentage: parseFloat(e.target.value)})} className={`w-full border rounded-full px-4 py-2 focus:outline-none transition-colors ${isTaxEditing ? 'border-gray-400 focus:border-blue-500 bg-white' : 'border-transparent bg-gray-100 text-gray-600 cursor-not-allowed'}`} />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-6">
                <div className="hidden md:block"></div>
                 <div>
                    <label className="block text-gray-800 font-medium mb-2">Status</label>
                    <div className="flex gap-4 items-center">
                        <button disabled={!isTaxEditing} onClick={() => setTaxForm({...taxForm, status: 'Aktif'})} className={`flex-1 md:flex-none px-6 py-2 rounded-full font-medium border transition-colors ${taxForm.status === 'Aktif' ? 'bg-green-300 border-green-400 text-black' : 'bg-white border-gray-400 text-black hover:bg-gray-50'} ${!isTaxEditing && taxForm.status !== 'Aktif' ? 'opacity-50 cursor-not-allowed' : ''}`}>Aktif</button>
                        <button disabled={!isTaxEditing} onClick={() => setTaxForm({...taxForm, status: 'Tidak Aktif'})} className={`flex-1 md:flex-none px-6 py-2 rounded-full font-medium border transition-colors ${taxForm.status === 'Tidak Aktif' ? 'bg-red-300 border-red-400 text-black' : 'bg-white border-gray-400 text-black hover:bg-gray-50'} ${!isTaxEditing && taxForm.status !== 'Tidak Aktif' ? 'opacity-50 cursor-not-allowed' : ''}`}>Tidak Aktif</button>
                    </div>
                </div>
            </div>
        </div>

        {/* BUTTON ACTIONS */}
        <div className="flex flex-wrap justify-center gap-4">
            {!isTaxEditing ? (
                <>
                    <button onClick={handleAddTax} className="bg-[#BEDFFF] hover:bg-blue-300 text-black px-8 md:px-12 py-3 rounded-full flex items-center gap-2 text-lg md:text-xl font-medium shadow-md transition-transform hover:scale-105"><Plus className="w-6 h-6"/> Tambah</button>
                    <button onClick={handleEditTax} className="bg-[#FFE167] hover:bg-yellow-400 text-black px-8 md:px-12 py-3 rounded-full flex items-center gap-2 text-lg md:text-xl font-medium shadow-md transition-transform hover:scale-105"><Edit className="w-6 h-6"/> Edit</button>
                </>
            ) : (
                <>
                    <button onClick={handleCancelTax} className="bg-[#A5CEF2] hover:bg-blue-200 text-black px-6 md:px-8 py-3 rounded-full flex items-center gap-2 text-lg md:text-xl font-medium shadow-md transition-transform hover:scale-105"><XIcon className="w-6 h-6"/> Batalkan</button>
                    <button onClick={handleSaveTax} className="bg-[#BEDFFF] hover:bg-blue-300 text-black px-6 md:px-8 py-3 rounded-full flex items-center gap-2 text-lg md:text-xl font-medium shadow-md transition-transform hover:scale-105"><Save className="w-6 h-6 font-bold"/> Simpan</button>
                </>
            )}
        </div>

        {/* TABLE LIST - FIX RESPONSIVE */}
        <div className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm flex flex-col">
            <div className="bg-gray-100 border-b border-gray-200 px-4 py-3 font-bold text-gray-700 text-sm">
                Daftar Pajak
            </div>
            
            <div className="overflow-x-auto w-full">
                <table className="w-full text-sm text-left min-w-[600px]">
                    <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-xs border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3">Tax Name</th>
                            <th className="px-4 py-3 text-center">Percentage</th>
                            <th className="px-4 py-3 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {taxes.map(tax => (
                            <tr 
                                key={tax.id} 
                                onClick={() => handleSelectTaxRow(tax)} 
                                className={`cursor-pointer transition-colors hover:bg-blue-50 ${taxForm?.id === tax.id ? 'bg-blue-100' : ''}`}
                            >
                                <td className="px-4 py-3 font-medium text-gray-800">{tax.name}</td>
                                <td className="px-4 py-3 text-center text-gray-800">{tax.percentage}%</td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`px-4 py-1 rounded-full text-xs font-bold ${tax.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {tax.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default TaxTab;