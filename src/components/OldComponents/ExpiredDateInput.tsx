import React, { useState, useEffect } from 'react';
import FormattedNumberInput from './FormattedNumberInput';

interface ExpiredDateInputProps {
  onChange: (date: Date) => void;
  initialDate?: Date; // Make optional
  disableDaysMode?: boolean; // New prop
}

const ExpiredDateInput: React.FC<ExpiredDateInputProps> = ({ onChange, initialDate, disableDaysMode }) => {
  const [mode, setMode] = useState<'days' | 'date'>(disableDaysMode ? 'date' : 'days');
  const [days, setDays] = useState(30); // Default to 30 days
  
  // Default to initialDate or 30 days from now if undefined
  const [date, setDate] = useState(() => initialDate || new Date(new Date().setDate(new Date().getDate() + 30)));

  // Effect to synchronize the internal state when the initialDate prop changes
  useEffect(() => {
    if (initialDate) {
      setDate(initialDate);
    }
  }, [initialDate]);

  // Effect to call onChange when the user interacts with the component
  useEffect(() => {
    let newDate;
    if (mode === 'days') {
      newDate = new Date();
      newDate.setHours(0, 0, 0, 0); // Normalize to start of the day
      newDate.setDate(newDate.getDate() + days);
    } else {
      newDate = date;
    }

    // Only call onChange if the date has actually changed
    if (initialDate?.getTime() !== newDate.getTime()) {
      onChange(newDate);
    }
  }, [mode, days, date, onChange, initialDate]);

  const handleDaysChange = (val: number) => {
    setDays(val || 0);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [year, month, day] = e.target.value.split('-').map(Number);
    const newDate = new Date(year, month - 1, day);
    setDate(newDate);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className={`${disableDaysMode ? "" : "p-2 border rounded-md"}`}>
      {!disableDaysMode && <div className="flex items-center mb-2">
        
        <button 
          type="button"
          onClick={() => setMode('days')}
          className={`px-3 py-1 text-sm rounded-l-md ${mode === 'days' ? 'bg-primary text-white' : 'bg-gray-200'}`}>
            Days from Now
        </button>
        
        <button 
          type="button"
          onClick={() => setMode('date')}
          className={`px-3 py-1 text-sm ${!disableDaysMode ? 'rounded-r-md' : 'rounded-md'} ${mode === 'date' ? 'bg-primary text-white' : 'bg-gray-200'}`}>
            Pick a Date
        </button>
      </div>}
      {mode === 'days' && !disableDaysMode ? (
        <div>
          <label htmlFor="days-input" className="block text-sm font-medium text-gray-700">Expires in (days)</label>
          <FormattedNumberInput
            id={`days-input`}
            value={days}
            onChange={(val: number) => handleDaysChange(val)}
          />
        </div>
      ) : (
        <div>
          {!disableDaysMode && <label htmlFor="date-input" className="block text-sm font-medium text-gray-700">Expiration Date</label>}
          <input 
            type="date"
            id="date-input"
            value={date ? date.toISOString().split('T')[0] : ''} // Handle case where date might be null/undefined
            onChange={handleDateChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            min={today}
          />
        </div>
      )}
    </div>
  );
};

export default ExpiredDateInput;
