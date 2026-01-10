// src/pages/Inventory/InventoryUploadProduk.tsx
import React from 'react';
import { ArrowLeft, Loader2, FileSpreadsheet, Upload } from 'lucide-react';

interface InventoryUploadProdukProps {
  setIsUploadPage: (isOpen: boolean) => void;
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadFile: File | null;
  handleProcessUpload: () => void;
}

const InventoryUploadProduk: React.FC<InventoryUploadProdukProps> = ({
  setIsUploadPage,
  isUploading,
  fileInputRef,
  handleFileChange,
  uploadFile,
  handleProcessUpload,
}) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 relative">
      {/* LOADING OVERLAY */}
      {isUploading && (
        <div className="absolute inset-0 z-[100] bg-black/60 flex flex-col items-center justify-center text-white">
          <Loader2 className="w-16 h-16 animate-spin mb-4 text-[#3FA2F6]" />
          <h2 className="text-2xl font-bold">Uploading...</h2>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-white p-4 border-b flex items-center gap-4 shadow-sm">
        <button 
          onClick={() => setIsUploadPage(false)} 
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft />
        </button>
        <h1 className="text-xl font-bold">Upload Stock</h1>
      </div>

      {/* CONTENT UPLOAD */}
      <div className="flex-1 p-8 flex justify-center">
        <div className="bg-white w-full max-w-4xl p-8 rounded-xl border border-gray-300 shadow-sm">
          <div className="flex justify-between items-center mb-8 border-b pb-4">
            <h2 className="text-2xl font-bold">Upload Data</h2>
            <button className="bg-[#568f5d] text-white px-6 py-2 rounded-lg flex gap-2">
              <FileSpreadsheet /> Download Template
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block font-semibold mb-2">Upload Excel/CSV</label>
              <div className="flex items-center gap-4">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileChange} 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="bg-blue-50 text-blue-600 border border-blue-200 px-6 py-3 rounded-lg"
                >
                  Choose File
                </button>
                <span className="text-gray-500 italic">
                  {uploadFile ? uploadFile.name : "No file chosen"}
                </span>
              </div>
            </div>

            {/* WOI BACKEND JORDY: handleProcessUpload akan memanggil POST /api/inventory/upload untuk bulk insert produk dari file Excel/CSV */}
            <div className="pt-8 flex justify-end">
              <button 
                onClick={handleProcessUpload} 
                disabled={!uploadFile} 
                className="bg-[#3FA2F6] text-white font-bold px-8 py-3 rounded-lg hover:bg-blue-600 flex gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload /> Upload Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryUploadProduk;