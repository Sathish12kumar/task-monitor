import React, { useRef } from 'react';
import { getCurrentTimeString } from '../utils/dateUtils';
import { Clock } from 'lucide-react';

interface SearchableTimeInputProps {
  id?: string;
  value: string; // e.g. "10:30" or "10:30:00"
  onChange: (time: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
  autoFocus?: boolean;
  step?: string | number;
  onEnterNext?: () => void;
}

function normalizeTimeForInput(val?: string): string {
  if (!val) return '';
  const parts = val.split(':');
  if (parts.length === 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
  }
  if (parts.length === 3) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
  }
  return val;
}

export const SearchableTimeInput: React.FC<SearchableTimeInputProps> = ({
  id = 'time-picker-optional',
  value,
  onChange,
  className = '',
  required = false,
  autoFocus = false,
  step = '1',
  onEnterNext,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const formattedValue = normalizeTimeForInput(value);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (onEnterNext) {
        e.preventDefault();
        onEnterNext();
      }
    }
  };

  const handleSetNow = () => {
    const now = getCurrentTimeString();
    onChange(now);
  };

  return (
    <div className={`time-picker-field-container ${className}`}>
      <div className="time-picker-input-wrap">
        <input
          ref={inputRef}
          type="time"
          id={id}
          step={step}
          value={formattedValue}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          required={required}
          className="time-picker-input appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none font-mono"
        />

        <button
          type="button"
          tabIndex={-1}
          className="time-picker-now-badge"
          onClick={handleSetNow}
          title="Set current time"
        >
          <Clock size={11} />
          <span>Now</span>
        </button>
      </div>
    </div>
  );
};
