// src/pages/MasterSetting/tabs/UserGroupTab.tsx

import React, { useState, useEffect } from 'react';
import { Edit, Save, X as XIcon, Shield, CheckSquare, Square, Users } from 'lucide-react';
import type { User, Permission } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { and, collection, onSnapshot, query, QueryDocumentSnapshot, where, type DocumentData } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import authenticatedAxios from '../../../utils/api';
import { API_BASE_URL } from '../../../apiConfig';

// Type for grouped permissions
type GroupedPermissions = {
  [category: string]: { key: string; label: string }[];
};


const UserGroupTab: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  // Data Users
  const [users, setUsers] = useState<User[]>([]);
  
  // Permissions grouped by category
  const [allPermissions, setAllPermissions] = useState<GroupedPermissions>({});

  const defaultFormData: User = { 
    id: "", 
    username: "", 
    accessOutlets: [], 
    companyId: user?.companyId ?? "", 
    phone: "", 
    role: "", 
    status: "Aktif", 
    permissions: [] as any // Store as string array for permission keys
  };
  const [form, setForm] = useState<User>(defaultFormData);

  // Fetch Permissions from Firebase (db utama, bukan userDb)
  const fetchPermissions = () => {
    const permissionCollection = collection(db, 'permissions');
    
    const q = query(permissionCollection);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const permissionData: Permission[] = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        label: doc.data().label
      }));
      
      // Group permissions by category (bagian sebelum titik)
      const grouped: GroupedPermissions = {};
      
      permissionData.forEach((perm) => {
        // Split id by dot, first part is category
        const parts = perm.id.split('.');
        if (parts.length >= 2) {
          const category = parts[0].toUpperCase(); // e.g., "kasir" -> "KASIR"
          const key = perm.id; // Full id like "kasir.view"
          
          if (!grouped[category]) {
            grouped[category] = [];
          }
          
          grouped[category].push({
            key: key,
            label: perm.label
          });
        }
      });
      
      setAllPermissions(grouped);
    }, (err) => {
      console.error('Error fetching permissions:', err);
    });
    
    return unsubscribe;
  };

  // Fetch Users from Firebase
  const fetchUsers = () => {
    if(!db){
        console.error("Tidak ada dbnya: ", db);
        return null;
    }
    const userCollection = collection(db, 'users');

    const q = query(
      userCollection,
      and(
        where('isDeleted', '==', false),
        where('companyId', '==', user?.companyId),
        where('role', '!=', "master"),
      )
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userData: User[] = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const perms = doc.data().permissions ?? [];
        // Convert permissions to string array if they're objects
        const permissionKeys = Array.isArray(perms) 
          ? perms.map((p: any) => typeof p === 'string' ? p : p.id || p.key || p)
          : [];
        return {
          id: doc.id,
          accessOutlets: doc.data().accessOutlets ?? [],
          companyId: doc.data().companyId,
          phone: doc.data().phone ?? "",
          role: doc.data().role ?? "",
          status: doc.data().status ?? "Aktif",
          username: doc.data().username,
          permissions: permissionKeys as any
        };
      });
      setUsers(userData);
      // Set first user as default if form is empty
      if (userData.length > 0 && !form.id && !isEditing) {
        setForm(userData[0]);
      }
    }, (err) => {
      console.error('Error fetching users:', err);
    });

    return unsubscribe;
  };

  useEffect(() => {
    const unsubscribePermissions = fetchPermissions();
    const unsubscribeUsers = fetchUsers();
    return () => {
      if (unsubscribePermissions) unsubscribePermissions();
      if (unsubscribeUsers) unsubscribeUsers();
    };
  }, [user?.companyId]);

  // --- HANDLER ---
  const handleSelectUser = (user: User) => {
      if (!isEditing) {
          // Ensure permissions is array of strings (permission ids)
          const userPerms = user.permissions || [];
          const permissionIds: string[] = Array.isArray(userPerms) 
            ? userPerms.map((p: any) => typeof p === 'string' ? p : p.id || p.key || String(p))
            : [];
          
          setForm({
              ...user,
              permissions: permissionIds as any
          });
          // Scroll to detail on mobile if needed (optional)
          const detailElement = document.getElementById('group-detail-panel');
          if(detailElement && window.innerWidth < 1024) {
              detailElement.scrollIntoView({ behavior: 'smooth' });
          }
      }
  };

  // Removed handleAdd - users should be added in UserTab, not here

  const handleEdit = () => setIsEditing(true);

  const handleCancel = () => {
      setIsEditing(false);
      const current = form.id === "" ? users[0] : users.find(u => u.id === form.id);
      if (current) setForm(current);
  };

  const handleSave = async () => {
      if (!form.username.trim()) return alert("Username Wajib Diisi!");

      if (form.id === "") {
          // This shouldn't happen in this tab, but handle it anyway
          alert("Silakan pilih user terlebih dahulu!");
          return;
      } else {
          // Update user permissions via API
          const { id, password, ...updateData } = form;
          // Ensure permissions is array of strings (permission ids)
          const current = form.permissions || [];
          const permissionIds: string[] = Array.isArray(current) 
            ? current.map((p: any) => typeof p === 'string' ? p : p.id || p.key || String(p))
            : [];
          
          try {
              const response = await authenticatedAxios.put(`${API_BASE_URL}/api/users/update`, {
                  id: id,
                  ...updateData,
                  permissions: permissionIds
              });
              if (response.status === 200) {
                  // Update local state
                  setUsers(prev => prev.map(u => u.id === form.id ? form : u));
                  setIsEditing(false);
                  alert("Data User Permissions Berhasil Disimpan!");
              } else {
                  alert("Gagal menyimpan permissions");
              }
          } catch (error) {
              console.error("Error menyimpan permissions:", error);
              alert("Gagal menyimpan permissions. Silakan coba lagi.");
          }
      }
  };


  const togglePermission = (key: string) => {
      if (!isEditing) return;
      const current = form.permissions || [];
      // Convert to string array if needed
      const permissionKeys: string[] = Array.isArray(current) 
        ? current.map((p: any) => typeof p === 'string' ? p : p.id || p.key || String(p))
        : [];
      
      if (permissionKeys.includes(key)) {
          setForm({ ...form, permissions: permissionKeys.filter(k => k !== key) as any });
      } else {
          setForm({ ...form, permissions: [...permissionKeys, key] as any });
      }
  };

  const toggleCategory = (categoryKeys: string[]) => {
      if (!isEditing) return;
      const current = form.permissions || [];
      // Convert to string array if needed
      const permissionKeys: string[] = Array.isArray(current) 
        ? current.map((p: any) => typeof p === 'string' ? p : p.id || p.key || String(p))
        : [];
      const allSelected = categoryKeys.every(k => permissionKeys.includes(k));
      
      if (allSelected) {
          setForm({ ...form, permissions: permissionKeys.filter(k => !categoryKeys.includes(k)) as any });
      } else {
          const newPerms = [...permissionKeys];
          categoryKeys.forEach(k => {
              if (!permissionKeys.includes(k)) newPerms.push(k);
          });
          setForm({ ...form, permissions: newPerms as any });
      }
  };

  return (
    // FIX: Container utama 'h-full' dihapus agar bisa scroll window
    <div className="flex flex-col animate-in fade-in space-y-6 p-1 pb-20">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2 uppercase tracking-wider">USER PERMISSIONS</h2>
        
        {/* Layout Flex: Stack on Mobile, Row on Desktop */}
        <div className="flex flex-col lg:flex-row gap-6">
            
            {/* PANEL KIRI: LIST USERS */}
            <div className="w-full lg:w-1/4 bg-white border border-gray-300 rounded-xl overflow-hidden flex flex-col shadow-sm h-fit">
                <div className="bg-gray-100 p-4 border-b border-gray-300 font-bold text-gray-700 text-sm flex justify-between items-center sticky top-0 z-10">
                    <span>Daftar Users</span>
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">{users.length}</span>
                </div>
                {/* List tanpa batasan tinggi scroll internal */}
                <div className="flex-col">
                    {users.map(userItem => (
                        <div 
                            key={userItem.id} 
                            onClick={() => handleSelectUser(userItem)}
                            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors ${form.id === userItem.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
                        >
                            <div className="font-bold text-gray-800 flex items-center gap-2">
                                <Users className="w-4 h-4 text-gray-500"/> {userItem.username}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold border border-purple-200">
                                    {userItem.role || 'No Role'}
                                </span>
                            </div>
                        </div>
                    ))}
                    {users.length === 0 && (
                        <div className="p-4 text-center text-gray-400 italic text-sm">Tidak ada data user</div>
                    )}
                </div>
            </div>

            {/* PANEL KANAN: FORM DETAIL */}
            <div id="group-detail-panel" className="flex-1 bg-white border border-gray-300 rounded-xl flex flex-col shadow-sm overflow-hidden h-fit">
                
                {/* HEADER FORM */}
                <div className="p-6 border-b border-gray-200 bg-white sticky top-0 z-10">
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label>
                            <input 
                                type="text" 
                                disabled={true}
                                value={form.username || ""} 
                                className="w-full text-xl font-bold border-b-2 px-2 py-1 focus:outline-none border-transparent bg-gray-50 text-gray-600"
                                placeholder="Pilih user dari list"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role / Group</label>
                            <input 
                                type="text" 
                                disabled={true}
                                value={form.role || ""} 
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none border-transparent bg-gray-50 text-gray-600"
                                placeholder="Role user"
                            />
                        </div>
                    </div>
                    
                    {/* TOOLBAR ACTIONS */}
                    <div className="flex justify-end gap-3">
                        {!isEditing ? (
                            <>
                                <button onClick={handleEdit} className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg font-bold flex items-center gap-2 text-sm shadow-sm"><Edit className="w-4 h-4"/> Edit Permission</button>
                            </>
                        ) : (
                            <>
                                <button onClick={handleCancel} className="px-6 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 font-bold flex items-center gap-2 text-sm"><XIcon className="w-4 h-4"/> Batal</button>
                                <button onClick={handleSave} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-2 text-sm shadow-sm"><Save className="w-4 h-4"/> Simpan</button>
                            </>
                        )}
                    </div>
                </div>

                {/* PERMISSION GRID - Full Page Scroll */}
                <div className="p-6 bg-gray-50">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-purple-600"/> Hak Akses Aplikasi</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {Object.keys(allPermissions).length === 0 && (
                            <div className="col-span-full text-center py-8 text-gray-400 italic">
                                Memuat permissions...
                            </div>
                        )}
                        {Object.entries(allPermissions).map(([category, items]) => {
                            const current = form.permissions || [];
                            const permissionKeys: string[] = Array.isArray(current) 
                              ? current.map((p: any) => typeof p === 'string' ? p : p.id || p.key || String(p))
                              : [];
                            const isAllSelected = items.every(i => permissionKeys.includes(i.key));
                            const categoryKeys = items.map(i => i.key);

                            return (
                                <div key={category} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
                                    <div 
                                        className={`px-4 py-3 border-b border-gray-100 flex justify-between items-center cursor-pointer ${isEditing ? 'hover:bg-gray-50' : ''}`}
                                        onClick={() => toggleCategory(categoryKeys)}
                                    >
                                        <h4 className="font-bold text-xs text-gray-600 uppercase tracking-wider">{category.replace(/_/g, ' ')}</h4>
                                        {isEditing && (
                                            <div className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded">
                                                {isAllSelected ? 'Unselect All' : 'Select All'}
                                            </div>
                                        )}
                                    </div>
                                   <div className="p-3 space-y-2">
                                        {items.map((perm) => {
                                            const current = form.permissions || [];
                                            const permissionKeys: string[] = Array.isArray(current) 
                                              ? current.map((p: any) => typeof p === 'string' ? p : p.id || p.key || String(p))
                                              : [];
                                            const isActive = permissionKeys.includes(perm.key);
                                            return (
                                                <div 
                                                    key={perm.key} 
                                                    onClick={() => togglePermission(perm.key)}
                                                    className={`flex items-start gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer transition-all ${!isEditing ? 'pointer-events-none opacity-80' : 'hover:bg-blue-50'}`}
                                                >
                                                    {/* CHECKBOX ICON */}
                                                    {isActive ? (
                                                        <CheckSquare className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isEditing ? 'text-blue-600' : 'text-green-600'}`}/>
                                                    ) : (
                                                        <Square className="w-5 h-5 flex-shrink-0 mt-0.5 text-gray-300"/>
                                                    )}
                                                    
                                                    {/* LABEL */}
                                                    <span className={`leading-tight ${isActive ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                                                        {perm.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};

export default UserGroupTab;