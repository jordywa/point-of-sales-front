// src/pages/PrinterSettingPage.tsx

import React, { useState } from 'react';
import { Menu, Printer, Link, Link2Off, X, CheckCircle, AlertCircle, Plus, Trash2, Settings } from 'lucide-react';

interface PrinterSettingPageProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
  onExit?: () => void; 
}

// --- TIPE DATA ---
interface PrinterDevice {
  id: number;
  name: string;
  assignedTemplateId: string; // ID Template yang dipilih
  status: 'CONNECTED' | 'DISCONNECTED';
}

// MOCK DATA TEMPLATE
const ALL_TEMPLATES = [
    { id: 'NONE', name: '-- Pilih Template --', category: 'NONE' },
    // Template Struk
    { id: 'TPL-STRUK-1', name: 'Struk Standard (58mm)', category: 'STRUK (THERMAL)' },
    { id: 'TPL-STRUK-2', name: 'Struk Promo Lebaran (80mm)', category: 'STRUK (THERMAL)' },
    // Template Faktur
    { id: 'TPL-FAKTUR-1', name: 'Faktur Gudang (Matrix)', category: 'FAKTUR (MATRIX)' },
    { id: 'TPL-FAKTUR-2', name: 'Surat Jalan (Tanpa Harga)', category: 'FAKTUR (MATRIX)' },
    // Template Laporan
    { id: 'TPL-LAPORAN-1', name: 'Laporan Harian (A4)', category: 'LAPORAN (INKJET)' },
];

const MOCK_PRINTERS: PrinterDevice[] = [
    { id: 1, name: "EPSON TM-U220 (Kasir)", assignedTemplateId: 'TPL-STRUK-1', status: 'CONNECTED' },
];

const PrinterSettingPage: React.FC<PrinterSettingPageProps> = ({ setIsSidebarOpen, onExit }) => {
  const [printers, setPrinters] = useState<PrinterDevice[]>(MOCK_PRINTERS);

  // --- LOGIC ---
  const handleToggleConnect = (id: number) => {
    setPrinters(prev => prev.map(p => {
        if (p.id === id) {
            const newStatus = p.status === 'CONNECTED' ? 'DISCONNECTED' : 'CONNECTED';
            return { ...p, status: newStatus };
        }
        return p;
    }));
  };

  const handleChangeTemplate = (id: number, newTemplateId: string) => {
      setPrinters(prev => prev.map(p => 
          p.id === id ? { ...p, assignedTemplateId: newTemplateId } : p
      ));
  };

  const handleDeletePrinter = (id: number) => {
      if (window.confirm("Hapus printer ini dari daftar?")) {
          setPrinters(prev => prev.filter(p => p.id !== id));
      }
  };

  const handleAddNew = () => {
      const newPrinter: PrinterDevice = {
          id: Date.now(),
          name: "New Printer Device...",
          assignedTemplateId: 'NONE',
          status: 'DISCONNECTED'
      };
      setPrinters([...printers, newPrinter]);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 font-sans overflow-hidden">
      
      {/* HEADER PAGE */}
      <div className="h-16 bg-white flex items-center justify-between px-4 lg:px-6 border-b border-gray-200 shadow-sm flex-shrink-0 z-20">
         <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="hover:bg-gray-200 p-1 rounded">
                 <Menu className="w-6 h-6"/>
             </button>
             <h1 className="text-lg lg:text-xl font-bold text-black uppercase truncate">Pengaturan Printer</h1>
         </div>
         
         <button 
            onClick={() => {
                if (onExit) onExit();
                else alert("Tombol ini akan kembali ke halaman sebelumnya");
            }}
            className="p-2 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-full transition-colors"
            title="Keluar"
         >
             <X className="w-6 h-6 lg:w-8 lg:h-8"/>
         </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-8 w-full">
          <div className="max-w-6xl mx-auto">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <div>
                      <h2 className="text-lg font-bold text-gray-800">Daftar Perangkat</h2>
                      <p className="text-sm text-gray-500">Atur koneksi printer dan template cetak.</p>
                  </div>
                  <button onClick={handleAddNew} className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium">
                      <Plus className="w-5 h-5"/> Tambah Manual
                  </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  
                  {/* HEADER TABEL (HANYA MUNCUL DI DESKTOP) */}
                  <div className="hidden md:grid grid-cols-12 bg-gray-100 border-b border-gray-200 py-3 px-6 font-bold text-gray-600 text-sm uppercase tracking-wider">
                      <div className="col-span-5">Nama Printer</div>
                      <div className="col-span-4">Template Digunakan</div>
                      <div className="col-span-1 text-center">Status</div>
                      <div className="col-span-2 text-center">Aksi</div>
                  </div>

                  {/* LIST ITEM */}
                  {printers.length === 0 ? (
                      <div className="p-12 text-center flex flex-col items-center justify-center text-gray-400">
                          <Printer className="w-16 h-16 mb-4 opacity-20"/>
                          <p className="text-lg">Belum ada printer yang terdaftar.</p>
                          <button onClick={handleAddNew} className="mt-4 text-blue-600 font-bold hover:underline">Tambah Printer Sekarang</button>
                      </div>
                  ) : (
                      printers.map((printer) => (
                          <div key={printer.id} className="border-b border-gray-100 last:border-0 hover:bg-blue-50/30 transition-colors">
                              
                              {/* LAYOUT DESKTOP (GRID) */}
                              <div className="hidden md:grid grid-cols-12 py-4 px-6 items-center gap-4">
                                  {/* Kolom 1: Nama */}
                                  <div className="col-span-5 flex items-center gap-3">
                                      <button onClick={() => handleDeletePrinter(printer.id)} className="p-2 bg-red-50 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors"><Trash2 className="w-4 h-4"/></button>
                                      <div className="w-[1px] h-8 bg-gray-300 mx-1"></div>
                                      <div className="p-2 bg-gray-100 rounded-full text-gray-600"><Printer className="w-5 h-5"/></div>
                                      <span className="font-bold text-gray-800 text-base truncate">{printer.name}</span>
                                  </div>

                                  {/* Kolom 2: Template */}
                                  <div className="col-span-4">
                                      <div className="relative">
                                          <select value={printer.assignedTemplateId} onChange={(e) => handleChangeTemplate(printer.id, e.target.value)} className="w-full border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none cursor-pointer font-medium text-gray-700">
                                              {['NONE', 'STRUK (THERMAL)', 'FAKTUR (MATRIX)', 'LAPORAN (INKJET)'].map(category => {
                                                  const templates = ALL_TEMPLATES.filter(t => t.category === category);
                                                  if (templates.length === 0) return null;
                                                  if (category === 'NONE') return <option key="none" value="NONE">-- Tidak Ada Template --</option>;
                                                  return (<optgroup key={category} label={category}>{templates.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}</optgroup>);
                                              })}
                                          </select>
                                          <Settings className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"/>
                                      </div>
                                  </div>

                                  {/* Kolom 3: Status */}
                                  <div className="col-span-1 flex justify-center">
                                      {printer.status === 'CONNECTED' ? (
                                          <div className="flex items-center gap-1.5 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded border border-green-200"><CheckCircle className="w-3.5 h-3.5"/> On</div>
                                      ) : (
                                          <div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold bg-gray-100 px-2 py-1 rounded border border-gray-200"><AlertCircle className="w-3.5 h-3.5"/> Off</div>
                                      )}
                                  </div>

                                  {/* Kolom 4: Tombol */}
                                  <div className="col-span-2 flex justify-center">
                                      <button onClick={() => handleToggleConnect(printer.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm w-32 justify-center ${printer.status === 'CONNECTED' ? 'bg-white text-red-600 border border-red-200 hover:bg-red-50' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                                          {printer.status === 'CONNECTED' ? (<>Putuskan <Link2Off className="w-4 h-4"/></>) : (<>Sambung <Link className="w-4 h-4"/></>)}
                                      </button>
                                  </div>
                              </div>

                              {/* LAYOUT MOBILE (CARD STACK) */}
                              <div className="md:hidden p-4 flex flex-col gap-4">
                                  {/* Header Card */}
                                  <div className="flex justify-between items-start">
                                      <div className="flex items-center gap-3">
                                          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg"><Printer className="w-6 h-6"/></div>
                                          <div>
                                              <h3 className="font-bold text-gray-800 text-lg">{printer.name}</h3>
                                              <div className="flex items-center gap-2 mt-1">
                                                  {printer.status === 'CONNECTED' ? (
                                                      <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Terhubung</span>
                                                  ) : (
                                                      <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Terputus</span>
                                                  )}
                                              </div>
                                          </div>
                                      </div>
                                      <button onClick={() => handleDeletePrinter(printer.id)} className="p-2 text-red-400 bg-red-50 rounded-lg"><Trash2 className="w-5 h-5"/></button>
                                  </div>

                                  {/* Template Select */}
                                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                      <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">Template Cetak</label>
                                      <div className="relative">
                                          <select value={printer.assignedTemplateId} onChange={(e) => handleChangeTemplate(printer.id, e.target.value)} className="w-full border border-gray-300 rounded-md pl-3 pr-8 py-2 text-sm bg-white font-bold text-gray-700 focus:outline-none focus:border-blue-500">
                                              {['NONE', 'STRUK (THERMAL)', 'FAKTUR (MATRIX)', 'LAPORAN (INKJET)'].map(category => {
                                                  const templates = ALL_TEMPLATES.filter(t => t.category === category);
                                                  if (templates.length === 0) return null;
                                                  if (category === 'NONE') return <option key="none" value="NONE">-- Tidak Ada Template --</option>;
                                                  return (<optgroup key={category} label={category}>{templates.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}</optgroup>);
                                              })}
                                          </select>
                                          <Settings className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"/>
                                      </div>
                                  </div>

                                  {/* Action Button */}
                                  <button onClick={() => handleToggleConnect(printer.id)} className={`w-full py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-sm ${printer.status === 'CONNECTED' ? 'bg-white text-red-600 border border-red-200' : 'bg-blue-600 text-white'}`}>
                                      {printer.status === 'CONNECTED' ? (<>Putuskan Koneksi <Link2Off className="w-4 h-4"/></>) : (<>Sambungkan Printer <Link className="w-4 h-4"/></>)}
                                  </button>
                              </div>

                          </div>
                      ))
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default PrinterSettingPage;