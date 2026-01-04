// src/pages/MasterSetting/tabs/OutletTab.tsx

import React, { useState, useEffect } from 'react';
import { Edit, Save, X as XIcon, Plus, Trash2, Store } from 'lucide-react';
import type { Outlet } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { collection, onSnapshot, query, QueryDocumentSnapshot, where, type DocumentData } from 'firebase/firestore';
import authenticatedAxios from '../../../utils/api';
import { API_BASE_URL } from '../../../apiConfig';


const OutletTab: React.FC = () => {
  const {userDb} = useAuth();

  // --- STATE LIST OUTLET ---
  const [outlets, setOutlets] = useState<Outlet[]>([]);

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // --- STATE FORM ---
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const defaultFormData: Outlet = {
    id: "",
    name: "",
    phone: "",
    address: "",
    status: 'Aktif',
  };
  const [formData, setFormData] = useState<Outlet>(defaultFormData);
  
  const fetchOutlets = () => {
      setLoading(true);
      if(!userDb){
        console.error("Tidak ada dbnya: ", userDb);
        return null;
      }
      const outletCollection = collection(userDb, 'outlets');

      const q = query(
          outletCollection, 
          where('isDeleted', '==', false)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
          const outletData: Outlet[] = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
              id: doc.id,
              name: doc.data().name,
              address: doc.data().address ?? "",
              phone: doc.data().phone ?? "",
              status: doc.data().status,
          }));
          setOutlets(outletData);
          setLoading(false);
      }, (err) => {
          console.error('Error fetching products:', err);
          setLoading(false);
      });

      return unsubscribe;
  }

  useEffect(() => {
    const unsubscribeOutlets = fetchOutlets();

    return () => {
        if(unsubscribeOutlets)
          unsubscribeOutlets();
    };
  }, []);

  const handleAddNew = async () => {
    setIsAdding(true);
    setIsEditing(false);
    setSelectedId("");
    setFormData(defaultFormData);
  };

  const handleEditClick = (outlet: Outlet) => {
    setIsEditing(true);
    setIsAdding(false);
    setSelectedId(outlet.id);
    setFormData({
      id: outlet.id,
      name: outlet.name,
      phone: outlet.phone,
      address: outlet.address,
      status: outlet.status
    });
    // Scroll ke form otomatis
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsAdding(false);
    setSelectedId("");
    setFormData(defaultFormData);
  };

  const handleSave = async () => {
    if (isAdding) {
      const {id, ...newOutlet} = formData;
      try {
        const response = await authenticatedAxios.post(`${API_BASE_URL}/api/outlets`, {
            ...newOutlet
        });
        if(response.status === 201){
          setSuccessMsg("Outlet Berhasil ditambahkan!");
        } else{
          setErrorMsg("Gagal menambahkan outlet");
        }

      } catch (error) {
        console.error("Error menambahkan outlet, ", error);
        return;
      }
    } else if (isEditing && selectedId) {
      try {
        const response = await authenticatedAxios.put(`${API_BASE_URL}/api/outlets/update`, {
          ...formData,
          id: selectedId,
        });
        if(response.status === 200){
          setSuccessMsg("Outlet Berhasil diupdate!");
        } else{
            setErrorMsg("Gagal mengupdate outlet");
        }

      } catch (error) {
        console.error("Error mengupdate outlet, ", error);
        return;
      }
    }
    handleCancel();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus outlet ini?")) {
      try {
        const response = await authenticatedAxios.delete(`${API_BASE_URL}/api/outlets/delete`, {data: {id}});
        if(response.status === 200){
          setSuccessMsg("Outlet Berhasil didelete!");
        } else{
          setErrorMsg("Gagal mengdelete outlet");
        }

      } catch (error) {
        console.error("Error mengdelete outlet, ", error);
        return;
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in flex flex-col h-full relative p-1">
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-6 uppercase tracking-wider">MANAJEMEN OUTLET</h2>

      {/* SEKSI TABEL LIST OUTLET */}
      <div className="flex-1">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-bold text-gray-800 uppercase tracking-tight">Daftar Semua Outlet</h3>
          </div>
          <button 
            onClick={handleAddNew}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full flex items-center gap-2 transition-all text-sm shadow-md"
          >
            <Plus className="w-4 h-4" />
            Tambah Outlet
          </button>
        </div>

        <div className="overflow-hidden border border-gray-200 rounded-2xl shadow-sm bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Nama Outlet</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Kontak</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Alamat</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {outlets.map((outlet) => (
                  <tr key={outlet.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-800">{outlet.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{outlet.phone}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{outlet.address}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => handleEditClick(outlet)}
                          className="text-blue-500 hover:bg-blue-100 p-2 rounded-full transition-colors"
                          title="Edit Outlet"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(outlet.id)}
                          className="text-red-500 hover:bg-red-100 p-2 rounded-full transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FORM INPUT (MUNCUL HANYA JIKA TAMBAH/EDIT) */}
      {(isAdding || isEditing) && (
        <div className="mt-8 p-6 bg-white border-2 border-blue-100 rounded-3xl shadow-lg animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-blue-800 uppercase">
              {isAdding ? 'Tambah Outlet Baru' : 'Edit Data Outlet'}
            </h3>
            <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
              <XIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Nama Outlet*</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Masukkan nama outlet"
                className="w-full border border-gray-300 rounded-full px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Kontak</label>
              <input 
                type="text" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="No. Telepon / WhatsApp"
                className="w-full border border-gray-300 rounded-full px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-6">
            <label className="block text-gray-700 font-medium mb-2">Alamat Lengkap</label>
            <textarea 
              rows={3} 
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder="Masukkan alamat lengkap"
              className="w-full border border-gray-300 rounded-2xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            ></textarea>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button 
              onClick={handleCancel}
              className="px-6 py-2 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button 
              onClick={handleSave}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-2 rounded-full flex items-center gap-2 shadow-md transition-all"
            >
              <Save className="w-4 h-4" />
              {isAdding ? 'Simpan Outlet' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>
      )}

      <div className="pb-10"></div>
    </div>
  );
};

export default OutletTab;