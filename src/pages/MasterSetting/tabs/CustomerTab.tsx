// src/pages/MasterSetting/tabs/CustomerTab.tsx

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X as XIcon, User, Phone, Mail, Calendar, Users, Star, XCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { and, collection, onSnapshot, query, QueryDocumentSnapshot, where, type DocumentData } from 'firebase/firestore';
import authenticatedAxios from '../../../utils/api';
import { API_BASE_URL } from '../../../apiConfig';

interface CustomerData {
    id: string;
    name: string;
    category: string;
    phone: string;
    email: string;
    gender: 'L' | 'P' | '';
    dob: string; // Date of Birth (YYYY-MM-DD)
    companyId?: string;
}

const CustomerTab: React.FC = () => {
  const { user, userDb } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  // Data from Firebase
  const [customerList, setCustomerList] = useState<CustomerData[]>([]);
  
  // Customer Categories from Firebase
  const [customerCategories, setCustomerCategories] = useState<{ id: string; name: string }[]>([]);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const getDefaultFormData = (): CustomerData => ({
    id: "",
    name: "",
    category: customerCategories.length > 0 ? customerCategories[0].name : "",
    phone: "",
    email: "",
    gender: "",
    dob: "",
    companyId: user?.companyId ?? ""
  });
  const [formData, setFormData] = useState<CustomerData>({
    id: "",
    name: "",
    category: "",
    phone: "",
    email: "",
    gender: "",
    dob: "",
    companyId: user?.companyId ?? ""
  });

  // Fetch Customer Categories from Firebase
  const fetchCustomerCategories = () => {
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
      const categoryData = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        name: doc.data().name ?? ""
      }));
      setCustomerCategories(categoryData);
      // Update form category if current category doesn't exist or if form is empty
      if (categoryData.length > 0) {
        if (!formData.category || !categoryData.find(c => c.name === formData.category)) {
          setFormData(prev => ({ ...prev, category: categoryData[0].name }));
        }
      }
    }, (err) => {
      console.error('Error fetching customer categories:', err);
    });

    return unsubscribe;
  };

  // Fetch Customers from Firebase
  const fetchCustomers = () => {
    if (!userDb) {
      console.error("Tidak ada dbnya: ", userDb);
      return null;
    }
    const customerCollection = collection(userDb, 'customers');

    const q = query(
      customerCollection,
      and(
        where('isDeleted', '==', false),
        where('companyId', '==', user?.companyId)
      )
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customerData: CustomerData[] = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        name: doc.data().name ?? "",
        category: doc.data().category ?? "",
        phone: doc.data().phone ?? "",
        email: doc.data().email ?? "",
        gender: doc.data().gender ?? "",
        dob: doc.data().dob ?? "",
        companyId: doc.data().companyId ?? ""
      }));
      setCustomerList(customerData);
      // Set first customer as default if form is empty
      if (customerData.length > 0 && !formData.id && !isEditing) {
        setFormData(customerData[0]);
      }
    }, (err) => {
      console.error('Error fetching customers:', err);
    });

    return unsubscribe;
  };

  useEffect(() => {
    const unsubscribeCategories = fetchCustomerCategories();
    const unsubscribeCustomers = fetchCustomers();
    return () => {
      if (unsubscribeCategories) unsubscribeCategories();
      if (unsubscribeCustomers) unsubscribeCustomers();
    };
  }, [userDb, user?.companyId]);

  const handleSelectRow = (data: CustomerData) => { 
      if (!isEditing) setFormData(data); 
  };
  
  const handleAdd = () => { 
      setFormData({
        id: "",
        name: "",
        category: customerCategories.length > 0 ? customerCategories[0].name : "",
        phone: "",
        email: "",
        gender: "",
        dob: "",
        companyId: user?.companyId ?? ""
      }); 
      setIsEditing(true); 
  };
  
  const handleEdit = () => setIsEditing(true);
  
  const handleCancel = () => { 
      setIsEditing(false); 
      const current = formData.id === "" ? customerList[0] : customerList.find(c => c.id === formData.id); 
      if(current) setFormData(current); 
  };
  
  const handleSave = async () => {
      if (!formData.name.trim()) {
          alert("Nama Customer Wajib Diisi!");
          return;
      }

      if (formData.id === "") {
          // Insert new customer
          const { id, ...newCustomer } = formData;
          try {
              const response = await authenticatedAxios.post(`${API_BASE_URL}/api/customers`, {
                  ...newCustomer
              });
              console.log("Insert customer response:", response);
              // Accept both 200 and 201 as success
              if (response.status === 200 || response.status === 201) {
                  setIsEditing(false);
                  // Reset form to default after successful insert
                  setFormData({
                    id: "",
                    name: "",
                    category: customerCategories.length > 0 ? customerCategories[0].name : "",
                    phone: "",
                    email: "",
                    gender: "",
                    dob: "",
                    companyId: user?.companyId ?? ""
                  });
                  alert("Data Customer Berhasil Ditambahkan!");
              } else {
                  console.error("Unexpected status code:", response.status);
                  alert(`Gagal menambahkan customer. Status: ${response.status}`);
              }
          } catch (error: any) {
              console.error("Error menambahkan customer:", error);
              console.error("Error response:", error?.response);
              const errorMsg = error?.response?.data?.message || error?.response?.data?.error || error?.message || "Gagal menambahkan customer. Silakan coba lagi.";
              alert(errorMsg);
          }
      } else {
          // Update existing customer
          const { id, ...updateData } = formData;
          try {
              const response = await authenticatedAxios.put(`${API_BASE_URL}/api/customers/update`, {
                  id: id,
                  ...updateData
              });
              if (response.status === 200) {
                  setIsEditing(false);
                  alert("Data Customer Berhasil Diupdate!");
              } else {
                  alert("Gagal mengupdate customer");
              }
          } catch (error: any) {
              console.error("Error mengupdate customer:", error);
              console.error("Error response:", error?.response);
              const errorMsg = error?.response?.data?.message || error?.response?.data?.error || error?.message || "Gagal mengupdate customer. Silakan coba lagi.";
              alert(errorMsg);
          }
      }
  };

  const handleDelete = async (id: string) => {
      if(confirm("Hapus customer ini?")) {
          try {
              const response = await authenticatedAxios.delete(`${API_BASE_URL}/api/customers/${id}`);
              if (response.status === 200) {
                  if(formData.id === id && customerList.length > 1) {
                      const remaining = customerList.filter(c => c.id !== id);
                      if (remaining.length > 0) setFormData(remaining[0]);
                      else setFormData(getDefaultFormData());
                  }
                  alert("Customer Berhasil Dihapus!");
              } else {
                  alert("Gagal menghapus customer");
              }
          } catch (error) {
              console.error("Error menghapus customer:", error);
              alert("Gagal menghapus customer. Silakan coba lagi.");
          }
      }
  };

  const handleSaveNewCategory = async () => {
      if(!newCategoryName.trim()) return;
      if(customerCategories.find(c => c.name === newCategoryName)) {
          alert("Kategori sudah ada!");
          return;
      }
      // Create new category via API
      try {
          const response = await authenticatedAxios.post(`${API_BASE_URL}/api/customer-categories/`, {
              name: newCategoryName,
              description: "",
              companyId: user?.companyId ?? ""
          });
          console.log("Insert new category response:", response);
          // Accept both 200 and 201 as success
          if (response.status === 200 || response.status === 201) {
              setFormData(prev => ({ ...prev, category: newCategoryName })); 
              setIsAddCategoryOpen(false);
              setNewCategoryName("");
              alert("Kategori berhasil ditambahkan!");
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
  };

  return (
    // FIX: Hapus h-full agar scroll mengikuti konten
    <div className="space-y-6 max-w-5xl animate-in fade-in flex flex-col p-1 pb-20">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6 uppercase tracking-wider">CUSTOMER MASTER</h2>
        
        {/* FORM INPUT AREA */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* KOLOM KIRI */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-gray-800 font-bold mb-1 text-sm flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-600"/> Nama Lengkap <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            disabled={!isEditing} 
                            value={formData.name} 
                            onChange={(e) => setFormData({...formData, name: e.target.value})} 
                            className={`w-full border rounded-lg px-4 py-2 focus:outline-none transition-colors ${isEditing ? 'border-blue-400 focus:border-blue-600 bg-white' : 'border-gray-200 bg-gray-50 text-gray-600'}`} 
                            placeholder="Nama Customer / Toko"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-800 font-bold mb-1 text-sm flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-500"/> Kategori Customer
                        </label>
                        <div className="flex gap-2">
                            <select 
                                disabled={!isEditing} 
                                value={formData.category} 
                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                                className={`flex-1 border rounded-lg px-4 py-2 focus:outline-none transition-colors appearance-none cursor-pointer ${isEditing ? 'border-blue-400 bg-white' : 'border-gray-200 bg-gray-50 text-gray-600'}`}
                            >
                                {customerCategories.map(cat => (
                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                            {isEditing && (
                                <button 
                                    onClick={() => setIsAddCategoryOpen(true)}
                                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg transition-colors border border-blue-200"
                                    title="Tambah Kategori Baru"
                                >
                                    <Plus className="w-5 h-5"/>
                                </button>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-800 font-bold mb-1 text-sm flex items-center gap-2">
                            <Users className="w-4 h-4 text-purple-500"/> Jenis Kelamin
                        </label>
                        <div className="flex gap-4">
                            <label className={`flex items-center gap-2 cursor-pointer ${!isEditing && 'opacity-60 pointer-events-none'}`}>
                                <input 
                                    type="radio" 
                                    name="gender" 
                                    value="L" 
                                    checked={formData.gender === 'L'} 
                                    onChange={() => setFormData({...formData, gender: 'L'})}
                                    disabled={!isEditing}
                                    className="w-4 h-4 text-blue-600"
                                /> 
                                Laki-laki
                            </label>
                            <label className={`flex items-center gap-2 cursor-pointer ${!isEditing && 'opacity-60 pointer-events-none'}`}>
                                <input 
                                    type="radio" 
                                    name="gender" 
                                    value="P" 
                                    checked={formData.gender === 'P'} 
                                    onChange={() => setFormData({...formData, gender: 'P'})}
                                    disabled={!isEditing}
                                    className="w-4 h-4 text-pink-500"
                                /> 
                                Perempuan
                            </label>
                        </div>
                    </div>
                </div>

                {/* KOLOM KANAN */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-gray-800 font-bold mb-1 text-sm flex items-center gap-2">
                            <Phone className="w-4 h-4 text-green-600"/> Nomor HP / WA
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
                            placeholder="nama@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-800 font-bold mb-1 text-sm flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-orange-500"/> Tanggal Lahir
                        </label>
                        <input 
                            type="date" 
                            disabled={!isEditing} 
                            value={formData.dob} 
                            onChange={(e) => setFormData({...formData, dob: e.target.value})} 
                            className={`w-full border rounded-lg px-4 py-2 focus:outline-none transition-colors ${isEditing ? 'border-blue-400 focus:border-blue-600 bg-white' : 'border-gray-200 bg-gray-50 text-gray-600'}`} 
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
                {/* FIX: Tambahkan min-w agar tabel tidak gepeng */}
                <table className="w-full text-sm text-left min-w-[800px]">
                    <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-xs border-b border-gray-300">
                        <tr>
                            <th className="px-6 py-4">Nama Customer</th>
                            <th className="px-6 py-4">Kategori</th>
                            <th className="px-6 py-4">Kontak</th>
                            <th className="px-6 py-4">Gender / Tgl Lahir</th>
                            <th className="px-6 py-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {customerList.map(cust => (
                            <tr 
                                key={cust.id} 
                                onClick={() => handleSelectRow(cust)} 
                                className={`cursor-pointer transition-colors hover:bg-blue-50 ${formData?.id === cust.id ? 'bg-blue-100' : ''}`}
                            >
                                <td className="px-6 py-3 font-bold text-gray-800">{cust.name}</td>
                                <td className="px-6 py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold border 
                                        ${cust.category === 'General' ? 'bg-gray-100 text-gray-600 border-gray-300' : 
                                          cust.category === 'VIP' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                                          cust.category === 'Grosir' ? 'bg-purple-100 text-purple-700 border-purple-300' :
                                          'bg-blue-100 text-blue-700 border-blue-300'
                                        }`}
                                    >
                                        {cust.category}
                                    </span>
                                </td>
                                <td className="px-6 py-3">
                                    <div className="text-gray-900 font-medium">{cust.phone || "-"}</div>
                                    <div className="text-xs text-gray-500">{cust.email}</div>
                                </td>
                                <td className="px-6 py-3 text-gray-600">
                                    <div className="flex items-center gap-2">
                                        {cust.gender === 'L' && <span className="text-blue-600 font-bold">L</span>}
                                        {cust.gender === 'P' && <span className="text-pink-500 font-bold">P</span>}
                                        <span className="text-gray-400">|</span>
                                        <span>{cust.dob || "-"}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-3 text-center">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDelete(cust.id); }}
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4"/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* MODAL TAMBAH KATEGORI */}
        {isAddCategoryOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center animate-in fade-in zoom-in duration-200">
                <div className="bg-white rounded-xl shadow-2xl w-96 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">Tambah Kategori Customer</h3>
                        <button onClick={() => setIsAddCategoryOpen(false)}><XCircle className="w-6 h-6 text-gray-400 hover:text-red-500"/></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Nama Kategori</label>
                            <input 
                                type="text" 
                                autoFocus
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="Contoh: Platinum Member"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <button 
                            onClick={handleSaveNewCategory}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-colors"
                        >
                            Simpan
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default CustomerTab;