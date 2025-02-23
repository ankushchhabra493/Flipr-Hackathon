// filepath: /Users/ankushchhabra/Downloads/Flipr Hackathon/src/components/ui/input.jsx
import React from 'react';
import './input.css';

export const Input = ({ placeholder, value, onChange, className }) => (
  <input
    type="text"
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={`input ${className}`}
  />
);