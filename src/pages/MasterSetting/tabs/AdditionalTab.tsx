// src/pages/MasterSetting/tabs/AdditionalTab.tsx

import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X as XIcon, Layers, PlusCircle } from 'lucide-react';

// --- TIPE DATA ---
interface AdditionalOption {
    id: number;
    name: string;
    price: number | string; 
}

interface AdditionalGroup {
    id: number;
    name: string; 
    options: AdditionalOption[];
}

const AdditionalTab: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);

  // Mock Data Awal
  const [groups, setGroups] = useState<AdditionalGroup[]>([
      { 
          id: 1, 
          name: "Pilihan Sambal", 
          options: [
              { id: 101, name: "No Sambal", price: 0 },
              { id: 102, name: "Sambal Pisah", price: 0 },
              { id: 103, name: "Sambal Normal", price: 1000 },
              { id: 104, name: "Extra Sambal", price: 2000 },
          ]
      },
      { 
          id: 2, 
          name: "Custom (Pengurang)", 
          options: [
              { id: 201, name: "Tanpa Telur", price: -2000 },
              { id: 202, name: "Less Sugar", price: 0 },
          ]
      },
  ]);

  const [activeGroup, setActiveGroup] = useState<AdditionalGroup>({ id: 0, name: "", options: [] });
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionPrice, setNewOptionPrice] = useState<string>("");

  // --- HANDLER ---
  const handleSelectGroup = (group: AdditionalGroup) => {
      if (!isEditing) {
          setActiveGroup(JSON.parse(JSON.stringify(group)));
      }
  };

  const handleAddGroup = () => {
      setActiveGroup({ id: 0, name: "", options: [] });
      setIsEditing(true);
  };

  const handleDeleteGroup = (id: number) => {
      if(confirm("Hapus grup additional ini beserta semua opsinya?")) {
          setGroups(prev => prev.filter(g => g.id !== id));
          if (activeGroup.id === id) {
              setActiveGroup({ id: 0, name: "", options: [] });
              setIsEditing(false);
          }
      }
  };

  const handleEdit = () => setIsEditing(true);
  
  const handleCancel = () => {
      setIsEditing(false);
      const original = groups.find(g => g.id === activeGroup.id);
      if (original) setActiveGroup(JSON.parse(JSON.stringify(original)));
      else setActiveGroup({ id: 0, name: "", options: [] });
  };

  const handleSave = () => {
      if (!activeGroup.name.trim()) return alert("Nama Grup Wajib Diisi!");

      // Bersihkan data harga (convert string ke number) saat save
      const cleanOptions = activeGroup.options.map(opt => ({
          ...opt,
          price: typeof opt.price === 'string' ? parseInt(opt.price) || 0 : opt.price
      }));

      const groupToSave = { ...activeGroup, options: cleanOptions };

      if (activeGroup.id === 0) {
          const newId = Date.now();
          const newGroup = { ...groupToSave, id: newId };
          setGroups([...groups, newGroup]);
          setActiveGroup(newGroup);
      } else {
          setGroups(prev => prev.map(g => g.id === activeGroup.id ? groupToSave : g));
          setActiveGroup(groupToSave);
      }
      setIsEditing(false);
      alert("Data Additional Berhasil Disimpan!");
  };

  const handleAddOption = () => {
      if (!newOptionName.trim()) return alert("Nama opsi harus diisi!");
      
      const newOpt: AdditionalOption = {
          id: Date.now(),
          name: newOptionName,
          price: parseInt(newOptionPrice) || 0
      };

      setActiveGroup(prev => ({ ...prev, options: [...prev.options, newOpt] }));
      setNewOptionName("");
      setNewOptionPrice("");
  };

  const handleDeleteOption = (optId: number) => {
      setActiveGroup(prev => ({ ...prev, options: prev.options.filter(o => o.id !== optId) }));
  };

  const handleUpdateOption = (optId: number, field: 'name'|'price', value: any) => {
      setActiveGroup(prev => ({
          ...prev,
          options: prev.options.map(o => o.id === optId ? { ...o, [field]: value } : o)
      }));
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in space-y-6 p-2 md:p-4">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2 uppercase tracking-wider">
            ADDITIONAL / MODIFIER
        </h2>
        
        <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[500px]">
            
            {/* PANEL KIRI: LIST GROUP */}
            <div className="w-full lg:w-1/3 bg-white border border-gray-300 rounded-xl overflow-hidden flex flex-col shadow-sm">
                <div className="bg-gray-100 p-4 border-b border-gray-300 font-bold text-gray-700 text-sm flex justify-between items-center">
                    <span>Daftar Grup Additional</span>
                    <button onClick={handleAddGroup} disabled={isEditing} className="bg-blue-600 text-white p-1.5 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors" title="Tambah Grup Baru">
                        <Plus className="w-4 h-4"/>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {groups.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm italic">Belum ada grup additional.</div>
                    ) : (
                        groups.map(group => (
                            <div 
                                key={group.id} 
                                onClick={() => handleSelectGroup(group)}
                                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors flex justify-between items-center group/item ${activeGroup.id === group.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
                            >
                                <div>
                                    <div className="font-bold text-gray-800 flex items-center gap-2">
                                        <Layers className="w-4 h-4 text-gray-500"/> {group.name}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">{group.options.length} Opsi</div>
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}
                                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity p-1"
                                >
                                    <Trash2 className="w-4 h-4"/>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* PANEL KANAN: EDITOR */}
            <div className="flex-1 bg-white border border-gray-300 rounded-xl flex flex-col shadow-sm overflow-hidden">
                {activeGroup.id !== 0 || isEditing ? (
                    <>
                        {/* HEADER FORM */}
                        <div className="p-6 border-b border-gray-200 bg-white">
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Grup Additional</label>
                                <input 
                                    type="text" 
                                    disabled={!isEditing} 
                                    value={activeGroup.name} 
                                    onChange={(e) => setActiveGroup({...activeGroup, name: e.target.value})} 
                                    className={`w-full text-xl font-bold border-b-2 px-2 py-1 focus:outline-none ${isEditing ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-transparent'}`}
                                    placeholder="Contoh: Pilihan Sambal"
                                />
                            </div>
                            
                            {/* TOOLBAR ACTIONS */}
                            <div className="flex justify-end gap-3">
                                {!isEditing ? (
                                    <button onClick={handleEdit} className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg font-bold flex items-center gap-2 text-sm shadow-sm"><Edit className="w-4 h-4"/> Edit Grup</button>
                                ) : (
                                    <>
                                        <button onClick={handleCancel} className="px-6 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 font-bold flex items-center gap-2 text-sm"><XIcon className="w-4 h-4"/> Batal</button>
                                        <button onClick={handleSave} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-2 text-sm shadow-sm"><Save className="w-4 h-4"/> Simpan</button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* LIST OPSI */}
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">Daftar Opsi & Harga</h3>
                            
                            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs">
                                        <tr>
                                            <th className="px-4 py-3">Nama Opsi</th>
                                            <th className="px-4 py-3 w-40 text-right">Tambahan Harga</th>
                                            {isEditing && <th className="px-4 py-3 w-16 text-center">Aksi</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {activeGroup.options.length === 0 && (
                                            <tr><td colSpan={3} className="p-4 text-center text-gray-400 italic">Belum ada opsi. Silakan tambah di bawah.</td></tr>
                                        )}
                                        {activeGroup.options.map((opt) => {
                                            const priceVal = parseInt(String(opt.price)) || 0;
                                            const isNegative = priceVal < 0;

                                            return (
                                                <tr key={opt.id} className="hover:bg-blue-50/50 transition-colors">
                                                    <td className="px-4 py-2">
                                                        <input 
                                                            type="text" 
                                                            disabled={!isEditing}
                                                            value={opt.name}
                                                            onChange={(e) => handleUpdateOption(opt.id, 'name', e.target.value)}
                                                            className={`w-full bg-transparent focus:outline-none ${isEditing ? 'border-b border-blue-300 focus:border-blue-500' : ''}`}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        {isEditing ? (
                                                            <input 
                                                                type="number" 
                                                                value={opt.price}
                                                                onChange={(e) => handleUpdateOption(opt.id, 'price', e.target.value)}
                                                                className={`w-full bg-transparent focus:outline-none text-right font-mono font-bold 
                                                                    ${isEditing ? 'border-b border-blue-300 focus:border-blue-500' : ''}
                                                                    ${isNegative ? 'text-red-600' : 'text-gray-700'}
                                                                `}
                                                            />
                                                        ) : (
                                                            <span className={`font-mono font-bold ${isNegative ? 'text-red-600' : 'text-gray-700'}`}>
                                                                {priceVal.toLocaleString('id-ID')}
                                                            </span>
                                                        )}
                                                    </td>
                                                    {isEditing && (
                                                        <td className="px-4 py-2 text-center">
                                                            <button onClick={() => handleDeleteOption(opt.id)} className="text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50"><XIcon className="w-4 h-4"/></button>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                        
                                        {/* ROW TAMBAH BARU */}
                                        {isEditing && (
                                            <tr className="bg-blue-50/30 border-t-2 border-blue-100">
                                                <td className="px-4 py-3">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Nama Opsi... (mis: Extra Pedas)" 
                                                        value={newOptionName}
                                                        onChange={(e) => setNewOptionName(e.target.value)}
                                                        className="w-full border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 text-sm"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input 
                                                        type="number" 
                                                        placeholder="0" 
                                                        value={newOptionPrice}
                                                        onChange={(e) => setNewOptionPrice(e.target.value)}
                                                        className={`w-full border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 text-sm text-right font-bold ${parseInt(newOptionPrice) < 0 ? 'text-red-600' : ''}`}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button onClick={handleAddOption} className="bg-blue-600 text-white p-1.5 rounded hover:bg-blue-700 transition-colors shadow-sm" title="Tambah">
                                                        <PlusCircle className="w-5 h-5"/>
                                                    </button>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                        <Layers className="w-16 h-16 mb-4 opacity-20"/>
                        <p className="text-lg font-medium text-gray-500">Pilih Grup Additional</p>
                        <p className="text-sm">Klik salah satu grup di sebelah kiri untuk melihat atau mengedit detail opsi.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default AdditionalTab;