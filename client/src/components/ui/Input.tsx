import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full bg-slate-900/60 border border-slate-800 hover:border-slate-700 focus:border-violet-500 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none transition-all ${
          error ? 'border-red-500/80 focus:border-red-500' : ''
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-400 font-medium">{error}</p>
      )}
    </div>
  );
};
