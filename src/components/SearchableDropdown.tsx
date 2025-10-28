import React, { useState, useEffect, useRef } from 'react';

interface Option {
  value: string;
  label: string;
}

interface SearchableDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onAddNew?: (value: string) => void;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({ options, value, onChange, placeholder, onAddNew }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(option => option.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" onClick={() => setIsOpen(!isOpen)}>
        {selectedOption ? selectedOption.label : placeholder}
      </div>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <input
            type="text"
            className="w-full px-4 py-2 border-b border-gray-300 focus:outline-none"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <ul className="max-h-60 overflow-y-auto">
            {filteredOptions.map(option => (
              <li
                key={option.value}
                className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
              >
                {option.label}
              </li>
            ))}
            {onAddNew && searchTerm && !filteredOptions.some(option => option.label.toLowerCase() === searchTerm.toLowerCase()) && (
              <li
                className="px-4 py-2 cursor-pointer bg-primary-light text-primary-dark hover:bg-primary"
                onClick={() => {
                  onAddNew(searchTerm);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
              >
                Add "{searchTerm}"
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
