// src/pages/DashboardPage.tsx

import React, { useState, useEffect } from 'react';
import { 
  Menu, TrendingUp, DollarSign, ShoppingCart, 
  Package, ArrowUpRight, ArrowDownRight,
  Wallet, CreditCard, User, Truck, AlertTriangle, ArrowRight 
} from 'lucide-react';
import DateRangePicker, { type DateRange } from '../../components/DateRangePicker';

interface DashboardPageProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ setIsSidebarOpen }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);

  // Simulasi Loading Data
  // # woi back end jordy: Fetch data dashboard dari database
  // GET /api/dashboard/summary - untuk summaryCards (total penjualan, keuntungan, transaksi, piutang, hutang, stok menipis)
  // GET /api/dashboard/top-products - untuk topProducts
  // GET /api/dashboard/low-stock - untuk lowStockItems
  // GET /api/dashboard/sales-chart - untuk salesChartData
  // NOTE: Gunakan dateRange untuk filter data berdasarkan tanggal yang dipilih
  useEffect(() => {
    setTimeout(() => setIsLoading(false), 800);
  }, []);

  // Handler untuk date range change
  // # woi back end jordy: Refetch data berdasarkan date range yang dipilih
  // GET /api/dashboard/* dengan query params startDate dan endDate
  // Contoh: fetchDashboardData(range.startDate, range.endDate);
  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    console.log('Date range changed:', range);
  };

  // # woi back end jordy: Fetch data berdasarkan dateRange saat dateRange berubah
  // GET /api/dashboard/* dengan query params startDate dan endDate dari dateRange
  useEffect(() => {
    if (dateRange) {
      // TODO: Implementasi fetch data berdasarkan dateRange
      // fetchDashboardData(dateRange.startDate, dateRange.endDate);
    }
  }, [dateRange]);

  // --- DATA DUMMY DASHBOARD ---
  const summaryCards = [
    { 
      title: 'Total Penjualan', 
      value: 'Rp 15.250.000', 
      subValue: '142 Nota', 
      change: '+12.5%', 
      isPositive: true, 
      type: 'TREND', 
      icon: TrendingUp, 
      color: 'bg-blue-500', 
      desc: 'Omset hari ini' 
    },
    { 
      title: 'Total Keuntungan', 
      value: 'Rp 4.800.000', 
      change: '+8.2%', 
      isPositive: true, 
      type: 'TREND',
      icon: DollarSign, 
      color: 'bg-green-500', 
      desc: 'Margin profit 31%' 
    },
    { 
      title: 'Total Transaksi', 
      value: '142', 
      change: '-2.4%', 
      isPositive: false, 
      type: 'TREND',
      icon: ShoppingCart, 
      color: 'bg-orange-500', 
      desc: 'Transaksi valid' 
    },
    { 
      title: 'Total Piutang', 
      value: 'Rp 3.500.000', 
      subValue: 'Rp 500rb Lewat Tempo', 
      change: '5 Pelanggan', 
      isPositive: false, 
      type: 'INFO', 
      iconType: User, 
      icon: Wallet, 
      color: 'bg-purple-500', 
      desc: 'Tagihan ke Pelanggan' 
    },
    { 
      title: 'Total Hutang', 
      value: 'Rp 8.200.000', 
      subValue: 'Rp 1.2jt Lewat Tempo', 
      change: '2 Supplier', 
      isPositive: false, 
      type: 'INFO', 
      iconType: Truck, 
      icon: CreditCard, 
      color: 'bg-pink-500', 
      desc: 'Tagihan ke Supplier' 
    },
    { 
      title: 'Stok Menipis', 
      value: '12 Item', 
      change: 'Perlu Restock', 
      isPositive: false, 
      type: 'ALERT', 
      icon: Package, 
      color: 'bg-red-500', 
      desc: 'Cek Inventory' 
    },
  ];

  const topProducts = [
    { name: 'Kantong Plastik HD 15x30', sold: 450, revenue: 'Rp 2.250.000' },
    { name: 'Gelas Cup 16oz', sold: 320, revenue: 'Rp 1.800.000' },
    { name: 'Sedotan Steril', sold: 210, revenue: 'Rp 630.000' },
    { name: 'Mika Bento Sekat 4', sold: 180, revenue: 'Rp 1.080.000' },
    { name: 'Karet Gelang', sold: 150, revenue: 'Rp 300.000' },
  ];

  // [BARU] Data Stok Menipis
  const lowStockItems = [
    { name: 'Kertas Nasi Bungkus', current: 15, min: 50, unit: 'Pack', status: 'CRITICAL' },
    { name: 'Tusuk Sate Ayam', current: 8, min: 20, unit: 'Ikat', status: 'CRITICAL' },
    { name: 'Thinwall 500ml', current: 25, min: 100, unit: 'Pcs', status: 'WARNING' },
    { name: 'Sendok Plastik Putih', current: 40, min: 100, unit: 'Pcs', status: 'WARNING' },
    { name: 'Karet Gelang Merah', current: 2, min: 10, unit: 'Kg', status: 'CRITICAL' },
  ];

  const salesChartData = [
    { day: 'Sen', value: 40, height: 'h-24' },
    { day: 'Sel', value: 65, height: 'h-32' },
    { day: 'Rab', value: 45, height: 'h-28' },
    { day: 'Kam', value: 80, height: 'h-40' },
    { day: 'Jum', value: 55, height: 'h-30' },
    { day: 'Sab', value: 90, height: 'h-48' },
    { day: 'Min', value: 70, height: 'h-36' },
  ];

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-y-auto pb-20">
      {/* HEADER */}
      <div className="bg-white border-b px-6 py-5 flex items-center justify-between shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="p-1 hover:bg-gray-100 rounded">
                <Menu className="w-6 h-6 cursor-pointer" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
              <p className="text-sm text-gray-500">Ringkasan performa toko hari ini</p>
            </div>
        </div>
        <DateRangePicker
          onChange={handleDateRangeChange}
          // ===== KONFIGURASI DEFAULT DATE RANGE =====
          // Default: null (belum ada tanggal terpilih)
          // User harus klik tanggal 1, lalu klik tanggal 2 untuk membuat range
          // Jika ingin set default range, gunakan props defaultRange:
          // 
          // Contoh 1: Set default ke minggu ini
          // const today = new Date();
          // const startOfWeek = new Date(today);
          // startOfWeek.setDate(today.getDate() - today.getDay());
          // const endOfWeek = new Date(startOfWeek);
          // endOfWeek.setDate(startOfWeek.getDate() + 6);
          // defaultRange={{ startDate: startOfWeek, endDate: endOfWeek }}
          //
          // Contoh 2: Set default ke bulan ini
          // const today = new Date();
          // const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
          // const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          // defaultRange={{ startDate: firstDay, endDate: lastDay }}
          //
          // Contoh 3: Set default ke 7 hari terakhir
          // const today = new Date();
          // today.setHours(23, 59, 59, 999);
          // const sevenDaysAgo = new Date(today);
          // sevenDaysAgo.setDate(today.getDate() - 7);
          // sevenDaysAgo.setHours(0, 0, 0, 0);
          // defaultRange={{ startDate: sevenDaysAgo, endDate: today }}
        />
      </div>

      {/* CONTENT */}
      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        
        {/* 1. SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {summaryCards.map((card, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${card.color} bg-opacity-10 text-white`}>
                   <card.icon className={`w-6 h-6 ${card.color.replace('bg-', 'text-')}`} />
                </div>
                
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                    card.type === 'ALERT' ? 'bg-red-100 text-red-600' :
                    card.type === 'INFO' ? 'bg-gray-100 text-gray-600' :
                    card.isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                    {card.type === 'TREND' && (
                        card.isPositive ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>
                    )}
                    {card.type === 'INFO' && card.iconType && (
                        <card.iconType className="w-3 h-3"/>
                    )}
                    {card.change}
                </div>
              </div>
              
              <div>
                <h3 className="text-gray-500 text-sm font-medium mb-1">{card.title}</h3>
                <div className="flex items-baseline gap-2 flex-wrap">
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">{card.value}</h2>
                    {(card as any).subValue && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            (card as any).subValue.toLowerCase().includes('lewat') 
                            ? 'bg-red-100 text-red-600 animate-pulse' 
                            : 'bg-blue-50 text-blue-600'
                        }`}>
                            {(card as any).subValue}
                        </span>
                    )}
                </div>
                <p className="text-xs text-gray-400">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 2. CHART & TOP PRODUCTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-gray-800">Tren Penjualan Minggu Ini</h3>
              <button className="text-blue-600 text-sm font-semibold hover:underline">Lihat Detail</button>
            </div>
            <div className="flex items-end justify-between gap-2 h-64 pt-4 px-2">
              {salesChartData.map((data, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 flex-1 group cursor-pointer">
                  <div className="relative w-full flex justify-center">
                     <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs py-1 px-2 rounded mb-2 whitespace-nowrap z-10">
                        {data.value} Transaksi
                     </div>
                     <div className={`w-full max-w-[40px] ${data.height} bg-blue-100 rounded-t-lg group-hover:bg-blue-500 transition-colors relative`}></div>
                  </div>
                  <span className="text-xs font-bold text-gray-500">{data.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <h3 className="font-bold text-lg text-gray-800 mb-4">Produk Terlaris</h3>
             <div className="space-y-4">
                {topProducts.map((product, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b border-dashed border-gray-100 last:border-0 pb-3 last:pb-0">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs text-gray-600">
                          #{idx + 1}
                        </div>
                        <div>
                           <p className="text-sm font-bold text-gray-800 line-clamp-1">{product.name}</p>
                           <p className="text-xs text-gray-500">{product.sold} Terjual</p>
                        </div>
                     </div>
                     <span className="text-sm font-bold text-blue-600">{product.revenue}</span>
                  </div>
                ))}
             </div>
             <button className="w-full mt-6 py-2 text-sm text-center text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Lihat Semua Produk
             </button>
          </div>
        </div>

        {/* 3. [BARU] TABLE STOK MENIPIS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-red-50 rounded-lg text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-800">Stok Menipis (Perlu Restock)</h3>
                        <p className="text-sm text-gray-500">Segera lakukan pembelian ulang untuk item berikut</p>
                    </div>
                </div>
                <button className="text-sm text-blue-600 font-bold hover:underline flex items-center gap-1">
                    Ke Inventory <ArrowRight className="w-4 h-4" />
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Nama Produk</th>
                            <th className="px-6 py-4 text-center">Sisa Stok</th>
                            <th className="px-6 py-4 text-center">Min. Stok</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {lowStockItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-800">{item.name}</td>
                                <td className="px-6 py-4 text-center font-bold text-red-600">
                                    {item.current} <span className="text-gray-400 font-normal text-xs">{item.unit}</span>
                                </td>
                                <td className="px-6 py-4 text-center text-gray-500">
                                    {item.min} {item.unit}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        item.status === 'CRITICAL' 
                                        ? 'bg-red-100 text-red-600' 
                                        : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {item.status === 'CRITICAL' ? 'Kritis' : 'Menipis'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors shadow-sm">
                                        Restock
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;