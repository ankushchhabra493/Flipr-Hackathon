import React from 'react';
import './button.css';

export const Button = ({ children, onClick, className }) => (
  <button onClick={onClick} className={`button ${className}`}>
    {children}
  </button>
);