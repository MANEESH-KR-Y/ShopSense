import React, { useEffect } from 'react';

const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const bgColors = {
    info: 'bg-[var(--color-brand-blue)] text-white',
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    warning: 'bg-orange-500 text-white',
  };

  return (
    <div
      className={`fixed bottom-4 right-4 px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-5 ${bgColors[type] || bgColors.info}`}
    >
      <span className="font-bold text-lg">
        {type === 'success' && '✅'}
        {type === 'error' && '❌'}
        {type === 'warning' && '⚠️'}
        {type === 'info' && 'ℹ️'}
      </span>
      <p className="font-medium">{message}</p>
      <button onClick={onClose} className="ml-4 font-bold opacity-70 hover:opacity-100">
        &times;
      </button>
    </div>
  );
};

export default Toast;
