// src/pages/TemplateFakturPage.tsx

import React, { useState, useRef, useEffect } from 'react';
import { Menu, Save, Eye, EyeOff, GripVertical, CheckSquare, Square, FileText, Settings, AlignVerticalJustifyCenter, Upload, X as XIcon, ChevronDown, Plus, Trash2, CheckCircle, XCircle, Edit3, Sliders, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import LocoImage from '../../assets/loco.jpeg';

interface TemplateFakturPageProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
}

// --- TIPE DATA ---
type SectionType = 'HEADER' | 'INFO_CUSTOMER' | 'TABLE' | 'TOTALS' | 'SIGNATURE';

interface Section {
  id: string;
  type: SectionType;
  label: string;
  visible: boolean;
  data: any; 
}

interface SavedTemplate {
  id: string;
  name: string;
  isActive: boolean; // Status Aktif
  paperSize: { width: number, height: number };
  margins: { top: number, right: number, bottom: number, left: number };
  sections: Section[];
}

const DEFAULT_SECTIONS: Section[] = [
    { 
      id: 'header', type: 'HEADER', label: 'HEADER', visible: true, 
      data: { companyName: "NAMA TOKO ANDA", outletName: "Cabang Pusat", address: "Jl. Kh Moh Mansyur no 29a, Jakarta Barat", phone: "(021) 89523156", showOutlet: true, showAddress: true, showContact: true, showLogo: true, logoWidth: 40, logoUrl: null, customText: "" } 
    },
    { 
      id: 'info', type: 'INFO_CUSTOMER', label: 'Info Faktur & Customer', visible: true, 
      data: { labelKepada: "Kepada Yth,", showJatuhTempo: true, labelFaktur: "FAKTUR PENJUALAN", showCustName: true, showCustAddress: true, showCustPhone: false } 
    },
    { id: 'table', type: 'TABLE', label: 'Tabel Barang', visible: true, data: {} },
    { 
      id: 'totals', type: 'TOTALS', label: 'Total & Terbilang', visible: true, 
      data: { showTerbilang: true, showNote: true, note: "Pembayaran melalui Transfer / Giro ditujukan ke Rekening:\nBank BCA\nNo. Acc. 8888 7764" } 
    },
    { 
      id: 'signature', type: 'SIGNATURE', label: 'Tanda Tangan', visible: true, 
      data: { count: 3, labels: ["Penerima", "Hormat Kami", "Mengetahui"] } 
    },
];

const TemplateFakturPage: React.FC<TemplateFakturPageProps> = ({ setIsSidebarOpen }) => {
  // --- STATE RESPONSIVE ---
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);

  // --- STATE ZOOM ---
  const [zoomLevel, setZoomLevel] = useState(0.7); // Default zoom level

  // --- STATE TEMPLATE MANAGEMENT ---
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([
      { 
          id: 'tpl-f1', 
          name: 'Faktur Standard', 
          isActive: true, 
          paperSize: { width: 215, height: 140 }, 
          margins: { top: 10, right: 15, bottom: 10, left: 15 },
          sections: JSON.parse(JSON.stringify(DEFAULT_SECTIONS)) 
      },
      { 
          id: 'tpl-f2', 
          name: 'Faktur Polos (No Header)', 
          isActive: false, 
          paperSize: { width: 215, height: 140 }, 
          margins: { top: 10, right: 15, bottom: 10, left: 15 },
          sections: JSON.parse(JSON.stringify(DEFAULT_SECTIONS)) 
      }
  ]);
  const [activeTemplateId, setActiveTemplateId] = useState<string>('tpl-f1');

  // --- STATE CONFIG AKTIF ---
  const [paperSize, setPaperSize] = useState({ width: 215, height: 140 }); 
  const [margins, setMargins] = useState({ top: 10, right: 15, bottom: 10, left: 15 });
  const [sections, setSections] = useState<Section[]>(DEFAULT_SECTIONS);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('header');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper untuk cek status aktif template yg sedang diedit
  const currentEditingTemplate = savedTemplates.find(t => t.id === activeTemplateId);
  const isCurrentActive = currentEditingTemplate?.isActive || false;

  // Load Template Logic
  useEffect(() => {
      const tpl = savedTemplates.find(t => t.id === activeTemplateId);
      if (tpl) {
          setPaperSize(tpl.paperSize);
          setMargins(tpl.margins);
          setSections(JSON.parse(JSON.stringify(tpl.sections)));
      }
  }, [activeTemplateId]);

  // --- ACTIONS ---
  const handleSaveAsNew = () => {
      const name = prompt("Masukkan Nama Template Faktur Baru:", "Faktur Baru");
      if (name) {
          const newId = `tpl-f${Date.now()}`;
          const newTemplate: SavedTemplate = {
              id: newId,
              name: name,
              isActive: false, // Default tidak aktif
              paperSize,
              margins,
              sections: JSON.parse(JSON.stringify(sections))
          };
          setSavedTemplates([...savedTemplates, newTemplate]);
          setActiveTemplateId(newId);
          alert(`Template "${name}" berhasil disimpan!`);
      }
  };

  const handleUpdateCurrent = () => {
      setSavedTemplates(prev => prev.map(t => 
          t.id === activeTemplateId 
          ? { ...t, paperSize, margins, sections: JSON.parse(JSON.stringify(sections)) }
          : t
      ));
      alert("Perubahan disimpan ke template aktif.");
  };

  const handleDeleteTemplate = () => {
      if (savedTemplates.length <= 1) {
          alert("Minimal harus ada 1 template!");
          return;
      }
      if (isCurrentActive) {
          alert("Tidak bisa menghapus template yang sedang AKTIF!");
          return;
      }
      if (confirm("Hapus template ini?")) {
          const newTemplates = savedTemplates.filter(t => t.id !== activeTemplateId);
          setSavedTemplates(newTemplates);
          setActiveTemplateId(newTemplates[0].id);
      }
  };

  // Logic untuk mengaktifkan template (Mutually Exclusive)
  const handleActivateTemplate = () => {
      setSavedTemplates(prev => prev.map(t => ({
          ...t,
          isActive: t.id === activeTemplateId // Hanya yang sedang dipilih jadi true, sisanya false
      })));
  };

  const updateSectionData = (id: string, key: string, value: any) => {
    setSections(prev => prev.map(sec => 
      sec.id === id ? { ...sec, data: { ...sec.data, [key]: value } } : sec
    ));
  };

  const updateSignatureLabel = (index: number, value: string) => {
     const signSection = sections.find(s => s.id === 'signature');
     if (!signSection) return;
     const newLabels = [...signSection.data.labels];
     newLabels[index] = value;
     updateSectionData('signature', 'labels', newLabels);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      updateSectionData('header', 'logoUrl', imageUrl);
    }
  };

  const toggleVisibility = (index: number) => {
    const newSections = [...sections];
    newSections[index].visible = !newSections[index].visible;
    setSections(newSections);
  };

  const handleSelectSection = (id: string) => {
      setSelectedSectionId(id);
      if (window.innerWidth < 1024) {
          setShowRightPanel(true);
      }
  };

  const selectedSection = sections.find(s => s.id === selectedSectionId);

  // --- RENDER PREVIEW (MATRIX STYLE) ---
  const renderPreview = () => {
    const header = sections.find(s => s.id === 'header')?.data;
    const info = sections.find(s => s.id === 'info')?.data;
    const totals = sections.find(s => s.id === 'totals')?.data;
    const sign = sections.find(s => s.id === 'signature')?.data;
    const isVisible = (id: string) => sections.find(s => s.id === id)?.visible;

    const PIXEL_SCALE = 3.5;
    const previewWidth = paperSize.width * PIXEL_SCALE;
    const previewHeight = paperSize.height * PIXEL_SCALE;
    const holeCount = Math.floor(previewHeight / 20); 

    const paddingStyle = {
        paddingTop: `${margins.top * PIXEL_SCALE}px`,
        paddingRight: `${margins.right * PIXEL_SCALE}px`,
        paddingBottom: `${margins.bottom * PIXEL_SCALE}px`,
        paddingLeft: `${margins.left * PIXEL_SCALE}px`,
    };

    return (
      <div className="bg-white shadow-2xl relative text-black font-mono text-sm leading-tight transition-all duration-300 mx-auto" style={{ width: `${previewWidth}px`, minHeight: `${previewHeight}px`, ...paddingStyle }}>
        {/* --- VISUAL EFEK KERTAS CONTINUOUS FORM --- */}
        <div className="absolute left-0 top-0 bottom-0 w-6 flex flex-col justify-between py-2 items-center z-10 bg-gray-50 border-r border-gray-200">{Array.from({ length: holeCount }).map((_,i) => (<div key={`l-${i}`} className="w-3 h-3 rounded-full bg-gray-300 shadow-inner mb-2"></div>))}</div>
        <div className="absolute right-0 top-0 bottom-0 w-6 flex flex-col justify-between py-2 items-center z-10 bg-gray-50 border-l border-gray-200">{Array.from({ length: holeCount }).map((_,i) => (<div key={`r-${i}`} className="w-3 h-3 rounded-full bg-gray-300 shadow-inner mb-2"></div>))}</div>

        {/* 1. HEADER */}
        {isVisible('header') && (
          <div className="mb-6 cursor-pointer hover:outline hover:outline-blue-300" onClick={() => handleSelectSection('header')}>
             <div className="flex justify-between items-start">
                 <div className="flex-1 pr-4">
                    <h1 className="text-2xl font-bold tracking-widest uppercase">{header.companyName}</h1>
                    {header.showOutlet && <p className="font-bold">{header.outletName}</p>}
                    {header.showAddress && <p>{header.address}</p>}
                    {header.showContact && <p>Telp: {header.phone}</p>}
                    {header.customText && (<div className="mt-2 text-xs whitespace-pre-wrap italic text-gray-700">{header.customText}</div>)}
                 </div>
                 {header.showLogo && (<div className="flex-shrink-0"><img src={header.logoUrl || LocoImage} alt="Logo" style={{ width: `${header.logoWidth * PIXEL_SCALE}px` }} className="object-contain"/></div>)}
             </div>
          </div>
        )}

        {/* 2. INFO FAKTUR & CUSTOMER */}
        {isVisible('info') && (
          <div className="flex justify-between mb-4 items-start cursor-pointer hover:outline hover:outline-blue-300" onClick={() => handleSelectSection('info')}>
             <div className="w-1/2">
                <p className="font-bold mb-1">{info.labelKepada}</p>
                <div className="ml-4 pl-2 border-l-2 border-gray-200">
                   {info.showCustName && <div className="font-bold">Contoh Customer</div>}
                   {info.showCustAddress && <div>Jl. Contoh Alamat No. 8, Jakarta</div>}
                   {info.showCustPhone && <div>Telp: 0812-3456-7890</div>}
                </div>
             </div>
             <div className="w-1/2 text-right">
                <h2 className="text-xl font-bold underline mb-2 uppercase">{info.labelFaktur}</h2>
                <div className="grid grid-cols-2 gap-x-2 justify-end inline-grid text-left text-sm">
                   <span>No. Faktur</span> <span>: <span className="font-bold">INV/2025/001</span></span>
                   <span>Tanggal</span> <span>: 10/12/2025</span>
                   {info.showJatuhTempo && (<><span>Jatuh Tempo</span> <span>: 10/01/2026</span></>)}
                </div>
             </div>
          </div>
        )}

        {/* 3. TABEL BARANG */}
        {isVisible('table') && (
          <div className="mb-2 cursor-pointer hover:outline hover:outline-blue-300" onClick={() => handleSelectSection('table')}>
             <table className="w-full">
                <thead>
                   <tr className="border-t-2 border-b-2 border-black">
                      <th className="p-1 text-center w-10">No</th>
                      <th className="p-1 text-left">Nama Barang</th>
                      <th className="p-1 text-center w-16">Qty</th>
                      <th className="p-1 text-center w-20">Satuan</th>
                      <th className="p-1 text-right w-28">Harga</th>
                      <th className="p-1 text-right w-32">Jumlah</th>
                   </tr>
                </thead>
                <tbody>
                   {[1,2,3].map((num) => (
                      <tr key={num}>
                         <td className="p-1 text-center align-top">{num}</td>
                         <td className="p-1 align-top">Produk Contoh {num}</td>
                         <td className="p-1 text-center align-top">10</td>
                         <td className="p-1 text-center align-top">Pcs</td>
                         <td className="p-1 text-right align-top">100.000</td>
                         <td className="p-1 text-right align-top">1.000.000</td>
                      </tr>
                   ))}
                </tbody>
             </table>
             <div className="border-t border-black w-full mt-2"></div>
          </div>
        )}

        {/* 4. TOTALS */}
        {isVisible('totals') && (
          <div className="flex justify-between items-start mb-6 pt-1 cursor-pointer hover:outline hover:outline-blue-300" onClick={() => handleSelectSection('totals')}>
             <div className="w-2/3 pr-8">
                {totals.showTerbilang && (<div className="mb-2 italic">Terbilang: # Tiga Juta Rupiah #</div>)}
                {totals.showNote && (<div className="text-xs mt-2 border border-black p-2 whitespace-pre-wrap">Catatan: <br/>{totals.note}</div>)}
             </div>
             <div className="w-1/3 pl-4">
                 <div className="flex justify-between mb-1 font-bold text-lg"><span>TOTAL</span> <span>3.000.000</span></div>
             </div>
          </div>
        )}

        {/* 5. TANDA TANGAN */}
        {isVisible('signature') && (
          <div className="grid gap-4 text-center mt-12 cursor-pointer hover:outline hover:outline-blue-300" style={{ gridTemplateColumns: `repeat(${sign.count}, minmax(0, 1fr))` }} onClick={() => handleSelectSection('signature')}>
              {Array.from({ length: sign.count }).map((_, idx) => (
                  <div key={idx} className="flex flex-col justify-between h-40"> 
                      <p className="font-bold">{sign.labels[idx] || "..."}</p>
                      <div className="flex-1"></div>
                      <p>( ........................ )</p>
                  </div>
              ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-100 font-sans overflow-hidden">
      
      {/* HEADER PAGE */}
      <div className="h-16 bg-white flex items-center justify-between px-4 border-b border-gray-200 shadow-sm flex-shrink-0 z-20">
         <div className="flex items-center gap-2 lg:gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="hover:bg-gray-200 p-1 rounded">
                 <Menu className="w-6 h-6"/>
             </button>
             <h1 className="text-sm lg:text-xl font-bold text-black uppercase truncate">TEMPLATE FAKTUR</h1>
         </div>
         
         {/* MOBILE TOGGLE BUTTONS */}
         <div className="flex lg:hidden gap-2">
             <button 
                onClick={() => setShowLeftPanel(!showLeftPanel)} 
                className={`p-2 rounded ${showLeftPanel ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
             >
                 <Sliders className="w-5 h-5"/>
             </button>
             <button 
                onClick={() => setShowRightPanel(!showRightPanel)} 
                className={`p-2 rounded ${showRightPanel ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
             >
                 <Edit3 className="w-5 h-5"/>
             </button>
         </div>

         {/* DESKTOP TOOLBAR */}
         <div className="hidden lg:flex items-center gap-3 bg-gray-100 p-1 rounded-lg">
             <div className="relative">
                 <select value={activeTemplateId} onChange={(e) => setActiveTemplateId(e.target.value)} className="appearance-none pl-3 pr-8 py-1.5 rounded-md text-sm font-bold text-gray-700 bg-white border border-gray-300 focus:outline-none focus:border-blue-500 cursor-pointer min-w-[150px]">
                     {savedTemplates.map(t => (<option key={t.id} value={t.id}>{t.name} {t.isActive ? '(Aktif)' : ''}</option>))}
                 </select>
                 <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"/>
             </div>
             <div className="w-[1px] h-6 bg-gray-300 mx-1"></div>
             <button onClick={handleSaveAsNew} className="p-1.5 hover:bg-green-100 text-green-600 rounded" title="Simpan sebagai Template Baru"><Plus className="w-5 h-5"/></button>
             <button onClick={handleUpdateCurrent} className="p-1.5 hover:bg-blue-100 text-blue-600 rounded" title="Simpan Perubahan"><Save className="w-5 h-5"/></button>
             <button onClick={handleDeleteTemplate} className="p-1.5 hover:bg-red-100 text-red-600 rounded" title="Hapus Template"><Trash2 className="w-5 h-5"/></button>
         </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
          
          {/* --- PANEL KIRI: SETTINGS & TEMPLATES --- */}
          {/* Overlay Mobile */}
          {showLeftPanel && (
              <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setShowLeftPanel(false)}></div>
          )}
          <div className={`
              absolute inset-y-0 left-0 w-80 bg-white border-r border-gray-200 flex flex-col overflow-y-auto z-30 transform transition-transform duration-300
              ${showLeftPanel ? 'translate-x-0' : '-translate-x-full'}
              lg:static lg:translate-x-0 lg:flex
          `}>
              <div className="p-4">
                  <div className="flex justify-between items-center mb-4 lg:hidden">
                      <h3 className="font-bold text-gray-800">Pengaturan Faktur</h3>
                      <button onClick={() => setShowLeftPanel(false)}><XIcon className="w-6 h-6"/></button>
                  </div>

                  {/* MOBILE TEMPLATE SELECTOR */}
                  <div className="lg:hidden mb-6 bg-gray-50 p-3 rounded-lg border">
                      <label className="text-xs font-bold text-gray-500 mb-1 block">Pilih Template</label>
                      <select value={activeTemplateId} onChange={(e) => setActiveTemplateId(e.target.value)} className="w-full mb-2 border rounded p-1.5 text-sm font-bold">
                         {savedTemplates.map(t => (<option key={t.id} value={t.id}>{t.name} {t.isActive ? '(Aktif)' : ''}</option>))}
                      </select>
                      <div className="flex gap-2 justify-end">
                          <button onClick={handleSaveAsNew} className="p-1.5 bg-green-100 text-green-600 rounded"><Plus className="w-4 h-4"/></button>
                          <button onClick={handleUpdateCurrent} className="p-1.5 bg-blue-100 text-blue-600 rounded"><Save className="w-4 h-4"/></button>
                          <button onClick={handleDeleteTemplate} className="p-1.5 bg-red-100 text-red-600 rounded"><Trash2 className="w-4 h-4"/></button>
                      </div>
                  </div>

                  {/* STATUS TEMPLATE */}
                  <div className="mb-6 border-b border-gray-200 pb-4 bg-gray-50 p-3 rounded-lg border">
                      <h3 className="font-bold text-gray-800 mb-2 text-sm flex items-center justify-between">
                          Status Template
                          {isCurrentActive ? 
                              <span className="text-[10px] bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-bold">DIGUNAKAN</span> 
                              : 
                              <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-bold">TIDAK AKTIF</span>
                          }
                      </h3>
                      <button
                        onClick={handleActivateTemplate}
                        disabled={isCurrentActive}
                        className={`w-full py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
                            isCurrentActive 
                            ? 'bg-green-100 text-green-700 border border-green-200 cursor-default'
                            : 'bg-white border border-gray-300 text-gray-600 hover:bg-blue-600 hover:text-white hover:border-blue-600'
                        }`}
                      >
                          {isCurrentActive ? (<><CheckCircle className="w-4 h-4"/> Sedang Aktif</>) : (<><XCircle className="w-4 h-4"/> Aktifkan Template Ini</>)}
                      </button>
                  </div>

                  {/* UKURAN & MARGIN */}
                  <div className="mb-6 border-b border-gray-200 pb-4">
                      <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><FileText className="w-4 h-4"/> Ukuran Kertas (mm)</h3>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                          <div><label className="text-xs text-gray-500 font-bold">Panjang / Lebar</label><input type="number" value={paperSize.width} onChange={(e) => setPaperSize({...paperSize, width: Number(e.target.value)})} className="w-full border border-gray-300 rounded px-2 py-1 text-sm"/></div>
                          <div><label className="text-xs text-gray-500 font-bold">Tinggi</label><input type="number" value={paperSize.height} onChange={(e) => setPaperSize({...paperSize, height: Number(e.target.value)})} className="w-full border border-gray-300 rounded px-2 py-1 text-sm"/></div>
                      </div>
                      <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 mt-4"><Settings className="w-4 h-4"/> Margin (mm)</h3>
                      <div className="grid grid-cols-2 gap-2">
                          <div><label className="text-xs text-gray-500 font-bold">Atas</label><input type="number" value={margins.top} onChange={(e) => setMargins({...margins, top: Number(e.target.value)})} className="w-full border border-gray-300 rounded px-2 py-1 text-sm"/></div>
                          <div><label className="text-xs text-gray-500 font-bold">Bawah</label><input type="number" value={margins.bottom} onChange={(e) => setMargins({...margins, bottom: Number(e.target.value)})} className="w-full border border-gray-300 rounded px-2 py-1 text-sm"/></div>
                          <div><label className="text-xs text-gray-500 font-bold">Kiri</label><input type="number" value={margins.left} onChange={(e) => setMargins({...margins, left: Number(e.target.value)})} className="w-full border border-gray-300 rounded px-2 py-1 text-sm"/></div>
                          <div><label className="text-xs text-gray-500 font-bold">Kanan</label><input type="number" value={margins.right} onChange={(e) => setMargins({...margins, right: Number(e.target.value)})} className="w-full border border-gray-300 rounded px-2 py-1 text-sm"/></div>
                      </div>
                  </div>

                  {/* SECTION LIST */}
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><GripVertical className="w-4 h-4"/> Bagian Faktur</h3>
                  <div className="space-y-2">
                      {sections.map((section, idx) => (<div key={section.id} onClick={() => handleSelectSection(section.id)} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${selectedSectionId === section.id ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-blue-300 bg-white'}`}><div className="flex-1 font-medium text-sm text-gray-700">{section.label}</div><button onClick={(e) => {e.stopPropagation(); toggleVisibility(idx)}} className={`p-1 hover:bg-gray-200 rounded ${section.visible ? 'text-blue-600' : 'text-gray-400'}`}>{section.visible ? <Eye className="w-4 h-4"/> : <EyeOff className="w-4 h-4"/>}</button></div>))}
                  </div>
              </div>
          </div>

          {/* --- PANEL TENGAH: PREVIEW --- */}
          <div className="flex-1 bg-gray-500 relative flex flex-col overflow-hidden">
              
              {/* ZOOM CONTROLS OVERLAY */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg border border-gray-200 transition-all hover:scale-105">
                  <button onClick={() => setZoomLevel(prev => Math.max(0.3, prev - 0.1))} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-700 active:scale-95 transition-transform" title="Zoom Out">
                      <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-gray-600 min-w-[3rem] text-center select-none">
                      {Math.round(zoomLevel * 100)}%
                  </span>
                  <button onClick={() => setZoomLevel(prev => Math.min(2.0, prev + 0.1))} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-700 active:scale-95 transition-transform" title="Zoom In">
                      <ZoomIn className="w-4 h-4" />
                  </button>
                  <div className="w-px h-4 bg-gray-300 mx-1"></div>
                  <button onClick={() => setZoomLevel(0.7)} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-700 active:rotate-180 transition-transform duration-500" title="Reset Zoom">
                      <RotateCcw className="w-4 h-4" />
                  </button>
              </div>

              {/* SCROLLABLE PREVIEW CONTAINER */}
              <div className="flex-1 overflow-auto p-4 lg:p-8 flex justify-center items-start">
                  <div 
                      style={{ 
                          transform: `scale(${zoomLevel})`, 
                          transformOrigin: 'top center',
                          transition: 'transform 0.2s ease-out'
                      }}
                  >
                      {renderPreview()}
                  </div>
              </div>
          </div>

          {/* --- PANEL KANAN: EDITOR --- */}
          {/* Overlay Mobile */}
          {showRightPanel && (
              <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setShowRightPanel(false)}></div>
          )}
          <div className={`
              absolute inset-y-0 right-0 w-80 bg-white border-l border-gray-200 flex flex-col p-6 overflow-y-auto z-30 transform transition-transform duration-300
              ${showRightPanel ? 'translate-x-0' : 'translate-x-full'}
              lg:static lg:translate-x-0 lg:flex
          `}>
              <div className="flex justify-between items-center mb-4 lg:hidden">
                  <h3 className="font-bold text-gray-800">Edit Konten</h3>
                  <button onClick={() => setShowRightPanel(false)}><XIcon className="w-6 h-6"/></button>
              </div>

              {selectedSection ? (
                  <div className="animate-in slide-in-from-right-4 fade-in duration-200">
                      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100"><h3 className="font-bold text-lg text-gray-800">{selectedSection.label}</h3></div>
                      
                      {selectedSection.type === 'HEADER' && (
                         <div className="space-y-4">
                            <div><label className="text-sm text-gray-600 font-bold">Nama Perusahaan</label><input type="text" value={selectedSection.data.companyName} onChange={(e) => updateSectionData('header', 'companyName', e.target.value)} className="w-full border p-2 rounded mt-1 text-sm"/></div>
                            <div className="space-y-2 pt-2 border-t border-gray-100">
                                {['showOutlet', 'showAddress', 'showContact'].map(key => (<div key={key} className="flex justify-between items-center"><label className="text-sm text-gray-600">Tampilkan {key.replace('show', '')}</label><button onClick={() => updateSectionData('header', key, !selectedSection.data[key])}>{selectedSection.data[key] ? <CheckSquare className="w-5 h-5 text-blue-600"/> : <Square className="w-5 h-5 text-gray-400"/>}</button></div>))}
                            </div>
                            <div className="pt-2 border-t border-gray-100"><div className="flex justify-between items-center mb-2"><label className="text-sm text-gray-600 font-bold">Tampilkan Logo (Kanan)</label><button onClick={() => updateSectionData('header', 'showLogo', !selectedSection.data.showLogo)}>{selectedSection.data.showLogo ? <CheckSquare className="w-5 h-5 text-blue-600"/> : <Square className="w-5 h-5 text-gray-400"/>}</button></div>{selectedSection.data.showLogo && (<div className="space-y-3"><div className="flex items-center gap-2"><button onClick={() => fileInputRef.current?.click()} className="flex-1 bg-gray-100 border border-gray-300 rounded p-2 text-xs flex items-center justify-center gap-2 hover:bg-gray-200"><Upload className="w-4 h-4"/> Upload Logo</button><input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload}/>{selectedSection.data.logoUrl && (<button onClick={() => updateSectionData('header', 'logoUrl', null)} className="bg-red-50 text-red-500 border border-red-200 p-2 rounded hover:bg-red-100" title="Hapus Logo"><XIcon className="w-4 h-4"/></button>)}</div><div><label className="text-xs text-gray-500 mb-1 block">Ukuran Logo (mm): {selectedSection.data.logoWidth}</label><input type="range" min="10" max="80" value={selectedSection.data.logoWidth} onChange={(e) => updateSectionData('header', 'logoWidth', Number(e.target.value))} className="w-full accent-blue-600"/></div></div>)}</div>
                            <div className="pt-2 border-t border-gray-100"><label className="text-sm text-gray-600 font-bold">Pesan Tambahan (Coretan Header)</label><textarea value={selectedSection.data.customText} onChange={(e) => updateSectionData('header', 'customText', e.target.value)} className="w-full border p-2 rounded mt-1 text-sm h-20" placeholder="Contoh: Titipan Barang..."/><p className="text-xs text-gray-400 mt-1">*Akan muncul di bawah kontak, tanpa kotak.</p></div>
                         </div>
                      )}

                      {selectedSection.type === 'INFO_CUSTOMER' && <div className="space-y-4"><div><label className="text-sm text-gray-600 font-bold">Label "Kepada"</label><input type="text" value={selectedSection.data.labelKepada} onChange={(e) => updateSectionData('info', 'labelKepada', e.target.value)} className="w-full border p-2 rounded mt-1 text-sm"/></div><div><label className="text-sm text-gray-600 font-bold">Judul Faktur</label><input type="text" value={selectedSection.data.labelFaktur} onChange={(e) => updateSectionData('info', 'labelFaktur', e.target.value)} className="w-full border p-2 rounded mt-1 text-sm font-bold"/></div><div className="pt-2 border-t border-gray-100 space-y-2"><p className="text-xs font-bold text-gray-400">DETAIL CUSTOMER</p>{['showCustName', 'showCustAddress', 'showCustPhone'].map(key => (<div key={key} className="flex justify-between items-center"><label className="text-sm text-gray-600">Tampilkan {key.replace('showCust', '')}</label><button onClick={() => updateSectionData('info', key, !selectedSection.data[key])}>{selectedSection.data[key] ? <CheckSquare className="w-5 h-5 text-blue-600"/> : <Square className="w-5 h-5 text-gray-400"/>}</button></div>))}</div></div>}

                      {selectedSection.type === 'TABLE' && <div className="space-y-4"><div className="bg-blue-50 p-3 rounded border border-blue-100"><AlignVerticalJustifyCenter className="w-6 h-6 text-blue-500 mb-2"/><p className="text-sm text-blue-700 font-semibold">Style Hemat Tinta Aktif</p><p className="text-xs text-blue-600 mt-1">Menggunakan garis horizontal saja untuk mempercepat cetak printer Matrix.</p></div></div>}

                      {selectedSection.type === 'TOTALS' && <div className="space-y-4"><div className="flex justify-between items-center pt-2"><label className="text-sm text-gray-600">Tampilkan Terbilang</label><button onClick={() => updateSectionData('totals', 'showTerbilang', !selectedSection.data.showTerbilang)}>{selectedSection.data.showTerbilang ? <CheckSquare className="w-5 h-5 text-blue-600"/> : <Square className="w-5 h-5 text-gray-400"/>}</button></div><div><label className="text-sm text-gray-600 font-bold">Catatan Kaki (Enter untuk baris baru)</label><textarea value={selectedSection.data.note} onChange={(e) => updateSectionData('totals', 'note', e.target.value)} className="w-full border p-2 rounded mt-1 text-sm h-24"/></div></div>}

                      {selectedSection.type === 'SIGNATURE' && <div className="space-y-6"><div><label className="text-sm text-gray-600 font-bold mb-2 block">Jumlah Kolom: {selectedSection.data.count}</label><input type="range" min="1" max="4" value={selectedSection.data.count} onChange={(e) => updateSectionData('signature', 'count', Number(e.target.value))} className="w-full cursor-pointer accent-blue-600"/><div className="flex justify-between text-xs text-gray-400 mt-1 px-1"><span>1</span><span>2</span><span>3</span><span>4</span></div></div><div className="space-y-3 pt-2 border-t border-gray-100"><label className="text-sm text-gray-600 font-bold block">Label Tanda Tangan:</label>{Array.from({ length: selectedSection.data.count }).map((_, idx) => (<div key={idx}><label className="text-xs text-gray-500 mb-1 block">Kolom {idx + 1}</label><input type="text" value={selectedSection.data.labels[idx] || ""} onChange={(e) => updateSignatureLabel(idx, e.target.value)} className="w-full border p-2 rounded text-sm focus:border-blue-500 outline-none" placeholder={`Label Kolom ${idx + 1}`}/></div>))}</div></div>}
                  </div>
              ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400"><p>Pilih bagian untuk diedit</p></div>
              )}
          </div>
      </div>
    </div>
  );
};

export default TemplateFakturPage;