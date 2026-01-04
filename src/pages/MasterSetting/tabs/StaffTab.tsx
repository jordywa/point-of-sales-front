// src/pages/MasterSetting/tabs/StaffTab.tsx

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Save, X as XIcon, User, Briefcase, Phone, Trash2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { and, collection, onSnapshot, query, QueryDocumentSnapshot, where, type DocumentData } from 'firebase/firestore';
import authenticatedAxios from '../../../utils/api';
import { API_BASE_URL } from '../../../apiConfig';

interface StaffData {
    id: string;
    name: string;
    role: string;
    phone: string;
    status: 'Aktif' | 'Tidak Aktif';
    companyId?: string;
}

const StaffTab: React.FC = () => {
  const { user, userDb } = useAuth();
  const [isStaffEditing, setIsStaffEditing] = useState(false);
  
  // Data Staff from Firebase
  const [staffList, setStaffList] = useState<StaffData[]>([]);
  
  const getDefaultFormData = (): StaffData => ({
    id: "", 
    name: "", 
    role: "", 
    phone: "", 
    status: "Aktif",
    companyId: user?.companyId ?? ""
  });
  const [staffForm, setStaffForm] = useState<StaffData>(getDefaultFormData());

  // Fetch Staff from Firebase
  const fetchStaffs = () => {
    if (!userDb) {
      console.error("Tidak ada dbnya: ", userDb);
      return null;
    }
    const staffCollection = collection(userDb, 'staffs');

    const q = query(
      staffCollection,
      and(
        where('isDeleted', '==', false),
        where('companyId', '==', user?.companyId)
      )
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const staffData: StaffData[] = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        name: doc.data().name ?? "",
        role: doc.data().role ?? "",
        phone: doc.data().phone ?? "",
        status: doc.data().status ?? "Aktif",
        companyId: doc.data().companyId ?? ""
      }));
      setStaffList(staffData);
      // Set first staff as default if form is empty
      if (staffData.length > 0 && !staffForm.id && !isStaffEditing) {
        setStaffForm(staffData[0]);
      }
    }, (err) => {
      console.error('Error fetching staffs:', err);
    });

    return unsubscribe;
  };

  useEffect(() => {
    const unsubscribeStaffs = fetchStaffs();
    return () => {
      if (unsubscribeStaffs) unsubscribeStaffs();
    };
  }, [userDb, user?.companyId]);

  const handleSelectStaffRow = (staff: StaffData) => { 
      if (!isStaffEditing) setStaffForm(staff); 
  };
  
  const handleAddStaff = () => { 
      setStaffForm(getDefaultFormData()); 
      setIsStaffEditing(true); 
  };
  
  const handleEditStaff = () => setIsStaffEditing(true);
  
  const handleCancelStaff = () => { 
      setIsStaffEditing(false); 
      const current = staffForm.id === "" ? staffList[0] : staffList.find(s => s.id === staffForm.id); 
      if(current) setStaffForm(current); 
  };
  
  const handleSaveStaff = async () => {
      if (!staffForm.name.trim()) return alert("Nama Staff wajib diisi!");

      if (staffForm.id === "") {
          // Insert new staff
          const { id, ...newStaff } = staffForm;
          try {
              const response = await authenticatedAxios.post(`${API_BASE_URL}/api/staffs`, {
                  ...newStaff
              });
              console.log("Insert staff response:", response);
              // Accept both 200 and 201 as success
              if (response.status === 200 || response.status === 201) {
                  setIsStaffEditing(false);
                  // Reset form to default after successful insert
                  setStaffForm(getDefaultFormData());
                  alert("Data Staff Berhasil Ditambahkan!");
              } else {
                  console.error("Unexpected status code:", response.status);
                  alert(`Gagal menambahkan staff. Status: ${response.status}`);
              }
          } catch (error: any) {
              console.error("Error menambahkan staff:", error);
              console.error("Error response:", error?.response);
              const errorMsg = error?.response?.data?.message || error?.response?.data?.error || error?.message || "Gagal menambahkan staff. Silakan coba lagi.";
              alert(errorMsg);
          }
      } else {
          // Update existing staff
          const { id, ...updateData } = staffForm;
          try {
              const response = await authenticatedAxios.put(`${API_BASE_URL}/api/staffs/update`, {
                  id: id,
                  ...updateData
              });
              if (response.status === 200) {
                  setIsStaffEditing(false);
                  alert("Data Staff Berhasil Diupdate!");
              } else {
                  alert("Gagal mengupdate staff");
              }
          } catch (error: any) {
              console.error("Error mengupdate staff:", error);
              const errorMsg = error?.response?.data?.message || error?.message || "Gagal mengupdate staff. Silakan coba lagi.";
              alert(errorMsg);
          }
      }
  };

  const handleDeleteStaff = async () => {
      if (!staffForm.id) return;
      if (confirm("Hapus data staff ini?")) {
          try {
              const response = await authenticatedAxios.delete(`${API_BASE_URL}/api/staffs/${staffForm.id}`);
              if (response.status === 200) {
                  setIsStaffEditing(false);
                  if (staffList.length > 1) {
                      const remaining = staffList.filter(s => s.id !== staffForm.id);
                      if (remaining.length > 0) setStaffForm(remaining[0]);
                      else setStaffForm(getDefaultFormData());
                  } else {
                      setStaffForm(getDefaultFormData());
                  }
                  alert("Data Staff Berhasil Dihapus!");
              } else {
                  alert("Gagal menghapus staff");
              }
          } catch (error) {
              console.error("Error menghapus staff:", error);
              alert("Gagal menghapus staff. Silakan coba lagi.");
          }
      }
  };

  return (
    // HAPUS 'h-full' agar tinggi mengikuti konten dan bisa di-scroll parent-nya
    <div className="space-y-6 max-w-4xl animate-in fade-in pb-20">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6 uppercase tracking-wider">STAFF / KARYAWAN</h2>
        
        {/* FORM INPUT AREA */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div>
                    <label className="block text-gray-800 font-medium mb-2 flex items-center gap-2 text-sm md:text-base">
                        <User className="w-4 h-4"/> Nama Staff*
                    </label>
                    <input 
                        type="text" 
                        disabled={!isStaffEditing} 
                        value={staffForm.name} 
                        onChange={(e) => setStaffForm({...staffForm, name: e.target.value})} 
                        className={`w-full border rounded-full px-4 py-2 focus:outline-none transition-colors ${isStaffEditing ? 'border-gray-400 focus:border-blue-500 bg-white' : 'border-transparent bg-gray-100 text-gray-600 cursor-not-allowed'}`} 
                        placeholder="Nama Lengkap"
                    />
                </div>
                <div>
                    <label className="block text-gray-800 font-medium mb-2 flex items-center gap-2 text-sm md:text-base">
                        <Briefcase className="w-4 h-4"/> Jabatan (Role)
                    </label>
                    <input 
                        type="text" 
                        disabled={!isStaffEditing} 
                        value={staffForm.role} 
                        onChange={(e) => setStaffForm({...staffForm, role: e.target.value})} 
                        className={`w-full border rounded-full px-4 py-2 focus:outline-none transition-colors ${isStaffEditing ? 'border-gray-400 focus:border-blue-500 bg-white' : 'border-transparent bg-gray-100 text-gray-600 cursor-not-allowed'}`} 
                        placeholder="Contoh: Kasir, Admin, Gudang..."
                    />
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-6">
                <div>
                    <label className="block text-gray-800 font-medium mb-2 flex items-center gap-2 text-sm md:text-base">
                        <Phone className="w-4 h-4"/> No. HP
                    </label>
                    <input 
                        type="text" 
                        disabled={!isStaffEditing} 
                        value={staffForm.phone} 
                        onChange={(e) => setStaffForm({...staffForm, phone: e.target.value})} 
                        className={`w-full border rounded-full px-4 py-2 focus:outline-none transition-colors ${isStaffEditing ? 'border-gray-400 focus:border-blue-500 bg-white' : 'border-transparent bg-gray-100 text-gray-600 cursor-not-allowed'}`} 
                        placeholder="0812..."
                    />
                </div>
                <div>
                    <label className="block text-gray-800 font-medium mb-2 text-sm md:text-base">Status</label>
                    <div className="flex gap-4 items-center">
                        <button disabled={!isStaffEditing} onClick={() => setStaffForm({...staffForm, status: 'Aktif'})} className={`flex-1 md:flex-none px-6 py-2 rounded-full font-medium border transition-colors ${staffForm.status === 'Aktif' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white border-gray-300 text-gray-500'} ${!isStaffEditing ? 'opacity-70 cursor-not-allowed' : ''}`}>Aktif</button>
                        <button disabled={!isStaffEditing} onClick={() => setStaffForm({...staffForm, status: 'Tidak Aktif'})} className={`flex-1 md:flex-none px-6 py-2 rounded-full font-medium border transition-colors ${staffForm.status === 'Tidak Aktif' ? 'bg-red-100 border-red-500 text-red-700' : 'bg-white border-gray-300 text-gray-500'} ${!isStaffEditing ? 'opacity-70 cursor-not-allowed' : ''}`}>Tidak Aktif</button>
                    </div>
                </div>
            </div>
        </div>

        {/* BUTTON ACTIONS */}
        <div className="flex flex-wrap justify-center gap-4">
                    {!isStaffEditing ? (
                <>
                    <button onClick={handleAddStaff} className="bg-blue-200 hover:bg-blue-300 text-blue-900 px-8 py-2.5 rounded-full flex items-center gap-2 font-bold shadow-sm transition-transform active:scale-95"><Plus className="w-5 h-5"/> Tambah</button>
                    {staffForm.id !== "" && (
                        <button onClick={handleEditStaff} className="bg-yellow-200 hover:bg-yellow-300 text-yellow-900 px-8 py-2.5 rounded-full flex items-center gap-2 font-bold shadow-sm transition-transform active:scale-95"><Edit className="w-5 h-5"/> Edit</button>
                    )}
                </>
            ) : (
                <>
                    <button onClick={handleCancelStaff} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2.5 rounded-full flex items-center gap-2 font-bold shadow-sm transition-transform active:scale-95"><XIcon className="w-5 h-5"/> Batal</button>
                    <button onClick={handleSaveStaff} className="bg-green-600 hover:bg-green-700 text-white px-8 py-2.5 rounded-full flex items-center gap-2 font-bold shadow-md transition-transform active:scale-95"><Save className="w-5 h-5"/> Simpan</button>
                    {staffForm.id !== "" && (
                        <button onClick={handleDeleteStaff} className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2.5 rounded-full flex items-center gap-2 font-bold shadow-sm transition-transform active:scale-95"><Trash2 className="w-5 h-5"/></button>
                    )}
                </>
            )}
        </div>

        {/* TABLE LIST */}
        <div className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm flex flex-col">
            <div className="bg-gray-100 border-b border-gray-200 px-4 py-3 font-bold text-gray-700 text-sm">
                Daftar Karyawan ({staffList.length})
            </div>
            
            {/* WRAPPER TABLE: Hanya scroll horizontal, tinggi vertikal mengikuti konten (Full Page Scroll) */}
            <div className="overflow-x-auto w-full">
                <table className="w-full text-sm text-left min-w-[600px]">
                    <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-xs border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3">Nama Staff</th>
                            <th className="px-4 py-3">Jabatan</th>
                            <th className="px-4 py-3">No. HP</th>
                            <th className="px-4 py-3 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {staffList.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center py-8 text-gray-400 italic">Belum ada data staff.</td>
                            </tr>
                        ) : (
                            staffList.map((staff) => (
                                <tr 
                                    key={staff.id} 
                                    onClick={() => handleSelectStaffRow(staff)}
                                    className={`cursor-pointer transition-colors hover:bg-blue-50 ${staffForm.id === staff.id ? 'bg-blue-100' : ''}`}
                                >
                                    <td className="px-4 py-3 font-medium text-gray-800">{staff.name}</td>
                                    <td className="px-4 py-3 text-gray-600">{staff.role}</td>
                                    <td className="px-4 py-3 text-gray-600 font-mono">{staff.phone}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${staff.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {staff.status}
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

export default StaffTab;