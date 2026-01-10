// src/components/ProductSearchDropdown.tsx

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';

export interface ProductSearchItem {
  id: string;
  name: string;
  stock: string | number; // Stok bisa berupa string atau number
}

interface ProductSearchDropdownProps {
  products: ProductSearchItem[];
  placeholder?: string;
  onSelect?: (product: ProductSearchItem) => void;
  className?: string;
  disabled?: boolean;
}

const ProductSearchDropdown: React.FC<ProductSearchDropdownProps> = ({
  products,
  placeholder = "Cari produk...",
  onSelect,
  className = "",
  disabled = false
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter produk berdasarkan search query
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close dropdown ketika klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex(prev => 
        prev < filteredProducts.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && highlightedIndex >= 0 && filteredProducts[highlightedIndex]) {
      e.preventDefault();
      handleSelect(filteredProducts[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const handleSelect = (product: ProductSearchItem) => {
    if (onSelect) {
      onSelect(product);
    }
    setSearchQuery("");
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg 
            focus:outline-none focus:border-blue-500 text-sm bg-white
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
          `}
        />
        <button
          type="button"
          onClick={() => {
            if (!disabled) {
              setIsOpen(!isOpen);
              setHighlightedIndex(-1);
            }
          }}
          disabled={disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Dropdown List */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              {searchQuery ? "Produk tidak ditemukan" : "Tidak ada produk"}
            </div>
          ) : (
            <ul className="py-1">
              {filteredProducts.map((product, index) => (
                <li
                  key={product.id}
                  onClick={() => handleSelect(product)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`
                    px-4 py-2 cursor-pointer transition-colors
                    ${highlightedIndex === index ? 'bg-blue-50' : 'hover:bg-gray-50'}
                  `}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-800 flex-1">
                      {product.name}
                    </span>
                    <span className="text-xs text-gray-500 ml-4">
                      Stok: {typeof product.stock === 'number' 
                        ? product.stock.toLocaleString('id-ID') 
                        : product.stock}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSearchDropdown;