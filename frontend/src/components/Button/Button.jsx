import React from 'react';
import './button.scss';

const Button = ({ type, text }) => {
    return (
        <button type={type}>{text}</button>
    );
  };
  
  export default Button;
