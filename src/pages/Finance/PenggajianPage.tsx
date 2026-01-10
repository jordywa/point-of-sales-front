// src/pages/PenggajianPage.tsx

import React, { useState } from 'react';
import { Menu, Calendar, User, Plus, Save, Clock, DollarSign, ChevronRight, ChevronLeft, CheckCircle, LayoutGrid, List, ArrowLeft, ArrowRight, Search, Edit2, XCircle } from 'lucide-react';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import LoadingOverlay from '../../components/LoadingOverlay';

interface PenggajianPageProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
}

// --- TIPE DATA ---
interface OvertimeRecord {
  id: number;
  date: string;
  amount: number;
  note: string;
}

interface DebtRecord {
  id: number;
  date: string;
  amount: number;
  note: string;
}

interface DeductionRecord {
  id: number;
  date: string;
  amount: number;
  note: string;
}

interface PayrollData {
  id: string;
  staffId: number;
  staffName: string;
  month: number;
  year: number;
  basicSalary: number;
  allowance: number;
  
  totalDebt: number;
  deductionRecords: DeductionRecord[];
  debtRecords: DebtRecord[];
  overtimeRecords: OvertimeRecord[];
  
  status: 'DRAFT' | 'PAID'; // Status updated
  paymentDate?: string;     // Tanggal pembayaran (otomatis saat klik PAID)
}

// --- MOCK DATA STAFF ---
const MOCK_STAFF = [
    { id: 1, name: "Admin Vicky", role: "Admin", baseSalary: 4500000 },
    { id: 2, name: "Budi Gudang", role: "Staf Gudang", baseSalary: 3800000 },
    { id: 3, name: "Siti Kasir", role: "Kasir", baseSalary: 3500000 },
    { id: 4, name: "Pak Eko Driver", role: "Driver", baseSalary: 4000000 },
];

const PenggajianPage: React.FC<PenggajianPageProps> = ({ setIsSidebarOpen }) => {
  // --- STATE ---
  // # woi back end jordy: START PERIODE PENGGAJIAN
  // Ambil start periode dari setting master (GET /api/settings/payroll-start-period)
  // Response: { startMonth: number, startYear: number } - bulan dan tahun pertama kali system payroll diaktifkan
  // Jika belum ada setting, gunakan bulan dan tahun saat ini sebagai default
  // Start periode ini digunakan untuk membatasi pilihan bulan/tahun di selector periode
  // User hanya bisa memilih periode mulai dari start periode hingga periode saat ini
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  // TODO: Ganti dengan data dari API setting
  // const [startPeriod, setStartPeriod] = useState({ month: currentMonth, year: currentYear });
  // const startPeriodMonth = startPeriod.month;
  // const startPeriodYear = startPeriod.year;

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  // Fungsi navigasi bulan
  const handlePreviousMonth = () => {
      if (selectedMonth === 0) {
          setSelectedMonth(11);
          setSelectedYear(selectedYear - 1);
      } else {
          setSelectedMonth(selectedMonth - 1);
      }
      setActivePayroll(null);
      setShowMobileDetail(false);
  };
  
  const handleNextMonth = () => {
      if (selectedMonth === 11) {
          setSelectedMonth(0);
          setSelectedYear(selectedYear + 1);
      } else {
          setSelectedMonth(selectedMonth + 1);
      }
      setActivePayroll(null);
      setShowMobileDetail(false);
  };
  
  // Generate dummy data for last 3 months with 4 employees
  const generateDummyPayrolls = (): PayrollData[] => {
    const dummy: PayrollData[] = [];
    const today = new Date();
    
    for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
      const targetDate = new Date(today.getFullYear(), today.getMonth() - monthOffset, 1);
      const month = targetDate.getMonth();
      const year = targetDate.getFullYear();
      
      MOCK_STAFF.forEach((staff) => {
        const isPaid = Math.random() > 0.3; // 70% chance of being paid
        const overtimeCount = Math.floor(Math.random() * 5) + 1;
        const overtimeRecords: OvertimeRecord[] = [];
        
        for (let i = 0; i < overtimeCount; i++) {
          const day = Math.floor(Math.random() * 28) + 1;
          overtimeRecords.push({
            id: Date.now() + i,
            date: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
            amount: Math.floor(Math.random() * 200000) + 50000,
            note: `Lembur ${i + 1}`
          });
        }
        
        dummy.push({
          id: `PAY-${year}-${month + 1}-${staff.id}`,
          staffId: staff.id,
          staffName: staff.name,
          month: month,
          year: year,
          basicSalary: staff.baseSalary,
          allowance: 0,
          totalDebt: 0,
          debtRecords: [],
          deductionRecords: [],
          overtimeRecords: overtimeRecords,
          status: isPaid ? 'PAID' : 'DRAFT',
          paymentDate: isPaid ? `${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}` : undefined
        });
      });
    }
    
    return dummy;
  };
  
  const [payrolls, setPayrolls] = useState<PayrollData[]>(generateDummyPayrolls());
  
  // Active Payroll State (seperti selectedPO di StockInPage)
  const [activePayroll, setActivePayroll] = useState<PayrollData | null>(null);
  
  // Tab State - Tab Kasbon di-comment dulu
  // const [activeTab, setActiveTab] = useState<'LEMBUR' | 'KASBON'>('LEMBUR');
  const [activeTab, setActiveTab] = useState<'BONUS_LEMBUR'>('BONUS_LEMBUR');
  
  // State untuk List/Grid view seperti FinancePage
  const [isGridView, setIsGridView] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  
  // State untuk edit gaji
  const [isEditingSalary, setIsEditingSalary] = useState(false);
  
  // State untuk edit bonus (untuk item PAID)
  const [isEditingBonus, setIsEditingBonus] = useState(false);

  // State untuk dialog dan loading
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form Input Kecil - tanggal otomatis hari ini (readonly)
  const [inputDate] = useState(new Date().toISOString().split('T')[0]);
  const [inputAmount, setInputAmount] = useState(""); 
  const [inputNote, setInputNote] = useState("");
  const [inputPaymentMethod, setInputPaymentMethod] = useState<string>("");
  
  // Payment method state untuk bayar gaji
  const [payrollPaymentMethod, setPayrollPaymentMethod] = useState<string>("");
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  
  // Mock data payment methods from Cash Bank
  // # woi back end jordy: GET /api/cash-bank/accounts untuk ambil daftar akun cash/bank
  // Response: Array of { id: number, name: string, type: 'CASH' | 'BANK', balance: number }
  const paymentMethods = [
    { id: 1, name: "KAS TOKO", type: "CASH" as const },
    { id: 2, name: "BANK BCA", type: "BANK" as const },
  ];
  
  // Get default payment method (cash untuk bonus/lembur, bank untuk bayar gaji)
  // # woi back end jordy: GET /api/settings/last-payment-method untuk ambil metode pembayaran terakhir dipakai
  // Response: { lastPaymentMethodId: number } - default mengikuti terakhir kali dipakai
  // Untuk sekarang default: cash untuk bonus/lembur, bank pertama untuk bayar gaji
  const defaultCashMethod = paymentMethods.find(m => m.type === 'CASH')?.id || paymentMethods[0]?.id || "";
  const defaultBankMethod = paymentMethods.find(m => m.type === 'BANK')?.id || paymentMethods[0]?.id || "";

  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  // --- HELPER FORMATTING ---
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
  
  // Filter dan sort staff berdasarkan search query, kemudian sort A-Z
  const filteredStaff = MOCK_STAFF
    .filter(staff => 
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      staff.role.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  // --- LOGIC ---
  const getPayrollForStaff = (staffId: number) => {
      return payrolls.find(p => p.staffId === staffId && p.month === selectedMonth && p.year === selectedYear);
  };

  const handleOpenPayroll = (staff: typeof MOCK_STAFF[0]) => {
      const existing = getPayrollForStaff(staff.id);
      
      if (existing) {
          setActivePayroll({ ...existing });
      } else {
          setActivePayroll({
              id: `PAY-${selectedYear}-${selectedMonth + 1}-${staff.id}`,
              staffId: staff.id,
              staffName: staff.name,
              month: selectedMonth,
              year: selectedYear,
              basicSalary: staff.baseSalary,
              allowance: 0,
              totalDebt: 0, 
              debtRecords: [{ id: 1, date: new Date().toISOString().split('T')[0], note: 'Sisa Bulan Lalu', amount: 0 }],
              deductionRecords: [],
              overtimeRecords: [],
              status: 'DRAFT'
          });
      }
      setActiveTab('BONUS_LEMBUR');
      setIsEditingSalary(false);
      setIsEditingBonus(false);
      resetInputForm();
      setShowMobileDetail(true); // Show detail on mobile/tablet
      // Set default payment method saat buka payroll
      if (!inputPaymentMethod) {
          setInputPaymentMethod(String(defaultCashMethod));
      }
  };
  
  const handleBackToList = () => {
      setShowMobileDetail(false);
      setActivePayroll(null);
  };

  const resetInputForm = () => {
      setInputAmount("");
      setInputNote("");
      setInputPaymentMethod(String(defaultCashMethod)); // Default cash untuk bonus/lembur
  };

  // --- ADD ITEM LOGIC ---
  const handleAddItem = (type: 'LEMBUR' | 'DEBT' | 'DEDUCTION') => {
      if (!activePayroll) return;
      
      // Validasi wajib isi keterangan dan nominal
      const amountVal = parseNumberInput(inputAmount);
      const trimmedNote = inputNote.trim();
      
      if (!trimmedNote) {
          alert("Keterangan wajib diisi!");
          return;
      }
      
      if (amountVal <= 0) {
          alert("Nominal wajib diisi dan harus lebih dari 0!");
          return;
      }
      
      if (type === 'LEMBUR') {
          // Validasi payment method wajib dipilih
          if (!inputPaymentMethod) {
              alert("Metode Pembayaran wajib dipilih!");
              return;
          }
          
          const newItem: OvertimeRecord = {
              id: Date.now(),
              date: inputDate,
              amount: amountVal,
              note: trimmedNote
          };
          
          // # woi back end jordy: INSERT pengeluaran bonus/lembur ke database (ini merupakan pengeluaran bagi user)
          // POST /api/expenses dengan body:
          // {
          //   date: inputDate,
          //   category: 'Bonus/Lembur',
          //   staffName: activePayroll.staffName,
          //   description: trimmedNote,
          //   amount: amountVal,
          //   paymentMethodId: inputPaymentMethod // ID dari cash bank account
          // }
          //
          // # woi back end jordy: UPDATE last payment method setting
          // PUT /api/settings/last-payment-method dengan body: { lastPaymentMethodId: inputPaymentMethod }
          
          setActivePayroll({
              ...activePayroll,
              overtimeRecords: [...activePayroll.overtimeRecords, newItem]
          });
          resetInputForm();
      } 
      else if (type === 'DEBT') {
          const newItem: DebtRecord = {
              id: Date.now(),
              date: inputDate,
              amount: amountVal,
              note: inputNote || "Pinjaman Baru"
          };
          setActivePayroll({
              ...activePayroll,
              debtRecords: [...activePayroll.debtRecords, newItem]
          });
      }
      else if (type === 'DEDUCTION') {
          const totalCurrentDebt = calculateTotalDebt(activePayroll);
          const totalPaid = calculateTotalDeduction(activePayroll);
          const remainingDebt = totalCurrentDebt - totalPaid;

          if (amountVal > remainingDebt) {
              alert(`Potongan melebihi sisa hutang! Sisa Hutang: ${formatRupiah(remainingDebt)}`);
              return;
          }

          const newItem: DeductionRecord = {
              id: Date.now(),
              date: inputDate,
              amount: amountVal,
              note: inputNote || "Potong Gaji"
          };
          setActivePayroll({
              ...activePayroll,
              deductionRecords: [...activePayroll.deductionRecords, newItem]
          });
      }
      resetInputForm();
  };

  const handleDeleteItem = (id: number, type: 'LEMBUR' | 'DEBT' | 'DEDUCTION') => {
      if (!activePayroll) return;

      if (confirm("Hapus item ini?")) {
          if (type === 'LEMBUR') {
              setActivePayroll({
                  ...activePayroll,
                  overtimeRecords: activePayroll.overtimeRecords.filter(r => r.id !== id)
              });
          } else if (type === 'DEBT') {
              setActivePayroll({
                  ...activePayroll,
                  debtRecords: activePayroll.debtRecords.filter(r => r.id !== id)
              });
          } else {
              setActivePayroll({
                  ...activePayroll,
                  deductionRecords: activePayroll.deductionRecords.filter(r => r.id !== id)
              });
          }
      }
  };

  // --- SAVE DRAFT ---
  const handleSaveDraft = () => {
      if (!activePayroll) return;
      
      setShowConfirmDialog(true);
      setConfirmAction(() => () => {
          setIsLoading(true);
          const updatedPayroll: PayrollData = { ...activePayroll, status: 'DRAFT' };
          
          // # woi back end jordy: INSERT atau UPDATE data payroll ke database
          // Jika activePayroll.id baru: POST /api/payrolls dengan body: updatedPayroll
          // Jika activePayroll.id sudah ada: PUT /api/payrolls/{activePayroll.id} dengan body: updatedPayroll
          
          // Simulasi API call
          setTimeout(() => {
              saveToState(updatedPayroll);
              setIsLoading(false);
              setShowConfirmDialog(false);
              setActivePayroll(null);
              alert("Data berhasil disimpan sebagai DRAFT.");
          }, 1000);
      });
  };

  // --- SAVE PAID (untuk edit item yang sudah PAID) ---
  const handleSavePaid = () => {
      if (!activePayroll) return;
      
      setIsLoading(true);
      const updatedPayroll: PayrollData = { 
          ...activePayroll,
          status: 'PAID' // Tetap PAID setelah save
      };
      
      // # woi back end jordy: UPDATE data payroll yang sudah PAID di database
      // PUT /api/payrolls/{activePayroll.id} dengan body: updatedPayroll
      
      // Simulasi API call
      setTimeout(() => {
          saveToState(updatedPayroll);
          setIsLoading(false);
          setIsEditingSalary(false);
          setIsEditingBonus(false);
          alert("Data berhasil disimpan.");
      }, 1000);
  };
  
  // --- SAVE BONUS PAID (untuk save bonus yang ditambah pada item PAID) ---
  const handleSaveBonusPaid = () => {
      if (!activePayroll) return;
      
      // Validasi: Pastikan tidak ada form input yang masih terisi tapi belum di-add
      const amountVal = parseNumberInput(inputAmount);
      const trimmedNote = inputNote.trim();
      
      // Jika ada input yang terisi tapi belum di-add, minta user untuk add dulu
      if (trimmedNote || amountVal > 0) {
          alert("Silakan tambahkan bonus/lembur yang sudah diisi terlebih dahulu dengan tombol + sebelum menyimpan!");
          return;
      }
      
      // Validasi: Pastikan semua overtimeRecords memiliki keterangan dan nominal yang valid
      const invalidRecords = activePayroll.overtimeRecords.filter(rec => {
          return !rec.note || rec.note.trim() === '' || rec.amount <= 0;
      });
      
      if (invalidRecords.length > 0) {
          alert("Pastikan semua bonus/lembur memiliki keterangan dan nominal yang valid!");
          return;
      }
      
      // Jika tidak ada data baru yang ditambahkan
      if (activePayroll.overtimeRecords.length === 0) {
          alert("Tidak ada bonus/lembur yang ditambahkan. Silakan tambahkan terlebih dahulu.");
          return;
      }
      
      // Semua validasi passed, tampilkan dialog konfirmasi untuk save
      setShowConfirmDialog(true);
      setConfirmAction(() => () => {
          setIsLoading(true);
          const updatedPayroll: PayrollData = { 
              ...activePayroll,
              status: 'PAID' // Tetap PAID setelah save
          };
          
          // # woi back end jordy: UPDATE data payroll yang sudah PAID di database
          // PUT /api/payrolls/{activePayroll.id} dengan body: updatedPayroll
          
          // Simulasi API call
          setTimeout(() => {
              saveToState(updatedPayroll);
              setIsLoading(false);
              setShowConfirmDialog(false);
              setIsEditingBonus(false);
              resetInputForm();
              alert("Bonus berhasil ditambahkan dan disimpan.");
          }, 1000);
      });
  };

  // --- BAYAR GAJI (PAID) ---
  const handlePay = () => {
      if (!activePayroll) return;
      
      // Set default payment method ke bank jika belum dipilih
      if (!payrollPaymentMethod) {
          setPayrollPaymentMethod(String(defaultBankMethod));
      }
      
      // Tampilkan modal pilih payment method
      setShowPaymentMethodModal(true);
  };
  
  const handleConfirmPay = () => {
      if (!activePayroll) return;
      
      // Validasi payment method wajib dipilih
      if (!payrollPaymentMethod) {
          alert("Metode Pembayaran wajib dipilih!");
          return;
      }
      
      setShowPaymentMethodModal(false);
      setShowConfirmDialog(true);
      setConfirmAction(() => () => {
          setIsLoading(true);
          const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
          
          const updatedPayroll: PayrollData = { 
              ...activePayroll, 
              status: 'PAID',
              paymentDate: todayStr
          };

          // # woi back end jordy: UPDATE status payroll menjadi PAID di database
          // PUT /api/payrolls/{activePayroll.id} dengan body: 
          // { 
          //   status: 'PAID', 
          //   paymentDate: todayStr,
          //   paymentMethodId: payrollPaymentMethod // ID dari cash bank account
          // }
          // 
          // # woi back end jordy: INSERT pengeluaran ke database (ini merupakan pengeluaran bagi user)
          // POST /api/expenses dengan body:
          // {
          //   date: todayStr,
          //   category: 'Gaji Karyawan',
          //   staffName: activePayroll.staffName,
          //   description: `Pembayaran gaji ${monthNames[activePayroll.month]} ${activePayroll.year}`,
          //   amount: calculateTotal(activePayroll),
          //   paymentMethodId: payrollPaymentMethod // ID dari cash bank account
          // }
          //
          // # woi back end jordy: UPDATE last payment method setting
          // PUT /api/settings/last-payment-method dengan body: { lastPaymentMethodId: payrollPaymentMethod }
          
          // Simulasi API call
          setTimeout(() => {
              saveToState(updatedPayroll);
              setIsLoading(false);
              setShowConfirmDialog(false);
              setConfirmAction(null);
              setPayrollPaymentMethod("");
              setActivePayroll(null);
              alert(`Gaji berhasil dibayarkan pada tanggal ${todayStr}`);
          }, 1000);
      });
  };

  const saveToState = (data: PayrollData) => {
      setPayrolls(prev => {
          const filtered = prev.filter(p => p.id !== data.id);
          return [...filtered, data];
      });
  };

  // --- CALCULATIONS ---
  const calculateTotalOvertime = (p: PayrollData) => p.overtimeRecords.reduce((acc, curr) => acc + curr.amount, 0);
  const calculateTotalDebt = (p: PayrollData) => p.debtRecords.reduce((acc, curr) => acc + curr.amount, 0);
  const calculateTotalDeduction = (p: PayrollData) => p.deductionRecords.reduce((acc, curr) => acc + curr.amount, 0);

  const calculateTotal = (p: PayrollData) => {
      const totalOvertime = calculateTotalOvertime(p);
      const totalDeduction = calculateTotalDeduction(p);
      // Tunjangan Tetap dihilangkan dari perhitungan
      return (p.basicSalary + totalOvertime) - totalDeduction;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 font-sans overflow-hidden">
      
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0 z-20">
         <div className="h-16 flex items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-4">
                <button onClick={() => setIsSidebarOpen(true)} className="hover:bg-gray-200 p-1 rounded"><Menu className="w-6 h-6"/></button>
                <h1 className="text-lg md:text-xl font-bold text-black uppercase flex items-center gap-2 truncate">
                   <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-green-600"/> 
                   <span className="hidden md:inline">PENGGAJIAN (PAYROLL)</span>
                   <span className="md:hidden">PENGGAJIAN</span>
                </h1>
            </div>
            
            {/* Toggle List/Grid View */}
            <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-600 hidden md:block">Mode Tampilan:</span>
                <button 
                   onClick={() => { setIsGridView(false); setShowMobileDetail(false); setActivePayroll(null); }}
                   className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${!isGridView ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-500'}`}
                   title="Tampilan List (PC)"
                >
                    <List className="w-5 h-5"/>
                    <span className="text-xs font-bold hidden md:block">List View</span>
                </button>
                <button 
                   onClick={() => { setIsGridView(true); setShowMobileDetail(false); setActivePayroll(null); }}
                   className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${isGridView ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-500'}`}
                   title="Tampilan Grid (Tablet)"
                >
                    <LayoutGrid className="w-5 h-5"/>
                    <span className="text-xs font-bold hidden md:block">Grid View</span>
                </button>
            </div>
         </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
          
          {/* --- LEFT PANEL: LIST STAFF (seperti FinancePage) --- */}
          <div className={`
              flex-col bg-white z-10 transition-all duration-300 border-r border-gray-200
              ${isGridView 
                  ? 'w-full'  // Mode Grid: Full Width
                  : 'w-full md:w-[340px] lg:w-[400px] xl:w-[450px]' // Mode List: Responsive Width
              }
              ${showMobileDetail ? 'hidden' : 'flex'} // Hide list when detail is showing (Mobile/Tablet behavior)
              ${!isGridView ? 'md:flex' : ''} // Force flex on desktop list view
          `}>
              {/* SEARCH */}
              <div className="p-3 md:p-4 border-b border-gray-200 bg-gray-50">
                  <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input 
                        type="text" 
                        placeholder="Cari Nama Staff / Role..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm bg-white shadow-sm"
                      />
                  </div>
                  {/* Periode Selector di bawah search bar */}
                  {/* # woi back end jordy: Filter periode berdasarkan start periode dari setting master
                      - Jika tahun yang dipilih sama dengan startPeriodYear, hanya tampilkan bulan mulai dari startPeriodMonth
                      - Jika tahun yang dipilih lebih besar dari startPeriodYear, tampilkan semua bulan
                      - Tahun yang bisa dipilih mulai dari startPeriodYear hingga currentYear
                  */}
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-600">Periode:</span>
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
                            setActivePayroll(null);
                            setShowMobileDetail(false);
                         }}
                         className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
                      >
                         {/* TODO: Filter bulan berdasarkan start periode
                             {monthNames.map((month, index) => {
                                // Jika tahun sama dengan startPeriodYear, hanya tampilkan bulan >= startPeriodMonth
                                if (selectedYear === startPeriodYear && index < startPeriodMonth) return null;
                                return <option key={index} value={index}>{month}</option>;
                             })}
                         */}
                         {monthNames.map((month, index) => (
                            <option key={index} value={index}>{month}</option>
                         ))}
                      </select>
                      <select 
                         value={selectedYear} 
                         onChange={(e) => {
                            setSelectedYear(Number(e.target.value));
                            setActivePayroll(null);
                            setShowMobileDetail(false);
                         }}
                         className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
                      >
                         {/* TODO: Filter tahun mulai dari startPeriodYear hingga currentYear
                             {Array.from({ length: currentYear - startPeriodYear + 1 }, (_, i) => startPeriodYear + i).map(year => (
                                <option key={year} value={year}>{year}</option>
                             ))}
                         */}
                         {Array.from({ length: 10 }, (_, i) => currentYear - 5 + i).map(year => (
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
              </div>
              
              {/* LIST CONTENT */}
              <div className={`flex-1 overflow-y-auto ${isGridView ? 'bg-gray-100 p-4' : ''}`}>
                  {filteredStaff.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 text-sm">Tidak ada staff yang sesuai.</div>
                  ) : (
                      <div className={isGridView ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col"}>
                          {filteredStaff.map(staff => {
                              const payroll = getPayrollForStaff(staff.id);
                              const totalGaji = payroll ? calculateTotal(payroll) : 0;
                              const isPaid = payroll?.status === 'PAID';

                              if (isGridView) {
                                  return (
                                    <div 
                                        key={staff.id} 
                                        onClick={() => handleOpenPayroll(staff)}
                                        className={`bg-white border rounded-xl p-5 shadow-sm cursor-pointer transition-all hover:shadow-md group relative overflow-hidden ${isPaid ? 'border-green-500 ring-1 ring-green-200' : 'border-gray-200'}`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-gray-100 p-2 rounded-full group-hover:bg-blue-50 transition-colors"><User className="w-6 h-6 text-gray-600 group-hover:text-blue-600"/></div>
                                                <div><h3 className="font-bold text-gray-800">{staff.name}</h3><p className="text-xs text-gray-500">{staff.role}</p></div>
                                            </div>
                                            {isPaid ? (
                                                <div className="text-right">
                                                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center justify-end gap-1 mb-1"><CheckCircle className="w-3 h-3"/> PAID</span>
                                                    <span className="text-[10px] text-gray-500 block">{payroll?.paymentDate}</span>
                                                </div>
                                            ) : (
                                                payroll ? <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded-full">DRAFT</span> : <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-full">Belum Input</span>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm"><span className="text-gray-500">Gaji Pokok</span><span className="font-medium text-gray-800">{formatRupiah(staff.baseSalary)}</span></div>
                                            <div className="border-t border-dashed border-gray-200 my-2 pt-2 flex justify-between items-end"><span className="font-bold text-gray-400 text-xs uppercase">Total Gaji</span><span className={`font-bold text-lg ${isPaid ? 'text-green-600' : 'text-gray-600'}`}>{formatRupiah(payroll ? totalGaji : staff.baseSalary)}</span></div>
                                        </div>
                                        <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight className="w-5 h-5 text-gray-400"/></div>
                                    </div>
                                  );
                              }

                              return (
                                <div 
                                    key={staff.id} 
                                    onClick={() => handleOpenPayroll(staff)}
                                    className={`p-3 md:p-4 border-b cursor-pointer transition-colors hover:bg-gray-50 group relative ${activePayroll?.staffId === staff.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent border-gray-100'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-gray-800 text-sm truncate w-2/3" title={staff.name}>{staff.name}</span>
                                        {isPaid ? (
                                            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0"><CheckCircle className="w-3 h-3"/> PAID</span>
                                        ) : (
                                            payroll ? <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">DRAFT</span> : <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">Belum Input</span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-600 mb-1 truncate">
                                        {staff.role}
                                    </div>
                                    <div className="flex justify-between items-end mt-2">
                                        <span className="text-xs text-gray-500 truncate">Total: {formatRupiah(payroll ? totalGaji : staff.baseSalary)}</span>
                                        <div className="text-xs font-semibold text-blue-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                                            Detail <ArrowRight className="w-3 h-3"/>
                                        </div>
                                    </div>
                                </div>
                              );
                          })}
                      </div>
                  )}
              </div>
          </div>

          {/* --- RIGHT PANEL: DETAIL GAJI (seperti FinancePage) --- */}
          <div className={`
              flex-1 flex-col bg-gray-50 h-full overflow-hidden relative border-l border-gray-200
              ${showMobileDetail ? 'flex' : (isGridView ? 'hidden' : 'hidden md:flex')}
              w-full md:w-auto
          `}>
              {activePayroll ? (
                  <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                    
                    {/* DETAIL HEADER */}
                    {(showMobileDetail || isGridView) && (
                        <div className="bg-white p-4 border-b border-gray-200 shadow-sm">
                            <div className="flex items-center gap-3 md:gap-4 flex-wrap">
                                <button 
                                    onClick={handleBackToList} 
                                    className="text-gray-600 hover:text-black bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition-colors flex-shrink-0"
                                    title="Kembali ke List"
                                >
                                    <ArrowLeft className="w-5 h-5"/>
                                </button>
                                <h2 className="font-bold text-lg md:text-xl text-gray-800">{activePayroll.staffName}</h2>
                                <p className="text-sm text-gray-600 hidden md:block">({MOCK_STAFF.find(s => s.id === activePayroll.staffId)?.role})</p>
                                {activePayroll.status === 'PAID' ? (
                                    <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 ml-auto"><CheckCircle className="w-4 h-4"/> PAID</span>
                                ) : (
                                    <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full ml-auto">DRAFT</span>
                                )}
                                {activePayroll.paymentDate && (
                                    <p className="text-xs text-gray-500">Dibayar: {activePayroll.paymentDate}</p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                {/* Card Header Content */}
                                {!isGridView && !showMobileDetail && (
                                    <div className={`p-4 md:p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-3 ${activePayroll.status === 'PAID' ? 'bg-gray-50' : 'bg-green-50'}`}>
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-xl md:text-2xl font-bold text-gray-800 break-words">{activePayroll.staffName}</h2>
                                            <p className="text-sm text-gray-600">({MOCK_STAFF.find(s => s.id === activePayroll.staffId)?.role})</p>
                                            {activePayroll.paymentDate && (
                                                <p className="text-xs text-gray-500">Dibayar: {activePayroll.paymentDate}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {activePayroll.status === 'PAID' ? (
                                                <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"><CheckCircle className="w-4 h-4"/> PAID</span>
                                            ) : (
                                                <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full">DRAFT</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col lg:flex-row">
                                    
                                    {/* KIRI: GAJI (Read Only dengan tombol edit pensil) */}
                                    <div className="w-full lg:w-1/3 bg-gray-50 border-b lg:border-b-0 lg:border-r border-gray-200 p-4 md:p-6">
                                        <div className="mb-4">
                                            <h3 className="font-bold text-gray-800 border-b pb-2 text-sm md:text-base">Gaji ({monthNames[activePayroll.month]} {activePayroll.year})</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Gaji Pokok</label>
                                                {isEditingSalary && (activePayroll.status === 'DRAFT' || activePayroll.status === 'PAID') ? (
                                                    <div className="relative">
                                                        <input 
                                                            type="text" 
                                                            value={formatNumberDisplay(activePayroll.basicSalary)} 
                                                            onChange={(e) => setActivePayroll({...activePayroll, basicSalary: parseNumberInput(e.target.value)})} 
                                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-12 text-sm md:text-base text-right font-bold text-gray-800 focus:border-green-500 outline-none bg-white"
                                                            autoFocus
                                                        />
                                                        <button 
                                                            onClick={() => {
                                                                if (activePayroll.status === 'PAID') {
                                                                    handleSavePaid();
                                                                } else {
                                                                    setIsEditingSalary(false);
                                                                }
                                                            }}
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex-shrink-0"
                                                            title="Simpan"
                                                        >
                                                            <Save className="w-4 h-4"/>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="relative">
                                                        <div className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm md:text-base text-right font-bold text-gray-800 bg-white break-all">
                                                            {formatRupiah(activePayroll.basicSalary)}
                                                        </div>
                                                        {!isEditingSalary && (activePayroll.status === 'DRAFT' || activePayroll.status === 'PAID') && (
                                                            <button 
                                                                onClick={() => setIsEditingSalary(true)}
                                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                                                                title="Edit Gaji"
                                                            >
                                                                <Edit2 className="w-4 h-4 text-gray-600"/>
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Tunjangan Tetap dihilangkan */}
                                            
                                            <div className="pt-4 border-t border-gray-200 space-y-2">
                                                <div className="text-xs md:text-sm">
                                                    <span className="text-gray-600 block">Total Bonus/Lembur</span>
                                                    <span className="font-bold text-blue-600 block mt-1">({formatRupiah(calculateTotalOvertime(activePayroll))})</span>
                                                </div>
                                                {/* Tab Kasbon di-comment dulu */}
                                                {/* <div className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-600">Potongan Kasbon (-)</span>
                                                    <span className="font-bold text-red-600">({formatRupiah(calculateTotalDeduction(activePayroll))})</span>
                                                </div> */}
                                                <div className="bg-green-100 p-3 md:p-4 rounded-xl text-center mt-4 border border-green-200 shadow-sm">
                                                    <span className="text-xs font-bold text-green-700 uppercase block">Total Gaji Diterima</span>
                                                    <div className="text-lg md:text-2xl font-extrabold text-green-800 mt-1 break-all">{formatRupiah(calculateTotal(activePayroll))}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* KANAN: TAB TAMBAH BONUS/LEMBUR HARIAN */}
                                    <div className="flex-1 bg-white flex flex-col overflow-hidden">
                                        
                                        {/* TAB HEADER - Hanya satu tab */}
                                        <div className="border-b border-gray-200 bg-orange-50">
                                            <div className="py-3 md:py-4 px-4 md:px-6 text-xs md:text-sm font-bold flex items-center justify-between gap-2 border-b-2 border-orange-500 text-orange-600">
                                                <div className="flex items-center gap-2 flex-1 justify-center">
                                                    <Clock className="w-4 h-4 flex-shrink-0"/> <span className="truncate">Tambah Bonus/Lembur Harian</span>
                                                </div>
                                                {activePayroll.status === 'PAID' && !isEditingBonus && (
                                                    <button 
                                                        onClick={() => setIsEditingBonus(true)}
                                                        className="p-1.5 hover:bg-orange-100 rounded-lg transition-colors flex-shrink-0"
                                                        title="Edit Bonus"
                                                    >
                                                        <Edit2 className="w-4 h-4 text-orange-600"/>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Tab Kasbon di-comment dulu */}
                                        {/* <div className="flex border-b border-gray-200">
                                            <button onClick={() => setActiveTab('KASBON')} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'KASBON' ? 'border-red-500 text-red-600 bg-red-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
                                                <Wallet className="w-4 h-4"/> KASBON
                                            </button>
                                        </div> */}

                                        <div className="flex-1 overflow-y-auto p-4 md:p-6 min-w-0">
                                            
                                            {/* --- KONTEN TAB BONUS/LEMBUR HARIAN --- */}
                                            {activeTab === 'BONUS_LEMBUR' && (
                                                <div className="space-y-4 md:space-y-6">
                                                    {/* Form Lembur (Show if DRAFT or PAID with isEditingBonus) */}
                                                    {(activePayroll.status === 'DRAFT' || (activePayroll.status === 'PAID' && isEditingBonus)) && (
                                                        <div className="bg-orange-50 p-3 md:p-4 rounded-xl border border-orange-100">
                                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                                <div className="w-full">
                                                                    <label className="block text-[10px] md:text-xs font-bold text-orange-700 mb-1">Tanggal</label>
                                                                    <input 
                                                                        type="date" 
                                                                        value={inputDate} 
                                                                        readOnly
                                                                        disabled
                                                                        className="w-full border border-orange-200 rounded px-2 py-2 text-xs md:text-sm focus:outline-none bg-gray-100 cursor-not-allowed [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden"
                                                                        style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                                                                    />
                                                                </div>
                                                                <div className="w-full">
                                                                    <label className="block text-[10px] md:text-xs font-bold text-orange-700 mb-1">Metode Pembayaran</label>
                                                                    <select
                                                                        value={inputPaymentMethod}
                                                                        onChange={(e) => setInputPaymentMethod(e.target.value)}
                                                                        className="w-full border border-orange-200 rounded px-2 py-2 text-xs md:text-sm focus:outline-none focus:border-orange-500 bg-white"
                                                                    >
                                                                        <option value="">Pilih Metode</option>
                                                                        {paymentMethods.map(method => (
                                                                            <option key={method.id} value={String(method.id)}>
                                                                                {method.name} ({method.type})
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                <div className="w-full">
                                                                    <label className="block text-[10px] md:text-xs font-bold text-orange-700 mb-1">Keterangan</label>
                                                                    <input 
                                                                        type="text" 
                                                                        placeholder="Lembur..." 
                                                                        value={inputNote} 
                                                                        onChange={(e) => setInputNote(e.target.value)} 
                                                                        className="w-full border border-orange-200 rounded px-2 py-2 text-xs md:text-sm focus:outline-none bg-white"
                                                                    />
                                                                </div>
                                                                <div className="w-full">
                                                                    <label className="block text-[10px] md:text-xs font-bold text-orange-700 mb-1">Nominal (Rp)</label>
                                                                    <input 
                                                                        type="text" 
                                                                        placeholder="0" 
                                                                        value={formatNumberDisplay(inputAmount)} 
                                                                        onChange={(e) => setInputAmount(String(parseNumberInput(e.target.value)))} 
                                                                        className="w-full border border-orange-200 rounded px-2 py-2 text-xs md:text-sm font-bold text-right focus:outline-none bg-white"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex justify-end">
                                                                <button 
                                                                    onClick={() => handleAddItem('LEMBUR')} 
                                                                    className="bg-orange-500 hover:bg-orange-600 text-white p-2 md:p-2.5 rounded-lg shadow transition-transform active:scale-95 flex-shrink-0"
                                                                >
                                                                    <Plus className="w-5 h-5"/>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Tabel Lembur (FIXED RESPONSIVE) */}
                                                    <div className="border border-gray-200 rounded-lg overflow-x-auto">
                                                        <table className="w-full text-xs md:text-sm text-left border-collapse" style={{ minWidth: '600px', borderSpacing: 0 }}>
                                                            <thead className="bg-gray-100 font-bold text-gray-600">
                                                                <tr>
                                                                    <th className="pl-3 md:pl-4 pr-0 py-2 whitespace-nowrap">Tanggal</th>
                                                                    <th className="pl-0 pr-3 md:pr-4 py-2 whitespace-nowrap">Keterangan</th>
                                                                    <th className="px-3 md:px-4 py-2 text-right whitespace-nowrap">Nominal</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-100">
                                                                {activePayroll.overtimeRecords.length === 0 ? (
                                                                    <tr>
                                                                        <td colSpan={3} className="text-center py-6 text-gray-400 italic text-xs md:text-sm">Belum ada data lembur.</td>
                                                                    </tr>
                                                                ) : (
                                                                    [...activePayroll.overtimeRecords]
                                                                        .sort((a, b) => {
                                                                            // Sort dari yang paling baru ke paling lama (descending by date)
                                                                            const dateA = new Date(a.date).getTime();
                                                                            const dateB = new Date(b.date).getTime();
                                                                            return dateB - dateA;
                                                                        })
                                                                        .map(rec => (
                                                                            <tr key={rec.id} className="hover:bg-gray-50">
                                                                                <td className="pl-3 md:pl-4 pr-0 py-2 text-gray-600 whitespace-nowrap">{rec.date}</td>
                                                                                <td className="pl-0 pr-3 md:pr-4 py-2 text-gray-800 font-medium whitespace-normal break-words">{rec.note}</td>
                                                                                <td className="px-3 md:px-4 py-2 text-right font-bold text-orange-600 whitespace-nowrap">{formatRupiah(rec.amount)}</td>
                                                                            </tr>
                                                                        ))
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Action */}
                        {activePayroll.status !== 'PAID' && (
                            <div className="bg-white border-t border-gray-200 p-3 md:p-4 shadow-lg flex flex-wrap justify-end gap-2 md:gap-3 flex-shrink-0">
                                <button 
                                    onClick={handleBackToList} 
                                    className="px-4 md:px-6 py-2 md:py-2.5 rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition-colors text-sm md:text-base"
                                >
                                    Batal
                                </button>
                                
                                <button 
                                    onClick={handleSaveDraft} 
                                    className="px-4 md:px-6 py-2 md:py-2.5 rounded-lg border border-blue-500 text-blue-600 font-bold hover:bg-blue-50 transition-colors text-sm md:text-base"
                                >
                                    Simpan Draft
                                </button>
                                <button 
                                    onClick={handlePay} 
                                    className="px-6 md:px-8 py-2 md:py-2.5 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 shadow-lg transition-colors flex items-center gap-2 text-sm md:text-base"
                                >
                                    <DollarSign className="w-4 h-4 md:w-5 md:h-5"/> <span className="hidden sm:inline">BAYAR GAJI</span><span className="sm:hidden">BAYAR</span>
                                </button>
                            </div>
                        )}
                        
                        {/* Footer Action untuk PAID yang sedang edit bonus */}
                        {activePayroll.status === 'PAID' && isEditingBonus && (
                            <div className="bg-white border-t border-gray-200 p-3 md:p-4 shadow-lg flex flex-wrap justify-end gap-2 md:gap-3 flex-shrink-0">
                                <button 
                                    onClick={() => {
                                        setIsEditingBonus(false);
                                        resetInputForm();
                                    }}
                                    className="px-4 md:px-6 py-2 md:py-2.5 rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition-colors text-sm md:text-base"
                                >
                                    Batal
                                </button>
                                
                                <button 
                                    onClick={handleSaveBonusPaid} 
                                    className="px-6 md:px-8 py-2 md:py-2.5 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 shadow-lg transition-colors flex items-center gap-2 text-sm md:text-base"
                                >
                                    <Save className="w-4 h-4 md:w-5 md:h-5"/> <span className="hidden sm:inline">SIMPAN</span><span className="sm:hidden">SAVE</span>
                                </button>
                            </div>
                        )}
                    </div>
                  </div>
              ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                      <User className="w-16 h-16 md:w-20 md:h-20 mb-4 opacity-20"/>
                      <p className="text-lg md:text-xl font-medium">Pilih Staff</p>
                      <p className="text-sm md:text-base">untuk melihat detail penggajian.</p>
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
          activePayroll?.status === 'PAID' && isEditingBonus
            ? "Simpan Bonus/Lembur" 
            : activePayroll?.status === 'PAID'
            ? "Konfirmasi"
            : activePayroll?.status === 'DRAFT' 
            ? "Simpan Draft" 
            : "Bayar Gaji"
        }
        message={
          activePayroll?.status === 'PAID' && isEditingBonus
            ? "Apakah Anda yakin ingin menyimpan bonus/lembur yang ditambahkan?\n\nPastikan semua bonus/lembur sudah memiliki keterangan dan nominal yang valid." 
            : activePayroll?.status === 'PAID'
            ? "Pastikan semua bonus/lembur sudah memiliki keterangan dan nominal yang valid."
            : activePayroll?.status === 'DRAFT'
            ? "Apakah Anda yakin ingin menyimpan sebagai DRAFT?"
            : "Tandai sebagai SUDAH DIBAYAR (PAID)?"
        }
        confirmText={
          activePayroll?.status === 'PAID' && isEditingBonus
            ? "Ya, Simpan" 
            : activePayroll?.status === 'PAID'
            ? "OK"
            : activePayroll?.status === 'DRAFT' 
            ? "Ya, Simpan Draft" 
            : "Ya, Bayar"
        }
        cancelText="Batal"
        type={activePayroll?.status === 'PAID' && isEditingBonus ? 'info' : activePayroll?.status === 'PAID' ? 'warning' : 'warning'}
      />

      {/* Loading Overlay */}
      <LoadingOverlay 
        show={isLoading} 
        message={activePayroll?.status === 'PAID' ? "Menyimpan bonus/lembur..." : activePayroll?.status === 'DRAFT' ? "Menyimpan draft..." : "Memproses pembayaran..."}
      />
      
      {/* Payment Method Modal untuk Bayar Gaji */}
      {showPaymentMethodModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center animate-in fade-in zoom-in duration-200">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 mx-4">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-gray-800">Pilih Metode Pembayaran</h3>
                      <button 
                          onClick={() => {
                              setShowPaymentMethodModal(false);
                              setPayrollPaymentMethod("");
                          }}
                          className="text-gray-400 hover:text-red-500"
                      >
                          <XCircle className="w-6 h-6"/>
                      </button>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Metode Pembayaran</label>
                          <select
                              value={payrollPaymentMethod}
                              onChange={(e) => setPayrollPaymentMethod(e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-green-500 bg-white"
                              autoFocus
                          >
                              <option value="">Pilih Metode Pembayaran</option>
                              {paymentMethods.map(method => (
                                  <option key={method.id} value={String(method.id)}>
                                      {method.name} ({method.type})
                                  </option>
                              ))}
                          </select>
                      </div>
                  </div>
                  
                  <div className="flex gap-3">
                      <button 
                          onClick={() => {
                              setShowPaymentMethodModal(false);
                              setPayrollPaymentMethod("");
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-100 transition-colors"
                      >
                          Batal
                      </button>
                      <button 
                          onClick={handleConfirmPay}
                          disabled={!payrollPaymentMethod}
                          className="flex-1 px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                          Lanjutkan
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default PenggajianPage;