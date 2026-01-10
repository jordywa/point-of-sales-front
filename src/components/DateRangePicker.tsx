/**
 * DateRangePicker Component
 * 
 * Komponen kalender untuk memilih rentang tanggal (date range picker).
 * Komponen ini reusable dan bisa digunakan di berbagai halaman.
 * 
 * Layout:
 * - Kiri: Quick select (Hari Ini, Kemarin, 7 hari lalu, 30 hari sebelumnya) + Pilihan Tahun
 * - Kanan: 2 kalender side by side (From dan To) dengan dropdown bulan dan tahun
 * 
 * Cara penggunaan:
 * - Default: null (belum ada tanggal terpilih)
 * - Klik tanggal pertama untuk memilih start date
 * - Klik tanggal kedua untuk memilih end date dan menyelesaikan range
 * - Tidak menggunakan drag-and-drop
 * 
 * @example
 * // Penggunaan dasar (default null - belum ada tanggal terpilih)
 * <DateRangePicker onChange={(range) => console.log(range)} />
 * 
 * @example
 * // Mengatur default date range
 * const defaultRange = {
 *   startDate: new Date('2024-01-01'),
 *   endDate: new Date('2024-01-31')
 * };
 * <DateRangePicker 
 *   defaultRange={defaultRange}
 *   onChange={(range) => handleDateChange(range)}
 * />
 */

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export type DateRangeOrNull = DateRange | null;

export interface DateRangePickerProps {
  /** Default date range untuk kalender. Jika tidak diatur, default ke hari ini */
  defaultRange?: DateRange;
  /** Callback ketika date range berubah */
  onChange?: (range: DateRange) => void;
  /** Class name tambahan untuk styling */
  className?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  defaultRange,
  onChange,
  className = '',
}) => {
  // State untuk date range yang dipilih (null jika belum dipilih)
  const [selectedRange, setSelectedRange] = useState<DateRangeOrNull>(() => {
    if (defaultRange) {
      return defaultRange;
    }
    // Default null (belum dipilih)
    return null;
  });

  const [isOpen, setIsOpen] = useState(false);
  const [showDateCalendars, setShowDateCalendars] = useState(false); // State untuk menampilkan kalender From/To
  const [showYearGrid, setShowYearGrid] = useState(false); // State untuk menampilkan grid tahun
  
  // State untuk click-based selection (klik pertama = start, klik kedua = end)
  const [firstClickDate, setFirstClickDate] = useState<Date | null>(null);
  const [selectionState, setSelectionState] = useState<'start' | 'end'>('start'); // 'start' berarti klik berikutnya akan set start date
  
  // State untuk kalender From
  const [fromMonth, setFromMonth] = useState(() => {
    return defaultRange?.startDate.getMonth() ?? new Date().getMonth();
  });
  const [fromYear, setFromYear] = useState(() => {
    return defaultRange?.startDate.getFullYear() ?? new Date().getFullYear();
  });
  const [fromMonthDropdownOpen, setFromMonthDropdownOpen] = useState(false);
  const [fromYearDropdownOpen, setFromYearDropdownOpen] = useState(false);
  
  // State untuk kalender To
  const [toMonth, setToMonth] = useState(() => {
    return defaultRange?.endDate.getMonth() ?? new Date().getMonth();
  });
  const [toYear, setToYear] = useState(() => {
    return defaultRange?.endDate.getFullYear() ?? new Date().getFullYear();
  });
  const [toMonthDropdownOpen, setToMonthDropdownOpen] = useState(false);
  const [toYearDropdownOpen, setToYearDropdownOpen] = useState(false);

  // State untuk selection mode (from atau to)
  const [selectionMode, setSelectionMode] = useState<'from' | 'to'>('from');
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Generate list tahun (dari 2020 sampai tahun sekarang + 1)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 + 1 }, (_, i) => 2020 + i);
  
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  // Handle click outside untuk menutup dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowDateCalendars(false);
        setShowYearGrid(false);
        setFromMonthDropdownOpen(false);
        setFromYearDropdownOpen(false);
        setToMonthDropdownOpen(false);
        setToYearDropdownOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);


  // Format tanggal untuk display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Format tanggal pendek untuk display
  const formatDateShort = (date: Date): string => {
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
    });
  };

  // Handle quick select
  const handleQuickSelect = (days: number) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    let startDate: Date;
    if (days === 0) {
      // Hari ini
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
    } else if (days === 1) {
      // Kemarin
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      today.setDate(today.getDate() - 1);
      today.setHours(23, 59, 59, 999);
    } else {
      // 7 hari atau 30 hari sebelumnya
      startDate = new Date(today);
      startDate.setDate(today.getDate() - days);
      startDate.setHours(0, 0, 0, 0);
    }

    const newRange: DateRange = {
      startDate,
      endDate: today,
    };

    setSelectedRange(newRange);
    
    // Update kalender view
    setFromMonth(startDate.getMonth());
    setFromYear(startDate.getFullYear());
    setToMonth(today.getMonth());
    setToYear(today.getFullYear());
    
    // Reset views
    setShowDateCalendars(false);
    setShowYearGrid(false);
    
    onChange?.(newRange);
    setIsOpen(false);
  };

  // Handle range tanggal toggle
  const handleRangeTanggalToggle = () => {
    const willShow = !showDateCalendars;
    setShowDateCalendars(willShow);
    setShowYearGrid(false);
    
    // Jika membuka kalender, reset selectedRange (belum ada yang dipilih)
    if (willShow) {
      setSelectedRange(null);
      setFirstClickDate(null);
      setSelectionState('start');
    }
  };

  // Handle tahunan select - toggle grid tahun
  const handleYearSelectToggle = () => {
    setShowYearGrid(!showYearGrid);
    setShowDateCalendars(false);
  };

  // Handle pilih tahun dari grid
  const handleYearSelect = (year: number) => {
    const startDate = new Date(year, 0, 1); // 1 Januari
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(year, 11, 31); // 31 Desember
    endDate.setHours(23, 59, 59, 999);

    const newRange: DateRange = {
      startDate,
      endDate,
    };

    setSelectedRange(newRange);
    
    // Update kalender view
    setFromMonth(0);
    setFromYear(year);
    setToMonth(11);
    setToYear(year);
    
    // Reset views
    setShowYearGrid(false);
    setShowDateCalendars(false);
    
    onChange?.(newRange);
    setIsOpen(false);
  };

  // Generate days untuk calendar
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Handle date click untuk range selection (klik pertama = start, klik kedua = end)
  // Contoh: klik tanggal 1 = from 1, klik tanggal 9 = to 9 (tanpa auto-swap)
  const handleDateClick = (day: number, month: number, year: number) => {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);

    if (selectionState === 'start' || !firstClickDate) {
      // Klik pertama: set sebagai start date saja (from)
      setFirstClickDate(date);
      setSelectionState('end');
      // Set start date, tapi end date tetap null atau sama dengan start untuk visual
      setSelectedRange({
        startDate: date,
        endDate: date, // Temporary untuk visual, akan di-update saat klik kedua
      });
    } else {
      // Klik kedua: set sebagai end date (to) - TANPA auto-swap
      // Jika user klik tanggal yang lebih kecil dari start, berarti reset dan mulai baru
      if (date < firstClickDate) {
        // Reset dan mulai range baru dengan tanggal yang diklik sebagai start
        setFirstClickDate(date);
        setSelectionState('end');
        setSelectedRange({
          startDate: date,
          endDate: date,
        });
      } else {
        // Set end date persis seperti yang diklik (tanpa swap)
        const newRange: DateRange = {
          startDate: firstClickDate,
          endDate: date, // End date persis seperti yang diklik
        };
        
        setSelectedRange(newRange);
        setFirstClickDate(null);
        setSelectionState('start');
        // Panggil onChange setelah kedua tanggal dipilih
        onChange?.(newRange);
      }
    }
  };

  // Check jika date dalam range yang dipilih
  const isDateInRange = (day: number, month: number, year: number) => {
    if (!selectedRange) return false;
    
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);

    return date >= selectedRange.startDate && date <= selectedRange.endDate;
  };

  // Check jika date adalah start atau end
  const isStartDate = (day: number, month: number, year: number) => {
    if (!selectedRange) return false;
    
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    return date.getTime() === selectedRange.startDate.getTime();
  };

  const isEndDate = (day: number, month: number, year: number) => {
    if (!selectedRange) return false;
    
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    return date.getTime() === selectedRange.endDate.getTime();
  };

  // Check jika date adalah hari ini
  const isToday = (day: number, month: number, year: number) => {
    const date = new Date(year, month, day);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };


  // Render grid tahun 3x3
  const renderYearGrid = () => {
    const reversedYears = [...years].reverse();
    
    return (
      <div className="p-6">
        <h4 className="text-sm font-bold text-gray-700 mb-4">Pilih Tahun</h4>
        <div className="grid grid-cols-3 gap-3">
          {reversedYears.map((year) => (
            <button
              key={year}
              type="button"
              onClick={() => handleYearSelect(year)}
              className="px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-400 transition-colors"
            >
              {year}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Render calendar
  const renderCalendar = (month: number, year: number, type: 'from' | 'to') => {
    const daysInMonth = getDaysInMonth(month, year);
    const firstDay = getFirstDayOfMonth(month, year);
    const days = [];

    // Empty cells untuk hari pertama
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8"></div>);
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const inRange = isDateInRange(day, month, year);
      const start = isStartDate(day, month, year);
      const end = isEndDate(day, month, year);
      const today = isToday(day, month, year);

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateClick(day, month, year)}
          className={`
            h-8 w-8 rounded-lg text-xs font-medium transition-colors relative select-none cursor-pointer
            ${inRange ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}
            ${start ? 'bg-blue-600 text-white font-bold' : ''}
            ${end ? 'bg-blue-600 text-white font-bold' : ''}
            ${today && !start && !end ? 'border border-blue-400' : ''}
          `}
        >
          {day}
        </button>
      );
    }

    const monthDropdownOpen = type === 'from' ? fromMonthDropdownOpen : toMonthDropdownOpen;
    const yearDropdownOpen = type === 'from' ? fromYearDropdownOpen : toYearDropdownOpen;
    const setMonthDropdownOpen = type === 'from' ? setFromMonthDropdownOpen : setToMonthDropdownOpen;
    const setYearDropdownOpen = type === 'from' ? setFromYearDropdownOpen : setToYearDropdownOpen;

    return (
      <div 
        className="p-4 select-none"
        data-calendar-type={type}
      >
        {/* Header dengan dropdown bulan dan tahun */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const newState = !monthDropdownOpen;
                  setMonthDropdownOpen(newState);
                  setYearDropdownOpen(false);
                  // Close other calendar dropdowns
                  if (type === 'from') {
                    setToMonthDropdownOpen(false);
                    setToYearDropdownOpen(false);
                  } else {
                    setFromMonthDropdownOpen(false);
                    setFromYearDropdownOpen(false);
                  }
                }}
                className="px-3 py-1.5 text-sm font-bold text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
              >
                {monthNames[month]}
                <ChevronDown className={`w-4 h-4 transition-transform ${monthDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {monthDropdownOpen && (
                <div 
                  className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto min-w-[120px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {monthNames.map((name, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (type === 'from') {
                          setFromMonth(idx);
                        } else {
                          setToMonth(idx);
                        }
                        setMonthDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                        month === idx ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const newState = !yearDropdownOpen;
                  setYearDropdownOpen(newState);
                  setMonthDropdownOpen(false);
                  // Close other calendar dropdowns
                  if (type === 'from') {
                    setToMonthDropdownOpen(false);
                    setToYearDropdownOpen(false);
                  } else {
                    setFromMonthDropdownOpen(false);
                    setFromYearDropdownOpen(false);
                  }
                }}
                className="px-3 py-1.5 text-sm font-bold text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
              >
                {year}
                <ChevronDown className={`w-4 h-4 transition-transform ${yearDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {yearDropdownOpen && (
                <div 
                  className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto min-w-[80px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {years.map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (type === 'from') {
                          setFromYear(y);
                        } else {
                          setToYear(y);
                        }
                        setYearDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                        year === y ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-[10px] font-bold text-gray-500 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    );
  };

  // Display text untuk range
  const getDisplayText = () => {
    if (!selectedRange) {
      return 'Pilih Range Tanggal';
    }
    if (selectedRange.startDate.getTime() === selectedRange.endDate.getTime()) {
      return formatDateShort(selectedRange.startDate);
    }
    return `${formatDateShort(selectedRange.startDate)} - ${formatDateShort(selectedRange.endDate)}`;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors shadow-sm"
      >
        <Calendar className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">
          {getDisplayText()}
        </span>
        {isOpen ? (
          <X className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 w-[800px]">
          <div className="flex">
            {/* Sidebar Kiri - Quick Select & Tahun */}
            <div className="w-64 border-r border-gray-200 p-4">
              {/* Quick Select */}
              <div className="mb-6">
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleQuickSelect(0)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Hari Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSelect(1)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Kemarin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSelect(7)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    7 hari sebelumnya
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSelect(30)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    30 hari sebelumnya
                  </button>
                </div>
              </div>

              {/* Separator */}
              <div className="border-t border-gray-200 mb-6"></div>

              {/* Berdasarkan Range Tanggal */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={handleRangeTanggalToggle}
                  className={`w-full text-left px-3 py-2 text-sm font-bold rounded-lg transition-colors ${
                    showDateCalendars 
                      ? 'bg-blue-50 text-blue-600 border border-blue-400' 
                      : 'text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  Berdasarkan Range Tanggal
                </button>
              </div>

              {/* Separator */}
              <div className="border-t border-gray-200 mb-6"></div>

              {/* Pilihan Tahun */}
              <div>
                <button
                  type="button"
                  onClick={handleYearSelectToggle}
                  className={`w-full text-left px-3 py-2 text-sm font-bold rounded-lg transition-colors ${
                    showYearGrid 
                      ? 'bg-blue-50 text-blue-600 border border-blue-400' 
                      : 'text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  Berdasarkan Tahun
                </button>
              </div>
            </div>

            {/* Sidebar Kanan - Kalender atau Grid Tahun atau Kosong */}
            <div className="flex-1 bg-white min-h-[400px]">
              {showYearGrid ? (
                // Tampilkan grid tahun 3x3
                renderYearGrid()
              ) : showDateCalendars ? (
                // Tampilkan 2 kalender From/To
                <div className="flex h-full">
                  {/* Kalender From */}
                  <div className="flex-1 border-r border-gray-200">
                    <div className="p-3 border-b border-gray-200 bg-gray-50">
                      <h4 className="text-sm font-bold text-gray-700">Dari</h4>
                    </div>
                    {renderCalendar(fromMonth, fromYear, 'from')}
                  </div>

                  {/* Kalender To */}
                  <div className="flex-1">
                    <div className="p-3 border-b border-gray-200 bg-gray-50">
                      <h4 className="text-sm font-bold text-gray-700">Sampai</h4>
                    </div>
                    {renderCalendar(toMonth, toYear, 'to')}
                  </div>
                </div>
              ) : (
                // Default: putih kosong
                <div className="h-full"></div>
              )}
            </div>
          </div>

          {/* Footer */}
          {selectedRange && (
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="text-xs text-gray-600">
                <span className="font-semibold">Dipilih: </span>
                {formatDate(selectedRange.startDate)} - {formatDate(selectedRange.endDate)}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedRange(null);
                  const today = new Date();
                  setFromMonth(today.getMonth());
                  setFromYear(today.getFullYear());
                  setToMonth(today.getMonth());
                  setToYear(today.getFullYear());
                  setShowDateCalendars(false);
                  setShowYearGrid(false);
                  setFirstClickDate(null);
                  setSelectionState('start');
                  setIsOpen(false);
                }}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
