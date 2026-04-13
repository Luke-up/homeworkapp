import React, { useState, useEffect } from 'react';
import './inputselect.scss';

const InputSelect = ({ label, onChange, onSelectOption, type, options }) => {
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  

  useEffect(() => {
    setFilteredOptions(
      options.filter(option => {
        const optionText = typeof option === 'string' ? option : option.name;
        return optionText.toLowerCase().includes(value.toLowerCase());
      })
    );
  }, [value, options]);

  return (
    <div className="input">
      <input
        type={type}
        onChange={(e) => setValue(e.target.value)}
        value={value}
        placeholder={label}
        required
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {isFocused && filteredOptions.length > 0 && (
        <ul className="dropdown">
          {filteredOptions.map((option, index) => {
            const optionText = typeof option === 'string' ? option : option.name;
            return (
              <li
                key={index}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setValue(optionText);
                  if (onSelectOption) {
                    onSelectOption(typeof option === 'string' ? { name: option } : option);
                  }
                }}
              >
                {optionText}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default InputSelect;