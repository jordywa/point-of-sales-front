import React, { useState, useEffect } from 'react';
import { getFormattedNumber } from '../utils/formatting';

interface FormattedNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  id?: string;
  required?: boolean;
}

const FormattedNumberInput: React.FC<FormattedNumberInputProps> = ({ value, onChange, placeholder, id, required }) => {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    setDisplayValue(formatNumber(value));
  }, [value]);

  const formatNumber = (num: number) => {
    if (num === null || num === undefined) return '';
    return getFormattedNumber(num);
  };

  const parseNumber = (str: string) => {
    return Number(str.replace(/[^\d.-]/g, ''));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = parseNumber(rawValue);
    if (!isNaN(numericValue)) {
      onChange(numericValue);
    }
    setDisplayValue(rawValue);
  };

  const handleBlur = () => {
    setDisplayValue(formatNumber(value));
  };

  return (
    <input
      type="text"
      id={id}
      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      required={required}
    />
  );
};

export default FormattedNumberInput;
