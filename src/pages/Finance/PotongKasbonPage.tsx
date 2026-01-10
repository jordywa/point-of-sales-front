// src/pages/PotongKasbonPage.tsx

import React, { useState, useMemo } from 'react';
import { Menu, Search, Wallet, User, Plus, Save, XCircle, ArrowLeft, CheckCircle, History, Calendar, Trash2, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import LoadingOverlay from '../../components/LoadingOverlay';

interface PotongKasbonPageProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
}

// --- TIPE DATA ---
interface KasbonRecord {
  id: number;
  date: string;
  keterangan: string;
  nominal: number;
  status: 'Sudah dibayar' | 'dibayar sebagian' | 'lunas';
  totalPaid?: number;
  paymentHistory?: { date: string; amount: number; note: string }[];
}

interface StaffData {
  id: number;
  name: string;
  role: string;
}

// --- MOCK DATA STAFF (from Staff Master) ---
const MOCK_STAFF: StaffData[] = [
  { id: 1, name: "Admin Vicky", role: "Admin" },
  { id: 2, name: "Budi Gudang", role: "Staf Gudang" },
  { id: 3, name: "Siti Kasir", role: "Kasir" },
  { id: 4, name: "Pak Eko Driver", role: "Driver" },
];

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

// --- GENERATE DUMMY DATA FOR LAST 3 MONTHS ---
const generateDummyKasbon = (): Record<number, KasbonRecord[]> => {
  const data: Record<number, KasbonRecord[]> = {};
  const today = new Date();
  
  MOCK_STAFF.forEach(staff => {
    data[staff.id] = [];
    
    // Special case: Admin Vicky (id: 1) harus punya 30 kasbon belum dibayar
    if (staff.id === 1) {
      // Generate 30 kasbon belum dibayar untuk Admin Vicky
      for (let i = 0; i < 30; i++) {
        const monthOffset = Math.floor(i / 10); // Distribute across 3 months
        const targetDate = new Date(today.getFullYear(), today.getMonth() - monthOffset, 1);
        const month = targetDate.getMonth();
        const year = targetDate.getFullYear();
        const day = Math.floor(Math.random() * 28) + 1;
        const nominal = Math.floor(Math.random() * 500000) + 100000;
        
        // Semua belum dibayar (status: 'Sudah dibayar' atau 'dibayar sebagian')
        const statusRand = Math.random();
        let status: 'Sudah dibayar' | 'dibayar sebagian';
        let totalPaid = 0;
        
        if (statusRand > 0.5) {
          status = 'dibayar sebagian';
          totalPaid = Math.floor(nominal * (0.2 + Math.random() * 0.3)); // 20-50% paid
        } else {
          status = 'Sudah dibayar';
          totalPaid = 0;
        }
        
        data[staff.id].push({
          id: Date.now() + i + monthOffset * 1000,
          date: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          keterangan: `Kasbon ${i + 1} - ${monthNames[month]} ${year}`,
          nominal: nominal,
          status: status,
          totalPaid: totalPaid,
          paymentHistory: totalPaid > 0 ? [
            { date: `${year}-${String(month + 1).padStart(2, '0')}-${String(Math.min(day + 5, 28)).padStart(2, '0')}`, amount: totalPaid, note: 'Pembayaran kasbon' }
          ] : []
        });
      }
    } else {
      // Generate normal data for other staff
      for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
        const targetDate = new Date(today.getFullYear(), today.getMonth() - monthOffset, 1);
        const month = targetDate.getMonth();
        const year = targetDate.getFullYear();
        
        // Generate 2-4 kasbon records per month per staff
        const recordCount = Math.floor(Math.random() * 3) + 2;
        
        for (let i = 0; i < recordCount; i++) {
          const day = Math.floor(Math.random() * 28) + 1;
          const nominal = Math.floor(Math.random() * 500000) + 100000;
          const statusRand = Math.random();
          let status: 'Sudah dibayar' | 'dibayar sebagian' | 'lunas';
          let totalPaid = 0;
          
          if (statusRand > 0.7) {
            status = 'lunas';
            totalPaid = nominal;
          } else if (statusRand > 0.4) {
            status = 'dibayar sebagian';
            totalPaid = Math.floor(nominal * (0.3 + Math.random() * 0.5));
          } else {
            status = 'Sudah dibayar';
            totalPaid = 0;
          }
          
          data[staff.id].push({
            id: Date.now() + i + monthOffset * 1000,
            date: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
            keterangan: `Kasbon ${i + 1} - ${monthNames[month]} ${year}`,
            nominal: nominal,
            status: status,
            totalPaid: totalPaid,
            paymentHistory: totalPaid > 0 ? [
              { date: `${year}-${String(month + 1).padStart(2, '0')}-${String(Math.min(day + 5, 28)).padStart(2, '0')}`, amount: totalPaid, note: 'Pembayaran kasbon' }
            ] : []
          });
        }
      }
    }
  });
  
  return data;
};

const INITIAL_KASBON_DATA = generateDummyKasbon();

const PotongKasbonPage: React.FC<PotongKasbonPageProps> = ({ setIsSidebarOpen }) => {
  const [activeTab, setActiveTab] = useState<'BUKU_KASBON' | 'POTONG_KASBON'>('BUKU_KASBON');
  const [kasbonData, setKasbonData] = useState<Record<number, KasbonRecord[]>>(INITIAL_KASBON_DATA);
  const [selectedStaff, setSelectedStaff] = useState<StaffData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form state for BUKU KASBON
  const [inputDate] = useState(new Date().toISOString().split('T')[0]); // Readonly, default hari ini
  const [inputKeterangan, setInputKeterangan] = useState("");
  const [inputNominal, setInputNominal] = useState("");
  const [inputPaymentMethod, setInputPaymentMethod] = useState<string>("");
  
  // Edit state for BUKU KASBON
  const [editingRecord, setEditingRecord] = useState<KasbonRecord | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editKeterangan, setEditKeterangan] = useState("");
  const [editNominal, setEditNominal] = useState("");
  
  // Period selector state
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
  // Pagination state - separate for each tab
  const [currentPageBukuKasbon, setCurrentPageBukuKasbon] = useState(1);
  const [currentPagePotongKasbon, setCurrentPagePotongKasbon] = useState(1);
  const itemsPerPageBukuKasbon = 10;
  const itemsPerPagePotongKasbon = 5;
  
  // Form state for POTONG KASBON
  const [tanggalPotong] = useState(new Date().toISOString().split('T')[0]);
  const [jumlahPotong, setJumlahPotong] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  
  // Mock data payment methods from Cash Bank
  // # woi back end jordy: GET /api/cash-bank/accounts untuk ambil daftar akun cash/bank
  // Response: Array of { id: number, name: string, type: 'CASH' | 'BANK', balance: number }
  const paymentMethods = [
    { id: 1, name: "KAS TOKO", type: "CASH" as const },
    { id: 2, name: "BANK BCA", type: "BANK" as const },
  ];
  
  // Dialog and loading state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Helper Format Rupiah
  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  
  const formatNumberDisplay = (num: number | string) => {
    if (!num) return "";
    const str = String(num).replace(/\D/g, "");
    if (!str) return "";
    return new Intl.NumberFormat('id-ID').format(Number(str));
  };
  
  const parseNumberInput = (text: string) => {
    return parseInt(text.replace(/\./g, "") || "0", 10);
  };
  
  // Filter and sort staff by name
  const filteredStaff = useMemo(() => {
    return MOCK_STAFF
      .filter(staff => 
        staff.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        staff.role.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [searchQuery]);
  
  // Get kasbon records for selected staff
  const staffKasbonRecords = selectedStaff ? (kasbonData[selectedStaff.id] || []) : [];
  
  // Filter records based on tab and period
  const filteredRecords = useMemo(() => {
    if (!selectedStaff) return [];
    
    if (activeTab === 'BUKU_KASBON') {
      // Filter by period (month and year) for BUKU KASBON
      let records = staffKasbonRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() === selectedMonth && recordDate.getFullYear() === selectedYear;
      });
      
      // Show all records for BUKU KASBON, sorted by newest (descending by date)
      return records.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA; // Newest first
      });
    } else {
      // POTONG KASBON: Show all unpaid records (tidak filter periode), sorted by oldest first (paling lama di atas)
      // Filter hanya yang belum lunas (sisa hutang > 0)
      return staffKasbonRecords
        .filter(record => {
          const sisa = record.nominal - (record.totalPaid || 0);
          return sisa > 0; // Hanya yang belum lunas
        })
        .sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateA - dateB; // Oldest first (paling lama di atas)
        });
    }
  }, [selectedStaff, staffKasbonRecords, activeTab, selectedMonth, selectedYear]);
  
  // Pagination for BUKU KASBON
  const totalPagesBukuKasbon = Math.ceil(filteredRecords.length / itemsPerPageBukuKasbon);
  const paginatedRecordsBukuKasbon = useMemo(() => {
    if (activeTab !== 'BUKU_KASBON') return [];
    const start = (currentPageBukuKasbon - 1) * itemsPerPageBukuKasbon;
    const end = start + itemsPerPageBukuKasbon;
    return filteredRecords.slice(start, end);
  }, [filteredRecords, currentPageBukuKasbon, activeTab]);
  
  // Pagination for POTONG KASBON
  const totalPagesPotongKasbon = Math.ceil(filteredRecords.length / itemsPerPagePotongKasbon);
  const paginatedRecordsPotongKasbon = useMemo(() => {
    if (activeTab !== 'POTONG_KASBON') return [];
    const start = (currentPagePotongKasbon - 1) * itemsPerPagePotongKasbon;
    const end = start + itemsPerPagePotongKasbon;
    return filteredRecords.slice(start, end);
  }, [filteredRecords, currentPagePotongKasbon, activeTab]);
  
  // Handlers
  const handleSelectStaff = (staff: StaffData) => {
    setSelectedStaff(staff);
    setCurrentPageBukuKasbon(1);
    setCurrentPagePotongKasbon(1);
    resetForm();
    setEditingRecord(null);
    // Reset to current month/year when selecting staff
    const now = new Date();
    setSelectedMonth(now.getMonth());
    setSelectedYear(now.getFullYear());
  };
  
  const resetForm = () => {
    // inputDate tidak perlu di-reset karena readonly dan selalu hari ini
    setInputKeterangan("");
    setInputNominal("");
    setInputPaymentMethod("");
    setJumlahPotong("");
    setSelectedPaymentMethod("");
  };
  
  // Period navigation handlers
  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
    setCurrentPageBukuKasbon(1);
    setCurrentPagePotongKasbon(1);
  };
  
  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
    setCurrentPageBukuKasbon(1);
    setCurrentPagePotongKasbon(1);
  };
  
  const handleAddKasbon = () => {
    if (!selectedStaff) return alert("Pilih staff terlebih dahulu!");
    
    const nominal = parseNumberInput(inputNominal);
    if (nominal <= 0) return alert("Masukkan Nominal yang valid!");
    
    if (!inputPaymentMethod) {
      alert("Metode Pembayaran wajib dipilih!");
      return;
    }
    
    const newRecord: KasbonRecord = {
      id: Date.now(),
      date: inputDate,
      keterangan: inputKeterangan || "Kasbon",
      nominal: nominal,
      status: 'Sudah dibayar',
      totalPaid: 0,
      paymentHistory: []
    };
    
    // # woi back end jordy: INSERT data kasbon baru ke database
    // POST /api/kasbon dengan body:
    // {
    //   staffId: selectedStaff.id,
    //   date: inputDate,
    //   keterangan: inputKeterangan || "Kasbon",
    //   nominal: nominal,
    //   status: 'Sudah dibayar',
    //   totalPaid: 0,
    //   paymentMethodId: inputPaymentMethod, // ID dari cash bank account
    //   periodMonth: selectedMonth,
    //   periodYear: selectedYear
    // }
    
    setKasbonData(prev => ({
      ...prev,
      [selectedStaff.id]: [...(prev[selectedStaff.id] || []), newRecord]
    }));
    
    resetForm();
    alert("Kasbon berhasil ditambahkan!");
  };
  
  const handleEditKasbon = (record: KasbonRecord) => {
    setEditingRecord(record);
    setEditDate(record.date);
    setEditKeterangan(record.keterangan);
    setEditNominal(String(record.nominal));
  };
  
  const handleSaveEdit = () => {
    if (!selectedStaff || !editingRecord) return;
    
    const nominal = parseNumberInput(editNominal);
    if (nominal <= 0) return alert("Masukkan Nominal yang valid!");
    
    // # woi back end jordy: UPDATE data kasbon di database
    // PUT /api/kasbon/{editingRecord.id} dengan body:
    // {
    //   date: editDate,
    //   keterangan: editKeterangan,
    //   nominal: nominal
    // }
    
    setKasbonData(prev => ({
      ...prev,
      [selectedStaff.id]: (prev[selectedStaff.id] || []).map(r => 
        r.id === editingRecord.id 
          ? { ...r, date: editDate, keterangan: editKeterangan, nominal: nominal }
          : r
      )
    }));
    
    setEditingRecord(null);
    alert("Kasbon berhasil diupdate!");
  };
  
  const handleCancelEdit = () => {
    setEditingRecord(null);
    setEditDate("");
    setEditKeterangan("");
    setEditNominal("");
  };
  
  const handleDeleteKasbon = (id: number) => {
    if (!selectedStaff) return;
    if (!confirm("Hapus kasbon ini?")) return;
    
    // # woi back end jordy: DELETE data kasbon dari database
    // DELETE /api/kasbon/{id}
    
    setKasbonData(prev => ({
      ...prev,
      [selectedStaff.id]: (prev[selectedStaff.id] || []).filter(r => r.id !== id)
    }));
  };
  
  const handleSavePotongKasbon = () => {
    if (!selectedStaff) return;
    
    const jumlah = parseNumberInput(jumlahPotong);
    if (jumlah <= 0) {
      setShowConfirmDialog(true);
      setConfirmAction(() => () => {
        setShowConfirmDialog(false);
        setConfirmAction(null);
      });
      return;
    }
    
    // Validasi metode pembayaran wajib dipilih
    if (!selectedPaymentMethod) {
      alert("Metode Pembayaran wajib dipilih!");
      return;
    }
    
    // Get all unpaid records (tidak filter periode), sorted by oldest first
    // Filter hanya yang belum lunas (sisa hutang > 0)
    const unpaidRecords = staffKasbonRecords
      .filter(record => {
        const sisa = record.nominal - (record.totalPaid || 0);
        return sisa > 0; // Hanya yang belum lunas
      })
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB; // Oldest first
      });
    
    // Calculate total unpaid debt
    const totalHutang = unpaidRecords.reduce((sum, record) => {
      const sisa = record.nominal - (record.totalPaid || 0);
      return sum + sisa;
    }, 0);
    
    // Validation: jumlah potong tidak boleh lebih besar dari total hutang
    if (jumlah > totalHutang) {
      setShowConfirmDialog(true);
      setConfirmAction(() => () => {
        setShowConfirmDialog(false);
        setConfirmAction(null);
      });
      return;
    }
    
    // Show confirmation dialog
    setShowConfirmDialog(true);
    setConfirmAction(() => () => {
      setIsLoading(true);
      
      // # woi back end jordy: INSERT data potong kasbon ke database
      // POST /api/kasbon/potong dengan body:
      // {
      //   staffId: selectedStaff.id,
      //   tanggalPotong: tanggalPotong,
      //   jumlahPotong: jumlah,
      //   paymentMethodId: selectedPaymentMethod, // ID dari cash bank account
      //   periodMonth: selectedMonth,
      //   periodYear: selectedYear,
      //   kasbonDetails: [array of kasbon yang dipotong dengan detail]
      // }
      
      // Simulasi API call
      setTimeout(() => {
        // Potong kasbon dari yang paling lama dulu
        let remainingAmount = jumlah;
        const updatedKasbonData = { ...kasbonData };
        const staffRecords = [...(updatedKasbonData[selectedStaff.id] || [])];
        
        for (const record of unpaidRecords) {
          if (remainingAmount <= 0) break;
          
          const sisa = record.nominal - (record.totalPaid || 0);
          const potongAmount = Math.min(remainingAmount, sisa);
          
          // Update record
          const recordIndex = staffRecords.findIndex(r => r.id === record.id);
          if (recordIndex !== -1) {
            const newTotalPaid = (staffRecords[recordIndex].totalPaid || 0) + potongAmount;
            const newStatus = newTotalPaid >= staffRecords[recordIndex].nominal 
              ? 'lunas' 
              : 'dibayar sebagian';
            
            staffRecords[recordIndex] = {
              ...staffRecords[recordIndex],
              totalPaid: newTotalPaid,
              status: newStatus,
              paymentHistory: [
                ...(staffRecords[recordIndex].paymentHistory || []),
                {
                  date: tanggalPotong,
                  amount: potongAmount,
                  note: `Potong kasbon - ${tanggalPotong}`
                }
              ]
            };
          }
          
          remainingAmount -= potongAmount;
        }
        
        updatedKasbonData[selectedStaff.id] = staffRecords;
        setKasbonData(updatedKasbonData);
        
        setIsLoading(false);
        setShowConfirmDialog(false);
        setConfirmAction(null);
        setJumlahPotong("");
        setSelectedPaymentMethod("");
        alert(`Potong kasbon sebesar ${formatRupiah(jumlah)} berhasil disimpan!`);
      }, 1000);
    });
  };
  
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };
  
  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 font-sans overflow-hidden">
      
      {/* HEADER */}
      <div className="h-16 bg-white flex items-center justify-between px-4 md:px-6 border-b border-gray-200 shadow-sm flex-shrink-0 z-20">
         <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="hover:bg-gray-200 p-1 rounded">
                 <Menu className="w-6 h-6"/>
             </button>
             <h1 className="text-lg md:text-xl font-bold text-black uppercase flex items-center gap-2">
                <Wallet className="w-5 h-5 md:w-6 md:h-6"/> POTONG KASBON
             </h1>
         </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
          
          {/* --- LEFT PANEL: LIST STAFF --- */}
          <div className={`
              flex-col bg-white z-10 transition-all duration-300 border-r border-gray-200
              w-full md:w-80
              ${selectedStaff ? 'hidden md:flex' : 'flex'}
          `}>
              
              {/* TABS SWITCHER */}
              <div className="flex border-b border-gray-200">
                  <button 
                    onClick={() => { setActiveTab('BUKU_KASBON'); setSelectedStaff(null); }}
                    className={`flex-1 py-4 text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-colors border-b-4 ${activeTab === 'BUKU_KASBON' ? 'border-red-500 text-red-700 bg-red-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
                  >
                      <Wallet className="w-4 h-4"/> BUKU KASBON
                  </button>
                  <button 
                    onClick={() => { setActiveTab('POTONG_KASBON'); setSelectedStaff(null); }}
                    className={`flex-1 py-4 text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-colors border-b-4 ${activeTab === 'POTONG_KASBON' ? 'border-blue-500 text-blue-700 bg-blue-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
                  >
                      <Wallet className="w-4 h-4"/> POTONG KASBON
                  </button>
              </div>

              {/* SEARCH */}
              <div className="p-3 border-b border-gray-200 bg-gray-50">
                  <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input 
                        type="text" 
                        placeholder="Cari Nama Staff..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm shadow-sm"
                      />
                  </div>
              </div>
              
              {/* LIST STAFF */}
              <div className="flex-1 overflow-y-auto">
                  {filteredStaff.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 text-sm">Tidak ada staff yang sesuai.</div>
                  ) : (
                      <div className="flex flex-col">
                          {filteredStaff.map(staff => {
                              const staffRecords = kasbonData[staff.id] || [];
                              // Hitung benar-benar dari data yang belum dibayar (sisa hutang > 0)
                              const unpaidCount = staffRecords.filter(r => {
                                const sisa = r.nominal - (r.totalPaid || 0);
                                return sisa > 0; // Belum lunas jika sisa > 0
                              }).length;
                              
                              return (
                                <div 
                                    key={staff.id} 
                                    onClick={() => handleSelectStaff(staff)}
                                    className={`p-4 border-b cursor-pointer transition-colors hover:bg-blue-50 group ${selectedStaff?.id === staff.id ? 'bg-blue-100 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-gray-800 text-sm">{staff.name}</span>
                                    </div>
                                    <div className="text-xs text-gray-600 mb-1">{staff.role}</div>
                                    <div className={`text-xs ${activeTab === 'POTONG_KASBON' ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                                        {activeTab === 'POTONG_KASBON' 
                                          ? `Total Kasbon Belum Dibayar: ${unpaidCount}`
                                          : `Total Kasbon: ${staffRecords.length}`
                                        }
                                    </div>
                                </div>
                              );
                          })}
                      </div>
                  )}
              </div>
          </div>

          {/* --- RIGHT PANEL: DETAIL --- */}
          <div className={`
              flex-1 flex-col bg-gray-50 overflow-hidden relative
              ${selectedStaff ? 'flex' : 'hidden md:flex'}
              w-full md:w-auto
          `}>
              {selectedStaff ? (
                  <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                      
                      {/* HEADER */}
                      <div className="bg-white p-4 border-b border-gray-200 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 flex-1">
                                  <button 
                                      onClick={() => setSelectedStaff(null)} 
                                      className="md:hidden p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-700"
                                  >
                                      <ArrowLeft className="w-5 h-5"/>
                                  </button>
                                  <div>
                                      <h2 className="text-xl font-bold text-gray-800">{selectedStaff.name}</h2>
                                      <p className="text-xs text-gray-500">{selectedStaff.role}</p>
                                  </div>
                              </div>
                              
                              {/* PERIOD SELECTOR - Right aligned (only show for BUKU KASBON) */}
                              {activeTab === 'BUKU_KASBON' && (
                                  <div className="flex items-center gap-2">
                                      <span className="text-sm font-semibold text-gray-600 hidden sm:inline">Periode:</span>
                                      <button
                                          onClick={handlePreviousMonth}
                                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                                          title="Bulan Sebelumnya"
                                      >
                                          <ChevronLeft className="w-4 h-4 text-gray-600"/>
                                      </button>
                                      <select 
                                          value={selectedMonth} 
                                          onChange={(e) => {
                                              setSelectedMonth(Number(e.target.value));
                                              setCurrentPageBukuKasbon(1);
                                              setCurrentPagePotongKasbon(1);
                                          }}
                                          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
                                      >
                                          {monthNames.map((month, index) => (
                                              <option key={index} value={index}>{month}</option>
                                          ))}
                                      </select>
                                      <select 
                                          value={selectedYear} 
                                          onChange={(e) => {
                                              setSelectedYear(Number(e.target.value));
                                              setCurrentPageBukuKasbon(1);
                                              setCurrentPagePotongKasbon(1);
                                          }}
                                          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
                                      >
                                          {Array.from({ length: 10 }, (_, i) => currentDate.getFullYear() - 5 + i).map(year => (
                                              <option key={year} value={year}>{year}</option>
                                          ))}
                                      </select>
                                      <button
                                          onClick={handleNextMonth}
                                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                                          title="Bulan Selanjutnya"
                                      >
                                          <ChevronRight className="w-4 h-4 text-gray-600"/>
                                      </button>
                                  </div>
                              )}
                          </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20">
                          
                          {/* TAB BUKU KASBON */}
                          {activeTab === 'BUKU_KASBON' && (
                              <div className="space-y-6">
                                  {/* FORM INPUT */}
                                  <div className={`bg-red-50 p-4 rounded-xl border border-red-100 flex flex-col md:flex-row gap-3 items-end`}>
                                      <div className="flex-1 w-full">
                                          <label className="block text-[10px] font-bold text-red-700 mb-1">Tanggal</label>
                                          <input 
                                              type="date" 
                                              value={inputDate} 
                                              readOnly
                                              disabled
                                              className="w-full border border-red-200 rounded px-2 py-2 text-sm focus:outline-none bg-gray-100 cursor-not-allowed [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden"
                                              style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                                          />
                                      </div>
                                      <div className="flex-1 w-full">
                                          <label className="block text-[10px] font-bold text-red-700 mb-1">Keterangan</label>
                                          <input 
                                              type="text" 
                                              placeholder="Keterangan..." 
                                              value={inputKeterangan} 
                                              onChange={(e) => setInputKeterangan(e.target.value)} 
                                              className="w-full border border-red-200 rounded px-2 py-2 text-sm focus:outline-none bg-white"
                                          />
                                      </div>
                                      <div className="flex-1 w-full">
                                          <label className="block text-[10px] font-bold text-red-700 mb-1">Metode Pembayaran</label>
                                          <select
                                              value={inputPaymentMethod}
                                              onChange={(e) => setInputPaymentMethod(e.target.value)}
                                              className="w-full border border-red-200 rounded px-2 py-2 text-sm focus:outline-none focus:border-red-500 bg-white"
                                          >
                                              <option value="">Pilih Metode</option>
                                              {paymentMethods.map(method => (
                                                  <option key={method.id} value={String(method.id)}>
                                                      {method.name} ({method.type})
                                                  </option>
                                              ))}
                                          </select>
                                      </div>
                                      <div className="flex-1 w-full">
                                          <label className="block text-[10px] font-bold text-red-700 mb-1">Nominal (Rp)</label>
                                          <input 
                                              type="text" 
                                              placeholder="0" 
                                              value={formatNumberDisplay(inputNominal)} 
                                              onChange={(e) => setInputNominal(String(parseNumberInput(e.target.value)))} 
                                              className="w-full border border-red-200 rounded px-2 py-2 text-sm font-bold text-right focus:outline-none bg-white"
                                          />
                                      </div>
                                      <button 
                                          onClick={handleAddKasbon} 
                                          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg shadow transition-transform active:scale-95"
                                      >
                                          <Plus className="w-5 h-5"/>
                                      </button>
                                  </div>

                                  {/* TABLE HISTORY */}
                                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                      <div className="p-4 border-b border-gray-200 bg-red-50">
                                          <h3 className="font-bold text-gray-800">History Hutang</h3>
                                      </div>
                                      
                                      <div className="overflow-x-auto">
                                          <table className="w-full text-sm min-w-[600px]">
                                              <thead className="bg-gray-100 font-bold text-gray-600">
                                                  <tr>
                                                      <th className="px-4 py-2 text-left">Tanggal</th>
                                                      <th className="px-4 py-2 text-left">Keterangan</th>
                                                      <th className="px-4 py-2 text-right">Nominal</th>
                                                      <th className="px-4 py-2 text-center">Status</th>
                                                      <th className="px-4 py-2 text-center">Aksi</th>
                                                  </tr>
                                              </thead>
                                              <tbody className="divide-y divide-gray-100">
                                                  {paginatedRecordsBukuKasbon.length === 0 ? (
                                                      <tr>
                                                          <td colSpan={5} className="text-center py-6 text-gray-400 italic">Belum ada data kasbon untuk periode ini.</td>
                                                      </tr>
                                                  ) : (
                                                      paginatedRecordsBukuKasbon.map(record => {
                                                          const isEditing = editingRecord?.id === record.id;
                                                          return (
                                                              <tr key={record.id} className="hover:bg-gray-50">
                                                                  {isEditing ? (
                                                                      <>
                                                                          <td className="px-4 py-2">
                                                                              <input 
                                                                                  type="date" 
                                                                                  value={editDate} 
                                                                                  onChange={(e) => setEditDate(e.target.value)} 
                                                                                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none bg-white"
                                                                              />
                                                                          </td>
                                                                          <td className="px-4 py-2">
                                                                              <input 
                                                                                  type="text" 
                                                                                  value={editKeterangan} 
                                                                                  onChange={(e) => setEditKeterangan(e.target.value)} 
                                                                                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none bg-white"
                                                                              />
                                                                          </td>
                                                                          <td className="px-4 py-2">
                                                                              <input 
                                                                                  type="text" 
                                                                                  value={formatNumberDisplay(editNominal)} 
                                                                                  onChange={(e) => setEditNominal(String(parseNumberInput(e.target.value)))} 
                                                                                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm font-bold text-right focus:outline-none bg-white"
                                                                              />
                                                                          </td>
                                                                          <td className="px-4 py-2 text-center">
                                                                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                                                  record.status === 'lunas' ? 'bg-green-100 text-green-700' :
                                                                                  record.status === 'dibayar sebagian' ? 'bg-yellow-100 text-yellow-700' :
                                                                                  'bg-red-100 text-red-700'
                                                                              }`}>
                                                                                  {record.status}
                                                                              </span>
                                                                          </td>
                                                                          <td className="px-4 py-2 text-center">
                                                                              <div className="flex items-center justify-center gap-2">
                                                                                  <button 
                                                                                      onClick={handleSaveEdit} 
                                                                                      className="text-green-500 hover:text-green-700"
                                                                                      title="Simpan"
                                                                                  >
                                                                                      <Save className="w-4 h-4"/>
                                                                                  </button>
                                                                                  <button 
                                                                                      onClick={handleCancelEdit} 
                                                                                      className="text-red-400 hover:text-red-600"
                                                                                      title="Batal"
                                                                                  >
                                                                                      <XCircle className="w-4 h-4"/>
                                                                                  </button>
                                                                              </div>
                                                                          </td>
                                                                      </>
                                                                  ) : (
                                                                      <>
                                                                          <td className="px-4 py-2 text-gray-600">{formatDate(record.date)}</td>
                                                                          <td className="px-4 py-2 text-gray-800 font-medium">{record.keterangan}</td>
                                                                          <td className="px-4 py-2 text-right font-bold text-red-600">{formatRupiah(record.nominal)}</td>
                                                                          <td className="px-4 py-2 text-center">
                                                                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                                                  record.status === 'lunas' ? 'bg-green-100 text-green-700' :
                                                                                  record.status === 'dibayar sebagian' ? 'bg-yellow-100 text-yellow-700' :
                                                                                  'bg-red-100 text-red-700'
                                                                              }`}>
                                                                                  {record.status}
                                                                              </span>
                                                                          </td>
                                                                          <td className="px-4 py-2 text-center">
                                                                              <div className="flex items-center justify-center gap-2">
                                                                                  <button 
                                                                                      onClick={() => handleEditKasbon(record)} 
                                                                                      className="text-blue-400 hover:text-blue-600"
                                                                                      title="Edit"
                                                                                  >
                                                                                      <Edit2 className="w-4 h-4"/>
                                                                                  </button>
                                                                                  <button 
                                                                                      onClick={() => handleDeleteKasbon(record.id)} 
                                                                                      className="text-red-400 hover:text-red-600"
                                                                                      title="Hapus"
                                                                                  >
                                                                                      <Trash2 className="w-4 h-4"/>
                                                                                  </button>
                                                                              </div>
                                                                          </td>
                                                                      </>
                                                                  )}
                                                              </tr>
                                                          );
                                                      })
                                                  )}
                                              </tbody>
                                          </table>
                                      </div>
                                      
                                      {/* PAGINATION */}
                                      {totalPagesBukuKasbon > 1 && (
                                          <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-center gap-2">
                                              <button 
                                                  onClick={() => setCurrentPageBukuKasbon(prev => Math.max(1, prev - 1))}
                                                  disabled={currentPageBukuKasbon === 1}
                                                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                                              >
                                                  <ChevronLeft className="w-4 h-4"/>
                                              </button>
                                              {Array.from({ length: totalPagesBukuKasbon }, (_, i) => i + 1).map(page => (
                                                  <button
                                                      key={page}
                                                      onClick={() => setCurrentPageBukuKasbon(page)}
                                                      className={`px-3 py-1 border rounded-lg text-sm font-bold transition-colors ${
                                                          currentPageBukuKasbon === page
                                                              ? 'bg-blue-500 text-white border-blue-500'
                                                              : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                                                      }`}
                                                  >
                                                      {page}
                                                  </button>
                                              ))}
                                              <button 
                                                  onClick={() => setCurrentPageBukuKasbon(prev => Math.min(totalPagesBukuKasbon, prev + 1))}
                                                  disabled={currentPageBukuKasbon === totalPagesBukuKasbon}
                                                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                                              >
                                                  <ChevronRight className="w-4 h-4"/>
                                              </button>
                                          </div>
                                      )}
                                  </div>
                              </div>
                          )}

                          {/* TAB POTONG KASBON */}
                          {activeTab === 'POTONG_KASBON' && (
                              <div className="space-y-6">
                                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                      <div className="p-3 md:p-4 border-b border-gray-200 bg-blue-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                          <div className="flex items-center gap-2 flex-wrap">
                                              <h3 className="font-bold text-gray-800 text-sm md:text-base">Hutang Belum Lunas</h3>
                                              {selectedStaff && filteredRecords.length > 0 && (
                                                  <span className="text-red-600 font-bold text-sm md:text-base">
                                                      ({formatRupiah(filteredRecords.reduce((sum, record) => {
                                                          const sisa = record.nominal - (record.totalPaid || 0);
                                                          return sum + sisa;
                                                      }, 0))})
                                                  </span>
                                              )}
                                          </div>
                                          
                                          {/* PAGINATION - Right top of table */}
                                          {totalPagesPotongKasbon > 1 && (
                                              <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                                                  <button 
                                                      onClick={() => setCurrentPagePotongKasbon(prev => Math.max(1, prev - 1))}
                                                      disabled={currentPagePotongKasbon === 1}
                                                      className="p-1.5 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                                                      title="Halaman Sebelumnya"
                                                  >
                                                      <ChevronLeft className="w-4 h-4"/>
                                                  </button>
                                                  {Array.from({ length: totalPagesPotongKasbon }, (_, i) => i + 1).map(page => (
                                                      <button
                                                          key={page}
                                                          onClick={() => setCurrentPagePotongKasbon(page)}
                                                          className={`px-2.5 py-1 border rounded text-xs font-bold transition-colors ${
                                                              currentPagePotongKasbon === page
                                                                  ? 'bg-blue-500 text-white border-blue-500'
                                                                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                                                          }`}
                                                      >
                                                          {page}
                                                      </button>
                                                  ))}
                                                  <button 
                                                      onClick={() => setCurrentPagePotongKasbon(prev => Math.min(totalPagesPotongKasbon, prev + 1))}
                                                      disabled={currentPagePotongKasbon === totalPagesPotongKasbon}
                                                      className="p-1.5 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                                                      title="Halaman Selanjutnya"
                                                  >
                                                      <ChevronRight className="w-4 h-4"/>
                                                  </button>
                                              </div>
                                          )}
                                      </div>
                                      
                                      <div className="overflow-x-auto">
                                          <table className="w-full text-sm min-w-[600px]">
                                              <thead className="bg-gray-100 font-bold text-gray-600">
                                                  <tr>
                                                      <th className="px-4 py-2 text-left">Tanggal</th>
                                                      <th className="px-4 py-2 text-left">Keterangan</th>
                                                      <th className="px-4 py-2 text-right">Nominal</th>
                                                      <th className="px-4 py-2 text-right">Dibayar</th>
                                                      <th className="px-4 py-2 text-right">Sisa</th>
                                                      <th className="px-4 py-2 text-center">Status</th>
                                                  </tr>
                                              </thead>
                                              <tbody className="divide-y divide-gray-100">
                                                  {paginatedRecordsPotongKasbon.length === 0 ? (
                                                      <tr>
                                                          <td colSpan={6} className="text-center py-6 text-gray-400 italic">Tidak ada hutang yang belum lunas untuk periode ini.</td>
                                                      </tr>
                                                  ) : (
                                                      paginatedRecordsPotongKasbon.map(record => {
                                                          const sisa = record.nominal - (record.totalPaid || 0);
                                                          return (
                                                              <tr key={record.id} className="hover:bg-gray-50">
                                                                  <td className="px-4 py-2 text-gray-600">{formatDate(record.date)}</td>
                                                                  <td className="px-4 py-2 text-gray-800 font-medium">{record.keterangan}</td>
                                                                  <td className="px-4 py-2 text-right font-bold text-blue-600">{formatRupiah(record.nominal)}</td>
                                                                  <td className="px-4 py-2 text-right text-gray-600">{formatRupiah(record.totalPaid || 0)}</td>
                                                                  <td className="px-4 py-2 text-right font-bold text-red-600">{formatRupiah(sisa)}</td>
                                                                  <td className="px-4 py-2 text-center">
                                                                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                                          record.status === 'lunas' ? 'bg-green-100 text-green-700' :
                                                                          record.status === 'dibayar sebagian' ? 'bg-yellow-100 text-yellow-700' :
                                                                          'bg-red-100 text-red-700'
                                                                      }`}>
                                                                          {record.status}
                                                                      </span>
                                                                  </td>
                                                              </tr>
                                                          );
                                                      })
                                                  )}
                                              </tbody>
                                          </table>
                                      </div>
                                  </div>
                                  
                                  {/* FORM POTONG KASBON */}
                                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                      <h3 className="font-bold text-gray-800 mb-4 text-sm md:text-base">Form Potong Kasbon</h3>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div>
                                              <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Potong</label>
                                              <input 
                                                  type="date" 
                                                  value={tanggalPotong} 
                                                  readOnly
                                                  disabled
                                                  className="w-full border border-gray-300 rounded px-3 py-2 text-xs md:text-sm focus:outline-none bg-gray-100 cursor-not-allowed [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden"
                                                  style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                                              />
                                          </div>
                                          <div>
                                              <label className="block text-xs font-bold text-gray-700 mb-1">Metode Pembayaran</label>
                                              <select
                                                  value={selectedPaymentMethod}
                                                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                                                  className="w-full border border-gray-300 rounded px-3 py-2 text-xs md:text-sm focus:outline-none focus:border-blue-500 bg-white"
                                              >
                                                  <option value="">Pilih Metode Pembayaran</option>
                                                  {paymentMethods.map(method => (
                                                      <option key={method.id} value={String(method.id)}>
                                                          {method.name} ({method.type})
                                                      </option>
                                                  ))}
                                              </select>
                                          </div>
                                          <div className="md:col-span-2">
                                              <label className="block text-xs font-bold text-gray-700 mb-1">Jumlah Potong (Rp)</label>
                                              <div className="relative">
                                                  <input 
                                                      type="text" 
                                                      placeholder="0" 
                                                      value={formatNumberDisplay(jumlahPotong)} 
                                                      onChange={(e) => setJumlahPotong(String(parseNumberInput(e.target.value)))} 
                                                      className="w-full border border-gray-300 rounded px-3 py-2 pr-12 text-xs md:text-sm font-bold text-right focus:outline-none focus:border-blue-500 bg-white"
                                                  />
                                                  {jumlahPotong && parseNumberInput(jumlahPotong) > 0 && selectedPaymentMethod && (
                                                      <button
                                                          onClick={handleSavePotongKasbon}
                                                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white p-1.5 md:p-2 rounded-lg shadow transition-colors flex-shrink-0"
                                                          title="Simpan"
                                                      >
                                                          <Save className="w-4 h-4 md:w-5 md:h-5"/>
                                                      </button>
                                                  )}
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                      <User className="w-16 h-16 md:w-20 md:h-20 mb-4 opacity-20"/>
                      <p className="text-lg md:text-xl font-medium">Pilih Staff</p>
                      <p className="text-sm">untuk melihat detail kasbon.</p>
                  </div>
              )}
          </div>
      </div>
      
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onConfirm={() => {
          if (confirmAction) {
            confirmAction();
          }
        }}
        onCancel={() => {
          setShowConfirmDialog(false);
          setConfirmAction(null);
        }}
        title={
          (() => {
            if (!selectedStaff) return "Validasi Gagal";
            const jumlah = parseNumberInput(jumlahPotong);
            if (jumlah <= 0) {
              return "Validasi Gagal";
            }
            // Get all unpaid records (tidak filter periode), filter berdasarkan sisa > 0
            const unpaidRecords = (kasbonData[selectedStaff.id] || [])
              .filter(record => {
                const sisa = record.nominal - (record.totalPaid || 0);
                return sisa > 0; // Hanya yang belum lunas
              })
              .sort((a, b) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                return dateA - dateB;
              });
            const totalHutang = unpaidRecords.reduce((sum, record) => {
              const sisa = record.nominal - (record.totalPaid || 0);
              return sum + sisa;
            }, 0);
            if (jumlah > totalHutang) {
              return "Validasi Gagal";
            }
            return "Konfirmasi Potong Kasbon";
          })()
        }
        message={
          (() => {
            if (!selectedStaff) return "Pilih staff terlebih dahulu!";
            const jumlah = parseNumberInput(jumlahPotong);
            if (jumlah <= 0) {
              return "Jumlah Potong wajib diisi dan harus lebih dari 0!";
            }
            // Get all unpaid records (tidak filter periode), filter berdasarkan sisa > 0
            const unpaidRecords = (kasbonData[selectedStaff.id] || [])
              .filter(record => {
                const sisa = record.nominal - (record.totalPaid || 0);
                return sisa > 0; // Hanya yang belum lunas
              })
              .sort((a, b) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                return dateA - dateB;
              });
            const totalHutang = unpaidRecords.reduce((sum, record) => {
              const sisa = record.nominal - (record.totalPaid || 0);
              return sum + sisa;
            }, 0);
            if (jumlah > totalHutang) {
              return `Jumlah Potong (${formatRupiah(jumlah)}) tidak boleh lebih besar dari Total Hutang yang tersedia (${formatRupiah(totalHutang)})!`;
            }
            return `Apakah Anda yakin ingin memotong kasbon sebesar ${formatRupiah(jumlah)}?\n\nPotongan akan dilakukan dari kasbon paling lama terlebih dahulu.`;
          })()
        }
        confirmText={
          (() => {
            if (!selectedStaff) return "OK";
            const jumlah = parseNumberInput(jumlahPotong);
            if (jumlah <= 0) {
              return "OK";
            }
            // Get all unpaid records (tidak filter periode), filter berdasarkan sisa > 0
            const unpaidRecords = (kasbonData[selectedStaff.id] || [])
              .filter(record => {
                const sisa = record.nominal - (record.totalPaid || 0);
                return sisa > 0; // Hanya yang belum lunas
              })
              .sort((a, b) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                return dateA - dateB;
              });
            const totalHutang = unpaidRecords.reduce((sum, record) => {
              const sisa = record.nominal - (record.totalPaid || 0);
              return sum + sisa;
            }, 0);
            if (jumlah > totalHutang) {
              return "OK";
            }
            return "Ya, Potong Kasbon";
          })()
        }
        cancelText="Batal"
        type={
          (() => {
            if (!selectedStaff) return "danger";
            const jumlah = parseNumberInput(jumlahPotong);
            if (jumlah <= 0) {
              return "danger";
            }
            // Get all unpaid records (tidak filter periode), filter berdasarkan sisa > 0
            const unpaidRecords = (kasbonData[selectedStaff.id] || [])
              .filter(record => {
                const sisa = record.nominal - (record.totalPaid || 0);
                return sisa > 0; // Hanya yang belum lunas
              })
              .sort((a, b) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                return dateA - dateB;
              });
            const totalHutang = unpaidRecords.reduce((sum, record) => {
              const sisa = record.nominal - (record.totalPaid || 0);
              return sum + sisa;
            }, 0);
            if (jumlah > totalHutang) {
              return "danger";
            }
            return "warning";
          })()
        }
      />
      
      {/* Loading Overlay */}
      <LoadingOverlay 
        show={isLoading} 
        message="Memproses potong kasbon..."
      />
    </div>
  );
};

export default PotongKasbonPage;
