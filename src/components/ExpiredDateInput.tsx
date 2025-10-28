import React, { useState, useEffect } from 'react';

interface ExpiredDateInputProps {
  onChange: (date: Date) => void;
  initialDate: Date;
}

const ExpiredDateInput: React.FC<ExpiredDateInputProps> = ({ onChange, initialDate }) => {
  const [mode, setMode] = useState('days'); // 'days' or 'date'
  const [days, setDays] = useState(3);
  const [date, setDate] = useState(initialDate);

  useEffect(() => {
    if (mode === 'days') {
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + days);
      onChange(newDate);
    } else {
      onChange(date);
    }
  }, [mode, days, date, onChange]);

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="p-2 border rounded-md">
      <div className="flex items-center mb-2">
        <button 
          type="button"
          onClick={() => setMode('days')}
          className={`px-3 py-1 text-sm rounded-l-md ${mode === 'days' ? 'bg-primary text-white' : 'bg-gray-200'}`}>
            Days from Now
        </button>
        <button 
          type="button"
          onClick={() => setMode('date')}
          className={`px-3 py-1 text-sm rounded-r-md ${mode === 'date' ? 'bg-primary text-white' : 'bg-gray-200'}`}>
            Pick a Date
        </button>
      </div>
      {mode === 'days' ? (
        <div>
          <label htmlFor="days-input" className="block text-sm font-medium text-gray-700">Expires in (days)</label>
          <input 
            type="number"
            id="days-input"
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value, 10) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            min="1"
          />
        </div>
      ) : (
        <div>
          <label htmlFor="date-input" className="block text-sm font-medium text-gray-700">Expiration Date</label>
          <input 
            type="date"
            id="date-input"
            value={date.toISOString().split('T')[0]}
            onChange={(e) => setDate(new Date(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            min={today}
          />
        </div>
      )}
    </div>
  );
};

export default ExpiredDateInput;
