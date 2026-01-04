// src/pages/PenggajianPage.tsx

import React, { useState } from 'react';
import { Menu, Calendar, User, Plus, Save, Clock, Trash2, DollarSign, ChevronRight, X, Calculator, Wallet, Banknote, AlertCircle, CheckCircle } from 'lucide-react';

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
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  const [payrolls, setPayrolls] = useState<PayrollData[]>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePayroll, setActivePayroll] = useState<PayrollData | null>(null);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'LEMBUR' | 'KASBON'>('LEMBUR');

  // Form Input Kecil
  const [inputDate, setInputDate] = useState(new Date().toISOString().split('T')[0]);
  const [inputAmount, setInputAmount] = useState(""); 
  const [inputNote, setInputNote] = useState("");

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
      setIsModalOpen(true);
      setActiveTab('LEMBUR');
      resetInputForm();
  };

  const resetInputForm = () => {
      setInputDate(new Date().toISOString().split('T')[0]);
      setInputAmount("");
      setInputNote("");
  };

  // --- ADD ITEM LOGIC ---
  const handleAddItem = (type: 'LEMBUR' | 'DEBT' | 'DEDUCTION') => {
      const amountVal = parseNumberInput(inputAmount);
      if (!activePayroll || amountVal <= 0) return alert("Masukkan Nominal yang valid!");
      
      if (type === 'LEMBUR') {
          const newItem: OvertimeRecord = {
              id: Date.now(),
              date: inputDate,
              amount: amountVal,
              note: inputNote || "Lembur Harian"
          };
          setActivePayroll({
              ...activePayroll,
              overtimeRecords: [...activePayroll.overtimeRecords, newItem]
          });
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
      if (activePayroll.status === 'PAID') return alert("Data sudah PAID, tidak bisa dihapus."); // Proteksi

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
      const updatedPayroll: PayrollData = { ...activePayroll, status: 'DRAFT' };
      
      saveToState(updatedPayroll);
      setIsModalOpen(false);
      alert("Data berhasil disimpan sebagai DRAFT.");
  };

  // --- BAYAR GAJI (PAID) ---
  const handlePay = () => {
      if (!activePayroll) return;
      if (!confirm("Tandai sebagai SUDAH DIBAYAR (PAID)?\nData tidak dapat diubah setelah ini.")) return;

      const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
      
      const updatedPayroll: PayrollData = { 
          ...activePayroll, 
          status: 'PAID',
          paymentDate: todayStr
      };

      saveToState(updatedPayroll);
      setIsModalOpen(false);
      alert(`Gaji berhasil dibayarkan pada tanggal ${todayStr}`);
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
      return (p.basicSalary + p.allowance + totalOvertime) - totalDeduction;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 font-sans overflow-hidden">
      
      {/* HEADER */}
      <div className="h-16 bg-white flex items-center justify-between px-6 border-b border-gray-200 shadow-sm flex-shrink-0 z-20">
         <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="hover:bg-gray-200 p-1 rounded"><Menu className="w-6 h-6"/></button>
             <h1 className="text-xl font-bold text-black uppercase flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-green-600"/> PENGGAJIAN (PAYROLL)
             </h1>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
              
              {/* FILTER PERIODE */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-lg"><Calendar className="w-6 h-6 text-green-600"/></div>
                      <div><h2 className="text-lg font-bold text-gray-800">Periode Gaji</h2><p className="text-xs text-gray-500">Pilih bulan penggajian</p></div>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                      <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="border border-gray-300 rounded-lg px-4 py-2 font-medium bg-gray-50 cursor-pointer flex-1">
                          {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
                      </select>
                      <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="border border-gray-300 rounded-lg px-4 py-2 font-medium bg-gray-50 cursor-pointer w-28">
                          {[currentYear, currentYear-1].map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                  </div>
              </div>

              {/* LIST STAFF */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {MOCK_STAFF.map(staff => {
                      const payroll = getPayrollForStaff(staff.id);
                      const totalGaji = payroll ? calculateTotal(payroll) : 0;
                      const isPaid = payroll?.status === 'PAID';

                      return (
                          <div key={staff.id} onClick={() => handleOpenPayroll(staff)} className={`bg-white border rounded-xl p-5 shadow-sm cursor-pointer transition-all hover:shadow-md group relative overflow-hidden ${isPaid ? 'border-green-500 ring-1 ring-green-200' : 'border-gray-200'}`}>
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
                  })}
              </div>
          </div>
      </div>

      {/* --- MODAL INPUT GAJI --- */}
      {isModalOpen && activePayroll && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
                  
                  {/* Modal Header */}
                  <div className={`p-6 flex justify-between items-center text-white flex-shrink-0 ${activePayroll.status === 'PAID' ? 'bg-gray-700' : 'bg-green-600'}`}>
                      <div>
                          <h2 className="text-2xl font-bold flex items-center gap-2"><Calculator className="w-6 h-6"/> {activePayroll.status === 'PAID' ? 'Rincian Gaji (PAID)' : 'Input Penggajian'}</h2>
                          <p className="text-white/80 text-sm mt-1">{activePayroll.staffName} • {monthNames[activePayroll.month]} {activePayroll.year}</p>
                      </div>
                      <button onClick={() => setIsModalOpen(false)} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors"><X className="w-6 h-6"/></button>
                  </div>

                  <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                      
                      {/* KIRI: SUMMARY & GAJI POKOK */}
                      <div className="w-full md:w-1/3 bg-gray-50 border-r border-gray-200 p-6 overflow-y-auto">
                          <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Komponen Tetap</h3>
                          <div className="space-y-4">
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Gaji Pokok</label>
                                  <input 
                                    type="text" 
                                    value={formatNumberDisplay(activePayroll.basicSalary)} 
                                    onChange={(e) => setActivePayroll({...activePayroll, basicSalary: parseNumberInput(e.target.value)})} 
                                    disabled={activePayroll.status === 'PAID'}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-right font-bold text-gray-800 focus:border-green-500 outline-none disabled:bg-gray-100"
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Tunjangan Tetap</label>
                                  <input 
                                    type="text" 
                                    value={formatNumberDisplay(activePayroll.allowance)} 
                                    onChange={(e) => setActivePayroll({...activePayroll, allowance: parseNumberInput(e.target.value)})} 
                                    disabled={activePayroll.status === 'PAID'}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-right font-medium text-gray-800 focus:border-green-500 outline-none disabled:bg-gray-100"
                                  />
                              </div>
                              
                              <div className="pt-4 border-t border-gray-200 space-y-2">
                                  <div className="flex justify-between items-center text-sm">
                                      <span className="text-gray-600">Total Lembur (+)</span>
                                      <span className="font-bold text-blue-600">{formatRupiah(calculateTotalOvertime(activePayroll))}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-sm">
                                      <span className="text-gray-600">Potongan Kasbon (-)</span>
                                      <span className="font-bold text-red-600">({formatRupiah(calculateTotalDeduction(activePayroll))})</span>
                                  </div>
                                  <div className="bg-green-100 p-4 rounded-xl text-center mt-4 border border-green-200 shadow-sm">
                                      <span className="text-xs font-bold text-green-700 uppercase">Total Gaji Diterima</span>
                                      <div className="text-2xl font-extrabold text-green-800 mt-1">{formatRupiah(calculateTotal(activePayroll))}</div>
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* KANAN: TABBING (LEMBUR & KASBON) */}
                      <div className="flex-1 bg-white flex flex-col overflow-hidden">
                          
                          {/* TAB HEADER */}
                          <div className="flex border-b border-gray-200">
                              <button onClick={() => setActiveTab('LEMBUR')} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'LEMBUR' ? 'border-orange-500 text-orange-600 bg-orange-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
                                  <Clock className="w-4 h-4"/> LEMBUR
                              </button>
                              <button onClick={() => setActiveTab('KASBON')} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'KASBON' ? 'border-red-500 text-red-600 bg-red-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
                                  <Wallet className="w-4 h-4"/> KASBON
                              </button>
                          </div>

                          <div className="flex-1 overflow-y-auto p-6">
                              
                              {/* --- KONTEN TAB LEMBUR --- */}
                              {activeTab === 'LEMBUR' && (
                                  <div className="space-y-6">
                                      {/* Form Lembur (Hide if PAID) */}
                                      {activePayroll.status === 'DRAFT' && (
                                          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex flex-col md:flex-row gap-3 items-end">
                                              <div className="flex-1 w-full"><label className="block text-[10px] font-bold text-orange-700 mb-1">Tanggal</label><input type="date" value={inputDate} onChange={(e) => setInputDate(e.target.value)} className="w-full border border-orange-200 rounded px-2 py-2 text-sm focus:outline-none"/></div>
                                              <div className="flex-1 w-full"><label className="block text-[10px] font-bold text-orange-700 mb-1">Keterangan</label><input type="text" placeholder="Lembur..." value={inputNote} onChange={(e) => setInputNote(e.target.value)} className="w-full border border-orange-200 rounded px-2 py-2 text-sm focus:outline-none"/></div>
                                              <div className="flex-1 w-full"><label className="block text-[10px] font-bold text-orange-700 mb-1">Nominal (Rp)</label><input type="text" placeholder="0" value={formatNumberDisplay(inputAmount)} onChange={(e) => setInputAmount(String(parseNumberInput(e.target.value)))} className="w-full border border-orange-200 rounded px-2 py-2 text-sm font-bold text-right focus:outline-none"/></div>
                                              <button onClick={() => handleAddItem('LEMBUR')} className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-lg shadow transition-transform active:scale-95"><Plus className="w-5 h-5"/></button>
                                          </div>
                                      )}

                                      {/* Tabel Lembur (FIXED RESPONSIVE) */}
                                      <div className="border border-gray-200 rounded-lg overflow-x-auto">
                                          <table className="w-full text-sm text-left min-w-[500px]">
                                              <thead className="bg-gray-100 font-bold text-gray-600">
                                                  <tr><th className="px-4 py-2">Tanggal</th><th className="px-4 py-2">Keterangan</th><th className="px-4 py-2 text-right">Nominal</th><th className="px-4 py-2 text-center">Aksi</th></tr>
                                              </thead>
                                              <tbody className="divide-y divide-gray-100">
                                                  {activePayroll.overtimeRecords.length === 0 ? (
                                                      <tr><td colSpan={4} className="text-center py-6 text-gray-400 italic">Belum ada data lembur.</td></tr>
                                                  ) : (
                                                      activePayroll.overtimeRecords.map(rec => (
                                                          <tr key={rec.id} className="hover:bg-gray-50">
                                                              <td className="px-4 py-2 text-gray-600">{rec.date}</td><td className="px-4 py-2 text-gray-800 font-medium">{rec.note}</td><td className="px-4 py-2 text-right font-bold text-orange-600">{formatRupiah(rec.amount)}</td>
                                                              <td className="px-4 py-2 text-center">
                                                                  {activePayroll.status === 'DRAFT' && <button onClick={() => handleDeleteItem(rec.id, 'LEMBUR')} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>}
                                                              </td>
                                                          </tr>
                                                      ))
                                                  )}
                                              </tbody>
                                          </table>
                                      </div>
                                  </div>
                              )}

                              {/* --- KONTEN TAB KASBON (REVISED) --- */}
                              {activeTab === 'KASBON' && (
                                  <div className="space-y-8 animate-in fade-in">
                                      
                                      {/* BAGIAN 1: RINCIAN HUTANG (DEBT RECORDS) */}
                                      <div>
                                          <div className="flex justify-between items-center mb-2">
                                              <h4 className="font-bold text-gray-800 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-red-600"/> Rincian Hutang / Kasbon</h4>
                                              <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">Total Hutang: {formatRupiah(calculateTotalDebt(activePayroll))}</span>
                                          </div>
                                          
                                          {/* Form Tambah Hutang */}
                                          {activePayroll.status === 'DRAFT' && (
                                              <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex flex-col md:flex-row gap-3 items-end mb-3">
                                                  <div className="flex-1 w-full"><label className="block text-[10px] font-bold text-red-700 mb-1">Tanggal Pinjam</label><input type="date" value={inputDate} onChange={(e) => setInputDate(e.target.value)} className="w-full border border-red-200 rounded px-2 py-1.5 text-sm focus:outline-none"/></div>
                                                  <div className="flex-1 w-full"><label className="block text-[10px] font-bold text-red-700 mb-1">Catatan</label><input type="text" placeholder="Pinjaman..." value={inputNote} onChange={(e) => setInputNote(e.target.value)} className="w-full border border-red-200 rounded px-2 py-1.5 text-sm focus:outline-none"/></div>
                                                  <div className="flex-1 w-full"><label className="block text-[10px] font-bold text-red-700 mb-1">Nominal (Rp)</label><input type="text" placeholder="0" value={formatNumberDisplay(inputAmount)} onChange={(e) => setInputAmount(String(parseNumberInput(e.target.value)))} className="w-full border border-red-200 rounded px-2 py-1.5 text-sm font-bold text-right text-red-700 focus:outline-none"/></div>
                                                  <button onClick={() => handleAddItem('DEBT')} className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-lg shadow transition-transform active:scale-95"><Plus className="w-5 h-5"/></button>
                                              </div>
                                          )}

                                          {/* Tabel Hutang (FIXED RESPONSIVE) */}
                                          <div className="border border-gray-200 rounded-lg overflow-x-auto">
                                              <table className="w-full text-xs text-left min-w-[500px]">
                                                  <thead className="bg-gray-100 font-bold text-gray-600"><tr><th className="px-4 py-2">Tanggal</th><th className="px-4 py-2">Keterangan</th><th className="px-4 py-2 text-right">Jumlah Hutang</th><th className="px-4 py-2 text-center">Aksi</th></tr></thead>
                                                  <tbody className="divide-y divide-gray-100">
                                                      {activePayroll.debtRecords.length === 0 ? (
                                                          <tr><td colSpan={4} className="text-center py-4 text-gray-400 italic">Tidak ada catatan hutang.</td></tr>
                                                      ) : (
                                                          activePayroll.debtRecords.map(rec => (
                                                              <tr key={rec.id} className="hover:bg-red-50/30">
                                                                  <td className="px-4 py-2 text-gray-600">{rec.date}</td><td className="px-4 py-2 text-gray-800">{rec.note}</td><td className="px-4 py-2 text-right font-bold text-red-600">{formatRupiah(rec.amount)}</td>
                                                                  <td className="px-4 py-2 text-center">
                                                                      {activePayroll.status === 'DRAFT' && <button onClick={() => handleDeleteItem(rec.id, 'DEBT')} className="text-gray-400 hover:text-red-600"><Trash2 className="w-3 h-3"/></button>}
                                                                  </td>
                                                              </tr>
                                                          ))
                                                      )}
                                                  </tbody>
                                              </table>
                                          </div>
                                      </div>

                                      <hr className="border-gray-200"/>

                                      {/* BAGIAN 2: POTONGAN GAJI (DEDUCTIONS) */}
                                      <div>
                                          <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><Banknote className="w-4 h-4 text-green-600"/> Potongan Gaji Bulan Ini (Bayar Hutang)</h4>
                                          
                                          {/* Form Tambah Potongan */}
                                          {activePayroll.status === 'DRAFT' && (
                                              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex flex-col md:flex-row gap-3 items-end mb-3">
                                                  <div className="flex-1 w-full"><label className="block text-[10px] font-bold text-gray-500 mb-1">Keterangan</label><input type="text" placeholder="Potong Gaji..." value={inputNote} onChange={(e) => setInputNote(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none"/></div>
                                                  <div className="flex-1 w-full"><label className="block text-[10px] font-bold text-gray-500 mb-1">Nominal Potong (Rp)</label><input type="text" placeholder="0" value={formatNumberDisplay(inputAmount)} onChange={(e) => setInputAmount(String(parseNumberInput(e.target.value)))} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-bold text-right focus:outline-none text-green-700"/></div>
                                                  <button onClick={() => handleAddItem('DEDUCTION')} className="bg-green-600 hover:bg-green-700 text-white p-1.5 rounded-lg shadow transition-transform active:scale-95"><Plus className="w-5 h-5"/></button>
                                              </div>
                                          )}

                                          {/* Tabel Potongan (FIXED RESPONSIVE) */}
                                          <div className="border border-gray-200 rounded-lg overflow-x-auto">
                                              <table className="w-full text-xs text-left min-w-[500px]">
                                                  <thead className="bg-gray-100 font-bold text-gray-600"><tr><th className="px-4 py-2">Keterangan</th><th className="px-4 py-2 text-right">Jumlah Potong</th><th className="px-4 py-2 text-center">Aksi</th></tr></thead>
                                                  <tbody className="divide-y divide-gray-100">
                                                      {activePayroll.deductionRecords.length === 0 ? (
                                                          <tr><td colSpan={3} className="text-center py-4 text-gray-400 italic">Tidak ada potongan gaji bulan ini.</td></tr>
                                                      ) : (
                                                          activePayroll.deductionRecords.map(rec => (
                                                              <tr key={rec.id} className="hover:bg-green-50/30">
                                                                  <td className="px-4 py-2 text-gray-800">{rec.note}</td><td className="px-4 py-2 text-right font-bold text-green-600">{formatRupiah(rec.amount)}</td>
                                                                  <td className="px-4 py-2 text-center">
                                                                      {activePayroll.status === 'DRAFT' && <button onClick={() => handleDeleteItem(rec.id, 'DEDUCTION')} className="text-gray-400 hover:text-red-600"><Trash2 className="w-3 h-3"/></button>}
                                                                  </td>
                                                              </tr>
                                                          ))
                                                      )}
                                                  </tbody>
                                                  <tfoot className="bg-gray-50 border-t border-gray-200">
                                                      <tr>
                                                          <td className="px-4 py-2 font-bold text-gray-600 text-right">Sisa Hutang Akhir:</td>
                                                          <td className="px-4 py-2 text-right font-bold text-gray-800">
                                                              {formatRupiah(calculateTotalDebt(activePayroll) - calculateTotalDeduction(activePayroll))}
                                                          </td>
                                                          <td></td>
                                                      </tr>
                                                  </tfoot>
                                              </table>
                                          </div>
                                      </div>

                                  </div>
                              )}
                          </div>
                      </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 flex-shrink-0">
                      <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition-colors">
                          {activePayroll.status === 'PAID' ? 'Tutup' : 'Batal'}
                      </button>
                      
                      {activePayroll.status === 'DRAFT' && (
                          <>
                            <button onClick={handleSaveDraft} className="px-6 py-2.5 rounded-lg border border-blue-500 text-blue-600 font-bold hover:bg-blue-50 transition-colors">
                                Simpan Draft
                            </button>
                            <button onClick={handlePay} className="px-8 py-2.5 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 shadow-lg transition-colors flex items-center gap-2">
                                <DollarSign className="w-5 h-5"/> BAYAR GAJI
                            </button>
                          </>
                      )}
                  </div>

              </div>
          </div>
      )}

    </div>
  );
};

export default PenggajianPage;