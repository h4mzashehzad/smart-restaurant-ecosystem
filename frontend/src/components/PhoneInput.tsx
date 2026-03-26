import React, { useState, useEffect } from 'react';

interface PhoneInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (formattedValue: string) => void;
  required?: boolean;
  className?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({ id, name, value, onChange, required, className }) => {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value && value.startsWith('+92')) {
      setDisplayValue(value.slice(3));
    } else {
      setDisplayValue(value);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value.replace(/[^0-9]/g, '');
    
    // Auto-strip leading 0
    if (rawValue.startsWith('0')) {
      rawValue = rawValue.substring(1);
    }
    
    // Limit to 10 digits
    if (rawValue.length > 10) {
      rawValue = rawValue.slice(0, 10);
    }

    setDisplayValue(rawValue);

    if (rawValue.length > 0) {
      onChange(`+92${rawValue}`);
    } else {
      onChange('');
    }
  };

  return (
    <div className={`relative flex items-center group ${className || ''}`}>
      <div className="absolute left-0 inset-y-0 flex items-center pl-4 pointer-events-none">
        <span className="text-gray-500 font-semibold sm:text-sm mr-2">+92</span>
        <div className="h-5 w-[1.5px] bg-gray-200 group-focus-within:bg-orange-300 transition-colors"></div>
      </div>
      <input
        id={id}
        name={name}
        type="tel"
        required={required}
        value={displayValue}
        onChange={handleChange}
        className="block w-full pl-[4.5rem] pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all sm:text-sm font-medium"
        placeholder="3XX XXXXXXX"
        suppressHydrationWarning
      />
    </div>
  );
};
