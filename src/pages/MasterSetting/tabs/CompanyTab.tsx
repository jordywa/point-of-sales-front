// src/pages/MasterSetting/tabs/CompanyTab.tsx

import React, { useEffect, useState } from 'react';
import { Edit, Save, X as XIcon } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import type { Company } from '../../../types';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { API_BASE_URL } from '../../../apiConfig';
import authenticatedAxios from '../../../utils/api';

const CompanyTab: React.FC = () => {
    const {user} = useAuth();

    const [isCompanyEditing, setIsCompanyEditing] = useState(false);
    const [loading, setLoading] = useState<boolean>(true);

    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const [companyData, setCompanyData] = useState<Company>({
        id: user?.companyId || '',
        name: "",
    });

    const fetchCompany = () => {
        setLoading(true);
        const companyDocRef = doc(db, 'companies', user?.companyId || '');
        const unsubscribe = onSnapshot(companyDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const companyData: Company = {
                    id: docSnap.id,
                    name: docSnap.data().name,
                    address: docSnap.data().address,
                    contact: docSnap.data().contact,
                }
                // console.log(companyData);
                setCompanyData(companyData);
            } else {
                console.log("User tidak ditemukan di database");
                setCompanyData({ id: '', name: '' });
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching user:", error);
            setLoading(false);
        });
        setLoading(false);
        return unsubscribe;
    }
    
    useEffect(() => {
        if (user?.companyId) {
            const unsubscribe = fetchCompany();
            return () => unsubscribe();
        }
    }, [user?.companyId]);

    const handleEditCompany = () => {
        clearMessage();
        setIsCompanyEditing(true);
    };
    const handleCancelCompany = () => {
        clearMessage();
        setIsCompanyEditing(false);
    };

    const clearMessage = () =>{
        setSuccessMsg("")
        setErrorMsg("")
    }

    const handleSaveCompany = async () => {
        clearMessage();
        const response = await authenticatedAxios.put(`${API_BASE_URL}/api/companies/update`, {
            ...companyData
        });
        if(response.status === 200){
            setSuccessMsg("Berhasil mengupdate Company")
        } else{
            setErrorMsg("Gagal mengupdate company");
        }
        setIsCompanyEditing(false);
    };

    return (
        <div className="space-y-6 max-w-4xl animate-in fade-in flex flex-col h-full relative p-1">
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-6 uppercase tracking-wider">COMPANY</h2>
            <div className="flex-1">
                {/* ADAPTIF: grid-cols-1 di HP, grid-cols-2 di Tablet/PC */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <label className="block text-gray-800 font-medium mb-2">Nama Company*</label>
                        <input 
                            type="text" 
                            disabled={!isCompanyEditing} 
                            value={companyData.name} 
                            onChange={(e) => setCompanyData({...companyData, name: e.target.value})} className={`w-full border rounded-full px-4 py-2 focus:outline-none transition-colors ${isCompanyEditing ? 'border-gray-400 focus:border-blue-500 bg-white' : 'border-transparent bg-gray-100 text-gray-600 cursor-not-allowed'}`} />
                    </div>
                    <div>
                        <label className="block text-gray-800 font-medium mb-2">Kontak</label>
                        <input 
                            type="text" 
                            disabled={!isCompanyEditing} 
                            value={companyData.contact} 
                            onChange={(e) => setCompanyData({...companyData, contact: e.target.value})} 
                            className={`w-full border rounded-full px-4 py-2 focus:outline-none transition-colors ${isCompanyEditing ? 'border-gray-400 focus:border-blue-500 bg-white' : 'border-transparent bg-gray-100 text-gray-600 cursor-not-allowed'}`} />
                    </div>
                </div>
                <div className="mt-6">
                    <label className="block text-gray-800 font-medium mb-2">Alamat</label>
                    <textarea 
                        rows={5} 
                        disabled={!isCompanyEditing} 
                        value={companyData.address} 
                        onChange={(e) => setCompanyData({...companyData, address: e.target.value})} 
                        className={`w-full border rounded-2xl px-4 py-2 focus:outline-none transition-colors ${isCompanyEditing ? 'border-gray-400 focus:border-blue-500 bg-white' : 'border-transparent bg-gray-100 text-gray-600 cursor-not-allowed'}`}></textarea>
                </div>
            </div>
            <div className='flex justify-center align-center w-full'>
                <div className='text-green-500'>{successMsg}</div>
                <div className='text-red-500'>{errorMsg}</div>
            </div>
            <div className="mt-8 flex justify-center gap-4 pb-8">
                {!isCompanyEditing ? (
                    <button onClick={handleEditCompany} className="bg-[#FFE167] hover:bg-yellow-400 text-black px-12 py-3 rounded-full flex items-center gap-2 text-xl font-medium shadow-md transition-transform hover:scale-105"><Edit className="w-6 h-6"/> Edit</button>
                ) : (
                    <>
                        <button onClick={handleCancelCompany} className="bg-[#A5CEF2] hover:bg-blue-200 text-black px-8 py-3 rounded-full flex items-center gap-2 text-xl font-medium shadow-md transition-transform hover:scale-105"><XIcon className="w-6 h-6"/> Batalkan</button>
                        <button onClick={handleSaveCompany} className="bg-[#BEDFFF] hover:bg-blue-300 text-black px-8 py-3 rounded-full flex items-center gap-2 text-xl font-medium shadow-md transition-transform hover:scale-105"><Save className="w-6 h-6 font-bold"/> Simpan</button>
                    </>
                )}
            </div>
        </div>
    );
};

export default CompanyTab;