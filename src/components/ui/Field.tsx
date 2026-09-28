import React from 'react';

export const Field: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div className={`time-picker-field ${className}`} {...props}>
      {children}
    </div>
  );
};

export const FieldLabel: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <label className={`field-label ${className}`} {...props}>
      {children}
    </label>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({
  className = '',
  ...props
}) => {
  return (
    <input
      className={`time-picker-input ${className}`}
      {...props}
    />
  );
};
