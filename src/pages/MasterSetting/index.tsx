// src/pages/MasterSetting/index.tsx

import React, { useState } from 'react';
import { 
  Menu, Clock, 
  Building2, Store, UserCog, Users, Tags, Hash, 
  MoreHorizontal, Percent, TicketPercent, CreditCard, 
  Truck, Wallet, Briefcase, Shield, ShieldCheck 
} from 'lucide-react';

// Import All Tab Components
import StaffTab from './tabs/StaffTab';
import CompanyTab from './tabs/CompanyTab';
import CompanyPermissionTab from './tabs/CompanyPermissionTab'; // <--- IMPORT BARU
import OutletTab from './tabs/OutletTab';
import UserTab from './tabs/UserTab';
import UserGroupTab from './tabs/UserGroupTab';
import CustomerTab from './tabs/CustomerTab';
import CategoryCustomerTab from './tabs/CategoryCustomerTab';
import CategoryProductTab from './tabs/CategoryProductTab';
import NumberingTab from './tabs/NumberingTab';
import AdditionalTab from './tabs/AdditionalTab';
import TaxTab from './tabs/TaxTab';
import DiscountTab from './tabs/DiscountTab';
import PaymentMethodTab from './tabs/PaymentMethodTab';
import SupplierTab from './tabs/SupplierTab';
import CashBankTab from './tabs/CashBankTab';

interface MasterSettingPageProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
}

// Tambahkan tipe 'COMPANY_PERMISSION'
type SettingTab = 
  | 'COMPANY' 
  | 'COMPANY_PERMISSION' // <--- TIPE BARU
  | 'OUTLET' 
  | 'USER_GROUP' 
  | 'USER' 
  | 'STAFF' 
  | 'CUSTOMER'
  | 'CATEGORY_CUSTOMER'
  | 'CATEGORY_PRODUCT' 
  | 'NUMBERING' 
  | 'ADDITIONAL' 
  | 'TAX' 
  | 'DISKON' 
  | 'PAYMENT' 
  | 'SUPPLIER' 
  | 'CASH_BANK' 
  | '';

const MasterSettingPage: React.FC<MasterSettingPageProps> = ({ setIsSidebarOpen }) => {
  // Set default tab ke COMPANY_PERMISSION atau sesuai keinginan
  const [activeTab, setActiveTab] = useState<SettingTab>('COMPANY_PERMISSION'); 

  const renderContent = () => {
    switch (activeTab) {
      case 'COMPANY': return <CompanyTab />;
      case 'COMPANY_PERMISSION': return <CompanyPermissionTab />; // <--- RENDER DISINI
      case 'OUTLET': return <OutletTab />;
      case 'USER_GROUP': return <UserGroupTab />; 
      case 'USER': return <UserTab />;
      case 'STAFF': return <StaffTab />;
      case 'CUSTOMER': return <CustomerTab />;
      case 'CATEGORY_CUSTOMER': return <CategoryCustomerTab />;
      case 'CATEGORY_PRODUCT': return <CategoryProductTab />;
      case 'NUMBERING': return <NumberingTab />;
      case 'ADDITIONAL': return <AdditionalTab />;
      case 'TAX': return <TaxTab />;
      case 'DISKON': return <DiscountTab />;
      case 'PAYMENT': return <PaymentMethodTab />;
      case 'SUPPLIER': return <SupplierTab />;
      case 'CASH_BANK': return <CashBankTab />;
      
      default:
        return (
            <div className="flex flex-col h-full items-center justify-center p-4">
                 <h2 className="text-2xl font-bold text-gray-800 text-center mb-6 uppercase tracking-wider">{activeTab.replace('_', ' ')}</h2>
                 <div className="text-gray-400 italic text-xl text-center">
                    Halaman ini belum dipisah ke file sendiri.
                 </div>
            </div>
        );
    }
  };

  // List Menu dengan Icon dan Warna
  const menuItems = [
    { id: 'COMPANY', label: 'Company', icon: Building2, color: 'text-blue-600' },
    { id: 'COMPANY_PERMISSION', label: 'Company Permission', icon: ShieldCheck, color: 'text-indigo-600' }, // <--- MENU BARU
    { id: 'OUTLET', label: 'Outlet', icon: Store, color: 'text-orange-500' },
    { id: 'USER_GROUP', label: 'User Group (Role)', icon: Shield, color: 'text-pink-600' },
    { id: 'USER', label: 'User (Login)', icon: UserCog, color: 'text-red-500' },
    { id: 'STAFF', label: 'Staff / Karyawan', icon: Briefcase, color: 'text-purple-600' },
    { id: 'CUSTOMER', label: 'Customer', icon: Users, color: 'text-green-600' },
    { id: 'CATEGORY_CUSTOMER', label: 'Kategori Pelanggan', icon: Tags, color: 'text-teal-600' },
    { id: 'CATEGORY_PRODUCT', label: 'Category Product', icon: Tags, color: 'text-pink-600' },
    { id: 'NUMBERING', label: 'Penomoran', icon: Hash, color: 'text-gray-600' },
    { id: 'TAX', label: 'Tax (Pajak)', icon: Percent, color: 'text-orange-600' },
    { id: 'DISKON', label: 'Diskon', icon: TicketPercent, color: 'text-green-500' },
    { id: 'PAYMENT', label: 'Metode Pembayaran', icon: CreditCard, color: 'text-blue-500' }, 
    { id: 'SUPPLIER', label: 'Supplier', icon: Truck, color: 'text-indigo-600' },
    { id: 'CASH_BANK', label: 'Cash & Bank', icon: Wallet, color: 'text-teal-600' },
    { id: 'ADDITIONAL', label: 'Additional', icon: MoreHorizontal, color: 'text-gray-500' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-white font-sans">
      {/* HEADER */}
      <div className="h-16 bg-[#BEDFFF]/30 flex items-center justify-between px-4 border-b border-gray-200 shadow-sm flex-shrink-0">
         <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="hover:bg-gray-200 p-1 rounded"><Menu className="w-6 h-6"/></button>
             <h1 className="text-xl font-bold text-black truncate">PENGATURAN</h1>
         </div>
         <div className="flex items-center gap-4">
             <Clock className="w-6 h-6 hidden md:block"/>
             <div className="flex items-center gap-2">
                <span className="hidden md:inline">Admin</span>
                <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden border border-gray-400">
                    <img src="https://placehold.co/50x50" alt="Avatar"/>
                </div>
             </div>
         </div>
      </div>

      {/* CONTENT WRAPPER - ADAPTIF */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          
          {/* SIDEBAR MENU */}
          <div className="w-full md:w-64 bg-[#BEDFFF]/30 border-b md:border-b-0 md:border-r border-gray-200 flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto flex-shrink-0 p-2 md:pt-4 gap-2 md:gap-0 scrollbar-hide">
              {menuItems.map((menu) => {
                  const Icon = menu.icon;
                  const isActive = activeTab === menu.id;
                  
                  return (
                    <button 
                        key={menu.id} 
                        onClick={() => setActiveTab(menu.id as SettingTab)} 
                        className={`
                            flex items-center gap-3 text-left px-4 md:px-6 py-2 md:py-3 font-medium text-sm md:text-base transition-colors rounded-full md:rounded-none whitespace-nowrap
                            ${isActive 
                                ? 'bg-[#d1d5db] text-black font-bold shadow-sm' 
                                : 'text-gray-700 hover:bg-[#BEDFFF]/50 bg-white md:bg-transparent border md:border-0 border-gray-200'
                            }
                        `}
                    >
                        {/* Render Icon dengan warna */}
                        <Icon className={`w-5 h-5 flex-shrink-0 ${menu.color}`}/>
                        {menu.label}
                    </button>
                  );
              })}
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 flex flex-col relative overflow-hidden">
            <div className="flex-1 p-4 md:p-10 overflow-y-auto">
                {renderContent()}
            </div>
          </div>
      </div>
    </div>
  );
};

export default MasterSettingPage;