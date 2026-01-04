// src/pages/MasterSetting/tabs/NumberingTab.tsx

import React, { useState, useEffect } from 'react';
import { Edit, Save, X as XIcon } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { doc, onSnapshot, type DocumentData } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import authenticatedAxios from '../../../utils/api';
import { API_BASE_URL } from '../../../apiConfig';
import type { NumberingConfig } from '../../../types';

const NumberingTab: React.FC = () => {
  const { user, userDb } = useAuth();
  const [isNumberingEditing, setIsNumberingEditing] = useState(false);
  
  const defaultNumberingData: NumberingConfig = {
      salesPrefix: "SO",      
      purchasePrefix: "PU",   
      separator: "-",         
      yearFormat: "YYYY",     
      includeDay: false,      
      salesCounter: 1,
      purchaseCounter: 1
  };
  
  const [numberingData, setNumberingData] = useState<NumberingConfig>(defaultNumberingData);
  const [tempNumberingData, setTempNumberingData] = useState<NumberingConfig>(defaultNumberingData);
  const [companyId, setCompanyId] = useState<string>("");

  // Fetch Company data from Firebase (db utama, bukan userDb)
  useEffect(() => {
    if (!user?.companyId) return;
    
    const companyDocRef = doc(db, 'companies', user.companyId);
    
    const unsubscribe = onSnapshot(companyDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const companyData = docSnap.data() as DocumentData;
        setCompanyId(docSnap.id);
        
        // Set numbering data from company
        if (companyData.numbering) {
          setNumberingData(companyData.numbering);
          setTempNumberingData(companyData.numbering);
        } else {
          // Use default if no numbering config exists
          setNumberingData(defaultNumberingData);
          setTempNumberingData(defaultNumberingData);
        }
      }
    }, (err) => {
      console.error('Error fetching company:', err);
    });

    return () => unsubscribe();
  }, [user?.companyId]);

  const getPreviewNumber = (prefix: string, counter: number) => {
      const date = new Date();
      const yearFull = date.getFullYear().toString();
      const year = tempNumberingData.yearFormat === 'YY' ? yearFull.slice(-2) : yearFull;
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      const datePart = tempNumberingData.includeDay ? `${year}${month}${day}` : `${year}${month}`;
      return `${prefix}${datePart}${tempNumberingData.separator}${counter}`;
  };

  const handleEditNumbering = () => { 
    setTempNumberingData(numberingData); 
    setIsNumberingEditing(true); 
  };
  
  const handleCancelNumbering = () => { 
    setIsNumberingEditing(false); 
    setTempNumberingData(numberingData); 
  };
  
  const handleSaveNumbering = async () => {
    if (!companyId) {
      alert("Company ID tidak ditemukan!");
      return;
    }
    
    try {
      const response = await authenticatedAxios.put(`${API_BASE_URL}/api/companies/update`, {
        id: companyId,
        numbering: tempNumberingData
      });
      
      if (response.status === 200) {
        setNumberingData(tempNumberingData);
        setIsNumberingEditing(false);
        alert("Pengaturan Penomoran Berhasil Disimpan!");
      } else {
        alert("Gagal menyimpan pengaturan penomoran");
      }
    } catch (error: any) {
      console.error("Error menyimpan penomoran:", error);
      console.error("Error response:", error?.response);
      const errorMsg = error?.response?.data?.message || error?.response?.data?.error || error?.message || "Gagal menyimpan pengaturan penomoran. Silakan coba lagi.";
      alert(errorMsg);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in flex flex-col h-full relative p-1">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6 uppercase tracking-wider">PENGATURAN PENOMORAN</h2>
        
        <div className="bg-white border border-gray-300 p-6 rounded-xl shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                Format Umum
            </h3>
            
            {/* ADAPTIF: grid-cols-1 di HP, grid-cols-2 di Tablet, grid-cols-3 di PC */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                    <label className="block text-gray-600 font-medium mb-2 text-sm">Format Tahun</label>
                    <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
                        <button 
                            disabled={!isNumberingEditing}
                            onClick={() => setTempNumberingData({...tempNumberingData, yearFormat: 'YYYY'})}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${tempNumberingData.yearFormat === 'YYYY' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            YYYY
                        </button>
                        <button 
                            disabled={!isNumberingEditing}
                            onClick={() => setTempNumberingData({...tempNumberingData, yearFormat: 'YY'})}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${tempNumberingData.yearFormat === 'YY' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            YY
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-gray-600 font-medium mb-2 text-sm">Pemisah (Separator)</label>
                    <input 
                        type="text" 
                        disabled={!isNumberingEditing} 
                        value={tempNumberingData.separator} 
                        onChange={(e) => setTempNumberingData({...tempNumberingData, separator: e.target.value})} 
                        className={`w-full text-center border rounded-lg px-3 py-1.5 font-bold text-lg focus:outline-none focus:border-blue-500 ${isNumberingEditing ? 'border-gray-400 bg-white' : 'bg-gray-100 border-transparent text-gray-500'}`}
                        placeholder="-"
                        maxLength={1}
                    />
                </div>

                <div className="flex items-center pt-2 md:pt-6">
                    <label className={`flex items-center gap-2 cursor-pointer ${!isNumberingEditing && 'pointer-events-none opacity-60'}`}>
                        <input 
                            type="checkbox" 
                            checked={tempNumberingData.includeDay} 
                            onChange={(e) => setTempNumberingData({...tempNumberingData, includeDay: e.target.checked})}
                            disabled={!isNumberingEditing}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                        />
                        <span className="text-gray-700 font-bold text-sm">Sertakan Tanggal (DD)</span>
                    </label>
                </div>
            </div>
        </div>

        {/* CARD PREVIEW - ADAPTIF */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            <div className="border border-gray-300 rounded-xl p-6 bg-white shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-green-500"></div>
                <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                     Kasir
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-gray-600 font-medium mb-1 text-sm">Prefix (Awalan)</label>
                        <input 
                            type="text" 
                            disabled={!isNumberingEditing} 
                            value={tempNumberingData.salesPrefix} 
                            onChange={(e) => setTempNumberingData({...tempNumberingData, salesPrefix: e.target.value.toUpperCase()})} 
                            className={`w-full border rounded px-3 py-2 font-bold uppercase tracking-widest ${isNumberingEditing ? 'border-gray-400 bg-white' : 'bg-gray-100 border-transparent text-gray-500'}`}
                            placeholder="SO"
                        />
                    </div>
                    <div className="p-3 bg-gray-100 rounded border border-gray-200 text-center">
                        <label className="block text-xs text-gray-500 mb-1">Preview Nomor Selanjutnya</label>
                        <div className="text-xl font-mono font-bold text-green-700 break-all">
                            {getPreviewNumber(tempNumberingData.salesPrefix, tempNumberingData.salesCounter)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="border border-gray-300 rounded-xl p-6 bg-white shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-orange-500"></div>
                <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                     Pembelian (Purchase)
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-gray-600 font-medium mb-1 text-sm">Prefix (Awalan)</label>
                        <input 
                            type="text" 
                            disabled={!isNumberingEditing} 
                            value={tempNumberingData.purchasePrefix} 
                            onChange={(e) => setTempNumberingData({...tempNumberingData, purchasePrefix: e.target.value.toUpperCase()})} 
                            className={`w-full border rounded px-3 py-2 font-bold uppercase tracking-widest ${isNumberingEditing ? 'border-gray-400 bg-white' : 'bg-gray-100 border-transparent text-gray-500'}`}
                            placeholder="PU"
                        />
                    </div>
                    <div className="p-3 bg-gray-100 rounded border border-gray-200 text-center">
                        <label className="block text-xs text-gray-500 mb-1">Preview Nomor Selanjutnya</label>
                        <div className="text-xl font-mono font-bold text-orange-700 break-all">
                            {getPreviewNumber(tempNumberingData.purchasePrefix, tempNumberingData.purchaseCounter)}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="mt-8 flex justify-center gap-4 pb-8">
            {!isNumberingEditing ? (
                <button onClick={handleEditNumbering} className="bg-[#FFE167] hover:bg-yellow-400 text-black px-8 md:px-12 py-3 rounded-full flex items-center gap-2 text-lg md:text-xl font-medium shadow-md transition-transform hover:scale-105"><Edit className="w-6 h-6"/> Edit Penomoran</button>
            ) : (
                <>
                    <button onClick={handleCancelNumbering} className="bg-[#A5CEF2] hover:bg-blue-200 text-black px-6 md:px-8 py-3 rounded-full flex items-center gap-2 text-lg md:text-xl font-medium shadow-md transition-transform hover:scale-105"><XIcon className="w-6 h-6"/> Batalkan</button>
                    <button onClick={handleSaveNumbering} className="bg-[#BEDFFF] hover:bg-blue-300 text-black px-6 md:px-8 py-3 rounded-full flex items-center gap-2 text-lg md:text-xl font-medium shadow-md transition-transform hover:scale-105"><Save className="w-6 h-6 font-bold"/> Simpan</button>
                </>
            )}
        </div>
    </div>
  );
};

export default NumberingTab;