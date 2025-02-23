import React from 'react';
import './card.css';

export const Card = ({ children, className }) => (
  <div className={`card ${className}`}>{children}</div>
);

export const CardContent = ({ children }) => (
  <div className="card-content">{children}</div>
);