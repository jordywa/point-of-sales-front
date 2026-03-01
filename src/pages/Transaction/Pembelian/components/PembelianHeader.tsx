// src/pages/Transaction/Pembelian/components/PembelianHeader.tsx

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  ScanLine,
  Menu,
  X,
  LayoutGrid,
  List,
  ChevronDown,
} from "lucide-react";
import type { ViewMode } from "../../../../types/pembelian.types";

interface PembelianHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onMenuClick: () => void;
}

export const PembelianHeader: React.FC<PembelianHeaderProps> = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onMenuClick,
}) => {
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);
  const viewDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        viewDropdownRef.current &&
        !viewDropdownRef.current.contains(event.target as Node)
      ) {
        setIsViewDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="h-16 bg-white flex items-center px-4 shadow-sm gap-4 shrink-0">
      {/* Menu Button */}
      <Menu
        className="w-6 h-6 cursor-pointer hover:text-blue-500 transition-colors"
        onClick={onMenuClick}
      />

      {/* Search Input */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Cari Produk..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-10 py-2 border border-black rounded-full 
                     focus:outline-none focus:border-blue-500 text-lg"
        />
        {searchQuery && (
          <X
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 
                       text-gray-500 cursor-pointer hover:text-red-500"
            onClick={() => onSearchChange("")}
          />
        )}
        {!searchQuery && (
          <ScanLine className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black cursor-pointer" />
        )}
      </div>

      {/* View Mode Dropdown */}
      <div className="relative" ref={viewDropdownRef}>
        <button
          onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)}
          className="flex items-center gap-2 bg-blue-100 px-3 py-2 
                     rounded-lg text-blue-900 hover:bg-blue-200"
        >
          {viewMode === "GRID" ? (
            <LayoutGrid className="w-5 h-5" />
          ) : (
            <List className="w-5 h-5" />
          )}
          <span className="hidden md:inline font-semibold">
            {viewMode === "GRID" ? "Grid View" : "List View"}
          </span>
          <ChevronDown className="w-4 h-4" />
        </button>

        {isViewDropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-40 bg-white 
                          border border-gray-200 rounded-lg shadow-xl 
                          overflow-hidden z-20">
            <button
              onClick={() => {
                onViewModeChange("GRID");
                setIsViewDropdownOpen(false);
              }}
              className={`w-full text-left px-4 py-3 flex items-center gap-2 
                         hover:bg-gray-100 ${
                           viewMode === "GRID"
                             ? "text-blue-600 font-bold bg-blue-50"
                             : "text-gray-700"
                         }`}
            >
              <LayoutGrid className="w-4 h-4" /> Grid View
            </button>
            <button
              onClick={() => {
                onViewModeChange("LIST");
                setIsViewDropdownOpen(false);
              }}
              className={`w-full text-left px-4 py-3 flex items-center gap-2 
                         hover:bg-gray-100 ${
                           viewMode === "LIST"
                             ? "text-blue-600 font-bold bg-blue-50"
                             : "text-gray-700"
                         }`}
            >
              <List className="w-4 h-4" /> List View
            </button>
          </div>
        )}
      </div>
    </div>
  );
};