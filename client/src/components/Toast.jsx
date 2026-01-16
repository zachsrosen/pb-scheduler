import React from 'react';

export default function Toast({ message, type = 'success' }) {
  return (
    <div className={`toast visible ${type === 'error' ? 'error' : ''}`}>
      {message}
    </div>
  );
}
