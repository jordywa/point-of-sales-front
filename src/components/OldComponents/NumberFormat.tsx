import React from 'react';

interface NumberFormatProps {
  value: number;
}

const NumberFormat: React.FC<NumberFormatProps> = ({ value }) => {
  const formattedValue = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  return <span>{formattedValue}</span>;
};

export default NumberFormat;
