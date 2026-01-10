// src/components/Sidebar.tsx

import React, { useState } from 'react';
import { 
  ShoppingCart, Package, ArrowDownToLine, 
  ShoppingCart as CartIcon, DollarSign, Settings, FileText, 
  Store, ChevronDown, ChevronUp, PieChart, TrendingUp, Wallet, 
  FileBarChart, Printer, Database, Banknote, Users, LayoutDashboard
} from 'lucide-react';

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, setIsSidebarOpen, activeMenu, setActiveMenu }) => {
  
  const [isLaporanOpen, setIsLaporanOpen] = useState(false);
  const [isPengaturanOpen, setIsPengaturanOpen] = useState(false);

  // 1. Menu Utama
  const mainItems = [
    { id: 'KASIR', label: 'KASIR', icon: ShoppingCart, color: 'text-blue-600' },
    { id: 'PEMBELIAN', label: 'Pembelian', icon: CartIcon, color: 'text-orange-500' },
    { id: 'INVENTORY', label: 'Inventory', icon: Package, color: 'text-emerald-600' },
    { id: 'STOK_IN', label: 'Stok Masuk', icon: ArrowDownToLine, color: 'text-cyan-600' },
    
    // Menu Stock Opname
    // { id: 'STOCK_OPNAME', label: 'Stock Opname', icon: ClipboardCheck, color: 'text-purple-600' },

    { id: 'INPUT_PENGELUARAN', label: 'Biaya Operasional', icon: Banknote, color: 'text-pink-600' },
    
    // Menu Penggajian
    { id: 'PENGGAJIAN', label: 'Penggajian', icon: Users, color: 'text-green-600' },

    { id: 'KEUANGAN', label: 'Hutang / Piutang', icon: DollarSign, color: 'text-red-500' },
    { id: 'POTONG_KASBON', label: 'Potong Kasbon', icon: Wallet, color: 'text-purple-600' },
  ];

  // 2. Sub-menu Laporan
  const reportItems = [
    // [NEW] Dashboard di dalam Laporan
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard, color: 'text-indigo-600' },
    
    { id: 'LAPORAN_PENJUALAN', label: 'Lap. Penjualan', icon: TrendingUp, color: 'text-blue-500' },
    { id: 'LAPORAN_PEMBELIAN', label: 'Lap. Pembelian', icon: CartIcon, color: 'text-orange-500' },
    { id: 'LAPORAN_PENGELUARAN', label: 'Lap. Pengeluaran', icon: Wallet, color: 'text-red-500' },
    { id: 'LAPORAN_LABA_RUGI', label: 'Laba Rugi', icon: PieChart, color: 'text-purple-500' },
    // { id: 'LAPORAN_NERACA', label: 'Neraca', icon: Scale, color: 'text-teal-600' },
  ];

  // 3. Sub-menu Pengaturan
  const settingItems = [
    { id: 'MASTER_SETTING', label: 'Master Data', icon: Database, color: 'text-indigo-600' },
    { id: 'TEMPLATE_NOTA', label: 'Template Struk', icon: FileText, color: 'text-gray-600' },
    { id: 'TEMPLATE_FAKTUR', label: 'Template Faktur', icon: FileText, color: 'text-blue-600' },
    { id: 'PENGATURAN_PRINTER', label: 'Printer', icon: Printer, color: 'text-gray-700' },
  ];

  const handleMenuClick = (id: string) => {
      setActiveMenu(id);
      setIsSidebarOpen(false); 
  };

  // Helper untuk cek parent Laporan aktif
  const isLaporanActive = activeMenu.startsWith('LAPORAN') || activeMenu === 'DASHBOARD';

  return (
    <>
      <div 
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <div 
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-16 flex items-center px-6 bg-[#E6F4FF] border-b border-blue-100 flex-shrink-0">
           <h1 className="font-bold text-lg text-black">POS SYSTEM</h1>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          
          {mainItems.map((item) => {
            const isActive = activeMenu === item.id || activeMenu.startsWith(item.id);
            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`
                  w-full flex items-center gap-4 px-6 py-3.5 text-left transition-colors duration-200 border-l-4
                  ${isActive 
                    ? 'bg-[#E6F4FF] border-blue-600 text-black font-semibold' 
                    : 'bg-white border-transparent text-gray-600 hover:bg-gray-50 hover:text-black'
                  }
                `}
              >
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} className={`${item.color}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}

          {/* MENU LAPORAN (Dropdown) */}
          <div className="mt-1">
              <button
                onClick={() => setIsLaporanOpen(!isLaporanOpen)}
                className={`w-full flex items-center justify-between px-6 py-3.5 text-left transition-colors duration-200 border-l-4 border-transparent ${isLaporanActive ? 'bg-[#f0f9ff] border-blue-300 text-black font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-4">
                    <FileBarChart size={22} className="text-indigo-600" />
                    <span className="text-sm font-medium">Laporan</span>
                </div>
                {isLaporanOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
              </button>

              {isLaporanOpen && (
                  <div className="bg-gray-50 py-2 border-t border-gray-100">
                      {reportItems.map((subItem) => {
                          const isSubActive = activeMenu === subItem.id;
                          return (
                              <button
                                  key={subItem.id}
                                  onClick={() => handleMenuClick(subItem.id)}
                                  className={`w-full flex items-center gap-3 pl-14 pr-6 py-3 text-left text-sm font-medium transition-colors ${isSubActive ? 'bg-blue-100 text-blue-800' : 'text-gray-500 hover:text-black hover:bg-gray-100'}`}
                              >
                                  <subItem.icon size={18} className={subItem.color} />
                                  {subItem.label}
                              </button>
                          )
                      })}
                  </div>
              )}
          </div>

          {/* MENU PENGATURAN (Dropdown) */}
          <div className="mt-1">
              <button
                onClick={() => setIsPengaturanOpen(!isPengaturanOpen)}
                className={`w-full flex items-center justify-between px-6 py-3.5 text-left transition-colors duration-200 border-l-4 border-transparent ${['MASTER_SETTING', 'TEMPLATE_NOTA', 'TEMPLATE_FAKTUR', 'PENGATURAN_PRINTER'].includes(activeMenu) ? 'bg-[#f0f9ff] border-blue-300 text-black font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-4">
                    <Settings size={22} className="text-gray-600" />
                    <span className="text-sm font-medium">Pengaturan</span>
                </div>
                {isPengaturanOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
              </button>

              {isPengaturanOpen && (
                  <div className="bg-gray-50 py-2 border-t border-gray-100">
                      {settingItems.map((subItem) => {
                          const isSubActive = activeMenu === subItem.id;
                          return (
                              <button
                                  key={subItem.id}
                                  onClick={() => handleMenuClick(subItem.id)}
                                  className={`w-full flex items-center gap-3 pl-14 pr-6 py-3 text-left text-sm font-medium transition-colors ${isSubActive ? 'bg-blue-100 text-blue-800' : 'text-gray-500 hover:text-black hover:bg-gray-100'}`}
                              >
                                  <subItem.icon size={18} className={subItem.color} />
                                  {subItem.label}
                              </button>
                          )
                      })}
                  </div>
              )}
          </div>

        </div>

        <div className="p-4 border-t border-gray-100 bg-white flex-shrink-0">
             <div className="flex items-center gap-3 text-gray-500">
                 <div className="bg-blue-50 p-2 rounded-full text-blue-600"><Store size={18}/></div>
                 <div className="text-xs">
                     <p className="font-bold text-gray-700">Toko Plastik Jaya</p>
                     <p>v1.0.0 Alpha</p>
                 </div>
             </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;