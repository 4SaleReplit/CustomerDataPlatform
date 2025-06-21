import React, { useState, KeyboardEvent, useRef } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface EmailTagInputProps {
  value: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function EmailTagInput({ value, onChange, placeholder, className }: EmailTagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const addEmail = (email: string) => {
    const trimmedEmail = email.trim();
    if (trimmedEmail && isValidEmail(trimmedEmail) && !value.includes(trimmedEmail)) {
      onChange([...value, trimmedEmail]);
      setInputValue('');
    }
  };

  const removeEmail = (emailToRemove: string) => {
    onChange(value.filter(email => email !== emailToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      e.preventDefault();
      if (inputValue.trim()) {
        addEmail(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeEmail(value[value.length - 1]);
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addEmail(inputValue);
    }
    setIsFocused(false);
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div 
      className={`min-h-10 border border-input bg-background px-3 py-2 rounded-md cursor-text ${isFocused ? 'ring-2 ring-ring ring-offset-2' : ''} ${className}`}
      onClick={handleContainerClick}
    >
      <div className="flex flex-wrap gap-1 items-center">
        {value.map((email, index) => (
          <Badge 
            key={index} 
            variant="secondary" 
            className="bg-blue-100 text-blue-800 hover:bg-blue-200 flex items-center gap-1 px-2 py-1"
          >
            <span className="text-sm">{email}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeEmail(email);
              }}
              className="hover:bg-blue-300 rounded-full p-0.5 ml-1"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          placeholder={value.length === 0 ? placeholder : ''}
          className="border-0 p-0 h-auto flex-1 min-w-32 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
    </div>
  );
}