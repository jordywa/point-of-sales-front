import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
// ini buat yang pakai pin entar dulu
// import LoginPage from './pages/LoginPage';

// Import Halaman
import KasirPage from './pages/KasirPage';
import DashboardPage from './pages/DashboardPage'; // <--- [BARU] Import Dashboard
import InventoryPage from './pages/InventoryPage';
import StockInPage from './pages/StockInPage';
import StockOpnamePage from './pages/StockOpnamePage';
import PembelianPage from './pages/PembelianPage';
import FinancePage from './pages/FinancePage';
import MasterSettingPage from './pages/MasterSetting';
import TemplateNotaPage from './pages/TemplateNotaPage';
import TemplateFakturPage from './pages/TemplateFakturPage';
import PrinterSettingPage from './pages/PrinterSettingPage';
import InputPengeluaranPage from './pages/InputPengeluaranPage';
import PenggajianPage from './pages/PenggajianPage'; 
import LaporanPenjualanPage from './pages/LaporanPenjualanPage';
import LaporanPembelianPage from './pages/LaporanPembelianPage';
import LaporanPengeluaranPage from './pages/LaporanPengeluaranPage';
import LaporanLabaRugiPage from './pages/LaporanLabaRugiPage';
import LaporanNeracaPage from './pages/LaporanNeracaPage';
import LoginAdmin from './pages/LoginAdmin';
import { useAuth } from './context/AuthContext';

const App: React.FC = () => {
    const {isAuthenticated, loading} = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
  

    const [activeMenu, setActiveMenu] = useState('KASIR');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); 

    // --- SYNC URL SIDEBAR ---
    useEffect(() => {
      const path = location.pathname;
      if (path.includes('kasir')) setActiveMenu('KASIR');
      else if (path.includes('dashboard')) setActiveMenu('DASHBOARD'); // <--- [BARU] Sync URL Dashboard
      else if (path.includes('inventory')) setActiveMenu('INVENTORY');
      else if (path.includes('stock-in')) setActiveMenu('STOK_IN');
      else if (path.includes('stock-opname')) setActiveMenu('STOCK_OPNAME');
      else if (path.includes('pembelian')) setActiveMenu('PEMBELIAN');
      else if (path.includes('finance')) setActiveMenu('KEUANGAN');
      else if (path.includes('input-pengeluaran')) setActiveMenu('INPUT_PENGELUARAN');
      else if (path.includes('penggajian')) setActiveMenu('PENGGAJIAN'); 
      else if (path.includes('settings')) setActiveMenu('MASTER_SETTING');
    }, [location]);

    const handleMenuChange = (menu: string) => {
      setActiveMenu(menu);
      switch (menu) {
        case 'KASIR': navigate('/kasir'); break;
        case 'DASHBOARD': navigate('/dashboard'); break; // <--- [BARU] Navigasi Dashboard
        case 'INVENTORY': navigate('/inventory'); break;
        case 'STOK_IN': navigate('/stock-in'); break;
        case 'STOCK_OPNAME': navigate('/stock-opname'); break;
        case 'PEMBELIAN': navigate('/pembelian'); break;
        case 'KEUANGAN': navigate('/finance'); break;
        case 'INPUT_PENGELUARAN': navigate('/input-pengeluaran'); break;
        case 'PENGGAJIAN': navigate('/penggajian'); break; 
        case 'LAPORAN_PENJUALAN': navigate('/laporan-penjualan'); break;
        case 'LAPORAN_PEMBELIAN': navigate('/laporan-pembelian'); break;
        case 'LAPORAN_PENGELUARAN': navigate('/laporan-pengeluaran'); break;
        case 'LAPORAN_LABA_RUGI': navigate('/laporan-laba-rugi'); break;
        case 'LAPORAN_NERACA': navigate('/laporan-neraca'); break;
        case 'MASTER_SETTING': navigate('/settings'); break;
        case 'TEMPLATE_NOTA': navigate('/template-nota'); break;
        case 'TEMPLATE_FAKTUR': navigate('/template-faktur'); break;
        case 'PENGATURAN_PRINTER': navigate('/printer-settings'); break;
        default: navigate('/kasir');
      }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl font-semibold">Loading...</div>
            </div>
        );
    }

    const formatRupiah = (num: number) => {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
    };

    return (
        <div className="App">
            <Routes>
                {/* If user is logged in, redirect from /login to /products */}
                <Route path="/login-admin" element={isAuthenticated ? <Navigate to="/kasir" /> : <LoginAdmin />} />
                
                {/* Authenticated Routes */}
                <Route 
                    path="/*"  
                    element={isAuthenticated ? (
                    <div className="flex h-screen w-full bg-gray-50 overflow-hidden font-sans text-gray-800">
                        <Sidebar 
                          isSidebarOpen={isSidebarOpen}
                          activeMenu={activeMenu}
                          setActiveMenu={handleMenuChange} 
                          setIsSidebarOpen={setIsSidebarOpen}
                        />
                        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                          <div className="lg:hidden bg-white p-4 shadow flex justify-between items-center z-20">
                              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-gray-100 rounded">Menu</button>
                              <span className="font-bold">POS SYSTEM</span>
                          </div>
                          <div className="flex-1 overflow-auto p-2">
                            <Routes>
                                <Route path="/" element={<Navigate to="/kasir" replace />} />
                                <Route path="/kasir" element={<KasirPage setIsSidebarOpen={setIsSidebarOpen} formatRupiah={formatRupiah} />} />
                                <Route path="/dashboard" element={<DashboardPage setIsSidebarOpen={setIsSidebarOpen} />} /> {/* <--- [BARU] Route Dashboard */}
                                <Route path="/inventory" element={<InventoryPage setIsSidebarOpen={setIsSidebarOpen} />} />
                                <Route path="/stock-in" element={<StockInPage setIsSidebarOpen={setIsSidebarOpen} />} />
                                <Route path="/stock-opname" element={<StockOpnamePage setIsSidebarOpen={setIsSidebarOpen} />} />
                                <Route path="/pembelian" element={<PembelianPage setIsSidebarOpen={setIsSidebarOpen} formatRupiah={formatRupiah} />} />
                                <Route path="/finance" element={<FinancePage setIsSidebarOpen={setIsSidebarOpen} />} />
                                <Route path="/input-pengeluaran" element={<InputPengeluaranPage setIsSidebarOpen={setIsSidebarOpen} />} />
                                <Route path="/penggajian" element={<PenggajianPage setIsSidebarOpen={setIsSidebarOpen} />} />
                                <Route path="/laporan-penjualan" element={<LaporanPenjualanPage setIsSidebarOpen={setIsSidebarOpen} />} />
                                <Route path="/laporan-pembelian" element={<LaporanPembelianPage setIsSidebarOpen={setIsSidebarOpen} />} />
                                <Route path="/laporan-pengeluaran" element={<LaporanPengeluaranPage setIsSidebarOpen={setIsSidebarOpen} />} />
                                <Route path="/laporan-laba-rugi" element={<LaporanLabaRugiPage setIsSidebarOpen={setIsSidebarOpen} />} />
                                <Route path="/laporan-neraca" element={<LaporanNeracaPage setIsSidebarOpen={setIsSidebarOpen} />} />
                                <Route path="/settings" element={<MasterSettingPage setIsSidebarOpen={setIsSidebarOpen} />} />
                                <Route path="/template-nota" element={<TemplateNotaPage setIsSidebarOpen={setIsSidebarOpen} />} />
                                <Route path="/template-faktur" element={<TemplateFakturPage setIsSidebarOpen={setIsSidebarOpen} />} />
                                <Route path="/printer-settings" element={<PrinterSettingPage setIsSidebarOpen={setIsSidebarOpen} />} />
                            </Routes>
                          </div>
                        </div>
                      </div>
                    ) : <Navigate to="/login-admin" />}>
                </Route>
            </Routes>
        </div>
    );
};

export default App;