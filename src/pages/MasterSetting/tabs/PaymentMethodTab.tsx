// src/pages/MasterSetting/tabs/PaymentMethodTab.tsx

import React, { useState } from 'react';
import { Edit, Globe, Folder, ChevronDown, ChevronRight, Pencil, Trash2, Plus, Check, X as XIcon, CreditCard } from 'lucide-react';

interface CategoryNode {
  id: string;
  name: string;
  isOpen: boolean;
  children: CategoryNode[];
}

const PaymentMethodTab: React.FC = () => {
  const [paymentTree, setPaymentTree] = useState<CategoryNode[]>([{ id: 'root-pay', name: 'Metode Pembayaran', isOpen: true, children: [] }]);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>('root-pay');
  const [newPaymentName, setNewPaymentName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

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

  const addNode = (name: string, parentId: string, tree: CategoryNode[], setTree: React.Dispatch<React.SetStateAction<CategoryNode[]>>) => {
      const newId = `node-${Date.now()}`;
      const newNode: CategoryNode = { id: newId, name: name, isOpen: true, children: [] };
      const addRecursive = (nodes: CategoryNode[]): CategoryNode[] => {
          return nodes.map(node => {
              if (node.id === parentId) return { ...node, isOpen: true, children: [...node.children, newNode] };
              return { ...node, children: addRecursive(node.children) };
          });
      };
      setTree(addRecursive(tree));
  };

  const deleteNode = (id: string, tree: CategoryNode[], setTree: React.Dispatch<React.SetStateAction<CategoryNode[]>>) => {
     if(window.confirm("Hapus kategori ini beserta isinya?")) {
        const deleteRecursive = (nodes: CategoryNode[]): CategoryNode[] => {
            return nodes.filter(node => node.id !== id).map(node => ({ ...node, children: deleteRecursive(node.children) }));
        };
        setTree(deleteRecursive(tree));
     }
  };

  const renameNode = (id: string, newName: string, tree: CategoryNode[], setTree: React.Dispatch<React.SetStateAction<CategoryNode[]>>) => {
      const renameRecursive = (nodes: CategoryNode[]): CategoryNode[] => {
          return nodes.map(node => {
              if (node.id === id) return { ...node, name: newName };
              return { ...node, children: renameRecursive(node.children) };
          });
      };
      setTree(renameRecursive(tree));
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
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6 uppercase tracking-wider">METODE PEMBAYARAN</h2>
        
        {/* ADAPTIF: Flex Col di HP, Flex Row di Tablet/PC */}
        <div className="flex flex-col md:flex-row gap-6 h-auto md:h-[500px]">
            <div className="w-full md:w-1/3 border border-gray-300 rounded-lg p-4 overflow-y-auto bg-white shadow-sm min-h-[300px] md:min-h-0">
                <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Struktur Pembayaran</h3>
                <div className="space-y-1">
                    {renderTree(paymentTree, 0, selectedPaymentId, setSelectedPaymentId, (id) => toggleNode(id, paymentTree, setPaymentTree))}
                </div>
            </div>
            <div className="flex-1 bg-gray-50 p-6 rounded-lg border border-gray-200 h-fit">
                <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5"/> Kelola Pembayaran</h3>
                
                <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 p-3 rounded border border-gray-200 gap-4 md:gap-0">
                    <div>
                        <label className="block text-gray-600 text-sm mb-1">Metode Terpilih:</label>
                        {isRenaming ? (
                            <div className="flex items-center gap-1">
                                <input type="text" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} className="border border-blue-300 rounded px-2 py-1 text-base focus:outline-none text-black w-full md:w-60"/>
                                <button onClick={() => saveRename(paymentTree, setPaymentTree, selectedPaymentId)} className="bg-green-500 text-white rounded p-1.5 hover:bg-green-600"><Check className="w-4 h-4"/></button>
                                <button onClick={() => setIsRenaming(false)} className="bg-red-500 text-white rounded p-1.5 hover:bg-red-600"><XIcon className="w-4 h-4"/></button>
                            </div>
                        ) : (
                            <div className="font-bold text-xl text-blue-700 flex items-center gap-2">
                                {selectedPaymentId && selectedPaymentId.includes('root') ? <Globe className="w-5 h-5"/> : <Folder className="w-5 h-5 fill-blue-300"/>}
                                {(() => {
                                    const findName = (nodes: CategoryNode[]): string => {
                                        for(const node of nodes) {
                                            if (node.id === selectedPaymentId) return node.name;
                                            const child = findName(node.children);
                                            if(child) return child;
                                        }
                                        return "";
                                    }
                                    return findName(paymentTree) || "Metode Pembayaran";
                                })()}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 w-full md:w-auto">
                        {!isRenaming && (
                            <>
                                <button onClick={() => startRename(paymentTree, selectedPaymentId)} className="flex-1 md:flex-none justify-center bg-[#FFE167] hover:bg-yellow-400 text-black px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-sm transition-transform hover:scale-105">
                                    Edit <Pencil className="w-4 h-4"/>
                                </button>
                                {selectedPaymentId && !selectedPaymentId.includes('root') && (
                                    <button onClick={() => deleteNode(selectedPaymentId, paymentTree, setPaymentTree)} className="flex-1 md:flex-none justify-center bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-sm transition-transform hover:scale-105">
                                        Delete <Trash2 className="w-4 h-4"/>
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-gray-800 font-medium mb-2">Nama Metode Baru</label>
                        <div className="flex flex-col md:flex-row gap-2">
                            <input type="text" value={newPaymentName} onChange={(e) => setNewPaymentName(e.target.value)} placeholder="Contoh: QRIS, E-Wallet..." className="flex-1 border border-gray-400 rounded-full px-4 py-2 focus:outline-none focus:border-blue-500 bg-white"/>
                            <button onClick={() => { if(newPaymentName && selectedPaymentId) { addNode(newPaymentName, selectedPaymentId, paymentTree, setPaymentTree); setNewPaymentName(""); } }} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full flex items-center justify-center gap-2 font-medium shadow-sm transition-transform hover:scale-105"><Plus className="w-5 h-5"/> Tambah</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default PaymentMethodTab;