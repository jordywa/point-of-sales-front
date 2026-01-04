// src/pages/MasterSetting/tabs/UserTab.tsx

import React, { useEffect, useState } from 'react';
import { Edit, Save, Plus, X as XIcon, Shield, Store } from 'lucide-react';
import type { Outlet, Role, User } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { and, collection, onSnapshot, query, QueryDocumentSnapshot, where, type DocumentData } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import authenticatedAxios from '../../../utils/api';
import { API_BASE_URL } from '../../../apiConfig';

const UserTab: React.FC = () => {
    const {user, userDb} = useAuth();
    const [isUserEditing, setIsUserEditing] = useState(false);
    
    // Mock Data User
    const [users, setUsers] = useState<User[]>([]);

    const defaultFormData: User = {
        id: "",
        username: "",
        password: "",
        companyId: user?.companyId ?? "",
        accessOutlets: [],
        phone: "",
        role: "",
        status: "Aktif",
    }

    const [formData, setFormData] = useState<User>(defaultFormData);
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);

    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const fetchOutlets = () => {
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
        }, (err) => {
            console.error('Error fetching products:', err);
        });

        return unsubscribe;
    }

    const fetchRoles = () => {
        if(!userDb){
            console.error("Tidak ada dbnya: ", userDb);
            return null;
        }
        const outletCollection = collection(userDb, 'roles');

        const q = query(
            outletCollection, 
            where('isDeleted', '==', false)
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const roleData: Role[] = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
                id: doc.id,
                name: doc.data().name,
                description: doc.data().description
            }));
            
            setRoles([{id: "", name: ""}, ...roleData]);
        }, (err) => {
            console.error('Error fetching products:', err);
        });

        return unsubscribe;
    }

    const fetchUsers = () => {
        if(!db){
        console.error("Tidak ada dbnya: ", db);
        return null;
        }
        const outletCollection = collection(db, 'users');

        const q = query(
            outletCollection, 
            and(
                where('isDeleted', '==', false),
                where('companyId', '==', user?.companyId),
                where('role', '!=', "master"),
            )
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const userData: User[] = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
                id: doc.id,
                accessOutlets: doc.data().accessOutlets,
                companyId: doc.data().companyId,
                phone: doc.data().phone,
                role: doc.data().role,
                status: doc.data().status,
                username: doc.data().username,
                password: doc.data().password
            }));
            setUsers(userData)
        }, (err) => {
            console.error('Error fetching products:', err);
        });

        return unsubscribe;
    }

    
        useEffect(() => {
            const unsubscribeOutlets = fetchOutlets();
            const unsubscribeUsers = fetchUsers();
            const unsubscribeRoles = fetchRoles();

            return () => {
                if(unsubscribeOutlets)
                    unsubscribeOutlets();
                if(unsubscribeRoles)
                    unsubscribeRoles();
                if(unsubscribeUsers)
                    unsubscribeUsers();
            };
        }, []);
  const handleSelectUserRow = (user: User) => { if (!isUserEditing) setFormData({...user, password: ""}); };
  
  const handleAddUser = () => {
      setFormData(defaultFormData);
      setIsUserEditing(true);
  };
  
  const handleEditUser = () => {
    setIsUserEditing(true);
  }
  
  const handleCancelUser = () => {
      setIsUserEditing(false);
      const current = formData.id === "" ? users[0] : users.find(u => u.id === formData.id);
      if (current) setFormData({...current, password: ""});
  };
  
  const handleSaveUser = async () => {
        if(formData.id === ""){
            // Artinya insert
            const {id, ...newUser} = formData;
            console.log(newUser);
            try {
                const response = await authenticatedAxios.post(`${API_BASE_URL}/api/users`, {
                    ...newUser
                });
                if(response.status === 201){
                setSuccessMsg("user Berhasil ditambahkan!");
                } else{
                setErrorMsg("Gagal menambahkan user");
                }

            } catch (error) {
                console.error("Error menambahkan user, ", error);
                return;
            }
        } else{
            // Artinya update
            const {id, password, ...newUser} = formData;
            try {
                const response = await authenticatedAxios.put(`${API_BASE_URL}/api/users/update`, {
                    id: id,
                    ...newUser
                });
                if(response.status === 200){
                setSuccessMsg("user Berhasil ditambahkan!");
                } else{
                setErrorMsg("Gagal menambahkan user");
                }

            } catch (error) {
                console.error("Error menambahkan user, ", error);
                return;
            }

        }
      setIsUserEditing(false);
  };
  
  const handleAddUserAccess = (outletName: string) => {
      if (outletName && !formData.accessOutlets.includes(outletName)) setFormData({ ...formData, accessOutlets: [...formData.accessOutlets, outletName] });
  };
  
  const handleRemoveUserAccess = (outletName: string) => {
      setFormData({ ...formData, accessOutlets: formData.accessOutlets.filter(item => item !== outletName) });
  };

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto space-y-6 p-2 md:p-4 animate-in fade-in pb-20">
        
        {/* TITLE */}
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 text-center mb-2 uppercase tracking-wider">
            USER (LOGIN)
        </h2>
        
        {/* KOTAK ATAS: FORM AREA */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            
            {/* Header Form */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center rounded-t-xl">
                 <span className="font-bold text-gray-700 text-sm md:text-base">Form Input User</span>
                 <span className={`text-xs px-2 py-1 rounded font-bold ${isUserEditing ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                    {isUserEditing ? 'Mode Edit' : 'Mode Lihat'}
                 </span>
            </div>

            <div className="p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                    {/* KOLOM KIRI */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-gray-800 font-medium mb-1 text-sm">Username / Login ID*</label>
                            <input type="text" disabled={!isUserEditing} value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className={`w-full border rounded-lg px-4 py-2 focus:outline-none transition-colors text-sm ${isUserEditing ? 'border-gray-400 focus:border-blue-500 bg-white' : 'border-transparent bg-gray-100 text-gray-600 cursor-not-allowed'}`} />
                        </div>
                        <div>
                            <label className="block text-gray-800 font-medium mb-1 text-sm">Password</label>
                            <input type="password" placeholder={isUserEditing ? "Input new password" : "••••••••"} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} disabled={formData.id !== ""} className={`w-full border rounded-lg px-4 py-2 focus:outline-none transition-colors text-sm ${formData.id === "" ? 'border-gray-400 focus:border-blue-500 bg-white' : 'border-transparent bg-gray-100 text-gray-600 cursor-not-allowed'}`} />
                        </div>
                        
                        {/* INPUT GROUP USER */}
                        <div>
                            <label className="text-gray-800 font-medium mb-1 text-sm flex items-center gap-2">
                                <Shield className="w-4 h-4 text-purple-600"/> Group User (Role)
                            </label>
                            <div className="relative">
                                <select 
                                    disabled={!isUserEditing} 
                                    value={formData.role} 
                                    onChange={(e) => setFormData({...formData, role: e.target.value})} 
                                    className={`w-full border rounded-lg px-4 py-2 text-sm appearance-none focus:outline-none ${isUserEditing ? 'border-purple-300 bg-purple-50 text-purple-900 font-bold cursor-pointer' : 'border-transparent bg-gray-100 text-gray-500 cursor-not-allowed'}`}
                                >
                                    {roles.map(g => (
                                        <option key={g.id} value={g.name}>{g.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* KOLOM KANAN */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-gray-800 font-medium mb-1 text-sm">Kontak / HP</label>
                            <input type="text" disabled={!isUserEditing} value={formData.phone ?? ""} onChange={(e) => setFormData({...formData, phone: e.target.value})} className={`w-full border rounded-lg px-4 py-2 focus:outline-none transition-colors text-sm ${isUserEditing ? 'border-gray-400 focus:border-blue-500 bg-white' : 'border-transparent bg-gray-100 text-gray-600 cursor-not-allowed'}`} />
                        </div>
                        <div>
                            <label className="block text-gray-800 font-medium mb-1 text-sm">Status Akun</label>
                            <div className="flex gap-2">
                                <button disabled={!isUserEditing} onClick={() => setFormData({...formData, status: 'Aktif'})} className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${formData.status === 'Aktif' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white border-gray-300 text-gray-500'}`}>Aktif</button>
                                <button disabled={!isUserEditing} onClick={() => setFormData({...formData, status: 'Tidak Aktif'})} className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${formData.status === 'Tidak Aktif' ? 'bg-red-100 border-red-500 text-red-700' : 'bg-white border-gray-300 text-gray-500'}`}>Tidak Aktif</button>
                            </div>
                        </div>
                        
                        {/* AKSES OUTLET */}
                        <div>
                            <label className="text-gray-800 font-medium mb-1 text-sm flex items-center gap-2"><Store className="w-4 h-4"/> Akses Outlet</label>
                            <div className="flex flex-wrap gap-2 mb-2 min-h-8 bg-gray-50 p-2 rounded border border-gray-100">
                                {formData.accessOutlets.length === 0 && <span className="text-gray-400 text-xs italic">Belum ada akses outlet</span>}
                                {formData.accessOutlets.map((access, idx) => (
                                    <div key={idx} className="flex items-center gap-1 border border-blue-200 bg-white text-blue-700 rounded-full px-3 py-1 text-xs font-bold shadow-sm">
                                        {access}
                                        {isUserEditing && <button onClick={() => handleRemoveUserAccess(access)} className="hover:text-red-600"><XIcon className="w-3 h-3"/></button>}
                                    </div>
                                ))}
                            </div>
                            <div className="relative mt-2">
                                <select disabled={!isUserEditing} value="" onChange={(e) => handleAddUserAccess(e.target.value)} className={`w-full border rounded-lg px-4 py-2 text-sm focus:outline-none appearance-none ${isUserEditing ? 'border-gray-400 bg-white cursor-pointer hover:border-blue-500' : 'border-transparent bg-gray-100 cursor-not-allowed'}`}>
                                    <option value="" disabled>+ Tambah Outlet</option>
                                    {outlets.map(outlet => (<option key={outlet.id} value={outlet.name}>{outlet.name}</option>))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"><Plus className="w-4 h-4"/></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="mt-6 md:mt-8 flex flex-wrap justify-end gap-3 pt-4 border-t border-gray-100">
                    {!isUserEditing ? (
                        <>
                            <button onClick={handleAddUser} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2.5 rounded-lg flex justify-center items-center gap-2 font-bold shadow-sm transition-transform active:scale-95 text-sm md:text-base"><Plus className="w-4 h-4 md:w-5 md:h-5"/> <span className="hidden sm:inline">User Baru</span><span className="inline sm:hidden">Baru</span></button>
                            <button onClick={handleEditUser} className="flex-1 md:flex-none bg-yellow-400 hover:bg-yellow-500 text-black px-4 md:px-6 py-2.5 rounded-lg flex justify-center items-center gap-2 font-bold shadow-sm transition-transform active:scale-95 text-sm md:text-base"><Edit className="w-4 h-4 md:w-5 md:h-5"/> Edit</button>
                        </>
                    ) : (
                        <>
                            <button onClick={handleCancelUser} className="flex-1 md:flex-none bg-gray-200 hover:bg-gray-300 text-black px-4 md:px-6 py-2.5 rounded-lg flex justify-center items-center gap-2 font-bold transition-transform active:scale-95 text-sm md:text-base"><XIcon className="w-4 h-4 md:w-5 md:h-5"/> Batal</button>
                            <button onClick={handleSaveUser} className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white px-6 md:px-8 py-2.5 rounded-lg flex justify-center items-center gap-2 font-bold shadow-md transition-transform active:scale-95 text-sm md:text-base"><Save className="w-4 h-4 md:w-5 md:h-5"/> Simpan</button>
                        </>
                    )}
                </div>
            </div>
        </div>

        {/* KOTAK BAWAH: TABLE LIST USER */}
        {/* Perbaikan: Hapus min-h-[500px] dan biarkan h-auto/fit agar tinggi mengikuti data */}
        <div className="border border-gray-300 rounded-xl overflow-hidden shadow-sm bg-white flex flex-col h-fit">
            <div className="bg-gray-100 border-b border-gray-300 px-4 py-3 font-bold text-gray-700 text-sm">
                Daftar Pengguna ({users.length})
            </div>
            
            {/* WRAPPER TABLE */}
            <div className="flex-1 overflow-x-auto w-full">
                {/* Perbaikan: Hapus h-full disini juga agar tidak maksa tinggi */}
                <div className="min-w-[700px] flex flex-col"> 
                    
                    {/* Header Grid */}
                    <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 py-3 px-4 font-bold text-gray-600 text-xs uppercase tracking-wider">
                        <div className="col-span-3">Username</div>
                        <div className="col-span-3">Group / Role</div>
                        <div className="col-span-3">Kontak</div>
                        <div className="col-span-2 text-center">Status</div>
                        <div className="col-span-1 text-center">Outlet</div>
                    </div>
                    
                    {/* Body Grid */}
                    <div className="flex-1">
                        {users.map(user => (
                            <div key={user.id} onClick={() => handleSelectUserRow(user)} className={`grid grid-cols-12 border-b border-gray-100 py-3 px-4 items-center cursor-pointer transition-colors text-sm ${formData?.id === user.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50 border-l-4 border-l-transparent'}`}>
                                <div className="col-span-3 font-bold text-gray-800 truncate pr-2">{user.username}</div>
                                <div className="col-span-3 pr-2">
                                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] md:text-xs font-bold border border-purple-200 whitespace-nowrap">
                                        {user.role}
                                    </span>
                                </div>
                                <div className="col-span-3 text-gray-600 truncate pr-2">{user.phone}</div>
                                <div className="col-span-2 flex justify-center">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${user.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{user.status}</span>
                                </div>
                                <div className="col-span-1 text-center text-xs text-gray-500 font-medium bg-gray-50 rounded mx-1 py-1">
                                    {user.accessOutlets?.length ?? 0}
                                </div>
                            </div>
                        ))}
                        {users.length === 0 && (
                             <div className="text-center py-8 text-gray-400 italic">Tidak ada data user found.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default UserTab;