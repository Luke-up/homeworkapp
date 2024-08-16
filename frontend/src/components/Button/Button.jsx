import React from 'react';
import './button.scss';

const Button = ({ type, text, color }) => {
    return (
        <button className={color} type={type}>{text}</button>
    );
  };
  
  export default Button;
