// src/pages/MasterSetting/tabs/CategoryCustomerTab.tsx

import React, { useState, useEffect } from 'react';
import { Edit, Save, Plus, Trash2, X as XIcon, Users } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { and, collection, onSnapshot, query, QueryDocumentSnapshot, where, type DocumentData } from 'firebase/firestore';
import authenticatedAxios from '../../../utils/api';
import { API_BASE_URL } from '../../../apiConfig';

interface CustomerCategory {
    id: string;
    name: string;
    description: string;
    companyId?: string;
}

const CategoryCustomerTab: React.FC = () => {
  const { user, userDb } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  // Data from Firebase
  const [categories, setCategories] = useState<CustomerCategory[]>([]);

  const getDefaultFormData = (): CustomerCategory => ({
    id: "",
    name: "",
    description: "",
    companyId: user?.companyId ?? ""
  });
  const [form, setForm] = useState<CustomerCategory>(getDefaultFormData());

  // Fetch Customer Categories from Firebase
  const fetchCategories = () => {
    if (!userDb) {
      console.error("Tidak ada dbnya: ", userDb);
      return null;
    }
    const categoryCollection = collection(userDb, 'customer_categories');

    const q = query(
      categoryCollection,
      and(
        where('isDeleted', '==', false),
        where('companyId', '==', user?.companyId)
      )
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const categoryData: CustomerCategory[] = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        name: doc.data().name ?? "",
        description: doc.data().description ?? "",
        companyId: doc.data().companyId ?? ""
      }));
      setCategories(categoryData);
      // Set first category as default if form is empty
      if (categoryData.length > 0 && !form.id && !isEditing) {
        setForm(categoryData[0]);
      }
    }, (err) => {
      console.error('Error fetching customer categories:', err);
    });

    return unsubscribe;
  };

  useEffect(() => {
    const unsubscribeCategories = fetchCategories();
    return () => {
      if (unsubscribeCategories) unsubscribeCategories();
    };
  }, [userDb, user?.companyId]);

  const handleSelect = (item: CustomerCategory) => {
      if (!isEditing) setForm(item);
  };

  const handleAdd = () => {
      setForm(getDefaultFormData());
      setIsEditing(true);
  };

  const handleEdit = () => setIsEditing(true);

  const handleCancel = () => {
      setIsEditing(false);
      // Reset ke data awal (jika edit) atau kosong (jika baru)
      if (form.id !== "") {
          const current = categories.find(c => c.id === form.id);
          if (current) setForm(current);
      } else {
          setForm(categories[0] || getDefaultFormData());
      }
  };

  const handleSave = async () => {
      if (!form.name.trim()) return alert("Nama Kategori Wajib Diisi!");

      if (form.id === "") {
          // Insert new category
          const { id, ...newCategory } = form;
          try {
              const response = await authenticatedAxios.post(`${API_BASE_URL}/api/customer-categories`, {
                  ...newCategory
              });
              console.log("Insert category response:", response);
              // Accept both 200 and 201 as success
              if (response.status === 200 || response.status === 201) {
                  setIsEditing(false);
                  // Reset form to default after successful insert
                  setForm(getDefaultFormData());
                  alert("Kategori Berhasil Ditambahkan!");
              } else {
                  console.error("Unexpected status code:", response.status);
                  alert(`Gagal menambahkan kategori. Status: ${response.status}`);
              }
          } catch (error: any) {
              console.error("Error menambahkan kategori:", error);
              console.error("Error response:", error?.response);
              const errorMsg = error?.response?.data?.message || error?.response?.data?.error || error?.message || "Gagal menambahkan kategori. Silakan coba lagi.";
              alert(errorMsg);
          }
      } else {
          // Update existing category
          const { id, ...updateData } = form;
          try {
              const response = await authenticatedAxios.put(`${API_BASE_URL}/api/customer-categories/update`, {
                  id: id,
                  ...updateData
              });
              if (response.status === 200) {
                  setIsEditing(false);
                  alert("Kategori Berhasil Diupdate!");
              } else {
                  alert("Gagal mengupdate kategori");
              }
          } catch (error: any) {
              console.error("Error mengupdate kategori:", error);
              console.error("Error response:", error?.response);
              const errorMsg = error?.response?.data?.message || error?.response?.data?.error || error?.message || "Gagal mengupdate kategori. Silakan coba lagi.";
              alert(errorMsg);
          }
      }
  };

  const handleDelete = async () => {
      if (!form.id) return;
      if (categories.length <= 1) return alert("Minimal harus ada 1 kategori!");
      if (confirm(`Hapus "${form.name}"?`)) {
          try {
              const response = await authenticatedAxios.delete(`${API_BASE_URL}/api/customer-categories/${form.id}`);
              if (response.status === 200) {
                  setIsEditing(false);
                  const remaining = categories.filter(c => c.id !== form.id);
                  if (remaining.length > 0) setForm(remaining[0]);
                  else setForm(getDefaultFormData());
                  alert("Kategori Berhasil Dihapus!");
              } else {
                  alert("Gagal menghapus kategori");
              }
          } catch (error) {
              console.error("Error menghapus kategori:", error);
              alert("Gagal menghapus kategori. Silakan coba lagi.");
          }
      }
  };

  return (
    // FIX: Hapus h-full agar scroll mengikuti konten
    <div className="space-y-6 max-w-5xl animate-in fade-in flex flex-col p-1 pb-20 mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-4 uppercase tracking-wider">KATEGORI PELANGGAN</h2>
        
        {/* FIX: Hapus h-full di sini juga */}
        <div className="flex flex-col md:flex-row gap-8">
            
            {/* PANEL KIRI: LIST SIMPLE */}
            {/* FIX: Hapus max-h-[500px] agar memanjang natural */}
            <div className="w-full md:w-1/3 bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm flex flex-col h-fit">
                <div className="bg-gray-100 p-4 border-b border-gray-200 flex justify-between items-center">
                    <span className="font-bold text-gray-700">Daftar Kategori</span>
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">{categories.length}</span>
                </div>
                <div className="p-2 space-y-2">
                    {categories.map(cat => (
                        <div 
                            key={cat.id} 
                            onClick={() => handleSelect(cat)}
                            className={`p-4 rounded-2xl cursor-pointer transition-all border ${form.id === cat.id ? 'bg-[#BEDFFF] border-blue-300 shadow-sm' : 'bg-white border-transparent hover:bg-gray-50'}`}
                        >
                            <div className="font-bold text-gray-800 flex items-center gap-2">
                                <Users className="w-5 h-5 text-gray-600"/> {cat.name}
                            </div>
                            <div className="text-sm text-gray-500 mt-1 truncate">{cat.description}</div>
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t border-gray-200">
                    <button onClick={handleAdd} disabled={isEditing} className="w-full bg-white border-2 border-dashed border-gray-300 text-gray-500 font-bold py-3 rounded-2xl hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                        <Plus className="w-5 h-5"/> Tambah Baru
                    </button>
                </div>
            </div>

            {/* PANEL KANAN: FORM SIMPLE */}
            <div className="flex-1">
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm sticky top-4">
                    {/* INPUT FIELDS */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-gray-800 font-medium mb-2 pl-2">Nama Kategori*</label>
                            <input 
                                type="text" 
                                disabled={!isEditing} 
                                value={form.name} 
                                onChange={(e) => setForm({...form, name: e.target.value})} 
                                className={`w-full border rounded-full px-5 py-3 focus:outline-none transition-colors text-lg ${isEditing ? 'border-gray-400 focus:border-blue-500 bg-white' : 'border-transparent bg-gray-100 text-gray-600 cursor-not-allowed'}`}
                                placeholder="Contoh: Reseller"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-800 font-medium mb-2 pl-2">Keterangan</label>
                            <textarea 
                                rows={4}
                                disabled={!isEditing} 
                                value={form.description} 
                                onChange={(e) => setForm({...form, description: e.target.value})} 
                                className={`w-full border rounded-3xl px-5 py-3 focus:outline-none transition-colors ${isEditing ? 'border-gray-400 focus:border-blue-500 bg-white' : 'border-transparent bg-gray-100 text-gray-600 cursor-not-allowed'}`}
                                placeholder="Deskripsi singkat..."
                            />
                        </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                        {!isEditing ? (
                            <>
                                <button onClick={handleDelete} className="bg-red-100 hover:bg-red-200 text-red-600 px-6 py-3 rounded-full flex items-center gap-2 font-bold transition-transform hover:scale-105"><Trash2 className="w-5 h-5"/> Hapus</button>
                                <button onClick={handleEdit} className="bg-[#FFE167] hover:bg-yellow-400 text-black px-10 py-3 rounded-full flex items-center gap-2 text-lg font-medium shadow-md transition-transform hover:scale-105"><Edit className="w-5 h-5"/> Edit</button>
                            </>
                        ) : (
                            <>
                                <button onClick={handleCancel} className="bg-[#A5CEF2] hover:bg-blue-200 text-black px-8 py-3 rounded-full flex items-center gap-2 text-lg font-medium shadow-md transition-transform hover:scale-105"><XIcon className="w-5 h-5"/> Batal</button>
                                <button onClick={handleSave} className="bg-[#BEDFFF] hover:bg-blue-300 text-black px-10 py-3 rounded-full flex items-center gap-2 text-lg font-bold shadow-md transition-transform hover:scale-105"><Save className="w-5 h-5"/> Simpan</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default CategoryCustomerTab;