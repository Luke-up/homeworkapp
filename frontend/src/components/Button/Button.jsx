import React from 'react';
import './button.scss';

const Button = ({ type, text, color, onClick }) => {
    return (
        <button className={color} type={type} onClick={onClick}>{text}</button>
    );
  };
  
  export default Button;
