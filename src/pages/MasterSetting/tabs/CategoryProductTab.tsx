// src/pages/MasterSetting/tabs/CategoryProductTab.tsx

import React, { useState, useEffect } from 'react';
import { Edit, Globe, Folder, ChevronDown, ChevronRight, Pencil, Trash2, FolderPlus, Check, X as XIcon } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { and, collection, onSnapshot, query, QueryDocumentSnapshot, where, type DocumentData } from 'firebase/firestore';
import authenticatedAxios from '../../../utils/api';
import { API_BASE_URL } from '../../../apiConfig';
import type { CategoryNode } from '../../../types';

const CategoryProductTab: React.FC = () => {
  const { user, userDb } = useAuth();
  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([{ id: 'root', name: 'Root', isOpen: true, children: [] }]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>('root');
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  // Fetch Product Categories from Firebase
  const fetchCategories = () => {
    if (!userDb) {
      console.error("Tidak ada dbnya: ", userDb);
      return null;
    }
    const categoryCollection = collection(userDb, 'product_categories');

    const q = query(
      categoryCollection,
      and(
        where('isDeleted', '==', false),
        where('companyId', '==', user?.companyId)
      )
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const categoryData: CategoryNode[] = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        name: doc.data().name ?? "",
        isOpen: false,
        children: [],
        parentId: doc.data().parentId ?? null,
        companyId: doc.data().companyId ?? ""
      }));
      
      // Build tree structure from flat data
      const buildTree = (items: CategoryNode[], parentId: string | null = null): CategoryNode[] => {
        return items
          .filter(item => item.parentId === parentId)
          .map(item => ({
            ...item,
            children: buildTree(items, item.id)
          }));
      };
      
      const tree = buildTree(categoryData);
      setCategoryTree([{ id: 'root', name: 'Root', isOpen: true, children: tree }]);
    }, (err) => {
      console.error('Error fetching product categories:', err);
    });

    return unsubscribe;
  };

  useEffect(() => {
    const unsubscribeCategories = fetchCategories();
    return () => {
      if (unsubscribeCategories) unsubscribeCategories();
    };
  }, [userDb, user?.companyId]);

  // Logic Helper
  const renderTree = (nodes: CategoryNode[], level: number = 0, selectedId: string | null, onSelect: (id: string) => void, onToggle: (id: string) => void) => {
      return nodes.map(node => (
          <div key={node.id} className="select-none">
              <div 
                  className={`flex items-center gap-2 py-1 px-2 cursor-pointer transition-colors rounded ${selectedId === node.id ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-gray-100 text-gray-700'}`}
                  style={{ paddingLeft: `${level * 20 + 8}px` }}
                  onClick={() => onSelect(node.id)}
              >
                  <div onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}>
                    {node.children.length > 0 ? (
                        node.isOpen ? <ChevronDown className="w-4 h-4 text-gray-400"/> : <ChevronRight className="w-4 h-4 text-gray-400"/>
                    ) : ( <div className="w-4 h-4"></div> )}
                  </div>
                  {node.id.includes('root') ? <Globe className="w-5 h-5 text-blue-600"/> : <Folder className={`w-5 h-5 ${selectedId === node.id ? 'fill-blue-200' : 'fill-yellow-100'} text-yellow-500`}/>}
                  <span>{node.name}</span>
              </div>
              {node.isOpen && node.children.length > 0 && (
                  <div className="border-l border-dashed border-gray-300 ml-4">
                      {renderTree(node.children, level + 1, selectedId, onSelect, onToggle)}
                  </div>
              )}
          </div>
      ));
  };

  const toggleNode = (id: string, tree: CategoryNode[], setTree: React.Dispatch<React.SetStateAction<CategoryNode[]>>) => {
      const toggleRecursive = (nodes: CategoryNode[]): CategoryNode[] => {
          return nodes.map(node => {
              if (node.id === id) return { ...node, isOpen: !node.isOpen };
              return { ...node, children: toggleRecursive(node.children) };
          });
      };
      setTree(toggleRecursive(tree));
  };

  const addNode = async (name: string, parentId: string, tree: CategoryNode[], setTree: React.Dispatch<React.SetStateAction<CategoryNode[]>>) => {
      if (!name.trim()) return;
      
      const actualParentId = parentId === 'root' ? null : parentId;
      
      try {
          const response = await authenticatedAxios.post(`${API_BASE_URL}/api/product-categories`, {
              name: name,
              parentId: actualParentId,
              companyId: user?.companyId ?? ""
          });
          console.log("Insert category response:", response);
          // Accept both 200 and 201 as success
          if (response.status === 200 || response.status === 201) {
              // Tree will be updated automatically via onSnapshot
              setNewCategoryName("");
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

  const deleteNode = async (id: string, tree: CategoryNode[], setTree: React.Dispatch<React.SetStateAction<CategoryNode[]>>) => {
     if(window.confirm("Hapus kategori ini beserta isinya?")) {
        try {
            const response = await authenticatedAxios.delete(`${API_BASE_URL}/api/product-categories/${id}`);
            if (response.status === 200) {
                // Tree will be updated automatically via onSnapshot
                if (selectedCategoryId === id) {
                    setSelectedCategoryId('root');
                }
            } else {
                alert("Gagal menghapus kategori");
            }
        } catch (error: any) {
            console.error("Error menghapus kategori:", error);
            console.error("Error response:", error?.response);
            const errorMsg = error?.response?.data?.message || error?.response?.data?.error || error?.message || "Gagal menghapus kategori. Silakan coba lagi.";
            alert(errorMsg);
        }
     }
  };

  const renameNode = async (id: string, newName: string, tree: CategoryNode[], setTree: React.Dispatch<React.SetStateAction<CategoryNode[]>>) => {
      if (!newName.trim()) return;
      
      try {
          const response = await authenticatedAxios.put(`${API_BASE_URL}/api/product-categories/update`, {
              id: id,
              name: newName
          });
          if (response.status === 200) {
              // Tree will be updated automatically via onSnapshot
              setIsRenaming(false);
          } else {
              alert("Gagal mengupdate kategori");
          }
      } catch (error: any) {
          console.error("Error mengupdate kategori:", error);
          console.error("Error response:", error?.response);
          const errorMsg = error?.response?.data?.message || error?.response?.data?.error || error?.message || "Gagal mengupdate kategori. Silakan coba lagi.";
          alert(errorMsg);
      }
  };

  const startRename = (tree: CategoryNode[], selectedId: string | null) => {
      if(!selectedId) return;
      const findName = (nodes: CategoryNode[]): string => {
          for(const node of nodes) {
              if (node.id === selectedId) return node.name;
              const childName = findName(node.children);
              if (childName) return childName;
          }
          return "";
      }
      setRenameValue(findName(tree));
      setIsRenaming(true);
  };

  const saveRename = (tree: CategoryNode[], setTree: React.Dispatch<React.SetStateAction<CategoryNode[]>>, selectedId: string | null) => {
      if (selectedId && renameValue.trim()) {
          renameNode(selectedId, renameValue, tree, setTree);
      }
      setIsRenaming(false);
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6 uppercase tracking-wider">CATEGORY PRODUCT</h2>
        
        {/* ADAPTIF: Flex Col di HP, Flex Row di Tablet/PC */}
        <div className="flex flex-col md:flex-row gap-6 h-auto md:h-[500px]">
            
            {/* TREE VIEW PANEL */}
            <div className="w-full md:w-1/3 border border-gray-300 rounded-lg p-4 overflow-y-auto bg-white shadow-sm min-h-[300px] md:min-h-0">
                <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Struktur Kategori</h3>
                <div className="space-y-1">
                    {renderTree(categoryTree, 0, selectedCategoryId, setSelectedCategoryId, (id) => toggleNode(id, categoryTree, setCategoryTree))}
                </div>
            </div>

            {/* EDIT PANEL */}
            <div className="flex-1 bg-gray-50 p-6 rounded-lg border border-gray-200 h-fit">
                <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2"><Edit className="w-5 h-5"/> Kelola Kategori</h3>
                <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 p-3 rounded border border-gray-200 gap-4 md:gap-0">
                    <div>
                        <label className="block text-gray-600 text-sm mb-1">Kategori Terpilih:</label>
                        {isRenaming ? (
                            <div className="flex items-center gap-1">
                                <input type="text" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} className="border border-blue-300 rounded px-2 py-1 text-base focus:outline-none text-black w-full md:w-60"/>
                                <button onClick={() => saveRename(categoryTree, setCategoryTree, selectedCategoryId)} className="bg-green-500 text-white rounded p-1.5 hover:bg-green-600"><Check className="w-4 h-4"/></button>
                                <button onClick={() => setIsRenaming(false)} className="bg-red-500 text-white rounded p-1.5 hover:bg-red-600"><XIcon className="w-4 h-4"/></button>
                            </div>
                        ) : (
                            <div className="font-bold text-xl text-blue-700 flex items-center gap-2">
                                {selectedCategoryId && selectedCategoryId.includes('root') ? <Globe className="w-5 h-5"/> : <Folder className="w-5 h-5 fill-blue-300"/>}
                                {(() => {
                                    const findName = (nodes: CategoryNode[]): string => {
                                        for(const node of nodes) {
                                            if (node.id === selectedCategoryId) return node.name;
                                            const child = findName(node.children);
                                            if(child) return child;
                                        }
                                        return "";
                                    }
                                    return findName(categoryTree) || "Root";
                                })()}
                            </div>
                        )}
                    </div>
                    
                    <div className="flex gap-2 w-full md:w-auto">
                        {!isRenaming && (
                            <>
                                <button onClick={() => startRename(categoryTree, selectedCategoryId)} className="flex-1 md:flex-none justify-center bg-[#FFE167] hover:bg-yellow-400 text-black px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-sm transition-transform hover:scale-105">
                                    Edit <Pencil className="w-4 h-4"/>
                                </button>
                                {selectedCategoryId && !selectedCategoryId.includes('root') && (
                                    <button onClick={() => deleteNode(selectedCategoryId, categoryTree, setCategoryTree)} className="flex-1 md:flex-none justify-center bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-sm transition-transform hover:scale-105">
                                        Delete <Trash2 className="w-4 h-4"/>
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-gray-800 font-medium mb-2">Nama Kategori Baru</label>
                        <div className="flex flex-col md:flex-row gap-2">
                            <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Contoh: Sabun Cair..." className="flex-1 border border-gray-400 rounded-full px-4 py-2 focus:outline-none focus:border-blue-500 bg-white"/>
                            <button onClick={() => { if(newCategoryName && selectedCategoryId) { addNode(newCategoryName, selectedCategoryId, categoryTree, setCategoryTree); } }} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full flex items-center justify-center gap-2 font-medium shadow-sm transition-transform hover:scale-105"><FolderPlus className="w-5 h-5"/> Tambah</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default CategoryProductTab;