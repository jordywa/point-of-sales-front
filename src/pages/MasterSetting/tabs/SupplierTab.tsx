// src/pages/MasterSetting/tabs/SupplierTab.tsx

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Save, X as XIcon, Truck, Phone, Mail, MapPin, User, Trash2, CreditCard } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { and, collection, onSnapshot, query, QueryDocumentSnapshot, where, type DocumentData } from 'firebase/firestore';
import authenticatedAxios from '../../../utils/api';
import { API_BASE_URL } from '../../../apiConfig';
import type { Supplier } from '../../../types';

const SupplierTab: React.FC = () => {
  const { user, userDb } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  // Data Suppliers from Firebase
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  const getDefaultFormData = (): Supplier => ({
    id: "",
    name: "",
    contact: "",
    phone: "",
    email: "",
    address: "",
    accountNumber: "",
    companyId: user?.companyId ?? ""
  });
  const [formData, setFormData] = useState<Supplier>(getDefaultFormData());

  // Fetch Suppliers from Firebase
  const fetchSuppliers = () => {
    if (!userDb) {
      console.error("Tidak ada dbnya: ", userDb);
      return null;
    }
    const supplierCollection = collection(userDb, 'suppliers');

    const q = query(
      supplierCollection,
      and(
        where('isDeleted', '==', false),
        where('companyId', '==', user?.companyId)
      )
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const supplierData: Supplier[] = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        name: doc.data().name ?? "",
        contact: doc.data().contact ?? "",
        phone: doc.data().phone ?? "",
        email: doc.data().email ?? "",
        address: doc.data().address ?? "",
        accountNumber: doc.data().accountNumber ?? "",
        companyId: doc.data().companyId ?? ""
      }));
      setSuppliers(supplierData);
      // Set first supplier as default if form is empty
      if (supplierData.length > 0 && !formData.id && !isEditing) {
        setFormData(supplierData[0]);
      }
    }, (err) => {
      console.error('Error fetching suppliers:', err);
    });

    return unsubscribe;
  };

  useEffect(() => {
    const unsubscribeSuppliers = fetchSuppliers();
    return () => {
      if (unsubscribeSuppliers) unsubscribeSuppliers();
    };
  }, [userDb, user?.companyId]);

  const handleSelectRow = (supplier: Supplier) => { 
      if (!isEditing) setFormData(supplier); 
  };
  
  const handleAdd = () => { 
      setFormData(getDefaultFormData()); 
      setIsEditing(true); 
  };
  
  const handleEdit = () => setIsEditing(true);
  
  const handleCancel = () => { 
      setIsEditing(false); 
      const current = formData.id === "" ? suppliers[0] : suppliers.find(s => s.id === formData.id); 
      if(current) setFormData(current); 
  };
  
  const handleSave = async () => {
      if (!formData.name.trim()) {
          alert("Nama Supplier Wajib Diisi!");
          return;
      }

      if (formData.id === "") {
          // Insert new supplier
          const { id, ...newSupplier } = formData;
          try {
              const response = await authenticatedAxios.post(`${API_BASE_URL}/api/suppliers`, {
                  ...newSupplier
              });
              console.log("Insert supplier response:", response);
              // Accept both 200 and 201 as success
              if (response.status === 200 || response.status === 201) {
                  setIsEditing(false);
                  // Reset form to default after successful insert
                  setFormData(getDefaultFormData());
                  alert("Data Supplier Berhasil Ditambahkan!");
              } else {
                  console.error("Unexpected status code:", response.status);
                  alert(`Gagal menambahkan supplier. Status: ${response.status}`);
              }
          } catch (error: any) {
              console.error("Error menambahkan supplier:", error);
              console.error("Error response:", error?.response);
              const errorMsg = error?.response?.data?.message || error?.response?.data?.error || error?.message || "Gagal menambahkan supplier. Silakan coba lagi.";
              alert(errorMsg);
          }
      } else {
          // Update existing supplier
          const { id, ...updateData } = formData;
          try {
              const response = await authenticatedAxios.put(`${API_BASE_URL}/api/suppliers/update`, {
                  id: id,
                  ...updateData
              });
              if (response.status === 200) {
                  setIsEditing(false);
                  alert("Data Supplier Berhasil Diupdate!");
              } else {
                  alert("Gagal mengupdate supplier");
              }
          } catch (error: any) {
              console.error("Error mengupdate supplier:", error);
              console.error("Error response:", error?.response);
              const errorMsg = error?.response?.data?.message || error?.response?.data?.error || error?.message || "Gagal mengupdate supplier. Silakan coba lagi.";
              alert(errorMsg);
          }
      }
  };

  const handleDelete = async (id: string) => {
      if(confirm("Hapus supplier ini?")) {
          try {
              const response = await authenticatedAxios.delete(`${API_BASE_URL}/api/suppliers/delete`, {data: {id}});
              if (response.status === 200) {
                  if(formData.id === id && suppliers.length > 1) {
                      const remaining = suppliers.filter(s => s.id !== id);
                      if (remaining.length > 0) setFormData(remaining[0]);
                      else setFormData(getDefaultFormData());
                  }
                  alert("Supplier Berhasil Dihapus!");
              } else {
                  alert("Gagal menghapus supplier");
              }
          } catch (error: any) {
              console.error("Error menghapus supplier:", error);
              console.error("Error response:", error?.response);
              const errorMsg = error?.response?.data?.message || error?.response?.data?.error || error?.message || "Gagal menghapus supplier. Silakan coba lagi.";
              alert(errorMsg);
          }
      }
  };

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in flex flex-col p-1 pb-20 mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6 uppercase tracking-wider">SUPPLIER MASTER</h2>
        
        {/* FORM INPUT AREA */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* KOLOM KIRI */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-gray-800 font-bold mb-1 text-sm flex items-center gap-2">
                            <Truck className="w-4 h-4 text-blue-600"/> Nama Supplier <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            disabled={!isEditing} 
                            value={formData.name} 
                            onChange={(e) => setFormData({...formData, name: e.target.value})} 
                            className={`w-full border rounded-lg px-4 py-2 focus:outline-none transition-colors ${isEditing ? 'border-blue-400 focus:border-blue-600 bg-white' : 'border-gray-200 bg-gray-50 text-gray-600'}`} 
                            placeholder="Nama Supplier / Perusahaan"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-800 font-bold mb-1 text-sm flex items-center gap-2">
                            <User className="w-4 h-4 text-purple-500"/> Contact Person
                        </label>
                        <input 
                            type="text" 
                            disabled={!isEditing} 
                            value={formData.contact || ""} 
                            onChange={(e) => setFormData({...formData, contact: e.target.value})} 
                            className={`w-full border rounded-lg px-4 py-2 focus:outline-none transition-colors ${isEditing ? 'border-blue-400 focus:border-blue-600 bg-white' : 'border-gray-200 bg-gray-50 text-gray-600'}`} 
                            placeholder="Nama Contact Person"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-800 font-bold mb-1 text-sm flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-green-600"/> Alamat
                        </label>
                        <textarea 
                            rows={3}
                            disabled={!isEditing} 
                            value={formData.address} 
                            onChange={(e) => setFormData({...formData, address: e.target.value})} 
                            className={`w-full border rounded-lg px-4 py-2 focus:outline-none transition-colors ${isEditing ? 'border-blue-400 focus:border-blue-600 bg-white' : 'border-gray-200 bg-gray-50 text-gray-600'}`} 
                            placeholder="Alamat Lengkap"
                        />
                    </div>
                </div>

                {/* KOLOM KANAN */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-gray-800 font-bold mb-1 text-sm flex items-center gap-2">
                            <Phone className="w-4 h-4 text-green-600"/> Nomor HP / Telp
                        </label>
                        <input 
                            type="text" 
                            disabled={!isEditing} 
                            value={formData.phone} 
                            onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g,'')})} 
                            className={`w-full border rounded-lg px-4 py-2 focus:outline-none transition-colors ${isEditing ? 'border-blue-400 focus:border-blue-600 bg-white' : 'border-gray-200 bg-gray-50 text-gray-600'}`} 
                            placeholder="Contoh: 0812..."
                        />
                    </div>

                    <div>
                        <label className="block text-gray-800 font-bold mb-1 text-sm flex items-center gap-2">
                            <Mail className="w-4 h-4 text-red-500"/> Email
                        </label>
                        <input 
                            type="email" 
                            disabled={!isEditing} 
                            value={formData.email} 
                            onChange={(e) => setFormData({...formData, email: e.target.value})} 
                            className={`w-full border rounded-lg px-4 py-2 focus:outline-none transition-colors ${isEditing ? 'border-blue-400 focus:border-blue-600 bg-white' : 'border-gray-200 bg-gray-50 text-gray-600'}`} 
                            placeholder="supplier@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-800 font-bold mb-1 text-sm flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-indigo-500"/> Nomor Rekening
                        </label>
                        <input 
                            type="text" 
                            disabled={!isEditing} 
                            value={formData.accountNumber || ""} 
                            onChange={(e) => setFormData({...formData, accountNumber: e.target.value})} 
                            className={`w-full border rounded-lg px-4 py-2 focus:outline-none transition-colors ${isEditing ? 'border-blue-400 focus:border-blue-600 bg-white' : 'border-gray-200 bg-gray-50 text-gray-600'}`} 
                            placeholder="Nomor Rekening Bank"
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex justify-center gap-4">
            {!isEditing ? (
                <>
                    <button onClick={handleAdd} className="bg-[#BEDFFF] hover:bg-blue-300 text-black px-8 py-2.5 rounded-full flex items-center gap-2 font-bold shadow-md transition-transform hover:scale-105"><Plus className="w-5 h-5"/> Tambah Baru</button>
                    <button onClick={handleEdit} className="bg-[#FFE167] hover:bg-yellow-400 text-black px-8 py-2.5 rounded-full flex items-center gap-2 font-bold shadow-md transition-transform hover:scale-105"><Edit className="w-5 h-5"/> Edit Data</button>
                </>
            ) : (
                <>
                    <button onClick={handleCancel} className="bg-gray-200 hover:bg-gray-300 text-black px-6 py-2.5 rounded-full flex items-center gap-2 font-bold shadow-sm transition-transform hover:scale-105"><XIcon className="w-5 h-5"/> Batal</button>
                    <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-full flex items-center gap-2 font-bold shadow-md transition-transform hover:scale-105"><Save className="w-5 h-5"/> Simpan</button>
                </>
            )}
        </div>

        {/* TABLE LIST */}
        <div className="border border-gray-300 rounded-xl overflow-hidden shadow-sm bg-white mt-4">
            <div className="overflow-x-auto w-full">
                <table className="w-full text-sm text-left min-w-[1000px]">
                    <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-xs border-b border-gray-300">
                        <tr>
                            <th className="px-6 py-4">Nama Supplier</th>
                            <th className="px-6 py-4">Contact Person</th>
                            <th className="px-6 py-4">Kontak</th>
                            <th className="px-6 py-4">Nomor Rekening</th>
                            <th className="px-6 py-4">Alamat</th>
                            <th className="px-6 py-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {suppliers.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-8 text-gray-400 italic">Belum ada data supplier.</td>
                            </tr>
                        ) : (
                            suppliers.map(supplier => (
                                <tr 
                                    key={supplier.id} 
                                    onClick={() => handleSelectRow(supplier)} 
                                    className={`cursor-pointer transition-colors hover:bg-blue-50 ${formData?.id === supplier.id ? 'bg-blue-100' : ''}`}
                                >
                                    <td className="px-6 py-3 font-bold text-gray-800">{supplier.name}</td>
                                    <td className="px-6 py-3 text-gray-600">{supplier.contact || "-"}</td>
                                    <td className="px-6 py-3">
                                        <div className="text-gray-900 font-medium">{supplier.phone || "-"}</div>
                                        <div className="text-xs text-gray-500">{supplier.email || "-"}</div>
                                    </td>
                                    <td className="px-6 py-3 text-gray-600 font-mono text-sm">{supplier.accountNumber || "-"}</td>
                                    <td className="px-6 py-3 text-gray-600 text-sm">{supplier.address || "-"}</td>
                                    <td className="px-6 py-3 text-center">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDelete(supplier.id); }}
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4"/>
                                        </button>
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

export default SupplierTab;
