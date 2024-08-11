import React from 'react';
import './input.scss';

const Input = ({ label, value, onChange, type }) => {
  return (
    <div className="input">
      <label>{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required
      />
    </div>
  );
};

export default Input;