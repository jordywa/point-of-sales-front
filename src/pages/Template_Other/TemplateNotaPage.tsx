// src/pages/TemplateNotaPage.tsx

import React, { useState, useEffect } from 'react';
import { Menu, Save, ArrowUp, ArrowDown, Eye, EyeOff, GripVertical, AlignCenter, AlignLeft, AlignRight, CheckSquare, Square, Store, FileText, Plus, Trash2, ChevronDown, CheckCircle, XCircle, Sliders, Edit3, X as XIcon, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface TemplateNotaPageProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
}

// --- MOCK DATA ---
const MOCK_OUTLETS = [
  { id: 1, name: "Outlet Pusat", contact: "(021) 89523156", address: "Jl. Kh Moh Mansyur no 29a, Jakarta Barat" },
];

const DEFAULT_COMPANY_NAME = "NAMA TOKO ANDA";
const ACTIVE_TAX = { name: "PPN", percentage: 11 };

// --- TYPE DEFINITIONS ---
type SectionType = 'HEADER' | 'INFO' | 'ITEMS' | 'TOTALS' | 'FOOTER';

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
  isActive: boolean; // Menandakan template ini yang dipakai print
  paperWidth: number;
  sections: Section[];
}

const DEFAULT_SECTIONS: Section[] = [
    { 
      id: 'header', type: 'HEADER', label: 'Header Toko', visible: true, 
      data: { companyName: DEFAULT_COMPANY_NAME, outletId: 1, showOutletName: true, showAddress: true, showContact: true, showHeaderMessage: true, headerMessage: "Jangan lupa senyum :)", align: 'center', boldTitle: true } 
    },
    { id: 'info', type: 'INFO', label: 'Info Transaksi', visible: true, data: { showNoNota: true, showKasir: true, showDate: true } },
    { id: 'items', type: 'ITEMS', label: 'Daftar Belanja', visible: true, data: {} },
    { id: 'totals', type: 'TOTALS', label: 'Rincian Biaya', visible: true, data: { showSubtotal: true, showTax: false, showDiskon: true, showKembalian: true } },
    { id: 'footer', type: 'FOOTER', label: 'Footer / Pesan', visible: true, data: { text: 'Terima Kasih atas Kunjungan Anda\nBarang yang dibeli tidak dapat ditukar', align: 'center' } },
];

const TemplateNotaPage: React.FC<TemplateNotaPageProps> = ({ setIsSidebarOpen }) => {
  // --- STATE RESPONSIVE ---
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);

  // --- STATE TEMPLATE MANAGEMENT ---
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([
      { id: 'tpl-1', name: 'Standard Struk', isActive: true, paperWidth: 58, sections: JSON.parse(JSON.stringify(DEFAULT_SECTIONS)) },
      { id: 'tpl-2', name: 'Struk Lebar (80mm)', isActive: false, paperWidth: 80, sections: JSON.parse(JSON.stringify(DEFAULT_SECTIONS)) },
  ]);
  const [activeTemplateId, setActiveTemplateId] = useState<string>('tpl-1');

  // --- STATE CONFIG ---
  const [paperWidth, setPaperWidth] = useState<number>(58); 
  const [sections, setSections] = useState<Section[]>(DEFAULT_SECTIONS);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('header');

  // Helper untuk cek status aktif template yg sedang diedit
  const currentEditingTemplate = savedTemplates.find(t => t.id === activeTemplateId);
  const isCurrentActive = currentEditingTemplate?.isActive || false;

  // Load template saat activeTemplateId berubah
  useEffect(() => {
      const tpl = savedTemplates.find(t => t.id === activeTemplateId);
      if (tpl) {
          setPaperWidth(tpl.paperWidth);
          setSections(JSON.parse(JSON.stringify(tpl.sections))); // Deep copy
      }
  }, [activeTemplateId]);

  // --- ACTIONS ---
  const handleSaveAsNew = () => {
      const name = prompt("Masukkan Nama Template Baru:", "Template Baru");
      if (name) {
          const newId = `tpl-${Date.now()}`;
          const newTemplate: SavedTemplate = {
              id: newId,
              name: name,
              isActive: false, // Default tidak aktif
              paperWidth,
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
          ? { ...t, paperWidth, sections: JSON.parse(JSON.stringify(sections)) }
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
          alert("Tidak bisa menghapus template yang sedang AKTIF digunakan!");
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

  // --- LOGIC HELPER SECTION ---
  const moveSection = (index: number, direction: 'UP' | 'DOWN') => {
    const newSections = [...sections];
    if (direction === 'UP' && index > 0) {
      [newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]];
    } else if (direction === 'DOWN' && index < sections.length - 1) {
      [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    }
    setSections(newSections);
  };

  const toggleVisibility = (index: number) => {
    const newSections = [...sections];
    newSections[index].visible = !newSections[index].visible;
    setSections(newSections);
  };

  const updateSectionData = (id: string, key: string, value: any) => {
    setSections(prev => prev.map(sec => 
      sec.id === id ? { ...sec, data: { ...sec.data, [key]: value } } : sec
    ));
  };

  const handleSelectSection = (id: string) => {
      setSelectedSectionId(id);
      if (window.innerWidth < 1024) {
          setShowRightPanel(true);
      }
  };

  const selectedSection = sections.find(s => s.id === selectedSectionId);

  // --- RENDER PREVIEW COMPONENT ---
  const renderPreviewContent = (section: Section) => {
    switch (section.type) {
      case 'HEADER': {
        const outlet = MOCK_OUTLETS.find(o => o.id === Number(section.data.outletId)) || MOCK_OUTLETS[0];
        return (
          <div className={`text-${section.data.align} mb-4 border-b border-dashed border-gray-300 pb-2`}>
            <div className={`uppercase font-mono ${section.data.boldTitle ? 'font-bold text-xl' : 'text-lg'}`}>{section.data.companyName}</div>
            {section.data.showOutletName && <div className="text-sm font-semibold my-1">Cab: {outlet.name}</div>}
            {section.data.showAddress && <div className="text-xs text-gray-600 leading-tight px-2">{outlet.address}</div>}
            {section.data.showContact && <div className="text-xs text-gray-600 mt-1">{outlet.contact}</div>}
            {section.data.showHeaderMessage && section.data.headerMessage && <div className="text-xs text-gray-500 mt-2 whitespace-pre-wrap font-mono italic">{section.data.headerMessage}</div>}
          </div>
        );
      }
      case 'INFO':
        return (
          <div className="text-xs font-mono mb-2 pb-2 border-b border-dashed border-gray-300">
            {section.data.showNoNota && <div className="flex justify-between"><span>No: INV/001</span><span>10/10/25 14:30</span></div>}
            {section.data.showKasir && <div>Kasir: Admin</div>}
          </div>
        );
      case 'ITEMS':
        return (
          <div className="text-xs font-mono mb-2 border-b border-dashed border-gray-300 pb-2">
            <div className="flex justify-between font-bold mb-2 pb-1 border-b border-gray-200"><span>Item</span><span>Total</span></div>
            <div className="mb-3">
                <div className="font-bold text-sm mb-0.5 text-black">Contoh Produk 1</div>
                <div className="flex justify-between items-start text-gray-700">
                    <div className="flex gap-3"><span className="font-bold text-black w-3 text-center">2</span><span className="w-12">Pcs</span><span className="text-gray-600">Variant A</span></div>
                    <span className="font-bold text-black">20.000</span>
                </div>
            </div>
            <div className="mb-1">
                <div className="font-bold text-sm mb-0.5 text-black">Contoh Produk 2</div>
                <div className="flex justify-between items-start text-gray-700">
                    <div className="flex gap-3"><span className="font-bold text-black w-3 text-center">1</span><span className="w-12">Pack</span><span className="text-gray-600">Standard</span></div>
                    <span className="font-bold text-black">15.000</span>
                </div>
            </div>
          </div>
        );
      case 'TOTALS':
        return (
          <div className="text-xs font-mono mb-4 flex flex-col items-end">
             {section.data.showSubtotal && <div className="w-full flex justify-between"><span>Subtotal</span><span>35.000</span></div>}
             {section.data.showDiskon && <div className="w-full flex justify-between text-red-500"><span>Diskon</span><span>-0</span></div>}
             {section.data.showTax && <div className="w-full flex justify-between text-gray-600"><span>{ACTIVE_TAX.name} ({ACTIVE_TAX.percentage}%)</span><span>3.850</span></div>}
             <div className="w-full flex justify-between font-bold text-sm mt-1 border-t border-black pt-1"><span>TOTAL</span><span>35.000</span></div>
             <div className="w-full flex justify-between mt-1"><span>Tunai</span><span>50.000</span></div>
             {section.data.showKembalian && <div className="w-full flex justify-between"><span>Kembali</span><span>15.000</span></div>}
          </div>
        );
      case 'FOOTER':
        return <div className={`text-xs font-mono text-gray-600 text-${section.data.align} whitespace-pre-wrap`}>{section.data.text}</div>;
      default: return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-100 font-sans overflow-hidden">
      
      {/* HEADER PAGE */}
      <div className="h-16 bg-white flex items-center justify-between px-4 border-b border-gray-200 shadow-sm flex-shrink-0 z-20">
         <div className="flex items-center gap-2 lg:gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="hover:bg-gray-200 p-1 rounded">
                 <Menu className="w-6 h-6"/>
             </button>
             <h1 className="text-sm lg:text-xl font-bold text-black uppercase truncate">TEMPLATE STRUK (THERMAL)</h1>
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
                 <select 
                    value={activeTemplateId}
                    onChange={(e) => setActiveTemplateId(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-1.5 rounded-md text-sm font-bold text-gray-700 bg-white border border-gray-300 focus:outline-none focus:border-blue-500 cursor-pointer min-w-[150px]"
                 >
                     {savedTemplates.map(t => (
                         <option key={t.id} value={t.id}>{t.name} {t.isActive ? '(Aktif)' : ''}</option>
                     ))}
                 </select>
                 <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"/>
             </div>

             <div className="w-[1px] h-6 bg-gray-300 mx-1"></div>

             <button onClick={handleSaveAsNew} className="p-1.5 hover:bg-green-100 text-green-600 rounded" title="Simpan sebagai Template Baru">
                 <Plus className="w-5 h-5"/>
             </button>
             <button onClick={handleUpdateCurrent} className="p-1.5 hover:bg-blue-100 text-blue-600 rounded" title="Simpan Perubahan">
                 <Save className="w-5 h-5"/>
             </button>
             <button onClick={handleDeleteTemplate} className="p-1.5 hover:bg-red-100 text-red-600 rounded" title="Hapus Template">
                 <Trash2 className="w-5 h-5"/>
             </button>
         </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
          
          {/* --- PANEL KIRI: SETTINGS --- */}
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
                      <h3 className="font-bold text-gray-800">Pengaturan Struk</h3>
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

                  <div className="mb-6 border-b border-gray-200 pb-4">
                      <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><FileText className="w-4 h-4"/> Pengaturan Kertas</h3>
                      <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Lebar Kertas (mm)</label>
                          <div className="flex items-center gap-2">
                              <input type="number" value={paperWidth} onChange={(e) => setPaperWidth(Number(e.target.value))} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 font-bold" placeholder="58" />
                              <span className="text-sm font-bold text-gray-600">mm</span>
                          </div>
                          <div className="flex gap-2 mt-2">
                               <button onClick={() => setPaperWidth(58)} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">58mm</button>
                               <button onClick={() => setPaperWidth(80)} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">80mm</button>
                          </div>
                      </div>
                  </div>

                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><GripVertical className="w-4 h-4"/> Susunan Nota</h3>
                  <div className="space-y-2">
                      {sections.map((section, idx) => (
                          <div key={section.id} onClick={() => handleSelectSection(section.id)} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all group ${selectedSectionId === section.id ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-blue-300 bg-white'}`}>
                              <div className="text-gray-400 cursor-grab"><GripVertical className="w-4 h-4"/></div>
                              <div className="flex-1 font-medium text-sm text-gray-700">{section.label}</div>
                              <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                  <button onClick={(e) => {e.stopPropagation(); moveSection(idx, 'UP')}} disabled={idx === 0} className="p-1 hover:bg-gray-200 rounded text-gray-500 disabled:opacity-30"><ArrowUp className="w-3 h-3"/></button>
                                  <button onClick={(e) => {e.stopPropagation(); moveSection(idx, 'DOWN')}} disabled={idx === sections.length - 1} className="p-1 hover:bg-gray-200 rounded text-gray-500 disabled:opacity-30"><ArrowDown className="w-3 h-3"/></button>
                                  <button onClick={(e) => {e.stopPropagation(); toggleVisibility(idx)}} className={`p-1 hover:bg-gray-200 rounded ${section.visible ? 'text-blue-600' : 'text-gray-400'}`}>{section.visible ? <Eye className="w-3 h-3"/> : <EyeOff className="w-3 h-3"/>}</button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>

          {/* --- PANEL TENGAH: PREVIEW --- */}
          <div className="flex-1 bg-gray-200 relative flex flex-col overflow-hidden">
              
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
                  <button onClick={() => setZoomLevel(1.0)} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-700 active:rotate-180 transition-transform duration-500" title="Reset Zoom">
                      <RotateCcw className="w-4 h-4" />
                  </button>
              </div>

              {/* SCROLLABLE PREVIEW CONTAINER */}
              <div className="flex-1 overflow-auto p-4 lg:p-8 flex justify-center items-start">
                  <div 
                      className="bg-white shadow-2xl min-h-[500px] h-fit flex flex-col relative transition-transform duration-200 origin-top" 
                      style={{ 
                          width: `${paperWidth * 4.5}px`, 
                          padding: '16px',
                          transform: `scale(${zoomLevel})`
                      }}
                  >
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gray-800 opacity-20"></div>
                      {sections.map((section) => (section.visible && (<div key={section.id} onClick={() => handleSelectSection(section.id)} className={`cursor-pointer hover:bg-blue-50/50 transition-colors ${selectedSectionId === section.id ? 'ring-2 ring-blue-400 ring-offset-2 rounded' : ''}`}>{renderPreviewContent(section)}</div>)))}
                      <div className="mt-8 border-t-2 border-dashed border-gray-300 pt-2 text-center text-[10px] text-gray-400">--- Akhir Struk ---</div>
                  </div>
              </div>
          </div>

          {/* --- PANEL KANAN: EDITOR --- */}
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
                      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                          <h3 className="font-bold text-lg text-gray-800">{selectedSection.label}</h3>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-mono">{selectedSection.type}</span>
                      </div>
                      
                      {selectedSection.type === 'HEADER' && (
                          <div className="space-y-4">
                              <div><label className="block text-sm font-semibold text-gray-600 mb-1">Nama Perusahaan (Header)</label><input type="text" value={selectedSection.data.companyName} onChange={(e) => updateSectionData('header', 'companyName', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 font-bold"/></div>
                              <div className="border-t border-gray-100 pt-4 mt-2"><label className="block text-sm font-semibold text-gray-600 mb-2">Pilih Outlet</label><div className="relative"><select value={selectedSection.data.outletId} onChange={(e) => updateSectionData('header', 'outletId', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 appearance-none bg-white">{MOCK_OUTLETS.map(outlet => (<option key={outlet.id} value={outlet.id}>{outlet.name}</option>))}</select><Store className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"/></div></div>
                              <div className="space-y-2 pt-2">
                                  {['showOutletName', 'showAddress', 'showContact'].map(key => (
                                      <div key={key} className="flex justify-between items-center"><label className="text-sm text-gray-600">{key.replace('show', '')}</label><button onClick={() => updateSectionData('header', key, !selectedSection.data[key])}>{selectedSection.data[key] ? <CheckSquare className="w-5 h-5 text-blue-600"/> : <Square className="w-5 h-5 text-gray-400"/>}</button></div>
                                  ))}
                                  <div className="border-t border-gray-100 pt-3 mt-1">
                                      <div className="flex justify-between items-center mb-2"><label className="text-sm text-gray-600 font-semibold">Tampilkan Pesan Header</label><button onClick={() => updateSectionData('header', 'showHeaderMessage', !selectedSection.data.showHeaderMessage)}>{selectedSection.data.showHeaderMessage ? <CheckSquare className="w-5 h-5 text-blue-600"/> : <Square className="w-5 h-5 text-gray-400"/>}</button></div>
                                      {selectedSection.data.showHeaderMessage && (<textarea rows={2} value={selectedSection.data.headerMessage} onChange={(e) => updateSectionData('header', 'headerMessage', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" placeholder="Contoh: Jangan lupa senyum :)"/>)}
                                  </div>
                              </div>
                              <div className="flex justify-between items-center border-t border-gray-100 pt-4"><label className="text-sm text-gray-600">Tebalkan Judul Header</label><button onClick={() => updateSectionData('header', 'boldTitle', !selectedSection.data.boldTitle)}>{selectedSection.data.boldTitle ? <CheckSquare className="w-5 h-5 text-blue-600"/> : <Square className="w-5 h-5 text-gray-400"/>}</button></div>
                              <div><label className="block text-sm font-semibold text-gray-600 mb-2">Posisi Teks</label><div className="flex bg-gray-100 rounded p-1">{['left', 'center', 'right'].map((align) => (<button key={align} onClick={() => updateSectionData('header', 'align', align)} className={`flex-1 py-1 rounded flex justify-center ${selectedSection.data.align === align ? 'bg-white shadow text-black' : 'text-gray-400'}`}>{align === 'left' && <AlignLeft className="w-4 h-4"/>}{align === 'center' && <AlignCenter className="w-4 h-4"/>}{align === 'right' && <AlignRight className="w-4 h-4"/>}</button>))}</div></div>
                          </div>
                      )}

                      {selectedSection.type === 'ITEMS' && <div className="space-y-4"><p className="text-sm text-gray-600 italic">Tampilan item akan otomatis menyertakan Nama, Qty, Unit, dan Variasi.</p></div>}

                      {selectedSection.type === 'TOTALS' && <div className="space-y-3">{['showSubtotal', 'showDiskon', 'showTax', 'showKembalian'].map((key) => (<div key={key} className="flex justify-between items-center border-b border-gray-100 pb-2"><label className="text-sm text-gray-600 capitalize">{key.replace('show', '')}</label><button onClick={() => updateSectionData('totals', key, !selectedSection.data[key])}>{selectedSection.data[key] ? <CheckSquare className="w-5 h-5 text-blue-600"/> : <Square className="w-5 h-5 text-gray-400"/>}</button></div>))}<p className="text-xs text-gray-400 italic mt-2">*Pajak diambil dari setting Tax Master yang aktif.</p></div>}

                      {selectedSection.type === 'FOOTER' && <div className="space-y-4"><div><label className="block text-sm font-semibold text-gray-600 mb-1">Pesan Footer</label><textarea rows={4} value={selectedSection.data.text} onChange={(e) => updateSectionData('footer', 'text', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" placeholder="Contoh: Barang yang dibeli tidak dapat dikembalikan."/></div><div><label className="block text-sm font-semibold text-gray-600 mb-2">Posisi Teks</label><div className="flex bg-gray-100 rounded p-1">{['left', 'center', 'right'].map((align) => (<button key={align} onClick={() => updateSectionData('footer', 'align', align)} className={`flex-1 py-1 rounded flex justify-center ${selectedSection.data.align === align ? 'bg-white shadow text-black' : 'text-gray-400'}`}>{align === 'left' && <AlignLeft className="w-4 h-4"/>}{align === 'center' && <AlignCenter className="w-4 h-4"/>}{align === 'right' && <AlignRight className="w-4 h-4"/>}</button>))}</div></div></div>}

                      {selectedSection.type === 'INFO' && <div className="space-y-3">{Object.keys(selectedSection.data).map((key) => (<div key={key} className="flex justify-between items-center border-b border-gray-100 pb-2"><label className="text-sm text-gray-600 capitalize">{key.replace('show', '')}</label><button onClick={() => updateSectionData(selectedSection.id, key, !selectedSection.data[key])}>{selectedSection.data[key] ? <CheckSquare className="w-5 h-5 text-blue-600"/> : <Square className="w-5 h-5 text-gray-400"/>}</button></div>))}</div>}
                  </div>
              ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400"><FileText className="w-12 h-12 mb-4 opacity-50"/><p className="text-center text-sm">Pilih bagian di kiri atau klik preview untuk mengedit.</p></div>
              )}
          </div>
      </div>
    </div>
  );
};

export default TemplateNotaPage;